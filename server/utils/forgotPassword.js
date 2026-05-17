const Admin = require("../models/Admin");
const User = require("../models/User");
const sendEmail = require("../services/mailer");

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Check Admin first, then User collection (reviewers are now in User collection)
    const user = (await Admin.findOne({ email })) || (await User.findOne({ email }));

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const resetToken = generateResetToken();
    user.resetToken = resetToken;
    user.resetTokenExpiration = Date.now() + 60000;
    await user.save();

    const resetUrl = `${req.protocol}://${req.get("host")}/resetpassword/${resetToken}`;

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

    await sendEmail(email, subject, html);
    return res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to send password reset email" });
  }
};

function generateResetToken() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
