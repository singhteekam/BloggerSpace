// controllers/users.js
const bcrypt = require("bcrypt");
const User = require("../models/User");
// const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Blogs = require("../models/Blog");
const sendEmail = require("../services/mailer");
const validateUsername = require("../utils/validateUsername");
const Visit= require("../models/Visitor");

// verifyAccount controller
exports.verifyAccount = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User is already verified" });
    }

    // Create the verification token
    const verificationToken = user.generateVerificationToken();

    // Save the user with the new verification token
    await user.save();
    // Create the verification link
    const verificationLink = `${req.protocol}://${req.get(
      "host"
    )}/api/users/verify-account?token=${verificationToken}`;

    const receiver = email;
    const subject = "Account Verification";
    const html = `
              <p>Please click the following link to verify your account:</p>
              <a href="${verificationLink}">${verificationLink}</a>
                `;

    sendEmail(receiver, subject, html)
      .then((response) => {
        console.log(`Email sent to ${receiver}:`, response);
        // Handle success
        return res.status(200).json({ message: "Verification email sent" });
      })
      .catch((error) => {
        console.error("Error sending email:", error);
        // Handle error
        return res
          .status(500)
          .json({ message: "Failed to send verification email" });
      });
  } catch (error) {
    console.error("Error sending verification email:", error);
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
      // No user found with the provided token
      return res.status(400).send("Invalid verification token");
    }

    // Update the user's verification status
    user.isVerified = true;
    user.verificationToken = null;
    await user.save();
    // Redirect the user to the success page or any other page of your choice
    res.redirect("/api/users/verification-success");
  } catch (error) {
    console.error("Failed to verify account:", error);
    res.status(500).send("Failed to verify account");
  }
};

exports.signup = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    console.log(existingUser);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      fullName,
      userName: email.substring(0, email.indexOf("@")),
      email,
      password: hashedPassword,
    });

    console.log(newUser);

    await newUser.save();

    res.status(201).json({ message: "Signup successful" });
  } catch (error) {
    res.status(500).json({ message: "Signup failed", error: error.message });
  }
};

// Login controller
exports.login = async (req, res) => {
  console.log("Session Id: " + req.sessionID);
  try {
    const { email, password } = req.body;

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare the password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // You can generate a JWT token here if you want to implement authentication
    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h", // Token expiration time
    });
    // console.log(token);
    const userDetails = {
      email: user.email,
      fullName: user.fullName,
      isVerified: user.isVerified,
    };

    req.session.user = user; // Will remove in future
    req.session.userId = user._id;
    req.session.token = token;
    req.session.email = user.email;
    console.log("userId: " + req.session.userId);

    res.status(200).json({ message: "Login successful", token, userDetails });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

// Logout route
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    res.clearCookie("sid"); // Clear the session cookie
    res.status(200).json({ message: "Logout successful" });
  });
};

exports.deleteAccount = async (req, res) => {
  try {
    // Get the userId from the session or request body, depending on your implementation
    const userId = req.session.userId || req.body.userId;

    // Delete the user account from the database
    await User.findByIdAndDelete(userId);

    // Return a success message
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    // Handle any errors
    console.error("Account deletion failed:", error);
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
      return res.status(404).json({ error: "User not found" });
    }

    // Generate a unique password reset token
    const resetToken = generateResetToken();

    // Save the reset token and its expiration date in the user's document
    user.resetToken = resetToken;
    user.resetTokenExpiration = Date.now() + 3600000; // Token valid for 1 hour
    await user.save();

    // Create the password reset email
    // const resetUrl = `http://localhost:3000/resetpassword/${resetToken}`;
    const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

    const receiver = email;
    const subject = "Password Reset Request";
    const html =`<p>You are receiving this email because you (or someone else) has requested to reset the password for your account.\n\nPlease click on the following link to reset your password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n</p>`;
    sendEmail(receiver, subject, html)
      .then((response) => {
        console.log(`Email sent to ${receiver}:`, response);
        // Handle success
      })
      .catch((error) => {
        console.error("Error sending email:", error);
        // Handle error
      });

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

  // Find the user by reset token and check if it exists
  User.findOne({
    resetToken: resetToken,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      if (!user) {
        return res
          .status(400)
          .json({ error: "Invalid or expired reset token" });
      }

      // Hash the new password
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
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
            res.status(200).json({ message: "Password reset successfully" });
          })
          .catch((err) => {
            res.status(500).json({ error: "Failed to reset password" });
          });
      });
    })
    .catch((err) => {
      res.status(500).json({ error: "Failed to reset password" });
    });
};

