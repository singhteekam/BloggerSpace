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
  resetToken: String, // Field for storing the reset token
  resetTokenExpiration: Date, // Field for storing the token expiration date
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
