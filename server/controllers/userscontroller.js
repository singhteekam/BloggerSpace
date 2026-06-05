// controllers/users.js
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const User = require("../models/User");
// const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Blogs = require("../models/Blog");
const sendEmail = require("../services/mailer");
const validateUsername = require("../utils/validateUsername");
const Visit = require("../models/Visitor");
const logger = require("./../utils/Logging/logs");
const passport = require("../services/passportAuth.js");
const AdminConfig = require("../models/AdminConfig");
const { revalidate } = require("../utils/revalidate");

// ── Re-verification helpers ───────────────────────────────────────────────────
const REVERIFY_MAX_ATTEMPTS = 5;
const REVERIFY_LOCKOUT_MS   = 30 * 60 * 1000; // 30 minutes

let _configCache = { value: null, expiresAt: 0 };
async function getReverificationPeriod() {
  if (_configCache.value && Date.now() < _configCache.expiresAt) return _configCache.value;
  const config = await AdminConfig.findOne({}).lean();
  const period = config?.reverificationPeriodDays ?? 30;
  _configCache = { value: period, expiresAt: Date.now() + 60_000 };
  return period;
}
const { uploadImageToGitHub } = require("../utils/uploadImageToGitHub");
const PDFDocument = require('pdfkit');

// Returns a random 6-digit numeric OTP string
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// verifyAccount controller
exports.verifyAccount = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ email });

    if (!user) {
      logger.error("User not found with given email");
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      logger.info("Given user is already verified");
      return res.status(400).json({ message: "User is already verified" });
    }

    // Create the verification token
    const verificationToken = user.generateVerificationToken();

    // Save the user with the new verification token
    await user.save();
    // Create the verification link
    // const verificationLink = `${req.protocol}://${req.get(
    //   "host"
    // )}/api/users/verify-account?token=${verificationToken}`;
    const verificationLink = `${process.env.FRONTEND_URL}/api/users/verify-account?token=${verificationToken}`;

    const receiver = email;
    const subject = "VerifY your Account - BloggerSpace";
    const html = `
              <div class="content">
                <h2>Hi ${email},</h2>
                <p>Please click the following link to verify your account:</p>
                <a href="${verificationLink}">${verificationLink}</a>
                <br />
                <b>Note: Ignore this mail if not requested by you.</b>
              </div>
                `;

    sendEmail(receiver, subject, html)
      .then((response) => {
        console.log(`Email sent to ${receiver}:`, response);
        logger.debug("Verification emails sent successfully.");
      })
      .catch((error) => {
        console.error("Error sending email:", error);
        logger.error(
          "Error sending verification emails to receivers. Error: " + error
        );
      });
  } catch (error) {
    console.error("Error sending verification email:", error);
    logger.error("Error sending verification email:" + error);
    res.status(500).json({ message: "Failed to send verification email" });
  }
};

exports.verifyAccountget = async (req, res) => {
  try {
    // Get the verification token from the query parameters
    const { token } = req.query;

    // Find the user by the verification token
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      logger.error("Invalid verification token");
      // No user found with the provided token
      return res.status(400).send("Invalid verification token");
    }

    // Update the user's verification status
    user.isVerified = true;
    user.verificationToken = null;
    await user.save();
    // Redirect the user to the success page or any other page of your choice
    logger.debug(
      "Account verified successfully. redirecting to the verification success page."
    );
    res.redirect("/api/users/verification-success");
  } catch (error) {
    console.error("Failed to verify account:", error);
    logger.error("Failed to verify account: " + error.message);
    res.status(500).send("Failed to verify account");
  }
};

exports.signup = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.isVerified) {
        // Fully registered account — reject re-registration
        logger.error("Signup attempt for already-verified email: " + email);
        return res.status(400).json({ message: "User already exists" });
      }

      // Account was created before but never verified — issue a fresh OTP so they
      // can complete verification without creating a duplicate account.
      const otp = generateOtp();
      existingUser.otpCode = otp;
      existingUser.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await existingUser.save();

      sendEmail(email, "Your BloggerSpace verification code", `
        <div class="content">
          <h2>Hi ${existingUser.fullName},</h2>
          <p>You tried to sign up again. Your account already exists but hasn't been verified yet.</p>
          <p>Enter the code below to complete verification:</p>
          <div class="otp-code">${otp}</div>
          <div class="info-box">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</div>
          <p class="text-muted">Didn't request this? You can safely ignore this email.</p>
        </div>
      `).catch((err) => logger.error("Failed to send re-signup OTP email: " + err));

      logger.debug("Re-signup attempt for unverified account, new OTP sent: " + email);
      return res.status(200).json({
        message: "otp_required",
        email,
        info: "Account exists but is not verified. A new code has been sent to your email.",
      });
    }

    // New user — create account in INACTIVE/unverified state until OTP is confirmed
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();

    const newUser = new User({
      fullName,
      userName: email.substring(0, email.indexOf("@")).replace(/[^a-zA-Z0-9]/g, ""),
      email,
      password: hashedPassword,
      status: "INACTIVE",  // Activated on OTP verification
      isVerified: false,
      otpCode: otp,
      otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
    });

    await newUser.save();

    // Fire-and-forget — a failed email must not block account creation
    sendEmail(email, "Your BloggerSpace verification code", `
      <div class="content">
        <h2>Hi ${fullName},</h2>
        <p>Welcome to BloggerSpace! Enter the code below to verify your account and get started.</p>
        <div class="otp-code">${otp}</div>
        <div class="info-box">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</div>
        <p class="text-muted">Didn't sign up for BloggerSpace? You can safely ignore this email.</p>
      </div>
    `).catch((err) => logger.error("Failed to send signup OTP email: " + err));

    logger.debug("New user created (pending OTP verification): " + email);
    return res.status(201).json({
      message: "otp_required",
      email,
      info: "Account created. Enter the code sent to your email to complete sign-up.",
    });

  } catch (error) {
    logger.error("Signup failed. Error: " + error.message);
    res.status(500).json({ message: "Signup failed", error: error.message });
  }
};

