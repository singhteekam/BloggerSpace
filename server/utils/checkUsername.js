const User=require("../models/User");
const Reviewer= require("../models/Reviewer");
const Admin= require("../models/Admin");

// Check username
exports.checkUserName = async (req, res) => {
  try {
    const { userName } = req.body;
    const user = await User.findOne({ userName });
    const reviewer = await Reviewer.findOne({ userName });
    const admin = await Admin.findOne({ userName });

    if (!user && !reviewer && !admin) {
      console.log("Username available and prev username is " + userName);
      // return res.status(404).json({ message: "User not found" });
      res.status(200).json({ message: "Username available" });
    } else {
      res.status(404).json({ message: "Username not available1" });
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Username not available" });
  }
};


