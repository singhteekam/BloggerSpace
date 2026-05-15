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

    const receiver = email;
    const subject = "Password reset request — BloggerSpace";
    const html = `
      <div class="content">
        <h2>Reset your password</h2>
        <p>We received a request to reset the password for your BloggerSpace account. Click the button below to choose a new password.</p>
        <p><a class="btn" href="${resetUrl}">Reset Password</a></p>
        <div class="warn-box">
          This link expires in <strong>1 minute</strong>. If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged.
        </div>
        <p class="text-muted">If the button above doesn't work, copy and paste this URL into your browser:<br>${resetUrl}</p>
      </div>
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