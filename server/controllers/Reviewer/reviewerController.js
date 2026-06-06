const bcrypt = require("bcrypt");
const Blog = require("../../models/Blog");
const User = require("../../models/User");
const jwt = require("jsonwebtoken");
const Admin = require("../../models/Admin");
const mongoose = require("mongoose");
const pako = require("pako");
const sendEmail = require("../../services/mailer");
const removeDuplicates = require("../../utils/removeDuplicates");
const validateUsername = require("../../utils/validateUsername");
const { checkBlogDuplicate } = require("../../utils/checkBlogDuplicate");
const { notifyEmail } = require("../../utils/notify");

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.reviewerSignup = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Check User collection first
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.role === "reviewer" && existingUser.reviewerStatus === "approved") {
        return res.status(400).json({ message: "This email already has an active reviewer account." });
      }
      if (existingUser.reviewerStatus === "pending") {
        return res.status(400).json({ message: "An application with this email is already pending review." });
      }
      // Existing user must be email-verified before applying
      if (!existingUser.isVerified) {
        return res.status(400).json({
          message: "email_not_verified",
          info: "Your email is not yet verified. Please verify your account first, then apply for reviewer access from your profile.",
        });
      }
      // Verified existing user — direct them to the in-app apply flow
      return res.status(400).json({
        message: "account_exists",
        info: "You already have a BloggerSpace account. Sign in and use the 'Apply as Reviewer' option in your profile.",
      });
    }

    // New applicant — create a regular user account and send email verification OTP.
    // Reviewer application is submitted separately (from profile) after email is verified.
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const newUser = new User({
      fullName,
      userName: "user" + email.substring(0, email.indexOf("@")).replace(/[^a-zA-Z0-9]/g, ""),
      email,
      password: hashedPassword,
      role: "user",
      reviewerStatus: "none",
      isVerified: false,
      status: "INACTIVE",
      otpCode: otp,
      otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
    });
    await newUser.save();

    sendEmail(email, "Verify your BloggerSpace email", `
      <div class="content">
        <h2>Hi ${fullName},</h2>
        <p>Welcome to BloggerSpace! To get started, please verify your email address using the code below.</p>
        <div class="otp-code">${otp}</div>
        <div class="info-box">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</div>
        <p>Once verified, you'll be able to sign in and apply for reviewer access from your profile.</p>
      </div>
    `).catch((err) => console.error("Failed to send reviewer signup OTP:", err));

    return res.status(201).json({
      message: "otp_required",
      email,
      info: "Account created! Please verify your email to continue. After verification, you can apply for reviewer access from your profile.",
    });
  } catch (error) {
    res.status(500).json({ message: "Signup failed. Please try again.", error: error.message });
  }
};

