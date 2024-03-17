const mongoose = require("mongoose");
const { commentSchema } = require("./Comment");
const User= require("./User");

const IST_OFFSET = 330;

const blogSchema = new mongoose.Schema({
  blogId: {
    type: Number,
    default:()=> (new Date().getTime() + IST_OFFSET * 60000)+Math.floor(Math.random() * (90) + 10).toString(),
  },
  slug: {
    type: String,
    required: false,
  },
  title: {
    type: String,
    required: true,
  },
  category: {
    type: String,
  },
  tags: {
    type: Array,
  },
  content: {
    type: String,
    required: true,
  },
  authorDetails: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User,
  },
  status: {
    type: String,
    default: "PENDING_REVIEW",
  },
  currentReviewer: {
    type: String,
    default: "",
  },
  feedbackToAuthor: {
    type: Array,
    default: []
  },
  reviewedBy: {
    type: Array,
    default: [],
  },
  reportBlog: {
    type: Array,
    default: [],
  },
  createdAt: {
    type: Date,
    // default: Date.now,
    default: () => new Date(new Date().getTime() + IST_OFFSET * 60000),
  },
  lastUpdatedAt: {
    type: Date,
    default: "",
  },
  blogLikes: {
    type: Array,
    default: [],
  },
  blogViews: {
    type: Number,
    default: 0,
  },
  comments: [commentSchema],
});

const Blog = mongoose.model("Blog", blogSchema);

module.exports = Blog;
