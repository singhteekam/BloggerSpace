const bcrypt = require("bcrypt");
const Admin = require("../models/Admin");
const User = require("../models/User");

exports.resetPassword = async (req, res) => {
  const { resetToken, password } = req.body;

  try {
    // Check Admin first, then User collection (reviewers are now in User collection)
    const user =
      (await Admin.findOne({
        resetToken,
        resetTokenExpiration: { $gt: Date.now() },
      })) ||
      (await User.findOne({
        resetToken,
        resetTokenExpiration: { $gt: Date.now() },
      }));

    if (!user) {
      return res.status(404).json({ error: "Invalid reset link" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to reset password" });
  }
};
