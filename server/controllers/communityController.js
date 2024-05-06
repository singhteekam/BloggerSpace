const User = require("../models/User");
const Community = require("../models/Community");
const sendEmail = require("../services/mailer");
const pako = require("pako");


exports.getAllCommunityPosts = async (req, res) => {
  try {
    const posts = await Community.find({})
      .sort({ createdAt: -1 })
      .populate("communityPostAuthor") // Populate the author field with the User document
      .exec();

    // console.log(typeof posts[1].communityPostContent);

    for (let i = 0; i < posts.length; i++) {
      const compressedContentBuffer = Buffer.from(posts[i].communityPostContent, "base64");
      const decompressedContent = pako.inflate(compressedContentBuffer, {
        to: "string",
      });
      posts[i].communityPostContent= decompressedContent
    }
    
    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Server error" });
  }
};


exports.createCommunityPost = async (req, res) => {
  let iframely;
  try {
    const {
      communityPostSlug,
      communityPostTopic,
      communityPostCategory,
      communityPostContent,
    } = req.body;

    // Compress the content before saving it
    const compressedContentBuffer = pako.deflate(communityPostContent, {
      to: "string",
    });
    const compressedContent = Buffer.from(compressedContentBuffer).toString(
      "base64"
    );

    const newCommunityPost = new Community({
      communityPostSlug,
      communityPostTopic,
      communityPostCategory,
      communityPostContent: compressedContent,
      communityPostAuthor: req.session.userId,
      communityPostStatus:"PUBLISHED",
      lastUpdatedAt: new Date(new Date().getTime() + 330 * 60000),
    });
    const savedPost = await newCommunityPost.save();
    // console.log("Post saved...");

    // Sending mail to Admin
    const receiver = process.env.EMAIL;
    const subject = "New community post created!!";
    const html = `<p>Post title: ${communityPostTopic}</p>`;

    sendEmail(receiver, subject, html)
      .then((response) => {
        console.log(`Email sent to ${receiver}:`, response);
      })
      .catch((error) => {
        console.error("Error sending email:", error);
      });

    res.json(savedPost);
  } catch (error) {
    console.log("Error:" + error);
    res.status(500).json({ message: "Failed to add post to community" });
  }
};


exports.getCommunityPost = async (req, res) => {
  try {
    const post = await Community.findOne({communityPostSlug: req.params.communityPostSlug})
      .populate("communityPostAuthor") // Populate the author field with the User document
      .populate("communityPostComments.replyCommunityPostAuthor", "userName profilePicture")
      .exec();

      const compressedContentBuffer = Buffer.from(post.communityPostContent, "base64");
      const decompressedContent = pako.inflate(compressedContentBuffer, {
        to: "string",
      });
      post.communityPostContent= decompressedContent;

      for (let i = 0; i < post.communityPostComments.length; i++) {
        const compressedContentBuffer = Buffer.from(post.communityPostComments[i].replyCommunityPostContent, "base64");
        const decompressedContent = pako.inflate(compressedContentBuffer, {
          to: "string",
        });
        post.communityPostComments[i].replyCommunityPostContent= decompressedContent;
      }
    
    res.json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ error: "Server error" });
  }
};



exports.addReplyToCommunityPost = async (req, res) => {
  try {
    const {
      communityPostContent,
    } = req.body;

    const post = await Community.findOne({communityPostId: req.params.communityPostId});

    if(!post)
      return res.status(404).json({ message: "Post not found" });

    // Compress the content before saving it
    const compressedContentBuffer = pako.deflate(communityPostContent, {
      to: "string",
    });
    const compressedContent = Buffer.from(compressedContentBuffer).toString(
      "base64"
    );

    const newCommunityPostReply = {
      replyCommunityPostContent: compressedContent,
      replyCommunityPostAuthor: req.session.userId,
      lastUpdatedAt: new Date(new Date().getTime() + 330 * 60000),
    };
    post.communityPostComments.push(newCommunityPostReply);
    await post.save();
    // console.log("Post saved...");

    // Sending mail to Admin
    const receiver = process.env.EMAIL;
    const subject = "New community post created!!";
    const html = `<p>Reply: ${communityPostContent}</p>`;

    sendEmail(receiver, subject, html)
      .then((response) => {
        console.log(`Email sent to ${receiver}:`, response);
      })
      .catch((error) => {
        console.error("Error sending email:", error);
      });

    res.json(newCommunityPostReply);
  } catch (error) {
    console.log("Error:" + error);
    res.status(500).json({ message: "Failed to add reply to post" });
  }
};