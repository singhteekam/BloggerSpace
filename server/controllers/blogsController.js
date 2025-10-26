const mongoose = require("mongoose");
const Blog = require("../models/Blog");
const pako = require("pako");
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

exports.fetchAllBlogs = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;
  const skip = (page - 1) * limit;

  try {
    const blogs = await Blog.find({
      status: { $in: ["PUBLISHED", "ADMIN_PUBLISHED"] },
    })
      .skip(skip)
      .limit(limit)
      .sort({ lastUpdatedAt: -1 })
      .populate("authorDetails")
      .exec();

    const total = await Blog.countDocuments({
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

exports.fetchAllBlogsFromDB = async (req, res) => {
  try {
    const blogs = await Blog.find({
      status: { $in: ["PUBLISHED", "ADMIN_PUBLISHED"] },
      tags: "Interview Questions",  // TEMP
    })
      .populate("authorDetails")
      // .populate("blogLikes")  //TEMP
      // .populate("comments.user", "email userName profilePicture")    //TEMP
      // .populate("comments.commentReplies.replyCommentUser",  "email userName profilePicture")   //TEMP
      .exec();

    res.json({
      blogs,
    });
  } catch (error) {
    console.error("Error fetching blogs..:", error);
    res.status(500).json({ error: "Server error.." });
  }
};

exports.fetchMostViewedBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({
      status: { $in: ["PUBLISHED", "ADMIN_PUBLISHED"] },
    })
      .limit(15)
      .sort({ blogViews: -1 });
    // .populate("authorDetails")
    // .exec();

    res.json(blogs);
  } catch (error) {
    logger.error("Error fetching most viewed blogs..:" + error);
    console.error("Error fetching most viewed blogs..:", error);
    res.status(500).json({ error: "Server error.." });
  }
};

exports.fetchRelatedBlogs = async (req, res) => {
  try {
    const blogId = req.params.blogId;
    if (!blogId) {
      return res.status(404).send({ message: "Blog id is required" });
    }

    const currentBlog = await Blog.findById(blogId);
    if (!currentBlog) {
      return res.status(404).send({ message: "Blog not found" });
    }

    const stopwords = [
      "a",
      "the",
      "in",
      "as",
      "of",
      "on",
      "for",
      "and",
      "to",
      "by",
      "with",
    ];
    const words = currentBlog.title
      .split(" ")
      .filter((word) => !stopwords.includes(word.toLowerCase()));
    const titleRegex = new RegExp("\\b(" + words.join("|") + ")\\b", "i");

    const relatedBlogs = await Blog.find({
      _id: { $ne: blogId }, //Exclude current blog
      title: { $regex: titleRegex },
      status: { $in: ["PUBLISHED", "ADMIN_PUBLISHED"] },
    })
      .limit(15)
      .sort({ lastUpdatedAt: -1 });

    res.json(relatedBlogs);
  } catch (error) {
    logger.error("Error fetching related blogs..:" + error);
    console.error("Error fetching related blogs..:", error);
    res.status(500).json({ error: "Server error.." });
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
    const blogs = await Blog.find({ category: category, status: "PUBLISHED" })
      .skip(skip)
      .limit(limit)
      .sort({ blogViews: -1 })
      .populate("authorDetails") // Populate the author field with the User document
      .exec();

    const total = await Blog.countDocuments({
      category: category,
      status: "PUBLISHED",
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
      // .populate("likes")
      .populate("blogLikes")
      // .populate("comments")
      .populate("comments.user", "email userName profilePicture")
      .populate(
        "comments.commentReplies.replyCommentUser",
        "email userName profilePicture"
      )
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
    const { title } = req.body;
    const blog = await Blog.findOne({ title: title });
    if (!blog) {
      logger.debug("Topic is available: " + title);
      return res.json("Available");
    } else {
      logger.error("Topic is not avaialable: " + title);
      return res.json("Already exists");
    }
  } catch (error) {
    logger.error("Error checking isuniquetitle: " + error);
    console.error("Error checking isuniquetitle: ", error);
    res
      .status(500)
      .json({ error: "An error occurred while checking isuniquetitle" });
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
    const subject = "Blog submitted for review";
    const html = `
  <div class="content">
    <h2>Hello, ${authorEmail}!</h2>
    <p>Your blog is submitted for review.</p>
    <p>Topic: <span style="color:#167d7f; font-weight:bold">${title}</span></p>
    <p>Category: <span style="color:#167d7f; font-weight:bold">${category}</span></p>
    <p>Tags: <span style="color:#167d7f; font-weight:bold">${tags}</span></p>
    <p>Content:</p> <div class="blog-content">${content}</div>
    <br />
    <p>Your blog will be reviewed shortly.</p>
    <p><a href="${process.env.FRONTEND_URL}/myblogs" class="button">Track status</a></p>
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
    // const blogLink = `http://localhost:3000/api/blogs/${slug}`;
    const blogLink = `${process.env.REVIEWER_PANEL_URL}/${slug}`;
    const receiver2 = process.env.EMAIL;
    const subject2 = "New Blog available for review";
    const html2 = `
    <p>New blog available for review</p>
    <p>Title: ${title}</p>
    <a href="${blogLink}">${blogLink}</a>
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
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });

    const prompt = `Write a blog in HTML format for the title: "${req.body.title}". 
    Use proper HTML tags like <h1>, <p>, <ul>, <li>, <strong>, etc. 
    Do NOT include <html>, <head>, or <body> tags. Only the content inside.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    const data = response.text;
    // console.log(data);
    res.json(data);
  } catch (error) {
    console.log("Error generating AI blog:", error);
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
    const subject = "Blog submitted for review";
    const html = `
  <div class="content">
    <h2>Hello, ${blog.authorDetails.fullName}!</h2>
    <p>Your blog is submitted for review.</p>
    <p>Topic: <span style="color:#167d7f; font-weight:bold">${title}</span></p>
    <p>Category: <span style="color:#167d7f; font-weight:bold">${category}</span></p>
    <p>Content:</p> <div class="blog-content">${content}</div>
    <br />
    <p>Your blog will be reviewed shortly.</p>
    <p><a href="${process.env.FRONTEND_URL}/myblogs" class="button">Track status</a></p>
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
    // const blogLink = `http://localhost:3000/api/blogs/${slug}`;
    const blogLink = `${process.env.REVIEWER_PANEL_URL}/${slug}`;
    const receiver2 = process.env.EMAIL;
    const subject2 = "New Blog available for review";
    const html2 = `
    <p>New blog available for review</p>
    <p>Title: ${title}</p>
    <a href="${blogLink}">${blogLink}</a>
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

    const blog = await Blog.findOne({ slug: blogSlug });

    if (!blog) {
      logger.error("Blog not found  with blog: " + blogSlug);
      return res.status(404).json({ message: "blog not found" });
    }

    const newComment = {
      content,
      user: req.body.userId,
    };

    blog.comments.push(newComment);
    await blog.save();

    // Populate the user field with email and fullName
    // await blog.populate({ path: "comments.user", select: "email fullName" }).execPopulate();
    await blog.populate("comments.user", "email userName profilePicture");

    // Get the newly added comment with user details
    const addedComment = blog.comments.findLast((comment) =>
      comment.user._id.equals(req.body.userId)
    );

    if (!addedComment) {
      return res.status(500).json({ message: "Failed to add comment" });
    }

    const comments = blog.comments.map((comment) => ({
      _id: comment._id,
      content: comment.content,
      userEmail: comment.user.email,
      likes: comment.likes,
      createdAt: addedComment.createdAt,
    }));
    console.log("Comments: ", comments);
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

    const blog = await Blog.findOne({ slug: blogSlug })

    if (!blog) {
      logger.error("Blog not found  with blog: " + blogSlug);
      return res.status(404).json({ message: "blog not found" });
    }

    const newReplyComment = {
      replyCommentContent: replyCommentContent,
      replyCommentUser: req.query.userId,
    };
    console.log(newReplyComment);

    const repliedToComment = blog.comments
      .map((e) => e._id.toString())
      .indexOf(repliedToCommentId);

    // console.log("Index: "+ typeof(repliedToComment[0].toString()));
    console.log("Index2: " + typeof repliedToCommentId);
    console.log("Index3: " + repliedToComment);
    blog.comments[repliedToComment].commentReplies.push(newReplyComment);
    // console.log("Index2: "+ blog.comments[repliedToComment]);
    await blog.save();
    await blog.populate("comments.commentReplies.replyCommentUser",  "email userName profilePicture")

    const comments = blog.comments.map((comment) => ({
      _id: comment._id,
      content: comment.content,
      userEmail: comment.user.email,
      likes: comment.likes,
    }));
    res.json(comments);
  } catch (error) {
    console.error("Error adding comment:", error);
    logger.error("Error adding comment: " + error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.viewBlogComments = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.blogSlug })
      .populate("comments.user", "email userName profilePicture")
      .exec();

    if (!blog) {
      logger.error(
        "Blog not found to view comment. Blog: " + req.params.blogSlug
      );
      return res.status(404).json({ message: "blog not found" });
    }

    const comments = blog.comments.map((comment) => ({
      _id: comment._id,
      content: comment.content,
      userEmail: comment.user.email,
      userName: comment.user.userName,
      likes: comment.likes,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
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

exports.authorSavedDraftBlogs = async (req, res) => {
  try {
    // Perform the search query based on the provided search query
    const blogs = await Blog.find({
      authorDetails: new mongoose.Types.ObjectId(req.query.userId),
      status: "DRAFT",
    })
      .populate("authorDetails")
      .exec();
    // console.log(blogs);

    res.json(blogs);
  } catch (error) {
    console.error("Error searching published blogs:", error);
    logger.error("Error searching published blogs: " + error);
    res
      .status(500)
      .json({ error: "An error occurred while searching published blogs." });
  }
};
exports.authorPendingReviewBlogs = async (req, res) => {
  try {
    // Perform the search query based on the provided search query
    const blogs = await Blog.find({
      authorDetails: new mongoose.Types.ObjectId(req.query.userId),
      status: "PENDING_REVIEW",
    })
      .populate("authorDetails")
      .exec();
    // console.log(blogs);

    res.json(blogs);
  } catch (error) {
    console.error("Error searching pending review blogs:", error);
    logger.error("Error searching pending review blogs: " + error);
    res
      .status(500)
      .json({ error: "An error occurred while searching published blogs." });
  }
};
exports.authorUnderReviewBlogs = async (req, res) => {
  try {
    // Perform the search query based on the provided search query
    const blogs = await Blog.find({
      authorDetails: new mongoose.Types.ObjectId(req.query.userId),
      status: "UNDER_REVIEW",
    })
      .populate("authorDetails")
      .exec();
    // console.log(blogs);

    res.json(blogs);
  } catch (error) {
    console.error("Error searching under review blogs:", error);
    logger.error("Error searching under review blogs: " + error);
    res
      .status(500)
      .json({ error: "An error occurred while searching published blogs." });
  }
};

//Awaiting author blogs
exports.awaitingAuthorBlogs = async (req, res) => {
  try {
    // Perform the search query based on the provided search query
    const blogs = await Blog.find({
      authorDetails: new mongoose.Types.ObjectId(req.query.userId),
      status: "AWAITING_AUTHOR",
    })
      .populate("authorDetails")
      .exec();
    // console.log(blogs);

    res.json(blogs);
  } catch (error) {
    console.error("Error searching awaiting author blogs:", error);
    logger.error("Error searching awaiting author blogs: " + error);
    res.status(500).json({ error: "An error occurred while searching blogs." });
  }
};

//Awaiting author blogs
exports.authorPublishedBlogs = async (req, res) => {
  try {
    // Perform the search query based on the provided search query
    const blogs = await Blog.find({
      authorDetails: new mongoose.Types.ObjectId(req.query.userId),
      status: "PUBLISHED",
    })
      .populate("authorDetails")
      .exec();
    // console.log(blogs);

    res.json(blogs);
  } catch (error) {
    console.error("Error searching published blogs:", error);
    logger.error("Error searching published blogs:" + error);
    res
      .status(500)
      .json({ error: "An error occurred while searching published blogs." });
  }
};

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
      // blog.likes.splice(blog.likes.indexOf(req.session.userId),1);
      blog.blogLikes.splice(
        blog.blogLikes
          .map((e) => e.userId)
          .indexOf(new mongoose.Types.ObjectId(req.query.userId)),
        1
      );
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