// Submit a reviewer application (for already-verified, active users)
exports.reviewerApply = async (req, res) => {
  try {
    const userId = req.query.userId;
    const { motivation } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email before applying." });
    }
    if (user.status !== "ACTIVE") {
      return res.status(403).json({ message: "Your account is not active." });
    }
    if (user.role === "reviewer" && user.reviewerStatus === "approved") {
      return res.status(400).json({ message: "You are already an approved reviewer." });
    }
    if (user.reviewerStatus === "pending") {
      return res.status(400).json({ message: "Your application is already pending admin review." });
    }

    user.reviewerStatus = "pending";
    await user.save();

    const motivationHtml = motivation?.trim()
      ? `<br><strong>Motivation:</strong> ${motivation.trim()}`
      : "";
    const adminHtml = `
      <div class="content">
        <h2>New Reviewer Application</h2>
        <p>A verified BloggerSpace user has applied to join the Reviewer Panel.</p>
        <div class="info-box">
          <strong>Name:</strong> ${user.fullName}<br>
          <strong>Email:</strong> ${user.email}
          ${motivationHtml}
        </div>
        <p><a class="btn" href="${process.env.FRONTEND_URL}/admin">Open Admin Panel</a></p>
      </div>`;
    const applicantHtml = `
      <div class="content">
        <h2>Hi ${user.fullName},</h2>
        <p>Your application to the <strong>BloggerSpace Reviewer Panel</strong> has been received.</p>
        <p>Our admin team will review it and notify you by email once approved.</p>
        <div class="info-box">In the meantime, you can keep using BloggerSpace as a regular user.</div>
      </div>`;

    res.status(200).json({ message: "Application submitted successfully." });
    sendEmail(process.env.EMAIL, "New Reviewer Application — BloggerSpace", adminHtml).catch(console.error);
    sendEmail(user.email, "Application received — BloggerSpace Reviewer Panel", applicantHtml).catch(console.error);
  } catch (error) {
    res.status(500).json({ message: "Failed to submit application.", error: error.message });
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
      if (userReviewer.status === "INACTIVE") {
        return res.status(403).json({ message: "account_deactivated", info: "Your account has been deactivated. Please contact support." });
      }
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

    return res.status(404).json({ message: "Reviewer account not found. Please ensure you have a verified BloggerSpace account with reviewer access." });
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
      const reviewer = await User.findById(userId);
      if (!reviewer) return res.status(404).json({ error: "Reviewer not found" });
      reviewer.profilePicture = profilePictureData;
      await reviewer.save();
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
      })
        // List view only needs card fields — drop the heavy HTML body, comments and
        // likes arrays. The full content is loaded separately when a blog is opened
        // (editPendingBlog), so excluding them here just shrinks the payload.
        .select("-content -comments -blogLikes")
        .populate("authorDetails", "fullName email userName _id").sort({ lastUpdatedAt: -1 }).lean();
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
      })
        // List view only needs card fields — drop the heavy HTML body, comments and
        // likes arrays. The full content is loaded separately when a blog is opened
        // (editPendingBlog), so excluding them here just shrinks the payload.
        .select("-content -comments -blogLikes")
        .populate("authorDetails", "fullName email userName _id").sort({ lastUpdatedAt: -1 }).lean();
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

    // Only allow submission when the blog is actively assigned for review or
    // awaiting author revision (reviewer can send additional feedback if the
    // author hasn't updated yet).
    if (!["UNDER_REVIEW", "AWAITING_AUTHOR"].includes(blog.status)) {
      return res.status(409).json({
        error: "already_reviewed",
        message: "This blog has already been reviewed and is no longer under review.",
      });
    }
    if (blog.currentReviewer && blog.currentReviewer !== req.query.email) {
      return res.status(403).json({ error: "not_assigned", message: "You are not the assigned reviewer for this blog." });
    }

    // Guard against a duplicate title/slug — but only validate a field if the
    // reviewer actually CHANGED it from the original (an unchanged title must not
    // be re-checked, so a legacy duplicate can't block the review).
    const dupMsg = await checkBlogDuplicate(Blog, { title, slug, excludeId: blog._id, original: blog });
    if (dupMsg) return res.status(409).json({ error: dupMsg, message: dupMsg });

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

    // Add to reviewer's reviewedBlogs in User collection
    const reviewer = await User.findById(req.query.userId);
    if (reviewer) {
      reviewer.reviewedBlogs.push({
        BlogObjectId: blog._id,
        BlogId: blog.blogId,
        BlogTitle: title,
        BlogSlug: slug,
        BlogReviewedTime: new Date(new Date().getTime() + 330 * 60000),
      });
      await reviewer.save();

      const subject = "Your blog is now under review — BloggerSpace";
      const html = `
        <div class="content">
          <h2>Blog under review</h2>
          <p>You've successfully submitted your review. The blog has been moved to <strong>IN_REVIEW</strong> status.</p>
          <div class="info-box"><strong>Blog:</strong> ${blog.title}</div>
          <p><a class="btn" href="${process.env.FRONTEND_URL}/reviewer">Go to Reviewer Dashboard</a></p>
        </div>`;
      res.json({ message: "blog updated successfully" });
      await sendEmail(reviewer.email, subject, html);
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

    if (role === "Reviewer" || role === "reviewer") {
      const u = await User.findById(userId);
      if (!u) return res.status(404).json({ error: "Reviewer not found" });

      // Enrich reviewedBlogs with reviewer gems from the Blog collection
      const rawReviewed = u.reviewedBlogs || [];
      const blogObjectIds = rawReviewed.filter((rb) => rb.BlogObjectId).map((rb) => rb.BlogObjectId);
      const gemsMap = new Map();
      if (blogObjectIds.length) {
        const blogDocs = await Blog.find({ _id: { $in: blogObjectIds } }).select("_id gems").lean();
        blogDocs.forEach((b) => {
          const gems = b.gems;
          if (!gems?.awarded) { gemsMap.set(b._id.toString(), 0); return; }
          let reviewerGems = 0;
          const rid = u._id.toString();
          if (gems.reviewerAwards?.length) {
            const award = gems.reviewerAwards.find((a) => a.userId?.toString() === rid);
            reviewerGems = award?.gems || 0;
          } else if (gems.reviewerUserId?.toString() === rid) {
            reviewerGems = gems.reviewerGems || 0;
          }
          gemsMap.set(b._id.toString(), reviewerGems);
        });
      }
      const enrichedReviewedBlogs = rawReviewed.map((rb) => ({
        ...rb,
        reviewerGems: rb.BlogObjectId ? (gemsMap.get(rb.BlogObjectId.toString()) ?? 0) : 0,
      }));

      return res.json({
        _id: u._id,
        fullName: u.fullName,
        userName: u.userName,
        email: u.email,
        isVerified: u.isVerified,
        profilePicture: u.profilePicture,
        role: u.role,
        reviewedBlogs: enrichedReviewedBlogs,
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
      const reviewer = await User.findById(currentuserId);
      if (!reviewer) return res.status(404).json({ error: "Reviewer not found" });
      reviewer.status = "DELETED";
      await reviewer.save();
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

    const receiver1 = notifyEmail(blog.authorDetails); // null if author missing / self-deleted
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
    if (receiver1) await sendEmail(receiver1, subject, authorHtml);
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
      const reviewer = await User.findById(req.query.userId);
      if (!reviewer) return res.status(404).json({ error: "Reviewer not found" });
      reviewer.fullName = fullName;
      reviewer.userName = userName;
      await reviewer.save();
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
