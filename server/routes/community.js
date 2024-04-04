const express = require("express");
const { createCommunityPost, getAllCommunityPosts, getCommunityPost, addReplyToCommunityPost } = require("../controllers/communityController");
const router = express.Router();
const authenticate = require("../middlewares/authenticate");

router.get("/communityposts", getAllCommunityPosts);

router.post("/newpost",authenticate, createCommunityPost);

router.get("/post/:communityPostSlug", getCommunityPost);

router.post("/:communityPostId/addreply",authenticate, addReplyToCommunityPost);

module.exports = router;