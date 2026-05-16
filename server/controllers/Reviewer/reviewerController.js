const bcrypt = require("bcrypt");
const Blog = require("../../models/Blog");
const Reviewer = require("../../models/Reviewer");
const User = require("../../models/User");
const jwt = require("jsonwebtoken");
const Admin = require("../../models/Admin");
const mongoose = require("mongoose");
const pako = require("pako");
const sendEmail = require("../../services/mailer");
const removeDuplicates = require("../../utils/removeDuplicates");
const validateUsername = require("../../utils/validateUsername");

// Helper: find a reviewer by userId, checking User collection first (new system)
// then falling back to Reviewer collection (old system / not-yet-migrated).
async function findReviewerById(userId) {
  const user = await User.findById(userId);
  if (user && (user.role === "reviewer" || user.role === "Reviewer")) return { doc: user, source: "user" };
  const reviewer = await Reviewer.findById(userId);
  if (reviewer) return { doc: reviewer, source: "reviewer" };
  return null;
}

exports.reviewerSignup = async (req, res) => {
  try {
    const { fullName, email, password, motivation } = req.body;

    // Check User collection first — existing user can apply as reviewer
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.role === "reviewer" && existingUser.reviewerStatus === "approved") {
        return res.status(400).json({ message: "This email already has an active reviewer account." });
      }
      if (existingUser.reviewerStatus === "pending") {
        return res.status(400).json({ message: "An application with this email is already pending review." });
      }
      // Existing user — just add their reviewer application
      existingUser.reviewerStatus = "pending";
      await existingUser.save();

      const motivationHtml = motivation?.trim()
        ? `<p><strong>Motivation:</strong> ${motivation.trim()}</p>`
        : "";
      const adminHtml = `
        <div class="content">
          <h2>New Reviewer Application</h2>
          <p>An existing user has applied to join the BloggerSpace Reviewer Panel.</p>
          <div class="info-box">
            <strong>Name:</strong> ${existingUser.fullName}<br>
            <strong>Email:</strong> ${email}
            ${motivationHtml ? `<br><strong>Motivation:</strong> ${motivation.trim()}` : ""}
          </div>
          <p><a class="btn" href="${process.env.FRONTEND_URL}/admin">Open Admin Panel</a></p>
        </div>`;
      const applicantHtml = `
        <div class="content">
          <h2>Hi ${existingUser.fullName},</h2>
          <p>Your application to the <strong>BloggerSpace Reviewer Panel</strong> has been received.</p>
          <p>Our admin team will review it and notify you by email once approved.</p>
          <div class="info-box">In the meantime, you can keep using BloggerSpace as a regular reader and writer.</div>
        </div>`;

      res.status(201).json({ message: "Application submitted successfully." });
      await sendEmail(process.env.EMAIL, "New Reviewer Application — BloggerSpace", adminHtml);
      await sendEmail(email, "Application received — BloggerSpace Reviewer Panel", applicantHtml);
      return;
    }

    // Check old Reviewer collection to prevent duplicate applications
    const existingReviewer = await Reviewer.findOne({ email });
    if (existingReviewer) {
      return res.status(400).json({ message: "An application with this email already exists." });
    }

    // New applicant — create a User account with reviewer application pending
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      fullName,
      userName: "reviewer" + email.substring(0, email.indexOf("@")).replace(/[^a-zA-Z0-9]/g, ""),
      email,
      password: hashedPassword,
      role: "user",
      reviewerStatus: "pending",
      isVerified: false,
      status: "ACTIVE",
    });
    await newUser.save();

    const motivationHtml = motivation?.trim()
      ? `<p><strong>Motivation:</strong> ${motivation.trim()}</p>`
      : "";
    const adminHtml = `
      <div class="content">
        <h2>New Reviewer Application</h2>
        <p>A new user has applied to join the BloggerSpace Reviewer Panel.</p>
        <div class="info-box">
          <strong>Name:</strong> ${fullName}<br>
          <strong>Email:</strong> ${email}
          ${motivationHtml ? `<br><strong>Motivation:</strong> ${motivation.trim()}` : ""}
        </div>
        <p><a class="btn" href="${process.env.FRONTEND_URL}/admin">Open Admin Panel</a></p>
      </div>`;
    const applicantHtml = `
      <div class="content">
        <h2>Hi ${fullName},</h2>
        <p>Thank you for applying to the <strong>BloggerSpace Reviewer Panel</strong>!</p>
        <p>Your application has been received and is under review by our admin team. We'll notify you by email once it's approved.</p>
        <div class="info-box">Once approved, you can sign in at the Reviewer Portal with your email and password.</div>
      </div>`;

    res.status(201).json({ message: "Application submitted successfully." });
    await sendEmail(process.env.EMAIL, "New Reviewer Application — BloggerSpace", adminHtml);
    await sendEmail(email, "Application received — BloggerSpace Reviewer Panel", applicantHtml);
  } catch (error) {
    res.status(500).json({ message: "Signup failed. Please try again.", error: error.message });
  }
};