// Login controller
exports.login = async (req, res) => {
  // console.log("Session Id: " + req.sessionID);
  try {
    const { email, password } = req.body;

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      logger.error("User not found with given email.");
      return res.status(404).json({ message: "User not found" });
    }

    // Compare the password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.error("The password is invalid.");
      return res.status(401).json({ message: "Invalid password" });
    }

    // Block deactivated accounts
    if (user.status === "INACTIVE") {
      return res.status(403).json({ message: "account_deactivated", info: "Your account has been deactivated. Please contact support." });
    }

    // OTP gate — unverified accounts must verify before a session token is issued
    if (!user.isVerified) {
      const otp = generateOtp();
      user.otpCode = otp;
      user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await user.save();

      sendEmail(user.email, "Your BloggerSpace verification code", `
        <div class="content">
          <h2>Hi ${user.fullName},</h2>
          <p>Your account isn't verified yet. Enter the code below to complete verification and sign in.</p>
          <div class="otp-code">${otp}</div>
          <div class="info-box">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</div>
          <p class="text-muted">Didn't request this? You can safely ignore this email.</p>
        </div>
      `).catch((err) => logger.error("Failed to send login OTP email: " + err));

      logger.info("Login blocked — account not verified, OTP sent: " + user.email);
      return res.status(403).json({
        message: "otp_required",
        email: user.email,
        info: "Your email is not verified. An OTP has been sent to your email.",
      });
    }

    // ── Periodic re-verification gate (Email auth only) ──────────────
    const periodDays = await getReverificationPeriod();
    const lastVerified = user.lastVerifiedAt;
    const daysSince = lastVerified
      ? (Date.now() - new Date(lastVerified).getTime()) / 86_400_000
      : Infinity;

    if (daysSince > periodDays) {
      // Check lockout from previous failed re-verification attempts
      if (user.reverifyLockedUntil && new Date() < new Date(user.reverifyLockedUntil)) {
        return res.status(403).json({
          message: "reverify_locked",
          info: "Too many failed verification attempts. Please try again later.",
          lockedUntil: user.reverifyLockedUntil,
        });
      }

      // Don't issue a JWT. The /reverify page will request the OTP on mount
      // (single source of truth for sending — avoids duplicate emails).
      logger.info("Login blocked — re-verification required: " + user.email);
      return res.status(403).json({
        message: "reverification_required",
        email: user.email,
        info: `Your account requires periodic re-verification every ${periodDays} days.`,
      });
    }
    // ──────────────────────────────────────────────────────────────────

    // Updating user's last login
    const previousLogin = user.lastLogin;
    user.lastLogin = new Date(new Date().getTime() + 330 * 60000);
    await user.save();

    // Block reviewer applicants that are not yet approved
    if (user.role === "reviewer" && user.reviewerStatus !== "approved") {
      return res.status(403).json({ message: "Your reviewer application is still pending admin approval." });
    }

    // Unified JWT using CURRENT_JWT_SECRET (same secret as reviewer/admin)
    const token = jwt.sign(
      { userId: user._id, currentuserId: user._id, role: user.role || "user" },
      process.env.CURRENT_JWT_SECRET,
      { expiresIn: "3d" }
    );
    const userDetails = {
      _id: user._id,
      fullName: user.fullName,
      userName: user.userName,
      email: user.email,
      isVerified: user.isVerified,
      profilePicture: user.profilePicture,
      savedBlogs: user.savedBlogs,
      role: user.role || "user",
      reviewerStatus: user.reviewerStatus,
      createdAt: user.createdAt,
    };

    // req.session.user = user; // Will remove in future
    // req.session.userId = user._id;
    // req.session.token = token;
    // req.session.email = user.email;
    // console.log("userId: " + req.session.userId);

    // logger.debug("New user logged in: " + user.fullName);
    res
      .status(200)
      .json({ message: "Login successful", token, userDetails, previousLogin });
  } catch (error) {
    logger.error("Login failed: " + error.message);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

// Verify OTP submitted by the user after signup or login
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Guard against calling this endpoint on an already-verified account
    if (user.isVerified) {
      return res.status(400).json({ message: "Account is already verified." });
    }

    if (!user.otpCode || !user.otpExpiry) {
      return res.status(400).json({ message: "No OTP found. Please request a new one." });
    }

    if (new Date() > user.otpExpiry) {
      // Clean up the stale OTP
      user.otpCode = null;
      user.otpExpiry = null;
      await user.save();
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    if (user.otpCode !== otp.toString().trim()) {
      return res.status(400).json({ message: "Incorrect OTP. Please try again." });
    }

    // OTP is valid — activate and verify the account
    user.isVerified = true;
    user.status = "ACTIVE";
    user.otpCode = null;
    user.otpExpiry = null;
    user.lastVerifiedAt = new Date(); // start the re-verification clock
    user.lastLogin = new Date(new Date().getTime() + 330 * 60000); // IST
    await user.save();

    // Issue a JWT so the user is logged in immediately after verification
    const token = jwt.sign(
      { userId: user._id, currentuserId: user._id, role: user.role || "user" },
      process.env.CURRENT_JWT_SECRET,
      { expiresIn: "3d" }
    );

    const userDetails = {
      _id: user._id,
      fullName: user.fullName,
      userName: user.userName,
      email: user.email,
      isVerified: user.isVerified,
      profilePicture: user.profilePicture,
      savedBlogs: user.savedBlogs,
      role: user.role || "user",
      reviewerStatus: user.reviewerStatus,
      createdAt: user.createdAt,
    };

    // Welcome email — fire and forget
    sendEmail(email, "Your BloggerSpace account is verified!", `
      <div class="content">
        <h2>You're verified, ${user.fullName}!</h2>
        <p>Your email has been confirmed and your account is now active. Welcome to BloggerSpace — a space where every story is reviewed by a real human before it goes live.</p>
        <p>
          <a class="btn" href="${process.env.FRONTEND_URL}/blogs">Explore Blogs</a>
          &nbsp;
          <a class="btn-outline" href="${process.env.FRONTEND_URL}/newblog">Start Writing</a>
        </p>
      </div>
    `).catch((err) => logger.error("Failed to send verification success email: " + err));

    logger.debug("Account verified via OTP: " + email);
    return res.status(200).json({
      message: "Account verified successfully",
      token,
      userDetails,
    });

  } catch (error) {
    logger.error("OTP verification failed: " + error.message);
    res.status(500).json({ message: "Verification failed", error: error.message });
  }
};

// Resend OTP to an unverified account
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email });

    // Don't reveal whether the email is registered (prevents account enumeration)
    if (!user) {
      return res.status(200).json({ message: "If that email is registered, a new code has been sent." });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "This account is already verified." });
    }

    const otp = generateOtp();
    user.otpCode = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendEmail(email, "Your new BloggerSpace verification code", `
      <div class="content">
        <h2>Hi ${user.fullName},</h2>
        <p>Here is your new verification code:</p>
        <div class="otp-code">${otp}</div>
        <div class="info-box">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</div>
        <p class="text-muted">Didn't request this? You can safely ignore this email.</p>
      </div>
    `);

    logger.debug("OTP resent to: " + email);
    return res.status(200).json({ message: "A new code has been sent to your email." });

  } catch (error) {
    logger.error("Resend OTP failed: " + error.message);
    res.status(500).json({ message: "Failed to send OTP", error: error.message });
  }
};

// Logout route
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      logger.error("Error destroying session: " + err);
      return res.status(500).json({ message: "Logout failed" });
    }
    res.clearCookie("sid"); // Clear the session cookie
    res.status(200).json({ message: "Logout successful" });
  });
};

exports.deactivateAccount = async (req, res) => {
  try {
    const userId = req.query.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.status = "INACTIVE";
    await user.save();
    res.json({ message: "Account deactivated successfully." });
  } catch (error) {
    console.error("Account deactivation failed:", error);
    logger.error("Account deactivation failed: " + error.message);
    res.status(500).json({ error: "Failed to deactivate the account" });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    // userId is set from the auth token by the authenticate middleware
    const userId = req.query.userId || req.body.userId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.status === "DELETED") {
      return res.status(400).json({ error: "Account is already scheduled for deletion." });
    }

    // Soft-delete: mark DELETED and timestamp it. A TTL index permanently
    // removes the document 7 days later unless an admin deletes it sooner.
    user.status = "DELETED";
    user.deletedAt = new Date();
    await user.save();

    // Profile is now gone (404) AND this author's published posts must show as
    // "Anonymous" immediately — purge the profile + every one of their live blog
    // pages so the name disappears at once rather than within 24h.
    const authoredSlugs = await Blogs.find({
      authorDetails: userId,
      status: { $in: ["PUBLISHED", "ADMIN_PUBLISHED"] },
    })
      .select("slug")
      .lean();
    revalidate({
      username: user.userName,
      paths: authoredSlugs.map((b) => `/blogs/${b.slug}`),
    });

    const deletionDate = new Date(user.deletedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const purgeDate = new Date(user.deletedAt.getTime() + 7 * 24 * 60 * 60 * 1000)
      .toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "long", year: "numeric" });

    // Notify the user (best-effort — never block the deletion on email failure)
    sendEmail(
      user.email,
      "Your BloggerSpace account has been deleted",
      `
        <div style="font-family:sans-serif;line-height:1.6;color:#0b0f19;">
          <h2>Account deleted</h2>
          <p>Hi ${user.fullName || "there"},</p>
          <p>Your BloggerSpace account was deleted on <strong>${deletionDate}</strong> (IST).
          You have been signed out and your account is no longer accessible.</p>
          <p>This action is <strong>irreversible</strong>. Your account and personal data will be
          permanently removed from our systems by <strong>${purgeDate}</strong>. If this was a mistake,
          please contact us at ${process.env.EMAIL || "support"} as soon as possible.</p>
          <p>— The BloggerSpace team</p>
        </div>
      `,
    ).catch((e) => logger.error("Delete-account user email failed: " + e.message));

    // Notify the admin so they can review / action it from the panel
    if (process.env.EMAIL) {
      sendEmail(
        process.env.EMAIL,
        `Account deletion: ${user.email}`,
        `
          <div style="font-family:sans-serif;line-height:1.6;">
            <h3>A user deleted their account</h3>
            <p><strong>Name:</strong> ${user.fullName || "—"}<br/>
            <strong>Email:</strong> ${user.email}<br/>
            <strong>Username:</strong> ${user.userName || "—"}<br/>
            <strong>Deleted at:</strong> ${deletionDate} (IST)</p>
            <p>The account is in the <strong>Deleted Users</strong> tab of the admin panel. It will be
            permanently purged automatically on <strong>${purgeDate}</strong> unless you remove it sooner.</p>
          </div>
        `,
      ).catch((e) => logger.error("Delete-account admin email failed: " + e.message));
    }

    res.json({ message: "Account deleted successfully." });
  } catch (error) {
    console.error("Account deletion failed:", error);
    logger.error("Account deletion failed: " + error.message);
    res.status(500).json({ error: "Failed to delete the account" });
  }
};

