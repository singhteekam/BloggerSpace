const Admin= require("../models/Admin");
const Reviewer= require("../models/Reviewer");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

exports.changeAccountPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.query.userId;
    const role= req.query.role;
    var user;
    if(role==="Admin"){
      user = await Admin.findById({
      _id: new mongoose.Types.ObjectId(userId),
    });
    console.log("user: " + user);
    }
    else if(role==="Reviewer"){
      user = await Reviewer.findById({
      _id: new mongoose.Types.ObjectId(userId),
    });
    console.log("user: " + user);
    }
    else{
      res.status(500).json({ error: "Error occured while changing password!!" });
    }

    // Verify the old password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid old password" });
    }

    // Generate a salt and hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the user's password in the database
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Server error" });
  }
};