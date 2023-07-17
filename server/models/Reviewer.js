const mongoose = require("mongoose");

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
  reviewedBlogs: [
    {
      title: {
        type: String,
      },
      slug: {
        type: String,
      },
      time:{
        type: Date,
        default: Date.now
      }
    }
  ],
  resetToken: String, // Field for storing the reset token
  resetTokenExpiration: Date, // Field for storing the token expiration date
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Reviewer = mongoose.model("reviewers", reviewerSchema);

module.exports = Reviewer;