exports.forgetPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the user exists in the database
    const user = await User.findOne({ email });

    if (!user) {
      // User not found, return an error message
      logger.error(
        "In forget password route. User is not found with given details. Returning with 404 status"
      );
      return res.status(404).json({ error: "User not found" });
    }

    // Generate a unique password reset token
    const resetToken = generateResetToken();

    // Save the reset token and its expiration date in the user's document
    user.resetToken = resetToken;
    // user.resetTokenExpiration = Date.now() + 3600000; // Token valid for 1 hour
    user.resetTokenExpiration = new Date(
      new Date().getTime() + 330 * 60000 + 300000
    ); // Token valid for 5 minutes
    await user.save();

    // Create the password reset email
    // const resetUrl = `http://localhost:3000/resetpassword/${resetToken}`;
    const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

    const receiver = email;
    const subject = "Password Reset Request";
    const html = `
    <div class="content">
      <h2>Hello, ${email}!</h2>
      <p>You are receiving this email because you (or someone else) has requested to reset the password for your account.Please click on the following link to reset your password:</p>
      <b>${resetUrl}</b>
      <br /> <br />
      <b>Note: If you did not request this, please ignore this email and your password will remain unchanged.</b>
    </div>
    `;
    sendEmail(receiver, subject, html)
      .then((response) => {
        console.log(`Email sent to ${receiver}:`, response);
        logger.debug("Sending Password Reset url Email sent to receiver.");
      })
      .catch((error) => {
        console.error("Error sending email:", error);
        logger.error("Error sending email: " + error.message);
      });

    logger.debug("Password reset email sent successfully.");
    return res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    // An error occurred, return an error message
    console.error(error);
    logger.error(
      "Error sending foreget password reset email. Error: " + error.message
    );
    return res
      .status(500)
      .json({ error: "Failed to send password reset email" });
  }
};

// Helper function to generate a random reset token
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

// Resetting password
exports.resetPassword = (req, res) => {
  const { resetToken, password } = req.body;
  logger.info("Inside resetPassword function.");

  // Find the user by reset token and check if it exists
  User.findOne({
    resetToken: resetToken,
    // resetTokenExpiration: { $gt: Date.now() },
    resetTokenExpiration: { $gt: new Date(new Date().getTime() + 330 * 60000) },
  })
    .then((user) => {
      if (!user) {
        logger.error("Invalid or expired reset token. Error: ");
        return res
          .status(400)
          .json({ error: "Invalid or expired reset token" });
      }

      // Hash the new password
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          logger.error(
            req.session.userId + ": Failed to reset password. Error: " + err
          );
          return res.status(500).json({ error: "Failed to reset password" });
        }

        // Update the user's password and reset token fields
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiration = undefined;

        // Save the updated user object
        user
          .save()
          .then(() => {
            logger.debug(user.fullName + ": Password reset successfully");
            res.status(200).json({ message: "Password reset successfully" });
          })
          .catch((err) => {
            logger.debug(
              user.fullName + ": Failed to reset password. Error: " + err
            );
            res.status(500).json({ error: "Failed to reset password" });
          });
      });
    })
    .catch((err) => {
      logger.error("Failed to reset password");
      res.status(500).json({ error: "Failed to reset password" });
    });
};

//Change Password
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.query.userId;

    // Find the user by their ID
    const user = await User.findById({
      _id: new mongoose.Types.ObjectId(userId),
    });

    if (!user) {
      // User not found, return an error message
      logger.error("Inside change password route. User not found");
      return res.status(404).json({ error: "User not found" });
    }
    console.log("user: " + user);

    // Verify the old password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      logger.error(user.fullName + ": Invalid old password");
      return res.status(401).json({ error: "Invalid old password" });
    }

    // Generate a salt and hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the user's password in the database
    user.password = hashedPassword;
    await user.save();

    logger.debug(user.fullName + ": Password changed successfully");
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    // console.error("Error changing password:", error);
    logger.error("Error changing password:" + error);
    res.status(500).json({ error: "Server error" });
  }
};

// exports.uploadProfilePicture = async (req, res) => {
//   try {
//     // Get the user ID from the authenticated user (you may have your own authentication logic)
//     const userId = req.query.userId;
//     console.log("Userid pp:", userId);
//     console.log("File is: ", req.body.formData);

//     // Get the uploaded file from the request
//     const profilePicture = req.file;
//     console.log("File pp: ", profilePicture);

//     // Convert the file data to a string
//     // const profilePictureData = profilePicture.toString();
//     const profilePictureData = profilePicture.buffer.toString("base64");
//     // console.log("File2 pp: ", profilePictureData);

//     // Save the profile picture URL to the database
//     const user = await User.findById(userId);
//     console.log("User pp: ", user.fullName);
//     user.profilePicture = profilePictureData;
//     await user.save();

//     logger.debug(user.fullName + ": Profile picture uploaded successfully.");
//     res.status(200).json({ message: "Profile picture uploaded successfully" });
//   } catch (error) {
//     console.error("Error uploading profile picture pp:", error);
//     logger.error("Error uploading profile picture: " + error);
//     res.status(500).json({ error: "Failed to upload profile picture" });
//   }
// };

exports.uploadProfilePicture2 = async (req, res) => {
  try {
      const userId = req.query.userId;
      console.log("UserID:", userId);

      // Access the uploaded file from req.files
      const profilePicture = req.files.find(file => file.fieldname === "profilePicture");

      if (!profilePicture) {
          return res.status(400).json({ error: "No profile picture uploaded" });
      }

      console.log("File uploaded:", profilePicture);

      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ error: "User not found" });
      }

      const ext = profilePicture.mimetype === "image/png" ? "png"
        : profilePicture.mimetype === "image/webp" ? "webp"
        : profilePicture.mimetype === "image/gif" ? "gif"
        : "jpg";
      const cdnUrl = await uploadImageToGitHub(
        profilePicture.buffer,
        `profile-pictures/${userId}.${ext}`,
      );

      user.profilePicture = cdnUrl;
      await user.save();

      logger.debug(`${user.fullName}: Profile picture uploaded successfully.`);
      res.status(200).json({ message: "Profile picture uploaded successfully", user: user });
  } catch (error) {
      console.error("Error uploading profile picture:", error);
      logger.error(`Error uploading profile picture: ${error.message}`);
      res.status(500).json({ error: "Failed to upload profile picture" });
  }
};