// Legacy reviewer login — kept for backward compat with old Reviewer collection accounts.
// New reviewers (in User collection) log in via POST /api/users/login.
exports.reviewerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Try User collection first (new system)
    const userReviewer = await User.findOne({ email });
    if (userReviewer && (userReviewer.role === "reviewer")) {
      if (userReviewer.reviewerStatus !== "approved") {
        return res.status(403).json({ message: "Your reviewer application is pending admin approval." });
      }
      const isPasswordValid = await bcrypt.compare(password, userReviewer.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid password" });
      }
      const token = jwt.sign(
        { userId: userReviewer._id, currentuserId: userReviewer._id, role: "reviewer" },
        process.env.CURRENT_JWT_SECRET,
        { expiresIn: "3d" }
      );
      return res.status(200).json({
        message: "Login successful",
        token,
        reviewerDetails: {
          _id: userReviewer._id,
          email: userReviewer.email,
          fullName: userReviewer.fullName,
          isVerified: userReviewer.isVerified,
          role: "reviewer",
        },
      });
    }

    // Fallback: old Reviewer collection
    const reviewer = await Reviewer.findOne({ email });
    if (!reviewer) {
      return res.status(404).json({ message: "Reviewer not found" });
    }
    if (!reviewer.isVerified) {
      return res.status(403).json({ message: "Reviewer not verified" });
    }
    const isPasswordValid = await bcrypt.compare(password, reviewer.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }
    const token = jwt.sign(
      { userId: reviewer._id, currentuserId: reviewer._id, role: "Reviewer" },
      process.env.CURRENT_JWT_SECRET,
      { expiresIn: "3d" }
    );
    return res.status(200).json({
      message: "Login successful",
      token,
      reviewerDetails: {
        _id: reviewer._id,
        email: reviewer.email,
        fullName: reviewer.fullName,
        userName: reviewer.userName,
        profilePicture: reviewer.profilePicture,
        isVerified: reviewer.isVerified,
        role: reviewer.role,
        createdAt: reviewer.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

exports.uploadUserProfilePicture = async (req, res) => {
  try {
    const userId = req.query.userId;
    const profilePicture = req.files.find(file => file.fieldname === "profilePicture");
    if (!profilePicture) {
      return res.status(400).json({ error: "No profile picture uploaded" });
    }
    const profilePictureData = profilePicture.buffer.toString("base64");

    if (req.query.role === "Admin") {
      const user = await Admin.findById(userId);
      user.profilePicture = profilePictureData;
      await user.save();
    } else {
      // Reviewer — check User collection first, then legacy Reviewer collection
      const found = await findReviewerById(userId);
      if (!found) return res.status(404).json({ error: "Reviewer not found" });
      found.doc.profilePicture = profilePictureData;
      await found.doc.save();
    }

    res.status(200).json({ newPicture: profilePictureData, message: "Profile picture uploaded successfully" });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({ error: "Failed to upload profile picture" });
  }
};

exports.awaitingAuthorBlogs = async (req, res) => {
  try {
    if (req.query.userId && req.query.email) {
      const blogs = await Blog.find({
        status: "AWAITING_AUTHOR",
        currentReviewer: req.query.email,
      }).populate("authorDetails", "fullName email userName _id").sort({ lastUpdatedAt: -1 }).lean();
      res.json(blogs);
    } else {
      res.status(400).json({ error: "Missing credentials" });
    }
  } catch (error) {
    console.error("Error fetching awaiting author blogs:", error);
    res.status(500).json({ error: "Failed to fetch awaiting author blogs" });
  }
};

exports.pendingReviewBlogs = async (req, res) => {
  try {
    if (req.query.userId) {
      const pendingBlogs = await Blog.find({
        status: "UNDER_REVIEW",
        currentReviewer: req.query.email,
      }).populate("authorDetails", "fullName email userName _id").sort({ lastUpdatedAt: -1 }).lean();
      res.json(pendingBlogs);
    } else {
      res.status(500).json({ error: "Failed to fetch pending blogs" });
    }
  } catch (error) {
    console.error("Error fetching pending blogs:", error);
    res.status(500).json({ error: "Failed to fetch pending blogs" });
  }
};

exports.editPendingBlog = async (req, res) => {
  try {
    const blog = await Blog.findById({
      _id: new mongoose.Types.ObjectId(req.params.id),
    }).populate("authorDetails").exec();

    if (!blog) {
      return res.status(404).json({ error: "blog not found" });
    }

    const compressedContentBuffer = Buffer.from(blog.content, "base64");
    const decompressedContent = pako.inflate(compressedContentBuffer, { to: "string" });
    blog.content = decompressedContent;

    res.json(blog);
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.saveEditedPendingBlog = async (req, res) => {
  try {
    const { slug, title, content, category, rating, reviewRemarks, tags } = req.body;

    const blog = await Blog.findById({ _id: new mongoose.Types.ObjectId(req.params.id) });
    if (!blog) {
      return res.status(404).json({ error: "blog not found" });
    }

    const compressedContentBuffer = pako.deflate(content, { to: "string" });
    const compressedContent = Buffer.from(compressedContentBuffer).toString("base64");

    blog.slug = slug;
    blog.title = title;
    blog.content = compressedContent;
    blog.category = category;
    blog.currentReviewer = "";
    blog.status = "IN_REVIEW";
    blog.reviewedBy.push({
      ReviewedBy: {
        Id: new mongoose.Types.ObjectId(req.query.userId),
        Email: req.query.email,
        Role: req.query.role,
      },
      Revision: content,
      Rating: rating,
      Remarks: reviewRemarks,
      statusTransition: "UNDERREVIEW-INREVIEW",
      LastUpdatedAt: new Date(new Date().getTime() + 330 * 60000),
    });
    blog.lastUpdatedAt = new Date(new Date().getTime() + 330 * 60000);
    blog.tags = tags;
    await blog.save();

    // Add to reviewer's reviewedBlogs — check User first, then old Reviewer collection
    const found = await findReviewerById(req.query.userId);
    if (found) {
      const reviewedBlog = {
        BlogObjectId: blog._id,
        BlogId: blog.blogId,
        BlogTitle: title,
        BlogSlug: slug,
        BlogReviewedTime: new Date(new Date().getTime() + 330 * 60000),
      };
      found.doc.reviewedBlogs.push(reviewedBlog);
      await found.doc.save();

      const receiver = found.doc.email;
      const subject = "Your blog is now under review — BloggerSpace";
      const html = `
        <div class="content">
          <h2>Blog under review</h2>
          <p>You've successfully submitted your review. The blog has been moved to <strong>IN_REVIEW</strong> status.</p>
          <div class="info-box"><strong>Blog:</strong> ${blog.title}</div>
          <p><a class="btn" href="${process.env.FRONTEND_URL}/reviewer">Go to Reviewer Dashboard</a></p>
        </div>`;
      res.json({ message: "blog updated successfully" });
      await sendEmail(receiver, subject, html);
    } else {
      res.json({ message: "blog updated successfully" });
    }
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.userDetails = async (req, res) => {
  try {
    const role = req.query.role;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Authentication required. Please login!" });
    }

    const decoded = jwt.verify(token, process.env.CURRENT_JWT_SECRET);
    const userId = decoded.currentuserId || decoded.userId;

    if (!userId) {
      return res.status(404).json({ error: "Please login!!" });
    }

    if (role === "Admin") {
      const user = await Admin.findById({ _id: new mongoose.Types.ObjectId(userId) });
      return res.json({
        _id: user._id,
        fullName: user.fullName,
        userName: user.userName,
        email: user.email,
        isVerified: user.isVerified,
        profilePicture: user.profilePicture,
        role: user.role,
        createdAt: user.createdAt,
      });
    }

    // Reviewer — check User collection first (new system), then Reviewer collection (legacy)
    if (role === "Reviewer" || role === "reviewer") {
      const found = await findReviewerById(userId);
      if (!found) return res.status(404).json({ error: "Reviewer not found" });
      const u = found.doc;
      return res.json({
        _id: u._id,
        fullName: u.fullName,
        userName: u.userName,
        email: u.email,
        isVerified: u.isVerified,
        profilePicture: u.profilePicture,
        role: found.source === "user" ? "reviewer" : u.role,
        reviewedBlogs: u.reviewedBlogs,
        createdAt: u.createdAt,
      });
    }

    return res.status(400).json({ error: "Invalid role" });
  } catch (error) {
    console.error("Error fetching user information:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteReviewerAccount = async (req, res) => {
  try {
    const currentrole = req.query.role;
    const currentuserId = req.query.userId;

    if (currentrole === "Admin") {
      const admin = await Admin.findById(currentuserId);
      admin.status = "DELETED";
      await admin.save();
    } else {
      const found = await findReviewerById(currentuserId);
      if (!found) return res.status(404).json({ error: "Reviewer not found" });
      found.doc.status = "DELETED";
      await found.doc.save();
    }

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Account deletion failed:", error);
    res.status(500).json({ error: "Failed to delete the account" });
  }
};

exports.feedbackToAuthor = async (req, res) => {
  try {
    const feedback = req.body.feedback;
    const blogId = req.body.id;
    const currentReviewer = req.query.email;

    const blog = await Blog.findById({ _id: new mongoose.Types.ObjectId(blogId) }).populate("authorDetails");
    blog.status = "AWAITING_AUTHOR";
    blog.lastUpdatedAt = new Date(new Date().getTime() + 330 * 60000);
    blog.feedbackToAuthor.push({
      ReviewerId: new mongoose.Types.ObjectId(req.query.userId),
      ReviewerEmail: currentReviewer,
      Feedback: feedback,
      LastUpdated: new Date(new Date().getTime() + 330 * 60000),
    });
    await blog.save();

    const receiver1 = blog.authorDetails.email;
    const receiver2 = req.query.email;
    const subject = "Reviewer feedback on your blog — BloggerSpace";
    const authorHtml = `
      <div class="content">
        <h2>You have reviewer feedback</h2>
        <p>Your blog has been reviewed and requires some revisions before it can be published.</p>
        <div class="info-box">
          <strong>Blog:</strong> ${blog.slug}<br>
          <strong>Status:</strong> Awaiting your revision
        </div>
        <h3>Reviewer feedback</h3>
        <p>${feedback}</p>
        <p><a class="btn" href="${process.env.FRONTEND_URL}/myblogs">View your blogs</a></p>
      </div>`;
    const reviewerHtml = `
      <div class="content">
        <h2>Feedback sent</h2>
        <p>Your feedback has been sent to the author. The blog status has been updated to <strong>AWAITING_AUTHOR</strong>.</p>
        <div class="info-box"><strong>Blog:</strong> ${blog.slug}</div>
      </div>`;

    res.json({ message: "Feedback sent successfully" });
    await sendEmail(receiver1, subject, authorHtml);
    await sendEmail(receiver2, subject, reviewerHtml);
  } catch (error) {
    console.error("Failed to send feedback:", error);
    res.status(500).json({ error: "Failed to send feedback" });
  }
};

exports.changeUsername = async (req, res) => {
  try {
    const { fullName, userName } = req.body;
    const validationError = validateUsername(userName);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    if (req.query.role === "Admin") {
      const updatedUser = await Admin.findById({ _id: new mongoose.Types.ObjectId(req.query.userId) });
      updatedUser.fullName = fullName;
      updatedUser.userName = userName;
      await updatedUser.save();
    } else {
      const found = await findReviewerById(req.query.userId);
      if (!found) return res.status(404).json({ error: "Reviewer not found" });
      found.doc.fullName = fullName;
      found.doc.userName = userName;
      await found.doc.save();
    }

    res.json({ message: "Username updated successfully" });
  } catch (error) {
    console.error("Error updating username:", error);
    res.status(500).json({ error: "An error occurred while updating the username" });
  }
};

exports.saveReviewerDraft = async (req, res) => {
  try {
    const { slug, title, content, category, tags } = req.body;
    const blog = await Blog.findById(new mongoose.Types.ObjectId(req.params.id));
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    const compressedContent = Buffer.from(pako.deflate(content, { to: "string" })).toString("base64");
    blog.slug = slug;
    blog.title = title;
    blog.content = compressedContent;
    blog.category = category;
    blog.tags = tags;
    blog.lastUpdatedAt = new Date(new Date().getTime() + 330 * 60000);
    // Preserve UNDER_REVIEW status — reviewer is not done yet
    await blog.save();
    res.json({ message: "Draft saved" });
  } catch (error) {
    res.status(500).json({ error: "Failed to save draft" });
  }
};

exports.discardQueueBlog = async (req, res) => {
  try {
    const reviewRemarks = req.body.reviewRemarks;
    const rating = req.body.rating;
    const blog = await Blog.findById({ _id: new mongoose.Types.ObjectId(req.params.id) });

    if (!blog) {
      return res.status(404).json({ error: "Blog not found." });
    }

    blog.status = "DISCARD_QUEUE";
    blog.reviewedBy.push({
      ReviewedBy: {
        Id: new mongoose.Types.ObjectId(req.query.userId),
        Email: req.query.email,
        Role: req.query.role,
      },
      Rating: rating,
      Remarks: reviewRemarks,
      statusTransition: "UNDERREVIEW-DISCARDQUEUE",
      LastUpdatedAt: new Date(new Date().getTime() + 330 * 60000),
    });
    blog.lastUpdatedAt = new Date(new Date().getTime() + 330 * 60000);
    await blog.save();

    res.json({ message: "Blog moved to discard queue" });
  } catch (error) {
    res.status(500).json({ error: "An error occurred while discarding blog" });
  }
};