//Change Password
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.session.userId;

    // Find the user by their ID
    const user = await User.findById({
      _id: new mongoose.Types.ObjectId(userId),
    });
    console.log("user: " + user);

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

exports.uploadProfilePicture = async (req, res) => {
  try {
    // Get the user ID from the authenticated user (you may have your own authentication logic)
    const userId = req.session.userId;

    // Get the uploaded file from the request
    const profilePicture = req.file;

    // Convert the file data to a string
    // const profilePictureData = profilePicture.toString();
    const profilePictureData = profilePicture.buffer.toString("base64");

    // Save the profile picture URL to the database
    const user = await User.findById(userId);
    user.profilePicture = profilePictureData;
    await user.save();

    res.status(200).json({ message: "Profile picture uploaded successfully" });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({ error: "Failed to upload profile picture" });
  }
};

// User Info
exports.loggedInUserInfo = async (req, res) => {
  try {
    // Get the user ID from the session or token (depending on your authentication setup)
    const userId = req.session.userId; // Assuming you're using sessions
    const token = req.session.token; // Assuming you're using sessions

    console.log("Tokn: " + req.session.token);
    console.log("userId: " + req.session.userId);

    if (!userId && !token) {
      return res.status(404).json({ error: "Please login!!" });
    }

    // Fetch the user information from the database
    const user = await User.findById({
      _id: new mongoose.Types.ObjectId(userId),
    });

    // Return the user information as the response
    const userDetails = {
      _id: user._id,
      fullName: user.fullName,
      userName: user.userName,
      email: user.email,
      isVerified: user.isVerified,
      profilePicture: user.profilePicture,
    };
    console.log("LoggedIn user details fetched");
    res.json(userDetails);
  } catch (error) {
    console.error("Error fetching user information:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.userProfile = async (req, res) => {
  try {
    const userName = req.params.username;
    const user = await User.findOne({ userName });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch posts by the author's username
    const blogs = await Blogs.find({
      authorDetails: user._id,
      status: "PUBLISHED",
    });

    // Here, you can customize the post data you want to send in the response
    const userBlogs = blogs.map((blog) => {
      return {
        title: blog.title,
        slug: blog.slug,
        // Add more fields as needed
      };
    });

    // Create the user profile object
    const userProfile = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      blogs: userBlogs,
    };

    res.json(userProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateUserPersonalDetails = async (req, res) => {
  try {
    const { fullName, userName } = req.body;
    const validationError = validateUsername(userName);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const updatedUser = await User.findById({
      _id: new mongoose.Types.ObjectId(req.session.userId),
    });
    updatedUser.fullName = fullName;
    updatedUser.userName = userName;
    await updatedUser.save();

    res.json({ message: "Username updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating username:", error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the username" });
  }
};

exports.getVisitorCount = async (req, res) => {
  try {
    const visit = await Visit.findOne();
    res.status(200).json({ count: visit ? visit.count : 0 });
  } catch (error) {
    res.status(500).json({ error: "Error getting visit count." });
  }
};

exports.incrementVisitCount = async (req, res) => {
  try {
    const visit = await Visit.findOne();
    if (visit) {
      visit.count++;
      await visit.save();
    } else {
      await Visit.create({});
    }
  } catch (error) {
    console.error("Error incrementing visit count:", error);
  }
};