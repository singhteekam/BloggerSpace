const Admin = require("../models/Admin");
const User = require("../models/User");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

exports.changeAccountPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.query.userId;
    const role = req.query.role;

    let user;
    if (role === "Admin") {
      user = await Admin.findById(new mongoose.Types.ObjectId(userId));
    } else {
      // Reviewers are now in User collection
      user = await User.findById(new mongoose.Types.ObjectId(userId));
    }

    if (!user) return res.status(404).json({ error: "User not found" });

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid old password" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Server error" });
  }
};
