const bcrypt = require("bcrypt");
const Reviewer = require("../models/Reviewer");
const Admin = require("../models/Admin");

// Resetting password
exports.resetPassword = async (req, res) => {
  const { resetToken, password } = req.body;

  try {
    const user =
      (await Admin.findOne({
        resetToken: resetToken,
        resetTokenExpiration: { $gt: Date.now() },
      })) ||
      (await Reviewer.findOne({
        resetToken: resetToken,
        resetTokenExpiration: { $gt: Date.now() },
      }));

    if (!user) {
    // User not found, return an error message
    return res.status(404).json({ error: "Invalid reset link" });
    }

    // Hash the new password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ error: "Failed to reset password" });
      }

      // Update the user's password and reset token fields
      user.password = hashedPassword;
      user.resetToken = undefined;
      user.resetTokenExpiration = undefined;

    });
    // Save the updated user object
    await user.save();
      
    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to reset password" });
  }
};
