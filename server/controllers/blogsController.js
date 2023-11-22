const mongoose = require("mongoose");
const Blog = require("../models/Blog");
const pako = require("pako");
const sendEmail = require("../services/mailer");

exports.blogsHomepage = async (req, res) => {
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
      .populate("authorDetails") // Populate the author field with the User document
      .exec();

    // console.log(decompressedblogs);
    res.json(blogs);
  } catch (error) {
    console.error("Error fetching blog blogs:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.viewBlogRoute = async (req, res) => {
  try {
    const blog = await Blog.findOne({
      slug: req.params.blogSlug,
      status: "PUBLISHED",
    }).populate("authorDetails")
      .populate("likes")
      .populate("comments")
      .exec();

    if (!blog) {
      return res.status(404).json({ error: "blog not found" });
    }
    // console.log(blog);

    // Decompress the content before displaying it
    const compressedContentBuffer = Buffer.from(blog.content, "base64");
    const decompressedContent = pako.inflate(compressedContentBuffer, {
      to: "string",
    });

    console.log(
      "Content size:",
      Buffer.byteLength(blog.content, "utf8") / 1024,
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
    
    console.log(
      blog.likes.findIndex((like) => like._id.toString()===(req.session.userId))
    );
    const alreadyLiked = blog.likes.findIndex((like) =>
      like._id.toString()===(req.session.userId)
    )!==-1?true:false;

    console.log("Liked? :"+ alreadyLiked);
    res.json({blog, alreadyLiked});
  } catch (error) {
    console.error("Error fetching blog blog:", error);
    res.status(500).json({ error: "Server error" });
  }
};


exports.saveAsDraftBlog= async (req, res)=>{
  try {
    const { slug, title, content, category, tags } = req.body;

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
    if(blog){
        blog.slug= slug;
        blog.title=title;
        blog.content = compressedContent;
        blog.category= category;
        blog.lastUpdatedAt = new Date(new Date().getTime() + 330 * 60000);
        blog.tags= tags;
        await blog.save();

      return res.json(blog);
    }

    const newPost = new Blog({
      slug,
      title,
      content: compressedContent,
      category,
      authorDetails: req.session.userId,
      status: "DRAFT",
      lastUpdatedAt: new Date(new Date().getTime() + 330 * 60000),
      tags,
    });
    const savedBlog = await newPost.save();

    res.json(savedBlog);
  } catch (error) {
    console.error("Error creating new post:", error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the post" });
  }
}

exports.isUniqueTitle= async (req, res)=>{
  try {
    const {title}= req.body;
    const blog= await Blog.findOne({ title: title});
    if(!blog){
      return res.json("Available");
    }
    else{
      return res.json("Already exists");
    }
  } catch (error) {
    console.error("Error checking isuniquetitle: ", error);
    res.status(500).json({ error: "An error occurred while checking isuniquetitle" });
  }
}

exports.createNewBlog = async (req, res) => {
  try {
    const { slug, title, content, category, tags } = req.body;

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
      authorDetails: req.session.userId,
      // lastUpdatedAt: Date.now(),
      lastUpdatedAt: new Date(new Date().getTime() + 330 * 60000),
      tags,
    });
    const savedBlog = await newPost.save();

    // Sending mail to author
    const receiver = req.session.email;
    const subject = "Blog submitted for review";
    const html = "<p>New blog submitted successfully for review</p>";

    sendEmail(receiver, subject, html)
      .then((response) => {
        console.log(`Email sent to ${receiver}:`, response);
        // Handle success
      })
      .catch((error) => {
        console.error("Error sending email:", error);
        // Handle error
      });

    // Sending mail to admin
    // const blogLink = `http://localhost:3000/api/blogs/${slug}`;
    const blogLink = `${process.env.FRONTEND_URL}/${slug}`;
    const receiver2 = process.env.EMAIL;
    const subject2 = "New Blog available for review";
    const html2 = `
    <p>New blog available for review</p>
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
    res
      .status(500)
      .json({ error: "An error occurred while creating the post" });
  }
};



exports.editBlog = async (req, res) => {
  try {
    const blog = await Blog.findById({
      _id: new mongoose.Types.ObjectId(req.params.id),
    }).populate("authorDetails").exec();

    if (!blog) {
      return res.status(404).json({ error: "blog not found" });
    }

    // Decompress the content before displaying it
    const compressedContentBuffer = Buffer.from(blog.content, "base64");
    const decompressedContent = pako.inflate(compressedContentBuffer, {
      to: "string",
    });
    blog.content = decompressedContent;

    res.json(blog);
  } catch (error) {
    console.error("Error fetching blog blog:", error);
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
    });

    if (!blog) {
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
    if(blog.status==="AWAITING_AUTHOR")
      blog.status="UNDER_REVIEW";
    else
      blog.status = "PENDING_REVIEW";

    // Save the updated blog
    await blog.save();

    res.json({ message: "blog updated successfully" });
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.postNewBlogComment = async (req, res) => {
  try {
    const { blogSlug } = req.params;
    const { content } = req.body;

    const blog = await Blog.findOne({ slug: blogSlug });

    if (!blog) {
      return res.status(404).json({ message: "blog not found" });
    }

    const newComment = {
      content,
      user: req.session.userId,
    };

    blog.comments.push(newComment);
    await blog.save();

    // Populate the user field with email and fullName
    // await blog.populate({ path: "comments.user", select: "email fullName" }).execPopulate();
    await blog.populate("comments.user", "email userName");

    // Get the newly added comment with user details
    const addedComment = blog.comments.find((comment) =>
      comment.user._id.equals(req.session.userId)
    );

    if (!addedComment) {
      return res.status(500).json({ message: "Failed to add comment" });
    }

    const responseComment = {
      _id: addedComment._id,
      content: addedComment.content,
      userEmail: addedComment.user.email,
      userName: addedComment.user.userName,
      userProfilePic: addedComment.user.profilePicture
    };

    res.json(responseComment);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.viewBlogComments = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.blogSlug })
      .populate("comments.user", "email userName")
      .exec();

    if (!blog) {
      return res.status(404).json({ message: "blog not found" });
    }

    const comments = blog.comments.map((comment) => ({
      _id: comment._id,
      content: comment.content,
      userEmail: comment.user.email,
      userName: comment.user.userName,
      likes: comment.likes
    }));

    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// Search blogs
exports.searchBlogsFromDB = async (req, res) => {
  try {
    const query = req.params.query;
    console.log(query);

    // Perform the search query based on the provided search query
    const blogs = await Blog.find({
      $or: [
        { title: { $regex: ".*" + query + ".*", $options: "i" } },
        { author: { $regex: ".*" + query + ".*", $options: "i" } },
        { category: { $regex: ".*" + query + ".*", $options: "i" } },
      ],
      status: "PUBLISHED",
    });
    console.log(blogs);

    res.json(blogs);
  } catch (error) {
    console.error("Error searching blogs:", error);
    res.status(500).json({ error: "An error occurred while searching blogs." });
  }
};


exports.authorSavedDraftBlogs = async (req, res) => {
  try {
    // Perform the search query based on the provided search query
    const blogs = await Blog.find({
      authorDetails: req.session.userId,
      status: "DRAFT",
    }).populate("authorDetails").exec();
    // console.log(blogs);

    res.json(blogs);
  } catch (error) {
    console.error("Error searching published blogs:", error);
    res
      .status(500)
      .json({ error: "An error occurred while searching published blogs." });
  }
};
exports.authorPendingReviewBlogs = async (req, res) => {
  try {
    // Perform the search query based on the provided search query
    const blogs = await Blog.find({
      authorDetails: req.session.userId,
      status: "PENDING_REVIEW",
    }).populate("authorDetails").exec();
    // console.log(blogs);

    res.json(blogs);
  } catch (error) {
    console.error("Error searching published blogs:", error);
    res
      .status(500)
      .json({ error: "An error occurred while searching published blogs." });
  }
};
exports.authorUnderReviewBlogs = async (req, res) => {
  try {
    // Perform the search query based on the provided search query
    const blogs = await Blog.find({
      authorDetails: req.session.userId,
      status: "UNDER_REVIEW",
    }).populate("authorDetails").exec();
    // console.log(blogs);

    res.json(blogs);
  } catch (error) {
    console.error("Error searching published blogs:", error);
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
      authorDetails: req.session.userId,
      status: "AWAITING_AUTHOR",
    }).populate("authorDetails").exec();
    // console.log(blogs);

    res.json(blogs);
  } catch (error) {
    console.error("Error searching blogs:", error);
    res.status(500).json({ error: "An error occurred while searching blogs." });
  }
};

//Awaiting author blogs
exports.authorPublishedBlogs = async (req, res) => {
  try {
    // Perform the search query based on the provided search query
    const blogs = await Blog.find({
      authorDetails: req.session.userId,
      status: "PUBLISHED",
    }).populate("authorDetails").exec();
    // console.log(blogs);

    res.json(blogs);
  } catch (error) {
    console.error("Error searching published blogs:", error);
    res
      .status(500)
      .json({ error: "An error occurred while searching published blogs." });
  }
};


exports.blogLikes=async (req,res)=>{
  let thumbColor = req.body.thumbColor;
  try {
    const blog= await Blog.findById({
      _id: new mongoose.Types.ObjectId(req.params.id)
    })
    if (!blog) {
      return res.status(404).json({ error: "blog not found" });
    }
    // if (blog.likes.findIndex((like) => like._id.toString() === req.session.userId) !== -1){
    //   return res.status(404).json({ error: "blog already liked" });
    // }
      var newThumbColor;
    if(thumbColor==="regular"){
      blog.likes.push(req.session.userId);
      newThumbColor = "solid";
    }
    else if(thumbColor==="solid"){
      // console.log(blog.likes.indexOf(req.session.userId));
      blog.likes.splice(blog.likes.indexOf(req.session.userId),1);
      newThumbColor = "regular";
    }
    // blog.likes=[];
    await blog.save();

    // console.log(req.session.userId);
    // console.log(blog.likes.indexOf(req.session.userId));
    // console.log(blog.likes[1].toString());

    const newLikes= blog.likes;
    res.json({newThumbColor, newLikes});
  } catch (error) {
    res.status(500).json({ error: "An error occurred..." });
  }
}

exports.blogCommentLikes = async (req, res) => {
  let commentId= req.body.commentId;
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
    console.log(commentId+ " --- "+ commentThumbColor);

    var newCommentThumbColor;
    if (commentThumbColor === "regular") {
      blog.comments.find(comment=> comment._id.toString()===commentId).likes.push(req.session.userId);
      newCommentThumbColor = "solid";
    } else if (commentThumbColor === "solid") {
      blog.comments.find((comment) => comment._id.toString() === commentId).likes.splice(blog.comments.find((comment) => comment._id.toString() === commentId).likes.indexOf(req.session.userId));
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
    res.status(500).json({ error: "An error occurred..." });
  }
};