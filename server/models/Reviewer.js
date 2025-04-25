const mongoose = require("mongoose");

const IST_OFFSET = 330;

const reviewerSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  profilePicture: {
    type: String,
    default: "",
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: "Reviewer",
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    default: "INACTIVE",
  },
  // reviewedBlogs: [
  //   {
  //     title: {
  //       type: String,
  //     },
  //     slug: {
  //       type: String,
  //     },
  //     time: {
  //       type: Date,
  //       // default: Date.now
  //       default: () => new Date(new Date().getTime() + IST_OFFSET * 60000),
  //     },
  //   },
  // ],
  reviewedBlogs: {
    type: Array,
    default: [],
  },
  resetToken: String, // Field for storing the reset token
  resetTokenExpiration: Date, // Field for storing the token expiration date
  createdAt: {
    type: Date,
    // default: Date.now,
    default: () => new Date(new Date().getTime() + IST_OFFSET * 60000),
  },
});

const Reviewer = mongoose.model("reviewers", reviewerSchema);

module.exports = Reviewer;
