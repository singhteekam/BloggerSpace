const mongoose = require("mongoose");

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
  role:{
    type: String,
    default: "Admin"
  },

  isVerified: {
    type: Boolean,
    default: false,
  },
  resetToken: String, // Field for storing the reset token
  resetTokenExpiration: Date, // Field for storing the token expiration date
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Admin = mongoose.model("admins", adminSchema);

module.exports = Admin;
