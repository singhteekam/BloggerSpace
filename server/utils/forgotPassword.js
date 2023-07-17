const Admin = require("../models/Admin");
const Reviewer = require("../models/Reviewer");
const sendEmail = require("../services/mailer");

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user =
      (await Admin.findOne({ email })) || (await Reviewer.findOne({ email }));
   
    if (!user) {
      // User not found, return an error message
      return res.status(404).json({ error: "User not found" });
    }

    // Generate a unique password reset token
    const resetToken = generateResetToken();

    // Save the reset token and its expiration date in the user's document
    user.resetToken = resetToken;
    user.resetTokenExpiration = Date.now() + 60000; // Token valid for 1 minute
    await user.save();

    // Create the password reset email
    // const resetUrl = `http://localhost:4000/resetpassword/${resetToken}`;
    const resetUrl = `${req.protocol}://${req.get("host")}/resetpassword/${resetToken}`;

    const receiver= email;
    const subject = "Password Reset Request";
    const html = `
    You are receiving this email because you (or someone else) has requested to reset the password for your account.\n\nPlease click on the following link to reset your password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n
    `; 

    // Send the password reset email
    await sendEmail(receiver, subject, html);

    // Email sent successfully
    return res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    // An error occurred, return an error message
    console.error(error);
    return res
      .status(500)
      .json({ error: "Failed to send password reset email" });
  }
};


function generateResetToken() {
  const tokenLength = 32;
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";

  for (let i = 0; i < tokenLength; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    token += chars.charAt(randomIndex);
  }

  return token;
}