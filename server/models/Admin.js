const mongoose = require("mongoose");

const IST_OFFSET = 330;

const adminSchema = new mongoose.Schema({
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
    default: "Admin",
  },

  isVerified: {
    type: Boolean,
    default: false,
  },
  savedBlogs: {
    type: Array,
    default: [],
  },
  // Optional 6-digit security key required at login (in addition to the
  // password) once set. Empty string = not configured yet (legacy admins can
  // still log in until they set one from the Admin Panel).
  securityKey: { type: String, default: "" },
  resetToken: String,
  resetTokenExpiration: Date,
  otpCode: { type: String, default: null },
  otpExpiry: { type: Date, default: null },
  createdAt: {
    type: Date,
    // default: Date.now,
    default: () => new Date(new Date().getTime() + IST_OFFSET * 60000),
  },
});

const Admin = mongoose.model("admins", adminSchema);

module.exports = Admin;
