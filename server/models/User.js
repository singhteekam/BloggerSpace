const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const IST_OFFSET = 330;

const userSchema = new mongoose.Schema({
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
  authType:{
    type:String,
    default:"Email"
  },
  verificationToken: {
    type: String,
    default: null,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    default: "INACTIVE",
  },
  savedBlogs:{
    type: Array,
    default:[]
  },
  followers:[{
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  }],
  following:[{
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  }],
  role: {
    type: String,
    enum: ["user", "reviewer"],
    default: "user",
  },
  reviewerStatus: {
    type: String,
    enum: ["none", "pending", "approved", "rejected"],
    default: "none",
  },
  reviewedBlogs: {
    type: Array,
    default: [],
  },
  gems: { type: Number, default: 0 },

  // Phase 5 — cached sum of blogScores across all published blogs by this user.
  // Recomputed on every blogScore change. Default 0 so existing user docs
  // remain valid; recompute happens lazily the next time a blog is scored.
  creatorScore: { type: Number, default: 0, min: 0 },

  // Phase 6 — cached reviewer-quality aggregate across all ReviewScore docs.
  // All three are recomputed from scratch whenever a ReviewScore is saved.
  reviewerScoreAvg:   { type: Number, default: 0, min: 0 },
  reviewerScoreCount: { type: Number, default: 0, min: 0 },
  reviewerScoreBest:  { type: Number, default: 0, min: 0 },

  resetToken: String,
  resetTokenExpiration: Date,
  // OTP-based email verification fields
  otpCode: {
    type: String,
    default: null,
  },
  otpExpiry: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    // default: Date.now,
    default: () => new Date(new Date().getTime() + IST_OFFSET * 60000),
  },
  lastLogin:{
    type:Date,
    default:()=> new Date(new Date().getTime() + IST_OFFSET * 60000),
  }
});

userSchema.methods.generateVerificationToken = function () {
  const token = uuidv4(); // Generate a unique verification token using uuid
  this.verificationToken = token;
  return token;
};

const User = mongoose.model("users", userSchema);

module.exports = User;