// User Info
exports.loggedInUserInfo = async (req, res) => {
  try {
    // Get the token from the Authorization header (Bearer <token>)
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ error: "Authentication required. Please login!" });
    }

    // Verify and decode the JWT token
    const decoded = jwt.verify(token, process.env.CURRENT_JWT_SECRET);
    const userId = decoded.userId || decoded.currentuserId;

    // Fetch the user information from the database
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get the user ID from the session or token (depending on your authentication setup)
    // const userId = req.session.userId; // Assuming you're using sessions
    // const token = req.session.token; // Assuming you're using sessions

    // console.log("LoggedIn fn User: ", req.session.user);
    // console.log("LoggedIn fn Userid: ", req.session.userId);
    // console.log("LoggedIn fn token: ", req.session.token);
    // console.log("LoggedIn fn email: ", req.session.email);
    // // console.log("LoggedIn fn userr: ", req.user);

    // console.log("Tokn: " + req.session.token);
    // console.log("userId: " + req.session.userId);
    // logger.info("logged in User info: " + req.session.userId);

    // if (!userId && !token) {
    //   logger.error("You are not logged in. Please login!!!!");
    //   return res.status(404).json({ error: "Please login!!!!" });
    // }

    // Fetch the user information from the database
    // const user = await User.findById({
    //   _id: new mongoose.Types.ObjectId(userId),
    // });

    // Return the user information as the response
    const userDetails = {
      _id: user._id,
      fullName: user.fullName,
      userName: user.userName,
      email: user.email,
      isVerified: user.isVerified,
      profilePicture: user.profilePicture,
      savedBlogs: user.savedBlogs,
      role: user.role ?? "user",
      reviewerStatus: user.reviewerStatus ?? "none",
      gems: user.gems ?? 0,
      createdAt: user.createdAt,
      bio: user.bio ?? "",
      socialLinks: {
        linkedin: user.socialLinks?.linkedin ?? "",
        github:   user.socialLinks?.github ?? "",
        website:  user.socialLinks?.website ?? "",
      },
      newsletterOptIn: user.newsletterOptIn ?? false,
      readingHistoryEnabled: user.readingHistoryEnabled !== false,
      // Social counts so the logged-in user sees them on their own profile.
      followersCount: user.followers?.length ?? 0,
      followingCount: user.following?.length ?? 0,
    };
    // console.log("LoggedIn user details fetched");
    logger.debug("LoggedIn user details fetched. Name: " + user.fullName);
    res.json(userDetails);
  } catch (error) {
    // console.error("Error fetching user information:", error);
    logger.error("Error fetching user information: " + error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const PROFILE_BLOGS_PAGE_SIZE = 12;

exports.userProfile = async (req, res) => {
  try {
    const userName = req.params.username;
    const viewerId = req.query.viewerId || null;

    const user = await User.findOne({ userName })
      .select("fullName userName email profilePicture isVerified followers following createdAt creatorScore reviewerScoreAvg reviewerScoreCount reviewerScoreBest bio socialLinks status")
      .lean()
      .exec();

    if (!user) {
      logger.error("The requested User not found of username: " + userName);
      return res.status(404).json({ message: "User not found" });
    }

    // Deleted accounts are anonymised — their public profile is no longer reachable
    if (user.status === "DELETED") {
      return res.status(404).json({ message: "User not found" });
    }

    // Mask email: first char + stars + @domain
    const [local, domain] = user.email.split("@");
    const maskedEmail = `${local[0]}${"*".repeat(Math.min(local.length - 1, 5))}@${domain}`;

    // First page of published blogs only (the rest load on demand via
    // /profile/:username/blogs). Creator stats are computed by aggregation so
    // they stay correct even though we no longer load every blog here.
    const publishedMatch = {
      authorDetails: user._id,
      status: { $in: ["PUBLISHED", "ADMIN_PUBLISHED"] },
    };
    const [blogs, blogsTotal, statsAgg] = await Promise.all([
      Blogs.find(publishedMatch)
        .select("title slug blogViews blogLikes category tags createdAt lastUpdatedAt blogScore")
        .sort({ lastUpdatedAt: -1 })
        .limit(PROFILE_BLOGS_PAGE_SIZE)
        .lean(),
      Blogs.countDocuments(publishedMatch),
      Blogs.aggregate([
        { $match: { ...publishedMatch, blogScore: { $gt: 0 } } },
        { $group: { _id: null, count: { $sum: 1 }, sum: { $sum: "$blogScore" }, best: { $max: "$blogScore" } } },
      ]),
    ]);

    const stat = statsAgg[0] || { count: 0, sum: 0, best: 0 };
    const scoreSum = stat.sum;
    const scoreAvg = stat.count ? +(stat.sum / stat.count).toFixed(1) : 0;
    const scoreBest = stat.best;

    const isFollowing = viewerId
      ? user.followers.some((id) => id.toString() === viewerId)
      : false;

    logger.info("Returning from user profile route with data.");
    res.json({
      _id: user._id,
      fullName: user.fullName,
      userName: user.userName,
      email: maskedEmail,
      profilePicture: user.profilePicture,
      isVerified: user.isVerified,
      bio: user.bio ?? "",
      socialLinks: {
        linkedin: user.socialLinks?.linkedin ?? "",
        github:   user.socialLinks?.github ?? "",
        website:  user.socialLinks?.website ?? "",
      },
      followersCount: user.followers.length,
      followingCount: user.following.length,
      isFollowing,
      blogs,
      blogsTotal,
      blogsPageSize: PROFILE_BLOGS_PAGE_SIZE,
      createdAt: user.createdAt,
      // Phase 5 — public creator stats
      creatorScore: user.creatorScore ?? scoreSum, // fall back to live sum if cache is stale
      creatorStats: {
        scoredBlogCount: stat.count,
        avg: scoreAvg,
        best: scoreBest,
      },
      // Phase 6 — public reviewer stats (hidden when count = 0)
      reviewerScoreAvg:   user.reviewerScoreAvg ?? 0,
      reviewerScoreCount: user.reviewerScoreCount ?? 0,
      reviewerScoreBest:  user.reviewerScoreBest ?? 0,
    });
  } catch (error) {
    logger.error("Error fetching user profile: " + error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Paginated "load more" for a public profile's published blogs.
exports.getUserProfileBlogs = async (req, res) => {
  try {
    const userName = req.params.username;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || PROFILE_BLOGS_PAGE_SIZE));
    const search = (req.query.search || "").trim();

    const user = await User.findOne({ userName }).select("_id status").lean();
    if (!user || user.status === "DELETED") {
      return res.status(404).json({ message: "User not found" });
    }

    const match = { authorDetails: user._id, status: { $in: ["PUBLISHED", "ADMIN_PUBLISHED"] } };
    // Server-side search across ALL the author's published blogs (title/category/tags).
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      match.$or = [{ title: rx }, { category: rx }, { tags: rx }];
    }
    const [blogs, total] = await Promise.all([
      Blogs.find(match)
        .select("title slug blogViews blogLikes category tags createdAt lastUpdatedAt blogScore")
        .sort({ lastUpdatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Blogs.countDocuments(match),
    ]);
    res.json({ blogs, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (error) {
    logger.error("getUserProfileBlogs error: " + error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getFollowStatus = async (req, res) => {
  try {
    const { targetId } = req.params;
    const viewerId = req.query.viewerId;

    const target = await User.findById(targetId).select("followers").lean();
    if (!target) return res.status(404).json({ message: "User not found" });

    // Always return the live follower count (used to keep the author card's count
    // fresh on the ISR-cached blog page). isFollowing only applies to a logged-in viewer.
    const followersCount = target.followers?.length ?? 0;
    const isFollowing = viewerId
      ? target.followers.some((id) => id.toString() === viewerId)
      : false;
    res.json({ isFollowing, followersCount });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// List the users in someone's followers / following set (for the profile
// "Followers"/"Following" view). Public info — anyone can view a profile's lists.
exports.getFollowList = async (req, res) => {
  try {
    const { userId } = req.params;
    const type = req.query.type === "following" ? "following" : "followers";

    const owner = await User.findById(userId).select(type).lean();
    if (!owner) return res.status(404).json({ message: "User not found" });

    const ids = owner[type] || [];
    if (!ids.length) return res.json({ users: [] });

    // Exclude deleted/anonymised accounts; only the minimal fields the list needs.
    const users = await User.find({ _id: { $in: ids }, status: { $ne: "DELETED" } })
      .select("userName fullName profilePicture isVerified")
      .lean();

    res.json({ users });
  } catch (error) {
    logger.error("Error fetching follow list: " + error.message);
    res.status(500).json({ error: "Failed to fetch follow list" });
  }
};

exports.updateUserPersonalDetails = async (req, res) => {
  try {
    const { fullName, userName, bio, socialLinks } = req.body;
    const validationError = validateUsername(userName);
    if (validationError) {
      logger.error(
        "Error when validating user. returning with status code 400."
      );
      return res.status(400).json({ error: validationError });
    }

    const updatedUser = await User.findById({
      _id: new mongoose.Types.ObjectId(req.query.userId),
    });
    updatedUser.fullName = fullName;
    updatedUser.userName = userName;

    // Optional public-profile fields — only update when provided
    if (typeof bio === "string") updatedUser.bio = bio.slice(0, 280);
    if (socialLinks && typeof socialLinks === "object") {
      updatedUser.socialLinks = {
        linkedin: (socialLinks.linkedin || "").trim(),
        github:   (socialLinks.github || "").trim(),
        website:  (socialLinks.website || "").trim(),
      };
    }
    await updatedUser.save();

    // Public profile is ISR-cached — refresh it so bio/social/name show at once.
    revalidate({ username: updatedUser.userName });

    logger.debug("Information updated succesfully for user: " + userName);
    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    logger.error("Error updating username:" + error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the username" });
  }
};

// Reading history — record a blog read (authenticated). Auto-dedups within 24h,
// moves re-reads to the top, and caps the list at the 50 most-recent entries.
const READING_HISTORY_CAP = 50;
const READING_DEDUP_MS = 24 * 60 * 60 * 1000;

exports.addReadingHistory = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(401).json({ message: "Please login." });
    const { blogId, slug, title, category } = req.body;
    if (!slug) return res.status(400).json({ message: "slug required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Respect the user's opt-out — don't record anything when tracking is off.
    if (user.readingHistoryEnabled === false) {
      return res.status(200).json({ ok: true, disabled: true });
    }

    const history = user.readingHistory || [];
    const existing = history.find((h) => h.slug === slug);
    // Skip a fresh re-read of the same blog within the dedup window
    if (existing && existing.readAt && Date.now() - new Date(existing.readAt).getTime() < READING_DEDUP_MS) {
      return res.status(200).json({ ok: true, deduped: true });
    }

    const filtered = history.filter((h) => h.slug !== slug);
    filtered.unshift({ blogId, slug, title, category, readAt: new Date() });
    user.readingHistory = filtered.slice(0, READING_HISTORY_CAP);
    await user.save();

    res.status(200).json({ ok: true });
  } catch (error) {
    logger.error("Error adding reading history: " + error);
    res.status(500).json({ error: "Failed to record reading history" });
  }
};

exports.getReadingHistory = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(401).json({ message: "Please login." });
    const user = await User.findById(userId).select("readingHistory readingHistoryEnabled").lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({
      history: user.readingHistory || [],
      enabled: user.readingHistoryEnabled !== false,
    });
  } catch (error) {
    logger.error("Error fetching reading history: " + error);
    res.status(500).json({ error: "Failed to fetch reading history" });
  }
};

// Toggle reading-history tracking. Turning it OFF also clears the existing
// history so nothing is retained once the user opts out.
exports.setReadingHistoryEnabled = async (req, res) => {
  try {
    const userId = req.query.userId;
    const { enabled } = req.body;
    if (!userId) return res.status(401).json({ message: "Please login." });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.readingHistoryEnabled = !!enabled;
    if (!enabled) user.readingHistory = []; // clear retained history on opt-out
    await user.save();

    res.json({
      message: enabled ? "Reading history enabled." : "Reading history turned off and cleared.",
      enabled: user.readingHistoryEnabled,
    });
  } catch (error) {
    logger.error("Error updating reading history setting: " + error);
    res.status(500).json({ error: "Failed to update reading history setting" });
  }
};

// Newsletter opt-in toggle (authenticated). Default is off; user controls it.
exports.setNewsletterOptIn = async (req, res) => {
  try {
    const userId = req.query.userId;
    const { optIn } = req.body;
    if (!userId) return res.status(401).json({ message: "Please login." });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.newsletterOptIn = !!optIn;
    await user.save();

    res.json({ message: optIn ? "Subscribed to newsletter." : "Unsubscribed from newsletter.", newsletterOptIn: user.newsletterOptIn });
  } catch (error) {
    logger.error("Error updating newsletter opt-in: " + error);
    res.status(500).json({ error: "Failed to update newsletter preference" });
  }
};

// ── Public one-click newsletter unsubscribe / resubscribe ───────────────────
// Linked from the footer of newsletter emails (and the List-Unsubscribe header).
// No login required — the request is trusted via the HMAC token on the email.
// GET (link click) → returns a branded confirmation page.
// POST (Gmail/Apple one-click) → flips the flag and returns 200.
const unsub = require("../utils/unsubscribe");

async function setNewsletterByToken(req, res, optIn) {
  const email = (req.query.e || "").toString();
  const t = (req.query.t || "").toString();
  if (!unsub.verify(email, t)) {
    if (req.method === "POST") return res.status(400).send("Invalid link");
    return res
      .status(400)
      .type("html")
      .send(
        unsub.confirmationPage({
          ok: false,
          title: "Invalid link",
          body: "This link is invalid or has expired. Please manage your preferences from your account settings.",
          actionLabel: "Go to BloggerSpace",
          actionUrl: unsub.SITE_URL(),
        }),
      );
  }
  try {
    await User.updateOne({ email }, { $set: { newsletterOptIn: optIn } });
  } catch (e) {
    logger.error("newsletter token update failed: " + e);
  }
  if (req.method === "POST") return res.status(200).send("OK");

  const page = optIn
    ? {
        title: "You're resubscribed 🎉",
        body: `<b>${unsub.escapeHtml(email)}</b> will receive the BloggerSpace newsletter again. Welcome back!`,
        actionLabel: "Go to BloggerSpace",
        actionUrl: unsub.SITE_URL(),
      }
    : {
        title: "You're unsubscribed",
        body: `<b>${unsub.escapeHtml(email)}</b> won't receive the BloggerSpace newsletter anymore. Changed your mind?`,
        actionLabel: "Resubscribe",
        actionUrl: unsub.resubscribeUrl(email),
      };
  return res.status(200).type("html").send(unsub.confirmationPage({ ok: true, ...page }));
}

exports.newsletterUnsubscribe = (req, res) => setNewsletterByToken(req, res, false);
exports.newsletterResubscribe = (req, res) => setNewsletterByToken(req, res, true);

// Add to SavedBlogs
exports.addBlogToSavedBlogs = async (req, res) => {
  try {
    const userId = req.query.userId;
    console.log(userId);

    if (userId == "undefined") {
      return res.status(404).json({ message: "You are not logged in!!" });
    }

    const user = await User.findById(userId);
    const { title, slug, category, tags } = req.body;

    if (user.savedBlogs.map((e) => e.slug).indexOf(slug) !== -1) {
      console.log("Already saved the same blog");
      return res.status(404).json({ message: "Already saved the same blog" });
    }
    user.savedBlogs.push({ title, slug, category, tags });
    await user.save();
    console.log("Added to saved blogs successfully");
    // Return a success message
    res.json({ message: "Added to saved blogs successfully" });
  } catch (error) {
    // Handle any errors
    console.error("Added to saved blogs failed:", error);
    logger.error("Added to saved blogs failed: " + error.message);
    res.status(500).json({ error: "Failed to add to saved blogs" });
  }
};

// Remove from SavedBlogs
exports.removeBlogFromSavedBlogs = async (req, res) => {
  try {
    const userId = req.query.userId;
    const user = await User.findById(userId);

    user.savedBlogs.splice(
      user.savedBlogs.map((e) => e.slug).indexOf(req.params.blogSlug),
      1
    );
    await user.save();
    // Return a success message
    res.json({ message: "Removed from saved blogs successfully" });
  } catch (error) {
    // Handle any errors
    console.error("Removing from saved blogs failed:", error);
    logger.error("Removing from saved blogs failed: " + error.message);
    res.status(500).json({ error: "Failed to remove from saved blogs" });
  }
};

// Get Saved blogs.
//   • No pagination params  → returns the FULL array (back-compat: the blog
//     page's "is this saved?" check needs every saved slug, and other callers
//     relied on the original array shape).
//   • With page/limit/search → returns a paginated envelope for the saved page.
const SAVED_BLOGS_PAGE_SIZE = 12;
exports.getSavedBlogsOfUser = async (req, res) => {
  try {
    const userId = req.query.userId;

    // Only pull the savedBlogs array (not the whole user doc) for efficiency.
    const user = await User.findById(userId).select("savedBlogs").lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    // Newest-first (items are appended as they're saved).
    let items = (user.savedBlogs || []).slice().reverse();

    // Back-compat: no pagination params → return the full array as before.
    const wantsPaginated =
      req.query.page !== undefined ||
      req.query.limit !== undefined ||
      req.query.search !== undefined;
    if (!wantsPaginated) {
      return res.json(items);
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || SAVED_BLOGS_PAGE_SIZE));
    const search = (req.query.search || "").trim().toLowerCase();

    // Search filters across ALL saved blogs (title/category) before paginating.
    if (search) {
      items = items.filter(
        (b) =>
          (b.title || "").toLowerCase().includes(search) ||
          (b.category || "").toLowerCase().includes(search)
      );
    }

    const total = items.length;
    const start = (page - 1) * limit;
    const blogs = items.slice(start, start + limit);

    res.json({ blogs, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (error) {
    logger.error("Error getting saved blogs: " + error.message);
    res.status(500).json({ error: "Error getting saved blogs" });
  }
};

// Follow and Unfollow users
exports.followUser = async (req, res) => {
  try {
    if (!req.query.userId) return res.status(401).json({ error: "Not logged in" });
    const targetId = req.params.idToFollow;
    const userId = req.query.userId;
    if (targetId === userId) return res.status(400).json({ error: "Cannot follow yourself" });

    const [target, me] = await Promise.all([
      User.findByIdAndUpdate(targetId, { $addToSet: { followers: userId } }, { new: true }).select("userName"),
      User.findByIdAndUpdate(userId,   { $addToSet: { following: targetId } }, { new: true }).select("userName"),
    ]);
    // Both profiles' follower/following counts changed — refresh them.
    revalidate({
      paths: [target?.userName, me?.userName].filter(Boolean).map((u) => `/user/${u}`),
    });
    return res.json({ message: "Followed" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error occurred" });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    if (!req.query.userId) return res.status(401).json({ error: "Not logged in" });
    const targetId = req.params.idToUnfollow;
    const userId = req.query.userId;

    const [target, me] = await Promise.all([
      User.findByIdAndUpdate(targetId, { $pull: { followers: userId } }, { new: true }).select("userName"),
      User.findByIdAndUpdate(userId,   { $pull: { following: targetId } }, { new: true }).select("userName"),
    ]);
    // Both profiles' follower/following counts changed — refresh them.
    revalidate({
      paths: [target?.userName, me?.userName].filter(Boolean).map((u) => `/user/${u}`),
    });
    return res.json({ message: "Unfollowed" });

    // User.findByIdAndUpdate(
    //   req.params.idToUnfollow,
    //   {
    //     $pull: { followers: req.session.userId },
    //   },
    //   { new: true },
    //   (error, result) => {
    //     if (error) return res.status(404).json({ error: error });
    //     User.findByIdAndUpdate(
    //       req.session.userId,
    //       {
    //         $pull: { following: req.params.idToUnfollow },
    //       },
    //       { new: true },
    //       (err, res) => {
    //         if (err) return res.status(404).json({ err: err });
    //         else {
    //           res.json(res);
    //         }
    //       }
    //     );
    //   }
    // );
  } catch (error) {
    return res.status(404).json({ error: "Error occured" + error });
  }
};

exports.getVisitorCount = async (req, res) => {
  try {
    const visit = await Visit.findOne();
    res.status(200).json({ count: visit ? visit.count : 0 });
  } catch (error) {
    logger.error("Error getting visit count.");
    res.status(500).json({ error: "Error getting visit count." });
  }
};

exports.incrementVisitCount = async (req, res) => {
  try {
    // Single atomic upsert: increments the counter (creating the doc on first
    // hit) in one round trip, with no read-then-write race. Critically, it also
    // ALWAYS sends a response — the previous version never called res.*, so the
    // request hung until the 60s platform timeout (the 504s you saw).
    const visit = await Visit.findOneAndUpdate(
      {},
      { $inc: { count: 1 } },
      { upsert: true, new: true },
    );
    res.status(200).json({ count: visit.count });
  } catch (error) {
    logger.error("Error incrementing visit count: " + error);
    console.error("Error incrementing visit count:", error);
    res.status(500).json({ error: "Error incrementing visit count." });
  }
};

exports.contactUs = async (req, res) => {
  try {
    const { email, mobileNo, message } = req.body;
    sendEmail(
      process.env.EMAIL,
      "New contact us form",
      `<div class="content">
          <h2>Hi Admin,</h2>
          <p>Form details:</p>
          <p>Email: <b class="teal-green">${email}</b></p>
          <p>MobileNo: <b class="teal-green">${mobileNo}</b></p>
          <p>Message: <b class="teal-green">${message}</b></p>
        </div>`
    )
      .then((response) => {
        console.log("Email sent!!!");
      })
      .catch((err) => res.status(404).json("Error when sending mail"));
    return res.status(200).json("Email sent successfully");
  } catch (error) {
    return res.status(404).json("Error when sending mail...");
  }
};

// Google OAuth20
exports.oauthGoogleCallback = async (req, res) => {
  // Successful authentication, redirect to profile page

  console.log("Inside oauthcallback: ", req.user);
  if (req.user) {
    console.log("Inside if of oauthcallback: ", req.user);

    console.log("Inside if of oauthcallback Email 728: ", req.user.email);
    User.findOne({ email: req.user.email })
      .then((user) => {
        if (!user) {
          logger.error("User Not found G-auth ");
          console.log("User not found G-Auth");
          return res.redirect(`${process.env.FRONTEND_URL}/login`);
        }
        const token = jwt.sign(
          { userId: user._id, email: user.email },
          process.env.JWT_SECRET,
          {
            expiresIn: "1h", // Token expiration time
          }
        );

        // req.session.user = user; // Will remove in future
        // req.session.userId = user._id;
        // req.session.token = token;
        // req.session.email = user.email;

        // console.log("User: ", req.session.user);
        // console.log("Userid: ", req.session.userId);
        // console.log("token: ", req.session.token);
        // console.log("email: ", req.session.email);
        // console.log("User 746: ", req.user);
        console.log("Tokenn: ", token);

        const encodedToken = encodeURIComponent(token);
        // return res.status(200).json({
        //     success:true,
        //     message: "successful",
        //     user: user,
        //     token:token,
        //     cookies: req.cookies
        //   });
        return res.redirect(
          `${process.env.FRONTEND_URL}/auth-success?token=${encodedToken}`
        );
      })
      .catch((err) => {
        logger.error("Error when using G-Auth login");
        console.log("Error when using G-Auth login");
        res.status(500).json({ error: err });
      });
  }
};

// Passport Login Callback
exports.authPassportCallback = async (req, res) => {
  console.log("Inside auth passport callback: ", req.user?.email);
  if (req.user) {
    console.log("Inside if of auth passport callback: ", req.user?.email);

    console.log(
      "Inside if of auth passport callback Email 830: ",
      req.user.email
    );
    User.findOne({ email: req.user.email })
      .then(async (user) => {
        if (!user) {
          logger.error("User Not found!!");
          console.log("User not found!!");
          return res.redirect(`${process.env.FRONTEND_URL}/login`);
        }

        // Update last login + lastVerifiedAt (OAuth login counts as verification)
        const previousLogin = user.lastLogin;
        user.lastLogin = new Date(new Date().getTime() + 330 * 60000);
        user.lastVerifiedAt = new Date();
        await user.save();

        // Use CURRENT_JWT_SECRET so /api/users/userinfo (which verifies with CURRENT_JWT_SECRET) can decode it.
        // Previously used JWT_SECRET, which caused a mismatch with the userinfo endpoint.
        const token = jwt.sign(
          { userId: user._id, currentuserId: user._id, email: user.email, role: user.role || "user" },
          process.env.CURRENT_JWT_SECRET,
          {
            expiresIn: "3d",
          }
        );

        console.log("Token generated: ", token);
        const encodedToken = encodeURIComponent(token);

        return res.redirect(
          `${process.env.FRONTEND_URL}/auth-success?token=${encodedToken}&lastLogin=${previousLogin}`
        );
      })
      .catch((err) => {
        logger.error("Error when using passport login");
        console.log("Error when using passport login");
        res.status(500).json({ error: err });
      });
  }
};

// exports.fileUpload = async (req, res) => {
//   try {
//     const fileBuffer = req.file.buffer; // Buffer of the file
//     let fileName = req.file.originalname;

//     const ext = path.extname(fileName); // Get the file extension (e.g., .jpg)
//     const name = path.basename(fileName, ext); // Get the base name without extension
//     const timestamp = Date.now(); // Generate a unique timestamp
//     fileName = `${timestamp}_${name}${ext}`; // Append timestamp to filename

//     const fileUrl = `https://raw.githubusercontent.com/${process.env.GITHUBOWNER}/${process.env.GITHUBREPO}/${process.env.GITHUBBRANCH}/uploads/${fileName}`;

//     // Create the file on GitHub repository
//     const uploadResponse = await axios.put(
//       `https://api.github.com/repos/${process.env.GITHUBOWNER}/${process.env.GITHUBREPO}/contents/uploads/${fileName}`,
//       {
//         message: `Upload ${new Date(new Date().getTime())} `,
//         content: fileBuffer.toString("base64"),
//         branch: process.env.GITHUBBRANCH,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.GITHUBACCESSTOKEN}`,
//         },
//       }
//     );
//     // Return the raw file URL from GitHub
//     res.json({ success: true, imageUrl: fileUrl });
//   } catch (error) {
//     console.error("Error uploading file to GitHub:", error);
//     res.status(500).json({ success: false, message: "Failed to upload." });
//   }
// };

exports.fileUpload = async (req, res) => {
  try {
    // Ensure a file was uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    // Extract file data from the parsed request
    const file = req.files[0]; // Access the first uploaded file
    const fileBuffer = file.buffer; // Buffer of the file
    let fileName = file.originalname;

    // Process file name
    const ext = path.extname(fileName); // Get the file extension (e.g., .jpg)
    const name = path.basename(fileName, ext); // Get the base name without extension
    const timestamp = Date.now(); // Generate a unique timestamp
    fileName = `${timestamp}_${name}${ext}`; // Append timestamp to filename

    // Construct the file URL
    const fileUrl = `https://raw.githubusercontent.com/${process.env.GITHUBOWNER}/${process.env.GITHUBREPO_FILEUPLOAD}/${process.env.GITHUBBRANCH}/uploads/${fileName}`;

    // Upload the file to GitHub repository
    const uploadResponse = await axios.put(
      `https://api.github.com/repos/${process.env.GITHUBOWNER}/${process.env.GITHUBREPO_FILEUPLOAD}/contents/uploads/${fileName}`,
      {
        message: `Upload ${new Date().toISOString()}`, // Commit message
        content: fileBuffer.toString("base64"), // Encode file content to Base64
        branch: process.env.GITHUBBRANCH,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUBACCESSTOKEN}`, // GitHub authentication token
        },
      }
    );

    // Respond with the raw file URL
    res.json({ success: true, imageUrl: fileUrl });
  } catch (error) {
    console.error("Error uploading file to GitHub:", error);
    res.status(500).json({ success: false, message: "Failed to upload." });
  }
};

exports.fetchUploadedFiles = async (req, res) => {
  try {
    // Fetch the contents of the uploads folder in the GitHub repo
    const response = await axios.get(
      `https://api.github.com/repos/${process.env.GITHUBOWNER}/${process.env.GITHUBREPO_FILEUPLOAD}/contents/uploads`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUBACCESSTOKEN}`,
        },
      }
    );

    // Extract image URLs (filter out only image files)
    const images = response.data
      .filter((item) => {
        return (
          item.type === "file" &&
          (item.name.endsWith(".jpg") ||
            item.name.endsWith(".jpeg") ||
            item.name.endsWith(".png") ||
            item.name.endsWith(".gif"))
        );
      })
      .map((item) => ({
        fileName: item.name,
        fileUrl: item.download_url, // Raw file URL from GitHub
        filePreview: `https://raw.githubusercontent.com/${process.env.GITHUBOWNER}/${process.env.GITHUBREPO_FILEUPLOAD}/${process.env.GITHUBBRANCH}/uploads/${item.name}`, // Preview URL
      }));

      const sortedImages = images.sort((a, b) => {
        //  Sort by numbers. 
        const numA = parseInt(a.fileName.split('_')[0], 10);
        const numB = parseInt(b.fileName.split('_')[0], 10);
        return numB - numA;
      });

    res.json({ success: true, images: sortedImages });
  } catch (error) {
    console.error("Error fetching images from GitHub:", error);
    throw error;
  }
};

exports.downloadBlog= async (req, res)=>{
  const doc = new PDFDocument();
  const {title, content, tags, lastUpdated, category, author}= req.body;

  // res.setHeader('Content-Type', 'application/pdf');
  // res.setHeader('Content-Disposition', 'attachment; filename="report.pdf"');

  // Pipe the PDF to the response
  doc.pipe(res);

  doc.fontSize(10).fillColor('gray').text('BloggerSpace', 50, 20, {
    align: 'left',
  });
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 20, {
    align: 'right',
  });

  // Add content to the PDF
  doc.fontSize(25).fillColor('black').text(title, { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).fillColor('black').text(`Category: ${category}`);
  doc.moveDown();
  doc.fontSize(10).fillColor('black').text(`Tags: ${tags}`);
  doc.moveDown();
  doc.fontSize(10).fillColor('black').text(`Last updated: ${lastUpdated}`);
  doc.moveDown();
  doc.fontSize(12).fillColor('black').text(`Author: ${author}`);
  doc.moveDown();
  doc.fillColor('black').text(content, {align:'justify'});

  // Finalize the PDF and end the response
  doc.end();
}

// ── OTP-based login (passwordless sign-in) ──────────────────────────────────

// Request a login OTP (only for already-verified, active accounts)
exports.requestLoginOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal whether email is registered
      return res.status(200).json({ message: "otp_sent", info: "If that email is registered and verified, a code has been sent." });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Email not verified. Please verify your account first." });
    }

    if (user.status === "INACTIVE") {
      return res.status(403).json({ message: "account_deactivated", info: "Your account has been deactivated. Please contact support." });
    }

    const otp = generateOtp();
    user.otpCode = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    sendEmail(user.email, "Your BloggerSpace sign-in code", `
      <div class="content">
        <h2>Hi ${user.fullName},</h2>
        <p>Use the code below to sign in to your BloggerSpace account. No password needed.</p>
        <div class="otp-code">${otp}</div>
        <div class="info-box">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</div>
        <p class="text-muted">Didn't request this? You can safely ignore this email — your account is secure.</p>
      </div>
    `).catch((err) => logger.error("Failed to send login OTP: " + err));

    logger.debug("Login OTP sent to: " + email);
    return res.status(200).json({ message: "otp_sent", info: "A sign-in code has been sent to your email." });
  } catch (error) {
    logger.error("requestLoginOtp failed: " + error.message);
    res.status(500).json({ message: "Failed to send OTP.", error: error.message });
  }
};

// Verify login OTP and issue a JWT
exports.verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required." });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });

    if (!user.isVerified) {
      return res.status(403).json({ message: "Email not verified. Please verify your account first." });
    }

    if (user.status === "INACTIVE") {
      return res.status(403).json({ message: "account_deactivated", info: "Your account has been deactivated. Please contact support." });
    }

    if (!user.otpCode || !user.otpExpiry) {
      return res.status(400).json({ message: "No OTP found. Please request a new one." });
    }

    if (new Date() > user.otpExpiry) {
      user.otpCode = null;
      user.otpExpiry = null;
      await user.save();
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    if (user.otpCode !== otp.toString().trim()) {
      return res.status(400).json({ message: "Incorrect OTP. Please try again." });
    }

    // Block unapproved reviewer sign-in
    if (user.role === "reviewer" && user.reviewerStatus !== "approved") {
      user.otpCode = null;
      user.otpExpiry = null;
      await user.save();
      return res.status(403).json({ message: "Your reviewer application is still pending admin approval." });
    }

    // Clear OTP and update last login + re-verification clock
    // (passwordless OTP login proves email ownership = re-verification)
    user.otpCode = null;
    user.otpExpiry = null;
    user.lastVerifiedAt = new Date();
    user.lastLogin = new Date(new Date().getTime() + 330 * 60000);
    await user.save();

    const token = jwt.sign(
      { userId: user._id, currentuserId: user._id, role: user.role || "user" },
      process.env.CURRENT_JWT_SECRET,
      { expiresIn: "3d" }
    );

    const userDetails = {
      _id: user._id,
      fullName: user.fullName,
      userName: user.userName,
      email: user.email,
      isVerified: user.isVerified,
      profilePicture: user.profilePicture,
      savedBlogs: user.savedBlogs,
      role: user.role || "user",
      reviewerStatus: user.reviewerStatus,
      createdAt: user.createdAt,
    };

    logger.debug("Login via OTP successful: " + email);
    return res.status(200).json({ message: "Login successful", token, userDetails });
  } catch (error) {
    logger.error("verifyLoginOtp failed: " + error.message);
    res.status(500).json({ message: "OTP verification failed.", error: error.message });
  }
};

// ── OTP-based forgot password ────────────────────────────────────────────────

// Step 1: request OTP for password reset
exports.forgotPasswordRequestOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const user = await User.findOne({ email });
    // Verify the email actually belongs to an account before issuing an OTP.
    if (!user) {
      return res.status(404).json({ message: "No account found with this email address." });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Email not verified. Verify your account before resetting your password." });
    }

    if (user.status === "INACTIVE") {
      return res.status(403).json({ message: "account_deactivated", info: "Your account has been deactivated. Please contact support." });
    }

    const otp = generateOtp();
    user.otpCode = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    sendEmail(user.email, "Your BloggerSpace password reset code", `
      <div class="content">
        <h2>Hi ${user.fullName},</h2>
        <p>We received a request to reset your BloggerSpace password. Enter the code below to proceed.</p>
        <div class="otp-code">${otp}</div>
        <div class="info-box">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</div>
        <p class="text-muted">Didn't request a password reset? You can safely ignore this email — your account is secure.</p>
      </div>
    `).catch((err) => logger.error("Failed to send password reset OTP: " + err));

    logger.debug("Password reset OTP sent to: " + email);
    return res.status(200).json({ message: "otp_sent", info: "A reset code has been sent to your email." });
  } catch (error) {
    logger.error("forgotPasswordRequestOtp failed: " + error.message);
    res.status(500).json({ message: "Failed to send reset code.", error: error.message });
  }
};

// Step 2: verify OTP → issue a short-lived reset token
exports.forgotPasswordVerifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required." });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });

    if (!user.otpCode || !user.otpExpiry) {
      return res.status(400).json({ message: "No reset code found. Please request a new one." });
    }

    if (new Date() > user.otpExpiry) {
      user.otpCode = null;
      user.otpExpiry = null;
      await user.save();
      return res.status(400).json({ message: "Code has expired. Please request a new one." });
    }

    if (user.otpCode !== otp.toString().trim()) {
      return res.status(400).json({ message: "Incorrect code. Please try again." });
    }

    // OTP valid — issue a short-lived reset token (5 min)
    const resetToken = require("uuid").v4();
    user.otpCode = null;
    user.otpExpiry = null;
    user.resetToken = resetToken;
    user.resetTokenExpiration = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    logger.debug("Password reset OTP verified for: " + email);
    return res.status(200).json({ message: "otp_verified", resetToken });
  } catch (error) {
    logger.error("forgotPasswordVerifyOtp failed: " + error.message);
    res.status(500).json({ message: "OTP verification failed.", error: error.message });
  }
};

// Step 3: use reset token to set a new password
exports.forgotPasswordReset = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: "Reset token and new password are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const user = await User.findOne({ resetToken });
    if (!user) return res.status(400).json({ message: "Invalid or expired reset token." });

    if (!user.resetTokenExpiration || new Date() > user.resetTokenExpiration) {
      user.resetToken = null;
      user.resetTokenExpiration = null;
      await user.save();
      return res.status(400).json({ message: "Reset token has expired. Please start over." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpiration = null;
    user.lastVerifiedAt = new Date(); // OTP-based reset proves email ownership
    await user.save();

    sendEmail(user.email, "Your BloggerSpace password has been changed", `
      <div class="content">
        <h2>Password updated</h2>
        <p>Hi ${user.fullName}, your BloggerSpace password was just changed successfully.</p>
        <p class="text-muted">If you didn't make this change, please contact support immediately.</p>
      </div>
    `).catch((err) => logger.error("Failed to send password change confirmation: " + err));

    logger.debug("Password reset successful for: " + user.email);
    return res.status(200).json({ message: "Password updated successfully. You can now sign in." });
  } catch (error) {
    logger.error("forgotPasswordReset failed: " + error.message);
    res.status(500).json({ message: "Password reset failed.", error: error.message });
  }
};

// ── Periodic re-verification OTP ─────────────────────────────────────────────

// Send re-verification OTP (called when user is redirected to /reverify)
exports.sendReverifyOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });
    if (!user.isVerified || user.status === "INACTIVE") {
      return res.status(403).json({ message: "Account is not eligible for re-verification." });
    }

    // Check lockout
    if (user.reverifyLockedUntil && new Date() < new Date(user.reverifyLockedUntil)) {
      return res.status(429).json({
        message: "reverify_locked",
        info: "Too many failed attempts. Please try again later.",
        lockedUntil: user.reverifyLockedUntil,
      });
    }

    const otp = generateOtp();
    user.otpCode = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const periodDays = await getReverificationPeriod();
    sendEmail(user.email, "BloggerSpace — Account Re-verification Code", `
      <div class="content">
        <h2>Hi ${user.fullName},</h2>
        <p>Enter the code below to re-verify your BloggerSpace account.</p>
        <div class="otp-code">${otp}</div>
        <div class="info-box">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</div>
        <p class="text-muted">This is a routine security check required every ${periodDays} days.</p>
      </div>
    `).catch((err) => logger.error("Failed to send re-verification OTP: " + err));

    logger.info("Re-verification OTP sent: " + email);
    return res.status(200).json({ message: "otp_sent", info: "A re-verification code has been sent to your email." });
  } catch (error) {
    logger.error("sendReverifyOtp failed: " + error.message);
    res.status(500).json({ message: "Failed to send OTP.", error: error.message });
  }
};

// Verify re-verification OTP and issue JWT
exports.verifyReverifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required." });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });
    if (!user.isVerified || user.status === "INACTIVE") {
      return res.status(403).json({ message: "Account is not eligible for re-verification." });
    }

    // Check lockout
    if (user.reverifyLockedUntil && new Date() < new Date(user.reverifyLockedUntil)) {
      return res.status(429).json({
        message: "reverify_locked",
        info: "Too many failed attempts. Please try again later.",
        lockedUntil: user.reverifyLockedUntil,
      });
    }

    // Check OTP exists
    if (!user.otpCode || !user.otpExpiry) {
      return res.status(400).json({ message: "No OTP found. Please request a new one." });
    }

    // Check OTP expiry
    if (new Date() > new Date(user.otpExpiry)) {
      user.otpCode = null;
      user.otpExpiry = null;
      await user.save();
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    // Check OTP value
    if (user.otpCode !== otp.toString().trim()) {
      user.reverifyAttempts = (user.reverifyAttempts || 0) + 1;
      if (user.reverifyAttempts >= REVERIFY_MAX_ATTEMPTS) {
        user.reverifyLockedUntil = new Date(Date.now() + REVERIFY_LOCKOUT_MS);
        user.reverifyAttempts = 0;
        user.otpCode = null;
        user.otpExpiry = null;
        await user.save();
        logger.warn("Re-verification locked after max attempts: " + email);
        return res.status(429).json({
          message: "reverify_locked",
          info: `Too many failed attempts. Account locked for 30 minutes.`,
          lockedUntil: user.reverifyLockedUntil,
        });
      }
      await user.save();
      const attemptsLeft = REVERIFY_MAX_ATTEMPTS - user.reverifyAttempts;
      return res.status(400).json({
        message: "Incorrect OTP. Please try again.",
        attemptsLeft,
      });
    }

    // ✅ OTP correct — update verification timestamp and issue JWT
    user.lastVerifiedAt = new Date();
    user.reverifyAttempts = 0;
    user.reverifyLockedUntil = null;
    user.otpCode = null;
    user.otpExpiry = null;
    user.lastLogin = new Date(new Date().getTime() + 330 * 60000);
    await user.save();

    const token = jwt.sign(
      { userId: user._id, currentuserId: user._id, role: user.role || "user" },
      process.env.CURRENT_JWT_SECRET,
      { expiresIn: "3d" }
    );
    const userDetails = {
      _id: user._id,
      fullName: user.fullName,
      userName: user.userName,
      email: user.email,
      isVerified: user.isVerified,
      profilePicture: user.profilePicture,
      savedBlogs: user.savedBlogs,
      role: user.role || "user",
      reviewerStatus: user.reviewerStatus,
      createdAt: user.createdAt,
    };

    logger.info("Re-verification successful: " + email);
    return res.status(200).json({ message: "Re-verification successful", token, userDetails });
  } catch (error) {
    logger.error("verifyReverifyOtp failed: " + error.message);
    res.status(500).json({ message: "Re-verification failed.", error: error.message });
  }
};