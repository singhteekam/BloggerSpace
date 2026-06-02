const mongoose = require("mongoose");
const Blog = require("../models/Blog");
const User = require("../models/User");
const pako = require("pako");

// Null out authorDetails for any blog whose author has deleted their account, so
// the post stays live but the name/profile link is hidden ("Anonymous" on the UI).
// Operates in-place on a lean blogs array; safe to call when authorDetails is unpopulated.
function anonymiseDeletedAuthors(blogs) {
  if (!Array.isArray(blogs)) return blogs;
  for (const b of blogs) {
    if (b && b.authorDetails && b.authorDetails.status === "DELETED") {
      b.authorDetails = null;
    }
  }
  return blogs;
}
const sendEmail = require("../services/mailer");
const { GoogleGenAI } = require("@google/genai");
const logger = require("./../utils/Logging/logs.js");

// const Reviewer= require("../models/Reviewer.js");
// const User= require("../models/User.js");

exports.blogsHomepage = async (req, res) => {
  // const abcd= await Reviewer.updateMany({isVerified:true}, {$set: {isEmailVerified:true}});
  // const abcd= await Reviewer.aggregate([
  //   {$addFields: {isEmailVerified: false}},
  //   {$out: "reviewers"}
  // ]);
  // console.log(abcd);

  // const fav= await Blog.aggregate([
  //   {$addFields: {blogViews:0}},
  // {$out: "Blog"}
  // ]);
  // console.log(fav);

  // Blog.updateMany({}, { $set: { blogViews: 0 }})
  // .then((result) => {
  //   console.log("Documents updated successfully:", result);
  // })
  // .catch((err) => {
  //   console.error("Error updating documents:", err);
  // });

  // console.log("Current user: "+ req.session.currentemail);
  // console.log("Homepage- User info: " + req.session.userId);
  // console.log("Email- User info: " + req.session.email);

  // TO UPDATE ANY COLUMN FIELD VALUES. THIS QUERY WILL REMOVE reviewedBy field from every document
  // Blog.updateMany({}, { $unset: { reviewedBy: 1 }})
  //   .then((result) => {
  //     console.log("Documents updated successfully:", result);
  //   })
  //   .catch((err) => {
  //     console.error("Error updating documents:", err);
  //   });

  // TO UPDATE ANY COLUMN FIELD VALUES. THIS QUERY WILL add reviewedBy field in every document
  // Blog.updateMany({}, { $set: { reviewedBy: [] }})
  //   .then((result) => {
  //     console.log("Documents updated successfully:", result);
  //   })
  //   .catch((err) => {
  //     console.error("Error updating documents:", err);
  //   });

  // console.log("Date:  "+ new Date().toLocaleString(undefined, {timeZone: 'Asia/Kolkata'}));

  try {
    const blogs = await Blog.find({ status: "PUBLISHED" })
      .sort({ blogViews: -1 })
      .populate("authorDetails") // Populate the author field with the User document
      .exec();

    let allBlogs = [];

    blogs.map((blog) => {
      const x = {
        _id: blog._id,
        slug: blog.slug,
        title: blog.title,
        category: blog.category,
        tags: blog.tags,
        content: blog.content,
        blogViews: blog.blogViews,
        blogLikes: blog.blogLikes,
        lastUpdatedAt: blog.lastUpdatedAt,
        authorDetails: {
          userName: blog.authorDetails.userName,
        },
      };
      allBlogs.push(x);
    });

    // console.log(decompressedblogs);
    res.json(allBlogs);
  } catch (error) {
    logger.error("Error fetching blogs:" + error);
    console.error("Error fetching blogs:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.fetchBlogsForSitemap = async (req, res) => {
  try {
    const blogs = await Blog.find({ status: { $in: ["PUBLISHED", "ADMIN_PUBLISHED"] } })
      .select("slug lastUpdatedAt")
      .sort({ lastUpdatedAt: -1 })
      .lean();
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// Usernames of authors who have at least one published blog — i.e. profiles
// with real content worth indexing. Excludes deleted/anonymised accounts and
// admin-collection authors (they have no public /user profile).
exports.fetchAuthorsForSitemap = async (req, res) => {
  try {
    const authorIds = await Blog.distinct("authorDetails", {
      status: { $in: ["PUBLISHED", "ADMIN_PUBLISHED"] },
    });
    if (!authorIds.length) return res.json([]);
    const users = await User.find({
      _id: { $in: authorIds },
      status: { $ne: "DELETED" },
      userName: { $nin: [null, ""] },
    })
      .select("userName")
      .lean();
    res.json(users.map((u) => ({ userName: u.userName })));
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.fetchAllBlogs = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;
  const skip = (page - 1) * limit;

  try {
    const [blogs, total] = await Promise.all([
      Blog.find({ status: { $in: ["PUBLISHED", "ADMIN_PUBLISHED"] } })
        .skip(skip)
        .limit(limit)
        .sort({ lastUpdatedAt: -1 })
        .populate("authorDetails", "userName profilePicture fullName status")
        .lean()
        .exec(),
      Blog.countDocuments({ status: { $in: ["PUBLISHED", "ADMIN_PUBLISHED"] } }),
    ]);

    anonymiseDeletedAuthors(blogs);

    res.json({
      blogs,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error("Error fetching blogs..:" + error);
    console.error("Error fetching blogs..:", error);
    res.status(500).json({ error: "Server error.." });
  }
};


exports.fetchAllBlogsFromDB = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "6", 10), 1);

    const search = (req.query.search || "").trim();
    const categoryParam = req.query.category || "";
    const tagParam = req.query.tag || "";

    // Build match object
    const match = {
      status: { $in: ["PUBLISHED", "ADMIN_PUBLISHED"] },
    };

    if (search) {
      match.title = { $regex: search, $options: "i" };
    }

    const categoryValues = categoryParam ? categoryParam.split(",").map((v) => v.trim()).filter(Boolean) : [];
    const tagValues = tagParam ? tagParam.split(",").map((v) => v.trim()).filter(Boolean) : [];

    if (categoryValues.length > 0 && tagValues.length > 0) {
      match.$or = [
        { category: { $in: categoryValues } },
        { tags: { $in: tagValues } },
      ];
    } else if (categoryValues.length > 0) {
      match.category = categoryValues.length === 1 ? categoryValues[0] : { $in: categoryValues };
    } else if (tagValues.length > 0) {
      match.tags = { $in: tagValues };
    }

    const skip = (page - 1) * limit;

    // run find and count in parallel
    const [blogs, totalCount] = await Promise.all([
      Blog.find(match)
        .sort({ lastUpdatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("authorDetails", "userName profilePicture status") // minimal fields
        // do NOT populate comments/likes here (heavy)
        .lean()
        .exec(),
      Blog.countDocuments(match),
    ]);

    // Hide identity of authors who have deleted their account
    anonymiseDeletedAuthors(blogs);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      blogs,
      currentPage: page,
      totalPages,
      totalCount,
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// controllers/blogs.js (same file)
exports.fetchSingleBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findOne({
      _id: id,
      status: { $in: ["PUBLISHED", "ADMIN_PUBLISHED"] },
    })
      .populate("authorDetails", "userName profilePicture email")
      .populate("blogLikes", "user") // minimal fields
      .populate("comments.user", "email userName profilePicture")
      .populate(
        "comments.commentReplies.replyCommentUser",
        "email userName profilePicture"
      )
      .lean()
      .exec();

    if (!blog) return res.status(404).json({ message: "Blog not found" });

    res.json({ blog });
  } catch (err) {
    console.error("Error fetching blog detail:", err);
    res.status(500).json({ error: "Server error" });
  }
};


// exports.fetchAllBlogsFromDB = async (req, res) => {
//   try {
//     const blogs = await Blog.find({
//       status: { $in: ["PUBLISHED", "ADMIN_PUBLISHED"] }
//     }).lean()
//       .populate("authorDetails")
//       .populate("blogLikes")  //TEMP
//       .populate("comments.user", "email userName profilePicture")    //TEMP
//       .populate("comments.commentReplies.replyCommentUser",  "email userName profilePicture")   //TEMP
//       .exec();

//     res.json({
//       blogs,
//     });
//   } catch (error) {
//     console.error("Error fetching blogs..:", error);
//     res.status(500).json({ error: "Server error.." });
//   }
// };

exports.fetchTopViewedBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ status: { $in: ["PUBLISHED", "ADMIN_PUBLISHED"] } })
      .sort({ blogViews: -1 })
      .limit(10)
      .select("title slug blogViews blogLikes"); // Select only needed fields

    res.json({ blogs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch top viewed blogs" });
  }
};

// Recommended blogs (personalized by the user's reading + liked categories/tags),
// with a trending fallback (top viewed) for logged-out users or empty interests.
exports.getRecommendedBlogs = async (req, res) => {
  try {
    const userId = req.query.userId;
    const LIMIT = 6;
    const PUBLISHED = { status: { $in: ["PUBLISHED", "ADMIN_PUBLISHED"] } };
    const SELECT = "title slug category tags content status blogViews blogLikes comments createdAt lastUpdatedAt blogScore authorDetails";

    const trending = async () =>
      anonymiseDeletedAuthors(
        await Blog.find(PUBLISHED)
          .sort({ blogViews: -1 })
          .limit(LIMIT)
          .select(SELECT)
          .populate("authorDetails", "fullName userName profilePicture status")
          .lean(),
      );

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.json({ personalized: false, blogs: await trending() });
    }

    const user = await User.findById(userId).select("readingHistory").lean();
    if (!user) return res.json({ personalized: false, blogs: await trending() });

    const readSlugs = (user.readingHistory || []).map((h) => h.slug).filter(Boolean);
    const readCategories = (user.readingHistory || []).map((h) => h.category).filter(Boolean);

    // Liked blogs → their categories + tags feed the interest model
    const likedBlogs = await Blog.find({ ...PUBLISHED, "blogLikes.userId": userId })
      .select("category tags slug")
      .limit(50)
      .lean();
    const likedSlugs = likedBlogs.map((b) => b.slug);
    const likedCategories = likedBlogs.map((b) => b.category).filter(Boolean);
    const likedTags = likedBlogs.flatMap((b) => b.tags || []);

    const categories = [...new Set([...readCategories, ...likedCategories])];
    const tags = [...new Set(likedTags)];
    const excludeSlugs = [...new Set([...readSlugs, ...likedSlugs])];

    if (categories.length === 0 && tags.length === 0) {
      return res.json({ personalized: false, blogs: await trending() });
    }

    const orConds = [];
    if (categories.length) orConds.push({ category: { $in: categories } });
    if (tags.length) orConds.push({ tags: { $in: tags } });

    let blogs = await Blog.find({ ...PUBLISHED, slug: { $nin: excludeSlugs }, $or: orConds })
      .sort({ blogScore: -1, blogViews: -1 })
      .limit(LIMIT)
      .select(SELECT)
      .populate("authorDetails", "fullName userName profilePicture status")
      .lean();

    // Top up with trending if interests didn't yield enough fresh blogs
    if (blogs.length < LIMIT) {
      const taken = new Set([...excludeSlugs, ...blogs.map((b) => b.slug)]);
      const fillers = await Blog.find({ ...PUBLISHED, slug: { $nin: [...taken] } })
        .sort({ blogViews: -1 })
        .limit(LIMIT - blogs.length)
        .select(SELECT)
        .populate("authorDetails", "fullName userName profilePicture status")
        .lean();
      blogs = [...blogs, ...fillers];
    }

    anonymiseDeletedAuthors(blogs);
    res.json({ personalized: blogs.length > 0, blogs });
  } catch (err) {
    console.error("Error fetching recommended blogs:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.fetchRelatedBlogs = async (req, res) => {
  try {
    const { blogId } = req.params;
    // blogId is a custom NUMERIC field. The param arrives as a string, so coerce
    // it — otherwise `$ne: "5"` never matches the numeric 5 and fails to exclude
    // the current post (the previous bug).
    const numericId = Number(blogId);
    const currentBlog = await Blog.findOne({ blogId: numericId }).lean();
    if (!currentBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    const PUBLISHED = { $in: ["PUBLISHED", "ADMIN_PUBLISHED"] };
    const LIMIT = 6;
    const SELECT = "title slug blogViews blogLikes category tags createdAt";

    // Title keywords (escaped for safe regex; stop-words + short words dropped).
    const STOP = new Set(["the", "a", "an", "and", "or", "in", "on", "of", "to", "for", "with", "is", "are", "how"]);
    const keywords = (currentBlog.title || "")
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w))
      .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

    // Relevance: same category OR shared tags OR overlapping title keywords.
    const or = [];
    if (currentBlog.category) or.push({ category: currentBlog.category });
    if (currentBlog.tags?.length) or.push({ tags: { $in: currentBlog.tags } });
    if (keywords.length) or.push({ title: { $regex: keywords.join("|"), $options: "i" } });

    let related = or.length
      ? await Blog.find({ blogId: { $ne: numericId }, status: PUBLISHED, $or: or })
          .sort({ blogViews: -1 })
          .limit(LIMIT)
          .select(SELECT)
          .lean()
      : [];

    // Fallback: if too few genuine matches, top up with recent published posts so
    // the "Related" section never looks empty/sparse.
    if (related.length < LIMIT) {
      const seen = new Set(related.map((b) => b.blogId));
      seen.add(numericId);
      const fillers = await Blog.find({ blogId: { $nin: [...seen] }, status: PUBLISHED })
        .sort({ lastUpdatedAt: -1 })
        .limit(LIMIT - related.length)
        .select(SELECT)
        .lean();
      related = [...related, ...fillers];
    }

    res.json({ blogs: related });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch related blogs" });
  }
};

exports.fetchBlogByBlogId = async (req, res) => {
  try {
    const blog = await Blog.findOne({
      blogId: req.params.blogId,
    })
      .populate("authorDetails")
      .exec();

    if (!blog) {
      logger.error(
        "The requested blog can't open in improve blog mode because it doesn't exist. "
      );
      return res.status(404).json({ error: "blog not found" });
    }

    // Decompress the content before displaying it
    const compressedContentBuffer = Buffer.from(blog.content, "base64");
    const decompressedContent = pako.inflate(compressedContentBuffer, {
      to: "string",
    });
    blog.content = decompressedContent;
    logger.debug("Blog opened in Improve mode. Blog title: " + blog.title);

    res.json(blog);
  } catch (error) {
    console.error("Error fetching blog blog:", error);
    logger.error("Error fetching blog blog:" + error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.fetchBlogsByCategory = async (req, res) => {
  const category = req.params.filterCategory;
  // console.log(category);
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;
  const skip = (page - 1) * limit;

  try {
    const blogs = await Blog.find({ category, status: { $in: ["PUBLISHED", "ADMIN_PUBLISHED"] } })
      .skip(skip)
      .limit(limit)
      .sort({ lastUpdatedAt: -1 })
      .populate("authorDetails")
      .exec();

    const total = await Blog.countDocuments({
      category,
      status: { $in: ["PUBLISHED", "ADMIN_PUBLISHED"] },
    });

    res.json({
      blogs,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error("Error fetching blogs..:" + error);
    console.error("Error fetching blogs..:", error);
    res.status(500).json({ error: "Server error.." });
  }
};

exports.addBlogViewsCounter = async (req, res) => {
  try {
    const blog = await Blog.findOne({
      slug: req.body.blogSlug,
      status: { $in: ["PUBLISHED", "ADMIN_PUBLISHED"] },
    });
    if (!blog) return res.status(404).json({ error: "blog not found" });

    blog.blogViews++;
    // console.log("BlogViews: " + blog.blogViews);
    await blog.save();
    res.json({ totalViews: blog.blogViews });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.viewBlogRoute = async (req, res) => {
  try {
    logger.debug("Searching for blog: " + req.params.blogSlug);
    // console.log("Searching for blog: "+ req.params.blogSlug);
    const blog = await Blog.findOne({
      slug: req.params.blogSlug,
      status: { $in: ["PUBLISHED", "ADMIN_PUBLISHED"] },
    })
      .populate("authorDetails")
      .populate("blogLikes")
      // .populate("comments")
      .populate("comments.user", "email userName profilePicture")
      .populate(
        "comments.commentReplies.replyCommentUser",
        "email userName profilePicture"
      )
      .lean()
      .exec();

    if (!blog) {
      logger.error("blog not found. Slug: " + req.params.blogSlug);
      return res.status(404).json({ error: "blog not found" });
    }
    // console.log(blog);

    // Decompress the content before displaying it
    const compressedContentBuffer = Buffer.from(blog.content, "base64");
    const decompressedContent = pako.inflate(compressedContentBuffer, {
      to: "string",
    });

    // console.log(
    //   "Content size:",
    //   Buffer.byteLength(blog.content, "utf8") / 1024,
    //   " KB"
    // );
    logger.info(
      "Blog: " +
        blog.title +
        " fetched. Content size is: " +
        Buffer.byteLength(blog.content, "utf8") / 1024 +
        " KB"
    );

    // Assuming `content` is the original content string
    // console.log(
    //   "Compressed size from db:",
    //   Buffer.byteLength(blog.content, "utf8") / 1024,
    //   " KB"
    // );
    // Log the size of the compressed content
    // console.log(
    //   "Original decompressed content size:",
    //   Buffer.byteLength(decompressedContent, "utf8") / 1024,
    //   " KB"
    // );

    blog.content = decompressedContent;

    // console.log(
    //   blog.likes.findIndex((like) => like._id.toString()===(req.session.userId))
    // );
    // const alreadyLiked = blog.likes.findIndex((like) =>
    //   like._id.toString()===(req.session.userId)
    // )!==-1?true:false;

    // console.log("Is blog liked? "+
    //   blog.blogLikes.map(e=>e.userId).findIndex((like) => like._id.toString()===(req.session.userId))
    // );
    const alreadyLiked =
      blog.blogLikes
        .map((e) => e.userId)
        .findIndex((like) => like._id.toString() === req.query.userId) !== -1
        ? true
        : false;

    // Anonymise the author the moment they delete their account — the post stays
    // live but the name/profile link is hidden (null author → "Anonymous" on the UI).
    if (blog.authorDetails && blog.authorDetails.status === "DELETED") {
      blog.authorDetails = null;
    }

    // console.log("Liked? :"+ alreadyLiked);
    logger.debug("Inside viewBlogRoute function.");
    res.json({ blog, alreadyLiked });
  } catch (error) {
    logger.error("Error fetching blog in viewBlogRoute:" + error);
    console.error("Error fetching blog:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.saveAsDraftBlog = async (req, res) => {
  try {
    const { slug, title, content, category, tags, userId, authorEmail } =
      req.body;

    // Compress the content before saving it
    const compressedContentBuffer = pako.deflate(content, { to: "string" });
    const compressedContent = Buffer.from(compressedContentBuffer).toString(
      "base64"
    );

    console.log(
      "Original content size:",
      Buffer.byteLength(content, "utf8") / 1024,
      " KB"
    );
    // Log the size of the compressed content
    console.log(
      "Compressed content size:",
      Buffer.byteLength(compressedContent, "utf8") / 1024,
      " KB"
    );

    const blog = await Blog.findById({
      _id: new mongoose.Types.ObjectId(req.body.id),
    });
    if (blog) {
      blog.slug = slug;
      blog.title = title;
      blog.content = compressedContent;
      blog.category = category;
      blog.lastUpdatedAt = new Date(new Date().getTime() + 330 * 60000);
      blog.tags = tags;
      await blog.save();

      logger.debug("Blog saved as draft. Title: " + title);
      return res.json(blog);
    }

    const newPost = new Blog({
      slug,
      title,
      content: compressedContent,
      category,
      authorDetails: userId,
      status: "DRAFT",
      lastUpdatedAt: new Date(new Date().getTime() + 330 * 60000),
      tags,
    });
    const savedBlog = await newPost.save();

    logger.debug("New Blog saved as draft. Title: " + title);
    res.json(savedBlog);
  } catch (error) {
    logger.debug("Error creating new post:", error);
    console.error("Error creating new post:", error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the post" });
  }
};

exports.isUniqueTitle = async (req, res) => {
  try {
    const { title, excludeId } = req.body;
    const query = excludeId
      ? { title, _id: { $ne: excludeId } }
      : { title };
    const blog = await Blog.findOne(query).select("_id").lean();
    if (!blog) {
      logger.debug("Topic is available: " + title);
      return res.json({ message: "Available" });
    } else {
      logger.debug("Topic is not available: " + title);
      return res.json({ message: "Already exists" });
    }
  } catch (error) {
    logger.error("Error checking isuniquetitle: " + error);
    res.status(500).json({ error: "An error occurred while checking isuniquetitle" });
  }
};

exports.createNewBlog = async (req, res) => {
  try {
    const { slug, title, content, category, tags, userId, authorEmail } =
      req.body;

    // Compress the content before saving it
    const compressedContentBuffer = pako.deflate(content, { to: "string" });
    const compressedContent = Buffer.from(compressedContentBuffer).toString(
      "base64"
    );

    // Assuming `content` is the original content string
    console.log(
      "Original content size:",
      Buffer.byteLength(content, "utf8") / 1024,
      " KB"
    );
    // Log the size of the compressed content
    console.log(
      "Compressed content size:",
      Buffer.byteLength(compressedContent, "utf8") / 1024,
      " KB"
    );

    const newPost = new Blog({
      slug,
      title,
      content: compressedContent,
      category,
      authorDetails: userId,
      // authorDetails: req.session.userId,
      // lastUpdatedAt: Date.now(),
      lastUpdatedAt: new Date(new Date().getTime() + 330 * 60000),
      tags,
    });
    const savedBlog = await newPost.save();
    logger.debug("New blog created in Pending status. Title: " + title);

    // Sending mail to author
    const receiver = authorEmail;
    const subject = "Blog submitted for review — BloggerSpace";
    const html = `
      <div class="content">
        <h2>Blog submitted!</h2>
        <p>Your blog has been submitted and is now pending review by one of our human reviewers.</p>
        <div class="info-box">
          <strong>Title:</strong> ${title}<br>
          <strong>Category:</strong> ${category}<br>
          <strong>Tags:</strong> ${tags}
        </div>
        <p>We'll notify you by email when your blog moves through each review stage.</p>
        <p><a class="btn" href="${process.env.FRONTEND_URL}/myblogs">Track status</a></p>
      </div>
    `;

    sendEmail(receiver, subject, html)
      .then((response) => {
        console.log(`Email sent to ${receiver}:`, response);
        logger.debug("Email sent to writer:" + response);
        // Handle success
      })
      .catch((error) => {
        console.error("Error sending email:", error);
        logger.error("Error sending email:" + error);
        // Handle error
      });

    // Sending mail to admin
    const blogLink = `${process.env.REVIEWER_PANEL_URL}/${slug}`;
    const receiver2 = process.env.EMAIL;
    const subject2 = "New blog pending review — BloggerSpace";
    const html2 = `
      <div class="content">
        <h2>New blog submitted</h2>
        <p>A new blog has been submitted and is waiting to be assigned to a reviewer.</p>
        <div class="info-box"><strong>Title:</strong> ${title}</div>
        <p><a class="btn" href="${blogLink}">View in Admin Panel</a></p>
      </div>
    `;

    sendEmail(receiver2, subject2, html2)
      .then((response) => {
        console.log(`Email sent to ${receiver2}:`, response);
      })
      .catch((error) => {
        console.error("Error sending email:", error);
      });

    res.json(savedBlog);
  } catch (error) {
    console.error("Error creating new post:", error);
    logger.error("Error creating new post:" + error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the post" });
  }
};

exports.createNewAIBlog = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: "Title is required" });

    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });

    const prompt = `
Write a detailed, well-structured blog post in clean HTML format for the title: "${title}".

Guidelines:
- Use proper semantic HTML tags like <h2>, <h3>, <p>, <ul>, <li>, <code>, <pre>, <strong>, <em>, <blockquote>, etc.
- Do NOT include <html>, <head>, <body>, or <h1> tags — only the inner HTML content.
- Ensure the content is SEO-friendly, informative, and easy to read.
- If the topic is technical, include clear explanations with formatted code examples inside <pre><code> blocks.
- Do NOT restate the title at the beginning.
- Do NOT end with meta phrases like "Would you like me to…" or similar.
- Maintain a professional and engaging tone throughout.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    // Return raw HTML — frontend sets it directly in the editor
    res.json({ html: response.text });
  } catch (error) {
    console.log("Error generating AI blog:", error);
    res.status(500).json({ error: "AI generation failed" });
  }
};

exports.editBlog = async (req, res) => {
  try {
    const blog = await Blog.findById({
      _id: new mongoose.Types.ObjectId(req.params.id),
    })
      .populate("authorDetails")
      .exec();

    if (!blog) {
      logger.error(
        "The requested blog can't open in editable mode because it doesn't exist. "
      );
      return res.status(404).json({ error: "blog not found" });
    }

    // Decompress the content before displaying it
    const compressedContentBuffer = Buffer.from(blog.content, "base64");
    const decompressedContent = pako.inflate(compressedContentBuffer, {
      to: "string",
    });
    blog.content = decompressedContent;
    logger.debug("Blog opened in Edit mode. Blog title: " + blog.title);

    res.json(blog);
  } catch (error) {
    console.error("Error fetching blog blog:", error);
    logger.error("Error fetching blog blog:" + error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.saveEditedBlog = async (req, res) => {
  try {
    // const { id } = req.params;
    const { slug, title, content, category } = req.body;

    // Find the blog by ID
    const blog = await Blog.findById({
      _id: new mongoose.Types.ObjectId(req.params.id),
    })
      .populate("authorDetails")
      .exec();

    if (!blog) {
      logger.error(
        "The blog: " + title + " is not saved because it doesn't exist."
      );
      return res.status(404).json({ error: "blog not found" });
    }

    // Compress the content before saving it
    const compressedContentBuffer = pako.deflate(content, { to: "string" });
    const compressedContent = Buffer.from(compressedContentBuffer).toString(
      "base64"
    );

    // Update the blog fields
    blog.slug = slug;
    blog.title = title;
    blog.content = compressedContent;
    blog.category = category;
    if (blog.status === "AWAITING_AUTHOR") blog.status = "UNDER_REVIEW";
    else blog.status = "PENDING_REVIEW";

    // Save the updated blog
    await blog.save();
    logger.debug("Blog updated successfully. Title: " + blog.title);

    // Sending mail to author
    const receiver = blog.authorDetails.email;
    const subject = "Blog resubmitted for review — BloggerSpace";
    const html = `
      <div class="content">
        <h2>Blog resubmitted!</h2>
        <p>Hi ${blog.authorDetails.fullName}, your updated blog has been resubmitted and is now pending review.</p>
        <div class="info-box">
          <strong>Title:</strong> ${title}<br>
          <strong>Category:</strong> ${category}
        </div>
        <p>We'll notify you when the reviewer responds.</p>
        <p><a class="btn" href="${process.env.FRONTEND_URL}/myblogs">Track status</a></p>
      </div>
    `;

    sendEmail(receiver, subject, html)
      .then((response) => {
        console.log(`Email sent to ${receiver}:`, response);
        logger.debug("Email sent to writer:" + response);
      })
      .catch((error) => {
        console.error("Error sending email:", error);
        logger.error("Error sending email:" + error);
      });

    // Sending mail to admin
    const blogLink = `${process.env.REVIEWER_PANEL_URL}/${slug}`;
    const receiver2 = process.env.EMAIL;
    const subject2 = "Blog resubmitted — BloggerSpace";
    const html2 = `
      <div class="content">
        <h2>Blog resubmitted</h2>
        <p>An author has resubmitted their revised blog for review.</p>
        <div class="info-box"><strong>Title:</strong> ${title}</div>
        <p><a class="btn" href="${blogLink}">View in Admin Panel</a></p>
      </div>
    `;

    sendEmail(receiver2, subject2, html2)
      .then((response) => {
        console.log(`Email sent to ${receiver}:`, response);
        // Handle success
      })
      .catch((error) => {
        console.error("Error sending email:", error);
        // Handle error
      });

    res.json({ message: "blog updated successfully" });
  } catch (error) {
    console.error("Error updating blog:", error);
    logger.error("Error updating blog:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.postNewBlogComment = async (req, res) => {
  try {
    const { blogSlug } = req.params;
    const { content } = req.body;
    const isAdmin = req.userRole === "Admin";

    const blog = await Blog.findOne({ slug: blogSlug });

    if (!blog) {
      logger.error("Blog not found  with blog: " + blogSlug);
      return res.status(404).json({ message: "blog not found" });
    }

    const newComment = {
      content,
      user: req.body.userId,
      isAdminComment: isAdmin,
    };

    blog.comments.push(newComment);
    await blog.save();

    await blog.populate("comments.user", "email userName profilePicture");

    const comments = blog.comments
      .filter((comment) => comment.isAdminComment || comment.user != null)
      .map((comment) => ({
        _id: comment._id,
        content: comment.content,
        userEmail: comment.isAdminComment ? null : comment.user.email,
        userName: comment.isAdminComment ? null : comment.user.userName,
        profilePicture: comment.isAdminComment ? undefined : comment.user.profilePicture,
        isAdmin: comment.isAdminComment || false,
        commentLikes: comment.commentLikes,
        createdAt: comment.createdAt,
        commentReplies: [],
      }));
    res.json(comments);
  } catch (error) {
    console.error("Error adding comment:", error);
    logger.error("Error adding comment: " + error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.postNewBlogReplyComment = async (req, res) => {
  try {
    const { blogSlug } = req.params;
    const { repliedToCommentId, replyCommentContent } = req.body;

    const blog = await Blog.findOne({ slug: blogSlug });

    if (!blog) {
      logger.error("Blog not found  with blog: " + blogSlug);
      return res.status(404).json({ message: "blog not found" });
    }

    const commentIdx = blog.comments.findIndex((c) => c._id.toString() === repliedToCommentId);
    if (commentIdx === -1) return res.status(404).json({ message: "Comment not found" });

    blog.comments[commentIdx].commentReplies.push({
      replyCommentContent,
      replyCommentUser: req.query.userId,
    });

    await blog.save();
    await blog.populate("comments.user", "email userName profilePicture");
    await blog.populate("comments.commentReplies.replyCommentUser", "email userName profilePicture");

    const comments = blog.comments
      .filter((comment) => comment.isAdminComment || comment.user != null)
      .map((comment) => ({
        _id: comment._id,
        content: comment.content,
        userEmail: comment.isAdminComment ? null : comment.user.email,
        userName: comment.isAdminComment ? null : comment.user.userName,
        profilePicture: comment.isAdminComment ? undefined : comment.user.profilePicture,
        isAdmin: comment.isAdminComment || false,
        commentLikes: comment.commentLikes,
        createdAt: comment.createdAt,
        commentReplies: (comment.commentReplies || [])
          .filter((r) => r.replyCommentUser != null)
          .map((r) => ({
            _id: r._id,
            replyCommentContent: r.replyCommentContent,
            replyCommentUser: {
              email: r.replyCommentUser.email,
              userName: r.replyCommentUser.userName,
              profilePicture: r.replyCommentUser.profilePicture,
            },
            commentLikes: r.commentLikes,
            createdAt: r.createdAt,
          })),
      }));
    res.json(comments);
  } catch (error) {
    console.error("Error adding reply:", error);
    logger.error("Error adding reply: " + error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.toggleCommentLike = async (req, res) => {
  const { blogSlug, commentId } = req.params;
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: "userId required" });

  try {
    const blog = await Blog.findOne({ slug: blogSlug });
    if (!blog) return res.status(404).json({ error: "Blog not found" });

    const comment = blog.comments.id(commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    const idx = comment.commentLikes.indexOf(userId);
    let liked;
    if (idx !== -1) {
      comment.commentLikes.splice(idx, 1);
      liked = false;
    } else {
      comment.commentLikes.push(userId);
      liked = true;
    }

    await blog.save();
    res.json({ liked, likeCount: comment.commentLikes.length });
  } catch (error) {
    console.error("Error toggling comment like:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.toggleReplyLike = async (req, res) => {
  const { blogSlug, commentId, replyId } = req.params;
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: "userId required" });

  try {
    const blog = await Blog.findOne({ slug: blogSlug });
    if (!blog) return res.status(404).json({ error: "Blog not found" });

    const comment = blog.comments.id(commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    const reply = comment.commentReplies.id(replyId);
    if (!reply) return res.status(404).json({ error: "Reply not found" });

    const idx = reply.commentLikes.indexOf(userId);
    let liked;
    if (idx !== -1) {
      reply.commentLikes.splice(idx, 1);
      liked = false;
    } else {
      reply.commentLikes.push(userId);
      liked = true;
    }

    await blog.save();
    res.json({ liked, likeCount: reply.commentLikes.length });
  } catch (error) {
    console.error("Error toggling reply like:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.viewBlogComments = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.blogSlug })
      .populate("comments.user", "email userName profilePicture")
      .populate("comments.commentReplies.replyCommentUser", "email userName profilePicture")
      .exec();

    if (!blog) {
      logger.error(
        "Blog not found to view comment. Blog: " + req.params.blogSlug
      );
      return res.status(404).json({ message: "blog not found" });
    }

    const comments = blog.comments
      .filter((comment) => comment.isAdminComment || comment.user != null)
      .map((comment) => ({
        _id: comment._id,
        content: comment.content,
        userEmail: comment.isAdminComment ? null : comment.user.email,
        userName: comment.isAdminComment ? null : comment.user.userName,
        profilePicture: comment.isAdminComment ? undefined : comment.user.profilePicture,
        isAdmin: comment.isAdminComment || false,
        commentLikes: comment.commentLikes,
        createdAt: comment.createdAt,
        commentReplies: (comment.commentReplies || [])
          .filter((r) => r.replyCommentUser != null)
          .map((r) => ({
            _id: r._id,
            replyCommentContent: r.replyCommentContent,
            replyCommentUser: {
              email: r.replyCommentUser.email,
              userName: r.replyCommentUser.userName,
              profilePicture: r.replyCommentUser.profilePicture,
            },
            commentLikes: r.commentLikes,
            createdAt: r.createdAt,
          })),
      }));

    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    logger.error("Error fetching comments: " + error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Search blogs
exports.searchBlogsFromDB = async (req, res) => {
  try {
    const query = req.params.query;
    // console.log(query);

    // Perform the search query based on the provided search query
    const blogs = await Blog.find({
      $or: [
        { title: { $regex: ".*" + query + ".*", $options: "i" } },
        { author: { $regex: ".*" + query + ".*", $options: "i" } },
        { category: { $regex: ".*" + query + ".*", $options: "i" } },
      ],
      status: "PUBLISHED",
    });
    // console.log(blogs);

    res.json(blogs);
  } catch (error) {
    console.error("Error searching blogs:", error);
    logger.error("Error searching blogs: " + error);
    res.status(500).json({ error: "An error occurred while searching blogs." });
  }
};

// ── Author's own blogs (MyBlogs tabs) ─────────────────────────────────────────
// Shared, paginated handler for every status tab. Server-side search (title /
// category) runs across ALL the author's blogs of that status — not just the
// loaded page. Trims payload: no heavy `content`, no redundant author populate
// (it's always the requesting user), no likes/comments arrays the list ignores.
const MYBLOGS_PAGE_SIZE = 10;
const MYBLOGS_LIST_SELECT = "title slug category tags status blogViews createdAt lastUpdatedAt gems";

async function fetchAuthorBlogsByStatus(req, res, status) {
  try {
    const userId = req.query.userId;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || MYBLOGS_PAGE_SIZE));
    const search = (req.query.search || "").trim();

    const match = { authorDetails: new mongoose.Types.ObjectId(userId), status };
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      match.$or = [{ title: rx }, { category: rx }];
    }

    const [blogs, total] = await Promise.all([
      Blog.find(match)
        .select(MYBLOGS_LIST_SELECT)
        .sort({ lastUpdatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Blog.countDocuments(match),
    ]);
    res.json({ blogs, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (error) {
    logger.error(`Error fetching author ${status} blogs: ` + error);
    res.status(500).json({ error: "An error occurred while fetching blogs." });
  }
}

exports.authorSavedDraftBlogs   = (req, res) => fetchAuthorBlogsByStatus(req, res, "DRAFT");
exports.authorPendingReviewBlogs = (req, res) => fetchAuthorBlogsByStatus(req, res, "PENDING_REVIEW");
exports.authorUnderReviewBlogs  = (req, res) => fetchAuthorBlogsByStatus(req, res, "UNDER_REVIEW");
exports.awaitingAuthorBlogs     = (req, res) => fetchAuthorBlogsByStatus(req, res, "AWAITING_AUTHOR");
exports.authorPublishedBlogs    = (req, res) => fetchAuthorBlogsByStatus(req, res, "PUBLISHED");

exports.blogLikes = async (req, res) => {
  let thumbColor = req.body.thumbColor;
  try {
    const blog = await Blog.findById({
      _id: new mongoose.Types.ObjectId(req.params.id),
    });
    if (!blog) {
      return res.status(404).json({ error: "blog not found" });
    }
    // if (blog.likes.findIndex((like) => like._id.toString() === req.session.userId) !== -1){
    //   return res.status(404).json({ error: "blog already liked" });
    // }
    var newThumbColor;
    if (thumbColor === "regular") {
      // blog.likes.push(req.session.userId);
      blog.blogLikes.push({
        userId: new mongoose.Types.ObjectId(req.query.userId),
        likedTime: new Date(new Date().getTime() + 330 * 60000),
      });
      newThumbColor = "solid";
    } else if (thumbColor === "solid") {
      const idx = blog.blogLikes.findIndex(
        (e) => e.userId.toString() === req.query.userId
      );
      if (idx !== -1) blog.blogLikes.splice(idx, 1);
      newThumbColor = "regular";
    }
    // blog.likes=[];
    await blog.save();

    console.log(
      "blogLiked: " +
        blog.blogLikes
          .map((e) => e.userId)
          .indexOf(new mongoose.Types.ObjectId(req.query.userId))
    );
    console.log(req.query.userId);
    // console.log(blog.likes.indexOf(req.session.userId));
    // console.log(blog.likes[1].toString());

    const newLikes = blog.blogLikes;
    res.json({ newThumbColor, newLikes });
  } catch (error) {
    logger.error("Error occured when fetching blog likes.");
    res.status(500).json({ error: "An error occurred..." });
  }
};

//Original
// exports.blogLikes99=async (req,res)=>{
//   let thumbColor = req.body.thumbColor;
//   try {
//     const blog= await Blog.findById({
//       _id: new mongoose.Types.ObjectId(req.params.id)
//     })
//     if (!blog) {
//       return res.status(404).json({ error: "blog not found" });
//     }
//     // if (blog.likes.findIndex((like) => like._id.toString() === req.session.userId) !== -1){
//     //   return res.status(404).json({ error: "blog already liked" });
//     // }
//       var newThumbColor;
//     if(thumbColor==="regular"){
//       blog.likes.push(req.session.userId);
//       newThumbColor = "solid";
//     }
//     else if(thumbColor==="solid"){
//       // console.log(blog.likes.indexOf(req.session.userId));
//       blog.likes.splice(blog.likes.indexOf(req.session.userId),1);
//       newThumbColor = "regular";
//     }
//     // blog.likes=[];
//     await blog.save();

//     // console.log(req.session.userId);
//     // console.log(blog.likes.indexOf(req.session.userId));
//     // console.log(blog.likes[1].toString());

//     const newLikes= blog.likes;
//     res.json({newThumbColor, newLikes});
//   } catch (error) {
//     res.status(500).json({ error: "An error occurred..." });
//   }
// }

exports.blogCommentLikes = async (req, res) => {
  let commentId = req.body.commentId;
  let commentThumbColor = req.body.commentThumbColor;

  try {
    const blog = await Blog.findById({
      _id: new mongoose.Types.ObjectId(req.params.id),
    })
      .populate("comments")
      .exec();
    if (!blog) {
      return res.status(404).json({ error: "blog not found" });
    }
    console.log(commentId + " --- " + commentThumbColor);

    var newCommentThumbColor;
    if (commentThumbColor === "regular") {
      blog.comments
        .find((comment) => comment._id.toString() === commentId)
        .likes.push(req.body.userId);
      newCommentThumbColor = "solid";
    } else if (commentThumbColor === "solid") {
      blog.comments
        .find((comment) => comment._id.toString() === commentId)
        .likes.splice(
          blog.comments
            .find((comment) => comment._id.toString() === commentId)
            .likes.indexOf(req.body.userId)
        );
      newCommentThumbColor = "regular";
    }

    // blog.comments.find(comment=> comment._id.toString()===commentId).content="333333";
    await blog.save();
    const updatedComments = blog.comments;

    // if (blog.likes.findIndex((like) => like._id.toString() === req.session.userId) !== -1){
    //   return res.status(404).json({ error: "blog already liked" });
    // }
    // var newCommentThumbColor;
    // if (commentThumbColor === "regular") {
    //   blog.comments.likes.push(req.session.userId);
    //   newCommentThumbColor = "solid";
    // } else if (commentThumbColor === "solid") {
    //   console.log(blog.comments.indexOf(req.session.userId).likes);
    //   blog.comments.splice(blog.comments.indexOf(req.session.userId), 1);
    //   newCommentThumbColor = "regular";
    // }

    // await blog.save();

    // const newCommentLikes = blog.comments.likes;
    res.json({ newCommentThumbColor, updatedComments });
  } catch (error) {
    logger.error("Error occured when fetching comment likes of the blog.");
    res.status(500).json({ error: "An error occurred..." });
  }
};


exports.fetchAdminPublishedBlogs = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 9;
  const skip = (page - 1) * limit;
  try {
    const [blogs, total] = await Promise.all([
      Blog.find({ status: "ADMIN_PUBLISHED" })
        .skip(skip)
        .limit(limit)
        .sort({ lastUpdatedAt: -1 })
        .populate("authorDetails", "userName fullName profilePicture")
        .lean()
        .exec(),
      Blog.countDocuments({ status: "ADMIN_PUBLISHED" }),
    ]);
    res.json({ blogs, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Error fetching admin published blogs:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getDistinctCategories = async (req, res) => {
  try {
    const categories = await Blog.distinct("category", {
      status: { $in: ["PUBLISHED", "ADMIN_PUBLISHED"] },
      category: { $ne: null, $ne: "" },
    });
    res.json({ categories: categories.sort() });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getDistinctTags = async (req, res) => {
  try {
    const tags = await Blog.distinct("tags", {
      status: { $in: ["PUBLISHED", "ADMIN_PUBLISHED"] },
    });
    res.json({ tags: tags.filter(Boolean).sort() });
  } catch (error) {
    console.error("Error fetching tags:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.toggleBlogLike = async (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: "userId required" });

  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: "Blog not found" });

    // Deduplicate existing likes (keep last entry per userId)
    const seen = new Set();
    blog.blogLikes = blog.blogLikes.filter((l) => {
      const key = l.userId.toString();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const idx = blog.blogLikes.findIndex((l) => l.userId.toString() === userId);
    let liked;
    if (idx !== -1) {
      blog.blogLikes.splice(idx, 1);
      liked = false;
    } else {
      blog.blogLikes.push({
        userId: new mongoose.Types.ObjectId(userId),
        likedTime: new Date(),
      });
      liked = true;
    }

    await blog.save();
    res.json({ liked, likeCount: blog.blogLikes.length });
  } catch (error) {
    console.error("Error toggling blog like:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getBlogLikeStatus = async (req, res) => {
  const userId = req.query.userId;
  try {
    const blog = await Blog.findById(req.params.id).select("blogLikes").lean();
    if (!blog) return res.status(404).json({ error: "Blog not found" });

    const liked = userId
      ? blog.blogLikes.some((l) => l.userId.toString() === userId)
      : false;
    res.json({ liked, likeCount: blog.blogLikes.length });
  } catch (error) {
    console.error("Error fetching like status:", error);
    res.status(500).json({ error: "Server error" });
  }
};
