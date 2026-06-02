const bcrypt = require("bcrypt");
const Admin = require("../../models/Admin");
const User = require("../../models/User");
const Community= require("../../models/Community");
const migrateReviewersToUsers = require("../../utils/migrateReviewers");
const jwt = require("jsonwebtoken");
const Blog = require("../../models/Blog");
const mongoose = require("mongoose");
const pako = require("pako");
const sendEmail = require("../../services/mailer");
const generateSitemap = require('../../utils/generateSitemap');
const { revalidate } = require("../../utils/revalidate");
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const Newsletter = require("../../models/Newsletter");
const GemsTransaction = require("../../models/GemsTransaction");
const AdminConfig = require("../../models/AdminConfig");
const ReviewScore = require("../../models/ReviewScore");
const { uploadImageToGitHub } = require("../../utils/uploadImageToGitHub");
const IST_OFFSET = 330;

// Default caps if no AdminConfig doc exists yet (defensive — Phase 1 lazily
// creates one on first GET, but a request could land before that read).
const DEFAULT_PER_BLOG_AUTHOR_CAP = 10;
const DEFAULT_PER_BLOG_REVIEWER_CAP = 5;

async function loadPerBlogCaps() {
  const cfg = await AdminConfig.findOne({}).select("perBlogAuthorGemsCap perBlogReviewerGemsCap").lean();
  return {
    authorCap: cfg?.perBlogAuthorGemsCap ?? DEFAULT_PER_BLOG_AUTHOR_CAP,
    reviewerCap: cfg?.perBlogReviewerGemsCap ?? DEFAULT_PER_BLOG_REVIEWER_CAP,
  };
}

exports.adminSignup = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Check if the user already exists
    const existingAdmin = await Admin.findOne({ email });
    console.log(existingAdmin);
    if (existingAdmin) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newAdmin = new Admin({
      fullName,
      userName: "admin"+email.substring(0, email.indexOf("@")).replace(/[^a-zA-Z0-9 ]/g, ""),
      email,
      password: hashedPassword,
    });

    console.log(newAdmin);

    await newAdmin.save();

    res.status(201).json({ message: "Signup successful" });
  } catch (error) {
    res.status(500).json({ message: "Signup failed", error: error.message });
  }
};


const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const buildAdminDetails = (admin) => ({
  _id: admin._id,
  email: admin.email,
  fullName: admin.fullName,
  userName: admin.userName,
  profilePicture: admin.profilePicture,
  isVerified: admin.isVerified,
  role: admin.role,
  createdAt: admin.createdAt,
});

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    if (!admin.isVerified) return res.status(403).json({ message: "Admin account not verified" });

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) return res.status(401).json({ message: "Invalid password" });

    // OTP FLOW TEMPORARILY DISABLED — direct JWT login
    // To re-enable: uncomment the block below and remove the direct-login block
    /*
    const otp = generateOtp();
    admin.otpCode = otp;
    admin.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await admin.save();
    const html = `
      <div class="content">
        <h2>Admin login verification</h2>
        <p>Someone is trying to sign in to the BloggerSpace Admin panel. If this was you, use the code below to complete sign-in.</p>
        <div class="otp-code">${otp}</div>
        <div class="warn-box">This code expires in <strong>10 minutes</strong>. If you did not attempt to log in, your password may be compromised — change it immediately.</div>
      </div>`;
    res.status(200).json({ message: "otp_required", email });
    sendEmail(email, "Admin login verification code — BloggerSpace", html).catch(console.error);
    */

    const token = jwt.sign(
      { userId: admin._id, currentuserId: admin._id, role: "Admin" },
      process.env.CURRENT_JWT_SECRET,
      { expiresIn: "3d" }
    );
    res.status(200).json({ message: "Login successful", token, adminDetails: buildAdminDetails(admin) });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

exports.adminVerifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    if (!admin.otpCode || !admin.otpExpiry) {
      return res.status(400).json({ message: "No verification code pending. Please log in again." });
    }
    if (new Date() > admin.otpExpiry) {
      return res.status(401).json({ message: "Verification code has expired. Please log in again." });
    }
    if (admin.otpCode !== otp) {
      return res.status(401).json({ message: "Invalid verification code." });
    }

    admin.otpCode = null;
    admin.otpExpiry = null;
    await admin.save();

    const token = jwt.sign(
      { userId: admin._id, currentuserId: admin._id, role: "Admin" },
      process.env.CURRENT_JWT_SECRET,
      { expiresIn: "3d" }
    );

    res.status(200).json({ message: "Login successful", token, adminDetails: buildAdminDetails(admin) });
  } catch (error) {
    res.status(500).json({ message: "Verification failed", error: error.message });
  }
};

exports.adminResendLoginOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin || !admin.isVerified) return res.status(404).json({ message: "Admin not found" });

    const otp = generateOtp();
    admin.otpCode = otp;
    admin.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await admin.save();

    const html = `
      <div class="content">
        <h2>New admin login code</h2>
        <p>You requested a new verification code for the BloggerSpace Admin panel.</p>
        <div class="otp-code">${otp}</div>
        <div class="warn-box">This code expires in <strong>10 minutes</strong>.</div>
      </div>`;

    res.status(200).json({ message: "New code sent to your email." });
    sendEmail(email, "New admin login code — BloggerSpace", html).catch(console.error);
  } catch (error) {
    res.status(500).json({ message: "Failed to resend code", error: error.message });
  }
};


// Fetch admin blogs (paginated)
exports.fetchAdminBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const blogs = await Blog.find({ status: "ADMIN_PUBLISHED" })
      // .sort({ lastUpdatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalBlogs = await Blog.countDocuments({ status: "ADMIN_PUBLISHED" });

    res.json({
      blogs,
      currentPage: page,
      totalPages: Math.ceil(totalBlogs / limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch admin blogs" });
  }
};



exports.inReviewBlogs = async (req, res) => {
  try {
    // if (req.session.currentemail) {
    if (req.query.userId) {
      // List view only — exclude the heavy compressed `content` + `comments`.
      const rawBlogs = await Blog.find({ status: "IN_REVIEW" })
        .select("-content -comments")
        .sort({ lastUpdatedAt: -1 })
        .populate("authorDetails", "fullName email userName _id")
        .lean();

      // Collect unique non-Admin reviewer IDs
      const reviewerIdSet = new Set();
      rawBlogs.forEach((b) => {
        (b.reviewedBy || []).forEach((r) => {
          const id = r?.ReviewedBy?.Id;
          if (id && r?.ReviewedBy?.Role !== "Admin") reviewerIdSet.add(id.toString());
        });
      });
      const reviewerObjectIds = [...reviewerIdSet].map((id) => new mongoose.Types.ObjectId(id));
      const reviewerUsers = reviewerObjectIds.length
        ? await User.find({ _id: { $in: reviewerObjectIds } }, "fullName _id").lean()
        : [];
      const nameMap = new Map(reviewerUsers.map((r) => [r._id.toString(), r.fullName]));

      const pendingBlogs = rawBlogs.map((b) => ({
        ...b,
        reviewedBy: (b.reviewedBy || [])
          .filter((r) => r?.ReviewedBy?.Role !== "Admin" && r?.ReviewedBy?.Id)
          .map((r) => ({
            reviewerId: r.ReviewedBy.Id.toString(),
            reviewerName: nameMap.get(r.ReviewedBy.Id.toString()),
          })),
      }));

      res.json(pendingBlogs);
    } else {
      res.status(500).json({ error: "Failed to fetch pending blogs" });
    }
  } catch (error) {
    console.error("Error fetching pending blogs:", error);
    res.status(500).json({ error: "Failed to fetch pending blogs" });
  }
}; 


exports.editInReviewBlog = async (req, res) => {
  try {
    const blog = await Blog.findById({
      _id: new mongoose.Types.ObjectId(req.params.id),
    }).populate("authorDetails").exec();

    if (!blog) {
      return res.status(404).json({ error: "blog not found" });
    }

    // Decompress the content before displaying it
    const compressedContentBuffer = Buffer.from(blog.content, "base64");
    const decompressedContent = pako.inflate(compressedContentBuffer, {
      to: "string",
    });
    blog.content = decompressedContent;

    res.json(blog);
  } catch (error) {
    console.error("Error fetching blog blog:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.saveEditedInReviewBlog = async (req, res) => {
  try {
    // const { id } = req.params;
    const { slug, title, content, category, rating, reviewRemarks, tags } =
      req.body;

      console.log(req.query.userId);
      console.log(req.query.role);
      console.log(req.query.email);

    // Find the blog by ID
    const blog = await Blog.findById({
      _id: new mongoose.Types.ObjectId(req.params.id),
    }).populate("authorDetails").exec();

    console.log("Line 156", blog.authorDetails._id);

    if (!blog) {
      return res.status(404).json({ error: "blog not found" });
    }

    // Compress the content before saving it
    const compressedContentBuffer = pako.deflate(content, { to: "string" });
    const compressedContent = Buffer.from(compressedContentBuffer).toString(
      "base64"
    );

    await Blog.findByIdAndUpdate({_id: new mongoose.Types.ObjectId(req.params.id), }, { $set: { 'reviewedBy.$[].Revision': "" } });

    // Update the blog fields
    blog.slug = slug;
    blog.title = title;
    blog.content = compressedContent;
    blog.category = category;
    blog.currentReviewer = "";
    blog.status = "PUBLISHED";
    // blog.reviewedBy.push(req.session.currentemail);
    blog.reviewedBy.push({
      // ReviewedBy: req.session.currentemail,
      ReviewedBy: {
        Id: new mongoose.Types.ObjectId(req.query.userId),
        Email: req.body.email || req.query.email,
        Role: req.query.role,
      },
      Revision:"NA",
      Rating: rating,
      Remarks: reviewRemarks,
      statusTransition: "INREVIEW-PUBLISHED",
      LastUpdatedAt: new Date(new Date().getTime() + 330 * 60000),
    });
    // blog.lastUpdatedAt= Date.now();
    // blog.lastUpdatedAt = new Date(new Date().getTime() + 330 * 60000);   // TEMP
    blog.tags=tags;

    // Save the updated blog
    await blog.save();
    generateSitemap().catch((err) => console.error("Sitemap update failed:", err));
    // On-demand ISR: make the now-live blog + author profile + home fresh now.
    revalidate({ slug: blog.slug, username: blog.authorDetails?.userName, paths: ["/"] });

    // Sending mail to author
    const receiver = blog.authorDetails.email;
    const subject = "Your blog is live on BloggerSpace!";
    const html = `
      <div class="content">
        <h2>Congratulations, ${blog.authorDetails.fullName}!</h2>
        <p>Your blog has passed review and is now <strong>live</strong> on BloggerSpace. 🎉</p>
        <div class="info-box"><strong>Title:</strong> ${title}</div>
        <p>
          <a class="btn" href="${process.env.FRONTEND_URL}/blogs/${slug}">Read your blog</a>
          &nbsp;
          <a class="btn-outline" href="${process.env.FRONTEND_URL}/newblog">Write another</a>
        </p>
      </div>
    `;

    sendEmail(receiver, subject, html)
      .then((response) => {
        console.log(`Email sent to ${receiver}:`, response);
      })
      .catch((error) => {
        console.error("Error sending email:", error);
      });

    // Sending mail to admin
    const receiver2 = process.env.EMAIL;
    const subject2 = "Blog published — BloggerSpace";
    const html2 = `
      <div class="content">
        <h2>Blog published</h2>
        <p>A blog has been published successfully.</p>
        <div class="info-box">
          <strong>Title:</strong> ${title}<br>
          <strong>Author:</strong> ${blog.authorDetails.fullName}
        </div>
        <p><a class="btn" href="${process.env.FRONTEND_URL}/blogs/${slug}">View live blog</a></p>
      </div>
    `;

    sendEmail(receiver2, subject2, html2)
      .then((response) => {
        console.log(`Email sent to admin:`, response);
      })
      .catch((error) => {
        console.error("Error sending email:", error);
      });


    res.json({ message: "blog updated successfully" });
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


exports.publishedBlogs = async (req, res) => {
  try {
    const { userId, page = 1, limit = 30, search = "" } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const skip = (page - 1) * limit;
    const q = search.trim();
    const searchFilter = q
      ? { $or: [
          { title: { $regex: q, $options: "i" } },
          { category: { $regex: q, $options: "i" } },
        ] }
      : {};

    const publishedQuery = { status: { $in: ["PUBLISHED", "ADMIN_PUBLISHED"] }, ...searchFilter };

    const [rawBlogs, totalCount] = await Promise.all([
      Blog.find(publishedQuery)
        .sort({ lastUpdatedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("authorDetails", "fullName email userName _id")
        .lean(),
      Blog.countDocuments(publishedQuery),
    ]);

    // Collect unique non-Admin reviewer IDs across all blogs
    const reviewerIdSet = new Set();
    rawBlogs.forEach((b) => {
      (b.reviewedBy || []).forEach((r) => {
        const id = r?.ReviewedBy?.Id;
        const role = r?.ReviewedBy?.Role;
        if (id && role !== "Admin") reviewerIdSet.add(id.toString());
      });
    });
    const reviewerObjectIds = [...reviewerIdSet].map((id) => new mongoose.Types.ObjectId(id));

    const reviewerUsers = reviewerObjectIds.length
      ? await User.find({ _id: { $in: reviewerObjectIds } }, "fullName _id").lean()
      : [];

    const nameMap = new Map(reviewerUsers.map((r) => [r._id.toString(), r.fullName]));

    // Transform each blog: reviewedBy → [{reviewerId, reviewerName}], skip Admin entries
    const blogs = rawBlogs.map((b) => ({
      ...b,
      reviewedBy: (b.reviewedBy || [])
        .filter((r) => r?.ReviewedBy?.Role !== "Admin" && r?.ReviewedBy?.Id)
        .map((r) => ({
          reviewerId: r.ReviewedBy.Id.toString(),
          reviewerName: nameMap.get(r.ReviewedBy.Id.toString()),
        })),
    }));

    res.json({
      blogs,
      totalCount,
      currentPage: Number(page),
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("Error fetching PUBLISHED blogs:", error);
    res.status(500).json({ error: "Failed to fetch PUBLISHED blogs" });
  }
};


// exports.publishedBlogs = async (req, res) => {
//   try {
//     if (req.query.userId) {
//       // Query the Blog model for pending blogs assigned to the reviewer
//       const pendingBlogs = await Blog.find({
//         status: "PUBLISHED",
//       });

//       res.json(pendingBlogs);
//     } else {
//       res.status(500).json({ error: "Failed to fetch PUBLISHED blogs" });
//     }
//   } catch (error) {
//     console.error("Error fetching PUBLISHED blogs:", error);
//     res.status(500).json({ error: "Failed to fetch PUBLISHED blogs" });
//   }
// }; 


exports.allReviewersFromDB = async (req, res) => {
  try {
    if (!req.query.userId) return res.status(400).json({ error: "Missing userId" });
    const reviewers = await User.find({ role: "reviewer", reviewerStatus: "approved" });
    res.json(reviewers);
  } catch (error) {
    console.error("Error fetching Reviewers:", error);
    res.status(500).json({ error: "Failed to fetch Reviewers" });
  }
}; 

exports.allPendingBlogsfromDB = async (req, res) => {
  try {
    if (req.query.userId) {
      // Query the Blog model for pending blogs assigned to the reviewer
      // List view only — drop heavy content/comments, trim author fields, sort.
      const allPendingBlogs = await Blog.find({
        status: "PENDING_REVIEW",
        currentReviewer: "",
      })
        .select("-content -comments")
        .sort({ lastUpdatedAt: -1 })
        .populate("authorDetails", "fullName email userName _id")
        .lean();

      res.json(allPendingBlogs);
    } else {
      res.status(500).json({ error: "Failed to fetch Pending Blogs" });
    }
  } catch (error) {
    console.error("Error fetching Pending Blogs:", error);
    res.status(500).json({ error: "Failed to fetch Pending Blogs" });
  }
}; 


exports.updateReviewerAssignment = async (req, res) => {
  const { id } = req.params;
  const { assignedUser } = req.body;

  try {
    // Assuming you have a database model/schema for blogs
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Update the assignedUser field of the blog
    blog.currentReviewer = assignedUser;
    blog.status= "UNDER_REVIEW";
    // blog.lastUpdatedAt= Date.now();
    blog.lastUpdatedAt = new Date(new Date().getTime() + 330 * 60000);
    await blog.save();

    const receiver = assignedUser;
    const subject = "New blog assigned to you — BloggerSpace";
    const html = `
      <div class="content">
        <h2>New blog assigned</h2>
        <p>A blog has been assigned to you for review. Please complete the review within <strong>3 days</strong>.</p>
        <div class="info-box"><strong>Blog title:</strong> ${blog.title}</div>
        <p><a class="btn" href="${process.env.REVIEWER_PANEL_URL}">Open Reviewer Panel</a></p>
      </div>
    `;

    
    sendEmail(receiver, subject, html)
    .then((response) => {
      console.log(`Email sent to ${receiver}:`, response);
    })
    .catch((error) => {
      console.error("Error sending email:", error);
    });
    return res.json({ message: "Blog assigned successfully" });
  } catch (error) {
    console.error("Error assigning blog:", error);
    return res.status(500).json({ message: "Failed to assign blog" });
  }
};


exports.allUnderReviewBlogsfromDB = async (req, res) => {
  try {
    if (req.query.userId) {
      // Query the Blog model for pending blogs assigned to the reviewer
      // List view only — drop heavy content/comments, trim author fields, sort.
      const allUnderReviewBlogs = await Blog.find({
        status: "UNDER_REVIEW",
      })
        .select("-content -comments")
        .sort({ lastUpdatedAt: -1 })
        .populate("authorDetails", "fullName email userName _id")
        .lean();

      res.json(allUnderReviewBlogs);
    } else {
      res.status(500).json({ error: "Failed to fetch UNDER_REVIEW Blogs" });
    }
  } catch (error) {
    console.error("Error fetching UNDER_REVIEW Blogs:", error);
    res.status(500).json({ error: "Failed to fetch UNDER_REVIEW Blogs" });
  }
}; 


exports.fetchDiscardQueueBlogsFromDB = async (req, res) => {
  try {
    if (req.query.userId) {
      // Query the Blog model for pending blogs assigned to the reviewer
      // List view only — drop heavy content/comments, sort newest-first.
      const allDiscardQueueBlogs = await Blog.find({
        status: "DISCARD_QUEUE",
      })
        .select("-content -comments")
        .sort({ lastUpdatedAt: -1 })
        .lean();

      res.json(allDiscardQueueBlogs);
    } else {
      res.status(500).json({ error: "Failed to fetch DISCARD_QUEUE Blogs" });
    }
  } catch (error) {
    console.error("Error fetching UNDER_REVIEW Blogs:", error);
    res.status(500).json({ error: "Failed to fetch DISCARD_QUEUE Blogs" });
  }
}; 



exports.fetchAwaitingAuthorFromDB = async (req, res) => {
  try {
    if (req.query.userId) {
      // Query the Blog model for pending blogs assigned to the reviewer
      // List view only — drop heavy content/comments, trim author fields, sort.
      const allAwaitingAuthorBlogs = await Blog.find({
        status: "AWAITING_AUTHOR",
      })
        .select("-content -comments")
        .sort({ lastUpdatedAt: -1 })
        .populate("authorDetails", "fullName email userName _id")
        .lean();

      res.json(allAwaitingAuthorBlogs);
    } else {
      res.status(500).json({ error: "Failed to fetch AWAITING_AUTHOR Blogs" });
    }
  } catch (error) {
    console.error("Error fetching AWAITING_AUTHOR Blogs:", error);
    res.status(500).json({ error: "Failed to fetch AWAITING_AUTHOR Blogs" });
  }
}; 

exports.fetchAllVerifiedReviewers = async (req, res) => {
  try {
    const reviewers = await User.find({ role: "reviewer", reviewerStatus: "approved" });
    res.json(reviewers);
  } catch (error) {
    console.log("Error fetching verified reviewers");
    res.status(500).json({ error: "Failed to fetch All verified reviewers" });
  }
};

exports.fetchAllPendingRequestReviewers = async (req, res) => {
  try {
    const pendingUsers = await User.find({ reviewerStatus: "pending" });
    res.json(pendingUsers);
  } catch (error) {
    console.log("Error fetching pending request reviewers");
    res.status(500).json({ error: "Failed to fetch pending request reviewers" });
  }
};

exports.rejectReviewerRequest = async (req, res) => {
  const { id } = req.params;
  try {
    const target = await User.findById(id);
    if (!target) return res.status(404).json({ error: "Reviewer not found" });
    target.reviewerStatus = "rejected";
    await target.save();

    const receiver = target.email;
    const subject = "Update on your BloggerSpace Reviewer application";
    const html = `
      <div class="content">
        <h2>Hi ${target.fullName},</h2>
        <p>Thank you for your interest in joining the BloggerSpace Reviewer Panel.</p>
        <p>After reviewing your application, we're unable to approve it at this time.</p>
        <div class="info-box">You're welcome to continue writing and re-apply in the future. We appreciate your enthusiasm for the platform!</div>
        <p>If you have any questions, please reach out at <a href="mailto:${process.env.EMAIL}">${process.env.EMAIL}</a>.</p>
      </div>`;

    res.json({ message: "Reviewer request rejected." });
    await sendEmail(receiver, subject, html);
  } catch (error) {
    console.log("Error when rejecting reviewer request", error);
    res.status(500).json({ error: "Failed to reject reviewer request" });
  }
};

exports.approveReviewerRequest= async(req, res)=>{
  const {id}= req.params;
  try {
    const target = await User.findById(id);
    if (!target) return res.status(404).json({ error: "Reviewer not found" });
    target.role = "reviewer";
    target.reviewerStatus = "approved";
    target.status = "ACTIVE";
    await target.save();

    const receiver = target.email;
    const subject = "You're approved as a BloggerSpace Reviewer!";
    const html = `
      <div class="content">
        <h2>Welcome to the Reviewer team, ${target.fullName}!</h2>
        <p>Your application to join the BloggerSpace Reviewer Panel has been approved. You now have access to the Reviewer dashboard.</p>
        <div class="info-box">
          Please review assigned blogs before their deadline. Consistently missing deadlines may result in your reviewer access being revoked.
        </div>
        <p><a class="btn" href="${process.env.REVIEWER_PANEL_URL}">Sign in to Reviewer Panel</a></p>
      </div>`;

    res.json({ message: "Reviewer verified successfully" });
    await sendEmail(receiver, subject, html);
  } catch (error) {
    console.log("Error when approving request of the reviewer", error);
    res.status(500).json({ error: "Failed to approve reviewer" });
  }
}

exports.removeFromReviewerRole= async(req, res)=>{
  const {id}= req.params;
  try {
    const target = await User.findById(id);
    if (!target) return res.status(404).json({ error: "Reviewer not found" });
    const reviewerEmail = target.email;
    target.role = "user";
    target.reviewerStatus = "rejected";
    await target.save();
    await Blog.updateMany(
      { currentReviewer: reviewerEmail, status: "UNDER_REVIEW" },
      { $set: { currentReviewer: "", status: "PENDING_REVIEW", lastUpdatedAt: new Date() } }
    );

    const receiver = target.email;
    const subject = "Your BloggerSpace Reviewer access has been removed";
    const html = `
      <div class="content">
        <h2>Hi ${target.fullName},</h2>
        <p>Your reviewer access on BloggerSpace has been removed by an admin.</p>
        <p>You can still use BloggerSpace as a regular user. If you'd like to re-apply in the future, visit your profile settings.</p>
        <div class="warn-box">If you believe this was done in error, please contact us at <a href="mailto:${process.env.EMAIL}">${process.env.EMAIL}</a>.</div>
      </div>`;

    res.json({ message: "Reviewer removed successfully" });
    await sendEmail(receiver, subject, html);
  } catch (error) {
    console.log("Error when removing the reviewer", error);
    res.status(500).json({ error: "Failed to remove reviewer" });
  }
}

exports.discardAnyBlog = async (req, res) => {
  const { id } = req.params;
  const adminId = req.query.userId;
  try {
    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ error: "Blog not found" });

    // Deduct gems if they were awarded for this blog
    await deductGemsForBlog(blog, adminId);

    blog.status = blog.status.startsWith("ADMIN_") ? "ADMIN_DISCARDED" : "DISCARD_QUEUE";
    blog.lastUpdatedAt = new Date(new Date().getTime() + IST_OFFSET * 60000);
    await blog.save();
    // No longer public — purge its page (will 404 on next request) + listings + home.
    await blog.populate("authorDetails", "userName");
    revalidate({ slug: blog.slug, username: blog.authorDetails?.userName, paths: ["/adminblogs", "/"] });
    res.json({ message: "Blog discarded successfully" });
  } catch (error) {
    console.error("Error discarding blog:", error);
    res.status(500).json({ error: "Failed to discard blog" });
  }
};

exports.deleteBlogPermanently = async (req, res) => {
  const { id } = req.params;
  try {
    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    const allowedStatuses = ["DISCARD_QUEUE", "ADMIN_DISCARDED"];
    if (!allowedStatuses.includes(blog.status)) {
      return res.status(400).json({ error: "Only discarded blogs can be permanently deleted." });
    }
    await blog.populate("authorDetails", "userName");
    const slug = blog.slug;
    const username = blog.authorDetails?.userName;
    await Blog.findByIdAndDelete(id);
    revalidate({ slug, username, paths: ["/adminblogs"] });
    res.json({ message: "Blog permanently deleted." });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ error: "Failed to delete blog" });
  }
};

exports.adminEditAnyBlog = async (req, res) => {
  const { id } = req.params;
  try {
    const { title, slug, content, category, tags } = req.body;
    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    if (title) blog.title = title;
    if (slug) blog.slug = slug;
    if (content) {
      const compressedContent = Buffer.from(pako.deflate(content, { to: "string" })).toString("base64");
      blog.content = compressedContent;
    }
    if (category) blog.category = category;
    if (tags) blog.tags = tags;
    blog.lastUpdatedAt = new Date(new Date().getTime() + 330 * 60000);
    await blog.save();
    revalidate({ slug: blog.slug, paths: ["/adminblogs"] });
    res.json({ message: "Blog updated successfully" });
  } catch (error) {
    console.error("Error editing blog:", error);
    res.status(500).json({ error: "Failed to update blog" });
  }
};

exports.migrateReviewersToUsers = async (req, res) => {
  try {
    const result = await migrateReviewersToUsers();
    res.json({
      message: `Migration complete. ${result.migrated} created, ${result.merged} merged, ${result.skipped} already migrated.`,
      ...result,
    });
  } catch (error) {
    console.error("Migration failed:", error);
    res.status(500).json({ error: "Migration failed: " + error.message });
  }
};

// Team-management Users tab — paginated + server-side search across ALL users
// (name/username/email). Returns one page so the table stays fast as users grow.
exports.fetchAllUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const search = (req.query.search || "").trim();

    // Return ACTIVE and INACTIVE users so admin can see and reactivate deactivated accounts
    const match = { status: { $in: ["ACTIVE", "INACTIVE"] } };
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      match.$or = [{ fullName: rx }, { userName: rx }, { email: rx }];
    }

    const [users, total] = await Promise.all([
      User.find(match)
        .select("fullName userName email status isVerified role reviewerStatus gems createdAt authType lastLogin lastVerifiedAt reverifyAttempts newsletterOptIn")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(match),
    ]);

    res.json({ users, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (error) {
    console.log("Error fetching all users", error);
    res.status(500).json({ error: "Failed to fetch all users" });
  }
};

// Newsletter composer recipient list. The composer needs EVERY user (for
// "select all" + subscriber preselect), so this returns all of them but with
// only the minimal fields it uses — far lighter than the full user docs.
exports.getNewsletterRecipients = async (req, res) => {
  try {
    const recipients = await User.find({ status: { $in: ["ACTIVE", "INACTIVE"] } })
      .select("fullName userName email newsletterOptIn")
      .sort({ fullName: 1 })
      .lean();
    res.json(recipients);
  } catch (error) {
    console.log("Error fetching newsletter recipients", error);
    res.status(500).json({ error: "Failed to fetch newsletter recipients" });
  }
};

// Users who self-deleted their account (status DELETED). Includes deletedAt and a
// computed purgeAt (deletedAt + 7 days) so the admin sees when auto-removal happens.
exports.getDeletedUsers = async (req, res) => {
  try {
    const users = await User.find({ status: "DELETED" })
      .select("fullName userName email role createdAt deletedAt")
      .sort({ deletedAt: -1 })
      .lean();

    const withPurge = users.map((u) => ({
      ...u,
      purgeAt: u.deletedAt ? new Date(new Date(u.deletedAt).getTime() + 7 * 24 * 60 * 60 * 1000) : null,
    }));
    res.json(withPurge);
  } catch (error) {
    console.log("Error fetching deleted users", error);
    res.status(500).json({ error: "Failed to fetch deleted users" });
  }
}

exports.deleteUserAccount = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const userEmail = user.email;
    const userName = user.fullName;
    const wasReviewer = user.role === "reviewer";

    // Permanently delete user from DB
    await User.findByIdAndDelete(id);

    // If they were a reviewer, reassign any UNDER_REVIEW blogs back to pending
    if (wasReviewer) {
      await Blog.updateMany(
        { currentReviewer: userEmail, status: "UNDER_REVIEW" },
        { $set: { currentReviewer: "", status: "PENDING_REVIEW", lastUpdatedAt: new Date() } }
      );
    }

    const receiver = req.query.useremail || userEmail;
    const subject = "Your BloggerSpace account has been removed";
    const html = `
      <div class="content">
        <h2>Account removed</h2>
        <p>Your BloggerSpace account has been permanently removed by an admin.</p>
        <div class="warn-box">If you believe this was done in error or have any questions, please contact us at <a href="mailto:${process.env.EMAIL}">${process.env.EMAIL}</a>.</div>
      </div>
    `;

    res.json({ message: "User account permanently deleted." });
    await sendEmail(receiver, subject, html);
  } catch (error) {
    console.log("Error when deleting user account by admin", error);
    res.status(500).json({ error: "Failed to delete user account" });
  }
};

exports.deactivateUserAccount = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.status === "INACTIVE") return res.status(400).json({ error: "Account is already deactivated." });
    user.status = "INACTIVE";
    await user.save();
    res.json({ message: "Account deactivated successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to deactivate account" });
  }
};

exports.reactivateUserAccount = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.status === "ACTIVE") return res.status(400).json({ error: "Account is already active." });
    user.status = "ACTIVE";
    await user.save();
    res.json({ message: "Account reactivated successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to reactivate account" });
  }
};

// Community
exports.getCommunityPosts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const q = (req.query.search || "").trim();
  const searchFilter = q
    ? { $or: [
        { communityPostTopic: { $regex: q, $options: "i" } },
        { communityPostCategory: { $regex: q, $options: "i" } },
      ] }
    : {};
  try {
    const posts = await Community.find(searchFilter).skip(skip).limit(limit)
      .sort({ createdAt: -1 })
      .populate("communityPostAuthor")
      .exec();

    // console.log(typeof posts[1].communityPostContent);

    for (let i = 0; i < posts.length; i++) {
      const compressedContentBuffer = Buffer.from(posts[i].communityPostContent, "base64");
      const decompressedContent = pako.inflate(compressedContentBuffer, {
        to: "string",
      });
      posts[i].communityPostContent= decompressedContent
    }
 
    const total = await Community.countDocuments(searchFilter);
    
    res.json({
      posts, total, page, pages: Math.ceil(total/limit)
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteCommunityPost = async (req, res) => {
  const { id } = req.params;
  try {
    await Community.findByIdAndDelete(id);

    const receiver = process.env.EMAIL;
    const subject = `Community post ${id} deleted`;
    const html = `
          <div class="content">
            <h2>Hi Admin,</h2>
            <p>Community post deleted successfully.</p>
            <p>Post deleted ${id}</p>
          </div>
          `;

    res.json({ message: "post deleted by admin successfully" });
    await sendEmail(receiver, subject, html);
  } catch (error) {
    console.log("Error when deleting post by admin");
  }
};


// Admin Blogs
// New Blog
exports.adminNewBlog = async (req, res) => {
  try {
    const { slug, title, content, category, tags } = req.body;

    // Compress the content before saving it
    const compressedContentBuffer = pako.deflate(content, { to: "string" });
    const compressedContent = Buffer.from(compressedContentBuffer).toString(
      "base64"
    );

    // Assuming `content` is the original content string
    console.log(
      "Original content size:",
      Buffer.byteLength(content, "utf8") / 1024,
      " KB"
    );
    // Log the size of the compressed content
    console.log(
      "Compressed content size:",
      Buffer.byteLength(compressedContent, "utf8") / 1024,
      " KB"
    );

    const newPost = new Blog({
      slug,
      title,
      content: compressedContent,
      category,
      authorDetails: req.query.userId,
      // lastUpdatedAt: Date.now(),
      lastUpdatedAt: new Date(new Date().getTime() + 330 * 60000),
      tags,
      status: "ADMIN_PUBLISHED"
    });
    const savedBlog = await newPost.save();
    generateSitemap().catch((err) => console.error("Sitemap update failed:", err));

    res.json(savedBlog);
  } catch (error) {
    console.error("Error creating new post by admin:", error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the post by admin" });
  }
};

exports.adminSaveAsDraftBlog= async (req, res)=>{
  try {
    const { slug, title, content, category, tags } = req.body;

    // Compress the content before saving it
    const compressedContentBuffer = pako.deflate(content, { to: "string" });
    const compressedContent = Buffer.from(compressedContentBuffer).toString(
      "base64"
    );

    console.log(
      "Original content size:",
      Buffer.byteLength(content, "utf8") / 1024,
      " KB"
    );
    // Log the size of the compressed content
    console.log(
      "Compressed content size:",
      Buffer.byteLength(compressedContent, "utf8") / 1024,
      " KB"
    );

    const blog = await Blog.findById({
    _id: new mongoose.Types.ObjectId(req.body.id),
  });
    if(blog){
        blog.slug= slug;
        blog.title=title;
        blog.content = compressedContent;
        blog.category= category;
        blog.lastUpdatedAt = new Date(new Date().getTime() + 330 * 60000);
        blog.tags= tags;
        blog.status="ADMIN_DRAFT";
        await blog.save();

      return res.json(blog);
    }

    const newPost = new Blog({
      slug,
      title,
      content: compressedContent,
      category,
      authorDetails: req.query.userId,
      status: "ADMIN_DRAFT",
      lastUpdatedAt: new Date(new Date().getTime() + 330 * 60000),
      tags,
    });
    const savedBlog = await newPost.save();

    res.json(savedBlog);
  } catch (error) {
    console.error("Error creating new post by admin:", error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the post by admin" });
  }
}

// Draft Blogs:

exports.adminDraftBlogs = async (req, res) => {
  try {
    // List view only — drop heavy content/comments, sort newest-first.
    const blogs = await Blog.find({
      status: "ADMIN_DRAFT",
    })
      .select("-content -comments")
      .sort({ lastUpdatedAt: -1 })
      .lean();

    res.json(blogs);
  } catch (error) {
    console.error("Error searching draft blogs:", error);
    res
      .status(500)
      .json({ error: "An error occurred while searching draft blogs." });
  }
};

// Admin Published
exports.adminPublishedBlogs = async (req, res) => {
  try {
    // List view only — drop heavy content/comments, sort newest-first.
    const blogs = await Blog.find({
      status: "ADMIN_PUBLISHED",
    })
      .select("-content -comments")
      .sort({ lastUpdatedAt: -1 })
      .lean();

    res.json(blogs);
  } catch (error) {
    console.error("Error searching published blogs:", error);
    res
      .status(500)
      .json({ error: "An error occurred while searching published blogs." });
  }
};

// Admin Discarded
exports.adminDiscardedBlogs = async (req, res) => {
  try {
    // List view only — drop heavy content/comments, sort newest-first.
    const blogs = await Blog.find({
      status: "ADMIN_DISCARDED",
    })
      .select("-content -comments")
      .sort({ lastUpdatedAt: -1 })
      .lean();

    res.json(blogs);
  } catch (error) {
    console.error("Error searching discarded blogs:", error);
    res
      .status(500)
      .json({ error: "An error occurred while searching discarded blogs." });
  }
};

exports.adminWrittenDiscardBlogFromDB = async (req, res) => {
  const { id } = req.params;
  const adminId = req.query.userId;
  try {
    const blog = await Blog.findById({ _id: new mongoose.Types.ObjectId(id) });
    if (!blog) return res.status(404).json({ error: "Blog not found" });

    await deductGemsForBlog(blog, adminId);

    blog.status = "ADMIN_DISCARDED";
    await blog.save();
    res.json({ message: "Blog discarded successfully" });
  } catch (error) {
    console.error("Error discarding blogs:", error);
    res.status(500).json({ error: "An error occurred while discarding blogs." });
  }
};


exports.adminBlogEdit = async (req, res) => {
  try {
    const blog = await Blog.findById({
      _id: new mongoose.Types.ObjectId(req.params.id),
    }).populate("authorDetails").exec();

    if (!blog) {
      console.error("The requested blog can't open in editable mode because it doesn't exist. ")
      return res.status(404).json({ error: "blog not found" });
    }

    // Decompress the content before displaying it
    const compressedContentBuffer = Buffer.from(blog.content, "base64");
    const decompressedContent = pako.inflate(compressedContentBuffer, { to: "string" });

    // Transform reviewedBy: filter out Admin entries, look up reviewer names
    const rawReviewedBy = blog.reviewedBy || [];
    const reviewerIds = rawReviewedBy
      .filter((r) => r?.ReviewedBy?.Role !== "Admin" && r?.ReviewedBy?.Id)
      .map((r) => r.ReviewedBy.Id);

    const reviewerUsers = reviewerIds.length
      ? await User.find({ _id: { $in: reviewerIds } }, "fullName _id").lean()
      : [];

    const nameMap = new Map(reviewerUsers.map((r) => [r._id.toString(), r.fullName]));

    const blogObj = blog.toObject();
    blogObj.content = decompressedContent;
    blogObj.reviewedBy = rawReviewedBy
      .filter((r) => r?.ReviewedBy?.Role !== "Admin" && r?.ReviewedBy?.Id)
      .map((r) => ({
        reviewerId: r.ReviewedBy.Id.toString(),
        reviewerName: nameMap.get(r.ReviewedBy.Id.toString()),
      }));

    // Review history timeline — every action (incl. Admin), newest entries last
    // as stored. Excludes the heavy `Revision` snapshot. Names resolved for all
    // entries; Admin entries fall back to their email/role label.
    const allHistoryIds = rawReviewedBy.filter((r) => r?.ReviewedBy?.Id).map((r) => r.ReviewedBy.Id);
    const allHistoryUsers = allHistoryIds.length
      ? await User.find({ _id: { $in: allHistoryIds } }, "fullName _id").lean()
      : [];
    const historyNameMap = new Map(allHistoryUsers.map((u) => [u._id.toString(), u.fullName]));
    blogObj.reviewHistory = rawReviewedBy.map((r) => {
      const id = r?.ReviewedBy?.Id?.toString();
      return {
        reviewerName: (id && historyNameMap.get(id)) || r?.ReviewedBy?.Email || "Unknown",
        role: r?.ReviewedBy?.Role || "",
        action: r?.statusTransition || "",
        rating: typeof r?.Rating === "number" ? r.Rating : null,
        remarks: r?.Remarks || "",
        date: r?.LastUpdatedAt || null,
      };
    });

    console.debug("Blog opened in Edit mode. Blog title: " + blog.title);
    res.json(blogObj);
  } catch (error) {
    console.error("Error fetching blog blog:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.adminSaveEditedBlog = async (req, res) => {
  try {
    // const { id } = req.params;
    const { slug, title, content, category, tags } = req.body;

    // Find the blog by ID
    const blog = await Blog.findById({
      _id: new mongoose.Types.ObjectId(req.params.id),
    });

    if (!blog) {
      console.error("The blog: "+title+ " is not saved because it doesn't exist.")
      return res.status(404).json({ error: "blog not found" });
    }

    // Compress the content before saving it
    const compressedContentBuffer = pako.deflate(content, { to: "string" });
    const compressedContent = Buffer.from(compressedContentBuffer).toString(
      "base64"
    );

    // Update the blog fields
    blog.slug = slug;
    blog.title = title;
    blog.content = compressedContent;
    blog.category = category;
    if (tags) blog.tags = tags;
    blog.status = "ADMIN_PUBLISHED";
    blog.lastUpdatedAt = new Date(new Date().getTime() + 330 * 60000);

    // Save the updated blog
    await blog.save();
    generateSitemap().catch((err) => console.error("Sitemap update failed:", err));
    // On-demand ISR: refresh the edited/published admin blog + listing + home.
    revalidate({ slug: blog.slug, paths: ["/adminblogs", "/"] });
    console.debug("Blog updated successfully. Title: "+ blog.title);

    res.json({ message: "blog updated successfully" });
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Newsletter
exports.sendNewsletter = async (req, res) => {
  try {
    const { selectedUsers, subject, message } = req.body;
    const adminId = req.query.userId;

    selectedUsers.forEach(async (receiver) => {
      await sendEmail(receiver.value, subject, `<div class="content">${message}</div>`);
    });
    await sendEmail(process.env.EMAIL, subject, message);

    // Persist newsletter for history tracking
    await Newsletter.create({
      subject,
      message,
      recipients: selectedUsers.map((u) => ({ email: u.value, name: u.label })),
      recipientCount: selectedUsers.length,
      sentBy: adminId || null,
    });

    res.json({ message: "Mail sent successfully!!" });
  } catch (error) {
    console.error("Error sending emails...", error);
    res.status(500).json({ error: "Error sending emails..." });
  }
};

exports.getNewsletterHistory = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip  = (page - 1) * limit;
    const [newsletters, total] = await Promise.all([
      Newsletter.find({}).sort({ sentAt: -1 }).skip(skip).limit(limit).lean(),
      Newsletter.countDocuments({}),
    ]);
    res.json({ newsletters, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Error fetching newsletter history:", error);
    res.status(500).json({ error: "Failed to fetch newsletter history" });
  }
};

exports.updateSitemapXML = async (req, res) => {
  try {
    await generateSitemap();
    
    res.status(200).json({ message: "sitemap file updated!!" });
  } catch (error) {
    console.error("Error sending emails...", error);
    res.status(500).json({ error: "Error updating sitemap file..." });
  }
};


exports.downloadExcelReport = async (req,res)=>{
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Report');

  // Add some headers to the Excel file
  worksheet.columns = [
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Age', key: 'age', width: 10 },
    { header: 'Email', key: 'email', width: 30 },
  ];

  // Sample data to populate in the report
  const data = [
    { name: 'John Doe', age: 29, email: 'johndoe@example.com' },
    { name: 'Jane Smith', age: 34, email: 'janesmith@example.com' },
    // add more data as required
  ];

  // Add rows to the worksheet
  worksheet.addRows(data);

  // Create a buffer to store the Excel data
  const buffer = await workbook.xlsx.writeBuffer();

  // Sending mail to Admin
  const receiver = process.env.EMAIL;
  const subject = `Excel Report generated at ${new Date()} `;
  const html = `
<div class="content">
  <h2>Hi Admin</h2>
  <p>Please find the attached Excel report..</p>
 </div>
  `;
  const attachments= [
    {
      filename: 'report.xlsx',
      content: buffer,
      encoding: 'base64', // Make sure content is correctly encoded
    },
  ];

  sendEmail(receiver, subject, html, attachments)
    .then((response) => {
      console.log(`Email sent to ${receiver}:`, response);
      // Handle success
    })
    .catch((error) => {
      console.error("Error sending email:", error);
      // Handle error
    });

  // Set the response header to indicate it's a downloadable Excel file
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="report.xlsx"');

  // Write the Excel file to the response
  await workbook.xlsx.write(res);
  res.end();
}

exports.downloadPDFReport= async (req, res)=>{
  const doc = new PDFDocument();

  // res.setHeader('Content-Type', 'application/pdf');
  // res.setHeader('Content-Disposition', 'attachment; filename="report.pdf"');

  // Pipe the PDF to the response
  doc.pipe(res);

  // Add content to the PDF
  doc.fontSize(25).text('Interactive Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(14).text('Here is a sample report:');
  doc.text('Name: John Doe');
  doc.text('Age: 29');
  doc.text('Email: johndoe@example.com');

  // Create buffer to download pdf report
  let pdfBuffer = [];
  doc.on('data', (chunk) => pdfBuffer.push(chunk));
  doc.on('end', () => {
    pdfBuffer = Buffer.concat(pdfBuffer);

      // Sending mail to Admin
  const receiver = process.env.EMAIL;
  const subject = `PDF Report generated at ${new Date()} `;
  const html = `
  <div class="content">
    <h2>Hi Admin</h2>
    <p>Please find the attached PDF report..</p>
  </div>
  `;
  const attachments= [
    {
      filename: 'report.pdf',
      content: pdfBuffer,
      encoding: 'base64', // Make sure content is correctly encoded
    },
  ];

  sendEmail(receiver, subject, html, attachments)
    .then((response) => {
      console.log(`Email sent to ${receiver}:`, response);
      // Handle success
    })
    .catch((error) => {
      console.error("Error sending email:", error);
      // Handle error
    });
  })

  // Finalize the PDF and end the response
  doc.end();
}

exports.adminGetInfo = async (req, res) => {
  try {
    const adminId = req.query.userId;
    const admin = await Admin.findById(adminId).select("-password");
    if (!admin) return res.status(404).json({ error: "Admin not found" });
    res.json({
      _id: admin._id,
      fullName: admin.fullName,
      userName: admin.userName,
      email: admin.email,
      profilePicture: admin.profilePicture,
      isVerified: admin.isVerified,
      role: admin.role,
      createdAt: admin.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch admin info" });
  }
};

exports.adminUpdateProfile = async (req, res) => {
  try {
    const adminId = req.query.userId;
    const { fullName, userName } = req.body;
    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).json({ error: "Admin not found" });

    if (userName && userName !== admin.userName) {
      const taken = await Admin.findOne({ userName, _id: { $ne: adminId } });
      if (taken) return res.status(400).json({ message: "Username already taken." });
    }

    if (fullName) admin.fullName = fullName;
    if (userName) admin.userName = userName;
    await admin.save();

    const adminDetails = {
      _id: admin._id,
      fullName: admin.fullName,
      userName: admin.userName,
      email: admin.email,
      profilePicture: admin.profilePicture,
      isVerified: admin.isVerified,
      role: admin.role,
      createdAt: admin.createdAt,
    };
    res.json({ message: "Profile updated.", adminDetails });
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile" });
  }
};

exports.adminUploadProfilePicture = async (req, res) => {
  try {
    const adminId = req.query.userId;
    const profilePicture = req.files && req.files.find((f) => f.fieldname === "profilePicture");
    if (!profilePicture) return res.status(400).json({ error: "No profile picture uploaded" });

    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).json({ error: "Admin not found" });

    const ext = profilePicture.mimetype === "image/png" ? "png"
      : profilePicture.mimetype === "image/webp" ? "webp"
      : profilePicture.mimetype === "image/gif" ? "gif"
      : "jpg";
    const cdnUrl = await uploadImageToGitHub(
      profilePicture.buffer,
      `profile-pictures/admin-${adminId}.${ext}`,
    );

    admin.profilePicture = cdnUrl;
    await admin.save();
    res.json({ message: "Profile picture updated.", profilePicture: cdnUrl });
  } catch (error) {
    res.status(500).json({ error: "Failed to upload profile picture" });
  }
};

exports.addBlogToAdminSaved = async (req, res) => {
  try {
    const adminId = req.query.userId;
    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).json({ error: "Admin not found" });

    const { title, slug, category, tags } = req.body;
    if (admin.savedBlogs.some((b) => b.slug === slug)) {
      return res.status(400).json({ message: "Already saved this blog" });
    }
    admin.savedBlogs.push({ title, slug, category, tags });
    await admin.save();
    res.json({ message: "Added to saved blogs successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to add to saved blogs" });
  }
};

exports.removeBlogFromAdminSaved = async (req, res) => {
  try {
    const adminId = req.query.userId;
    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).json({ error: "Admin not found" });

    admin.savedBlogs = admin.savedBlogs.filter((b) => b.slug !== req.params.blogSlug);
    await admin.save();
    res.json({ message: "Removed from saved blogs successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove from saved blogs" });
  }
};

exports.getAdminSavedBlogs = async (req, res) => {
  try {
    const adminId = req.query.userId;
    const admin = await Admin.findById(adminId).select("savedBlogs");
    if (!admin) return res.status(404).json({ error: "Admin not found" });
    res.json(admin.savedBlogs);
  } catch (error) {
    res.status(500).json({ error: "Error getting saved blogs" });
  }
};
// Temporary file — contents will be appended to adminController.js

// ─── Gems helper ─────────────────────────────────────────────────────────────
async function deductGemsForBlog(blog, adminId) {
  if (!blog.gems || !blog.gems.awarded) return;
  const ops = [];
  if (blog.gems.authorGems > 0 && blog.authorDetails) {
    ops.push(
      User.findByIdAndUpdate(blog.authorDetails, { $inc: { gems: -blog.gems.authorGems } }),
      GemsTransaction.create({
        userId: blog.authorDetails,
        blogId: blog._id, blogTitle: blog.title, blogSlug: blog.slug,
        type: "DEDUCT", role: "AUTHOR", amount: blog.gems.authorGems,
        awardedBy: adminId || blog.gems.awardedBy,
      }),
    );
  }
  // Support multi-reviewer awards array (new) with fallback to legacy single reviewer
  const reviewerAwards = blog.gems.reviewerAwards && blog.gems.reviewerAwards.length > 0
    ? blog.gems.reviewerAwards
    : (blog.gems.reviewerGems > 0 && blog.gems.reviewerUserId
        ? [{ userId: blog.gems.reviewerUserId, gems: blog.gems.reviewerGems }]
        : []);
  for (const award of reviewerAwards) {
    if (award.gems > 0 && award.userId) {
      ops.push(
        User.findByIdAndUpdate(award.userId, { $inc: { gems: -award.gems } }),
        GemsTransaction.create({
          userId: award.userId,
          blogId: blog._id, blogTitle: blog.title, blogSlug: blog.slug,
          type: "DEDUCT", role: "REVIEWER", amount: award.gems,
          awardedBy: adminId || blog.gems.awardedBy,
        }),
      );
    }
  }
  await Promise.all(ops);
  blog.gems = {
    authorGems: 0, reviewerGems: 0, reviewerUserId: null,
    reviewerAwards: [], awarded: false, awardedAt: null, awardedBy: null,
  };
}

// ─── Gems award ───────────────────────────────────────────────────────────────
exports.awardGems = async (req, res) => {
  const { blogId } = req.params;
  // reviewerAwards: [{ userId, gems }] — one entry per reviewer
  const { authorGems, reviewerAwards } = req.body;
  const adminId = req.query.userId;
  try {
    const blog = await Blog.findById(blogId).populate("authorDetails", "email fullName userName");
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    if (!["PUBLISHED", "ADMIN_PUBLISHED"].includes(blog.status))
      return res.status(400).json({ error: "Gems can only be awarded to published blogs" });
    if (blog.gems && blog.gems.awarded)
      return res.status(409).json({ error: "Gems already awarded for this blog" });

    const aGems = Math.max(0, parseInt(authorGems) || 0);
    const validReviewerAwards = (Array.isArray(reviewerAwards) ? reviewerAwards : [])
      .map((a) => ({ userId: a.userId, gems: Math.max(0, parseInt(a.gems) || 0) }))
      .filter((a) => a.userId && a.gems > 0);

    // ── Per-blog cap enforcement (Phase 2) ──
    // Caps apply to the cumulative gems on this blog. Since `awardGems` is the
    // first-time award (gated by `blog.gems.awarded === false` above), the cap
    // check is simply `aGems <= authorCap` and `each reviewer.gems <= reviewerCap`.
    const { authorCap, reviewerCap } = await loadPerBlogCaps();
    if (aGems > authorCap) {
      return res.status(400).json({
        error: `Author gems exceed cap (${aGems} > ${authorCap}). Max ${authorCap} gems per blog for the author.`,
      });
    }
    const overReviewer = validReviewerAwards.find((a) => a.gems > reviewerCap);
    if (overReviewer) {
      return res.status(400).json({
        error: `Reviewer gems exceed cap (${overReviewer.gems} > ${reviewerCap}). Max ${reviewerCap} gems per blog per reviewer.`,
      });
    }

    const ops = [];

    if (aGems > 0 && blog.authorDetails) {
      ops.push(
        User.findByIdAndUpdate(blog.authorDetails._id, { $inc: { gems: aGems } }),
        GemsTransaction.create({
          userId: blog.authorDetails._id,
          blogId: blog._id, blogTitle: blog.title, blogSlug: blog.slug,
          type: "AWARD", role: "AUTHOR", amount: aGems, awardedBy: adminId,
        }),
      );
    }
    for (const award of validReviewerAwards) {
      ops.push(
        User.findByIdAndUpdate(award.userId, { $inc: { gems: award.gems } }),
        GemsTransaction.create({
          userId: award.userId,
          blogId: blog._id, blogTitle: blog.title, blogSlug: blog.slug,
          type: "AWARD", role: "REVIEWER", amount: award.gems, awardedBy: adminId,
        }),
      );
    }
    await Promise.all(ops);

    const totalReviewerGems = validReviewerAwards.reduce((s, a) => s + a.gems, 0);
    blog.gems = {
      authorGems: aGems,
      reviewerGems: totalReviewerGems,
      reviewerUserId: validReviewerAwards[0]?.userId || null,
      reviewerAwards: validReviewerAwards,
      awarded: true,
      awardedAt: new Date(new Date().getTime() + IST_OFFSET * 60000),
      awardedBy: adminId,
    };
    await blog.save();

    // Send email to author
    if (aGems > 0 && blog.authorDetails && blog.authorDetails.email) {
      sendEmail(
        blog.authorDetails.email,
        `You earned ${aGems} gems on BloggerSpace!`,
        `<div class="content"><h2>Congratulations, ${blog.authorDetails.fullName || blog.authorDetails.userName}!</h2><p>Admin has awarded you <b>${aGems} gems</b> for your published blog: <b>${blog.title}</b>.</p><p>Keep writing quality content to earn more!</p></div>`
      ).catch(() => {});
    }
    // Send email to each reviewer
    for (const award of validReviewerAwards) {
      User.findById(award.userId).then((reviewer) => {
        if (reviewer && reviewer.email) {
          sendEmail(
            reviewer.email,
            `You earned ${award.gems} gems on BloggerSpace!`,
            `<div class="content"><h2>Well done, ${reviewer.fullName || reviewer.userName}!</h2><p>Admin has awarded you <b>${award.gems} gems</b> for reviewing the blog: <b>${blog.title}</b>.</p></div>`
          ).catch(() => {});
        }
      });
    }

    res.json({ message: "Gems awarded successfully", gems: blog.gems });
  } catch (error) {
    console.error("Error awarding gems:", error);
    res.status(500).json({ error: "Failed to award gems" });
  }
};

exports.getGemsTransactions = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip  = (page - 1) * limit;
    const filterUserId = req.query.filterUserId || null;
    // Optional source filter (e.g. "ADMIN_GRANT" to show only admin grants).
    // Accepts comma-separated list: "ADMIN_GRANT,ADMIN_GRANT_REVERSE".
    const sourceParam = req.query.source || null;
    const filter = {};
    if (filterUserId) filter.userId = new mongoose.Types.ObjectId(filterUserId);
    if (sourceParam) {
      const sources = sourceParam.split(",").map((s) => s.trim()).filter(Boolean);
      filter.source = sources.length > 1 ? { $in: sources } : sources[0];
    }
    const [transactions, total] = await Promise.all([
      GemsTransaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
        .populate("userId", "fullName userName email")
        .populate("awardedBy", "fullName userName email")
        .lean(),
      GemsTransaction.countDocuments(filter),
    ]);
    res.json({ transactions, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

// ─── Admin gem grant (Phase 3) ────────────────────────────────────────────────
// Admin grants gems to a specific user with an appreciation note. Email sent.
// Validates amount falls within [minGrantGems, maxGrantGems] from AdminConfig.
const { awardGems: ledgerAward, reverseTransaction: ledgerReverse } = require("../../utils/gemsLedger");

exports.grantGems = async (req, res) => {
  const { userId: targetUserId } = req.params;
  const { amount, note } = req.body;
  const adminId = req.query.userId;
  try {
    const amt = parseInt(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ error: "amount must be a positive integer" });
    }

    const cfg = await AdminConfig.findOne({}).select("minGrantGems maxGrantGems").lean();
    const minGrant = cfg?.minGrantGems ?? 0;
    const maxGrant = cfg?.maxGrantGems ?? 100;
    if (amt < minGrant || amt > maxGrant) {
      return res.status(400).json({
        error: `Amount must be between ${minGrant} and ${maxGrant} gems`,
      });
    }

    const targetUser = await User.findById(targetUserId).select("fullName userName email status").lean();
    if (!targetUser) return res.status(404).json({ error: "User not found" });
    if (targetUser.status === "INACTIVE") {
      return res.status(400).json({ error: "Cannot grant gems to an inactive user" });
    }

    const cleanNote = (note ?? "").toString().trim().slice(0, 500);

    const { balance, txn } = await ledgerAward({
      userId: targetUserId,
      amount: amt,
      source: "ADMIN_GRANT",
      awardedBy: adminId,
      note: cleanNote,
    });

    // Send appreciation email (best-effort — log failure but don't fail request)
    if (targetUser.email) {
      sendEmail(
        targetUser.email,
        `You received ${amt} gems on BloggerSpace!`,
        `<div class="content">
          <h2>You earned ${amt} gems!</h2>
          <p>Hi ${targetUser.fullName || targetUser.userName || "there"},</p>
          <p>Admin has awarded you <b>${amt} gems</b> on BloggerSpace.</p>
          ${cleanNote ? `<p style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px;margin:16px 0;"><b>Note from admin:</b><br/>${escapeHtml(cleanNote)}</p>` : ""}
          <p>Your new balance: <b>${balance} gems</b>. Keep contributing to earn more!</p>
        </div>`
      ).catch((e) => console.error("[grantGems] email send failed:", e?.message));
    }

    res.status(201).json({
      message: "Gems granted successfully",
      balance,
      transaction: txn,
    });
  } catch (error) {
    console.error("Error granting gems:", error);
    res.status(500).json({ error: error.message || "Failed to grant gems" });
  }
};

// Reverse a previous ADMIN_GRANT within the configured reversal window.
// Creates an ADMIN_GRANT_REVERSE ledger entry and decrements the user balance.
exports.reverseGrant = async (req, res) => {
  const { txnId } = req.params;
  const { reason } = req.body;
  const adminId = req.query.userId;
  try {
    const original = await GemsTransaction.findById(txnId).lean();
    if (!original) return res.status(404).json({ error: "Transaction not found" });
    if (original.source !== "ADMIN_GRANT") {
      return res.status(400).json({ error: "Only admin grants can be reversed" });
    }
    if (original.reversedByTxnId) {
      return res.status(409).json({ error: "This grant has already been reversed" });
    }

    const cfg = await AdminConfig.findOne({}).select("grantReverseWindowHours").lean();
    const windowHours = cfg?.grantReverseWindowHours ?? 24;
    const ageMs = Date.now() - new Date(original.createdAt).getTime();
    if (ageMs > windowHours * 60 * 60 * 1000) {
      return res.status(400).json({
        error: `Reversal window (${windowHours}h) has passed for this grant`,
      });
    }

    const { balance, reverseTxn } = await ledgerReverse({
      txnId,
      reversedBy: adminId,
      reason: (reason ?? "").toString().trim().slice(0, 500),
    });

    res.json({
      message: "Grant reversed successfully",
      balance,
      reverseTransaction: reverseTxn,
    });
  } catch (error) {
    console.error("Error reversing grant:", error);
    res.status(500).json({ error: error.message || "Failed to reverse grant" });
  }
};

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// ─── Blog scoring (Phase 5) ───────────────────────────────────────────────────
// Admin sets a 0..maxBlogScore value on a blog. We then recompute the author's
// User.creatorScore from scratch (sum of blogScore across their published blogs)
// so the cached aggregate stays correct regardless of edge cases (a previously
// scored blog being deleted, unpublished, status changed, etc.).
exports.setBlogScore = async (req, res) => {
  const { id } = req.params;
  const { score } = req.body;
  const adminId = req.query.userId;

  try {
    const s = parseInt(score);
    if (!Number.isFinite(s) || s < 0) {
      return res.status(400).json({ error: "score must be a non-negative integer" });
    }

    const cfg = await AdminConfig.findOne({}).select("maxBlogScore").lean();
    const maxBlogScore = cfg?.maxBlogScore ?? 10;
    if (s > maxBlogScore) {
      return res.status(400).json({
        error: `Score exceeds cap (${s} > ${maxBlogScore})`,
      });
    }

    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    if (!["PUBLISHED", "ADMIN_PUBLISHED"].includes(blog.status)) {
      return res.status(400).json({
        error: "Scores can only be assigned to published blogs",
      });
    }

    blog.blogScore = s;
    blog.blogScoreUpdatedAt = new Date(new Date().getTime() + IST_OFFSET * 60000);
    blog.blogScoreUpdatedBy = adminId;
    await blog.save();

    // Recompute creatorScore from scratch (authoritative) — covers the case
    // where this is a re-score, a previously deleted blog adjusted things, etc.
    const authorId = blog.authorDetails;
    let newCreatorScore = 0;
    if (authorId) {
      const agg = await Blog.aggregate([
        {
          $match: {
            authorDetails: new mongoose.Types.ObjectId(authorId.toString()),
            status: { $in: ["PUBLISHED", "ADMIN_PUBLISHED"] },
          },
        },
        { $group: { _id: null, sum: { $sum: { $ifNull: ["$blogScore", 0] } } } },
      ]);
      newCreatorScore = agg[0]?.sum ?? 0;
      const author = await User.findByIdAndUpdate(
        authorId,
        { creatorScore: newCreatorScore },
        { new: true },
      ).select("userName");
      // Author's public creator score + the blog's score changed — refresh both.
      revalidate({ slug: blog.slug, username: author?.userName });
    }

    res.json({
      message: "Blog score updated",
      blogScore: blog.blogScore,
      creatorScore: newCreatorScore,
    });
  } catch (error) {
    console.error("Error setting blog score:", error);
    res.status(500).json({ error: "Failed to set blog score" });
  }
};

// ─── Reviewer scoring (Phase 6) ──────────────────────────────────────────────
// Admin assigns a quality score to a reviewer for their review of a specific
// blog. One score per (blog, reviewer) pair — re-scoring upserts. After each
// change the reviewer's User.reviewerScore{Avg,Count,Best} fields are
// recomputed from scratch via aggregation so drift is impossible.
exports.setReviewerScore = async (req, res) => {
  const { blogId, reviewerId } = req.params;
  const { score, note } = req.body;
  const adminId = req.query.userId;

  try {
    const s = parseInt(score);
    if (!Number.isFinite(s) || s < 0) {
      return res.status(400).json({ error: "score must be a non-negative integer" });
    }

    const cfg = await AdminConfig.findOne({}).select("maxBlogScore").lean();
    const maxBlogScore = cfg?.maxBlogScore ?? 10;
    if (s > maxBlogScore) {
      return res.status(400).json({
        error: `Score exceeds cap (${s} > ${maxBlogScore})`,
      });
    }

    // Confirm the reviewer actually reviewed this blog
    const blog = await Blog.findById(blogId).select("reviewedBy title").lean();
    if (!blog) return res.status(404).json({ error: "Blog not found" });

    const didReview = (blog.reviewedBy || []).some(
      (r) => r?.ReviewedBy?.Id?.toString() === reviewerId && r?.ReviewedBy?.Role !== "Admin",
    );
    if (!didReview) {
      return res.status(400).json({ error: "This reviewer did not review this blog" });
    }

    // Upsert the per-blog review score
    await ReviewScore.findOneAndUpdate(
      { blogId: new mongoose.Types.ObjectId(blogId), reviewerId: new mongoose.Types.ObjectId(reviewerId) },
      {
        score: s,
        note: (note || "").slice(0, 500),
        awardedBy: adminId,
        awardedAt: new Date(new Date().getTime() + IST_OFFSET * 60000),
      },
      { upsert: true, new: true },
    );

    // Recompute reviewer aggregate from scratch
    const agg = await ReviewScore.aggregate([
      { $match: { reviewerId: new mongoose.Types.ObjectId(reviewerId) } },
      {
        $group: {
          _id: null,
          sum:   { $sum: "$score" },
          count: { $sum: 1 },
          best:  { $max: "$score" },
        },
      },
    ]);
    const count = agg[0]?.count ?? 0;
    const avg   = count ? +(agg[0].sum / count).toFixed(1) : 0;
    const best  = agg[0]?.best ?? 0;

    const reviewer = await User.findByIdAndUpdate(
      reviewerId,
      { reviewerScoreAvg: avg, reviewerScoreCount: count, reviewerScoreBest: best },
      { new: true },
    ).select("userName");
    // Reviewer's public reviewer-score stats changed — refresh their profile.
    revalidate({ username: reviewer?.userName });

    res.json({
      message: "Reviewer score updated",
      reviewerScore: s,
      reviewerScoreAvg: avg,
      reviewerScoreCount: count,
    });
  } catch (error) {
    console.error("Error setting reviewer score:", error);
    res.status(500).json({ error: "Failed to set reviewer score" });
  }
};

// ─── Community comment deletion ───────────────────────────────────────────────
exports.deleteCommentFromPost = async (req, res) => {
  const { postId, commentId } = req.params;
  try {
    const post = await Community.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });
    const before = post.communityPostComments.length;
    post.communityPostComments = post.communityPostComments.filter(
      (c) => c._id.toString() !== commentId
    );
    if (post.communityPostComments.length === before)
      return res.status(404).json({ error: "Comment not found" });
    await post.save();
    res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
};

// ─── User content view ────────────────────────────────────────────────────────
exports.getUserContent = async (req, res) => {
  const { userId } = req.params;
  try {
    const [user, rawBlogs, communityPosts] = await Promise.all([
      User.findById(userId).select("fullName userName email profilePicture gems createdAt role isVerified reviewedBlogs").lean(),
      Blog.find({ authorDetails: userId })
        .select("title slug status category createdAt lastUpdatedAt gems reviewedBy")
        .sort({ createdAt: -1 }).lean(),
      Community.find({ communityPostAuthor: userId })
        .select("communityPostId communityPostSlug communityPostTopic communityPostCategory createdAt")
        .sort({ createdAt: -1 }).lean(),
    ]);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Fetch reviewed blog docs (gems + reviewedBy + author) for reviewed blogs tab
    const rawReviewed = user.reviewedBlogs || [];
    const reviewedBlogObjectIds = rawReviewed.filter((rb) => rb.BlogObjectId).map((rb) => rb.BlogObjectId);
    const [reviewedBlogDocs, existingReviewScores] = await Promise.all([
      reviewedBlogObjectIds.length
        ? Blog.find({ _id: { $in: reviewedBlogObjectIds } })
            .select("_id gems reviewedBy authorDetails")
            .populate("authorDetails", "fullName email")
            .lean()
        : Promise.resolve([]),
      // Fetch any existing scores this reviewer has for these blogs
      reviewedBlogObjectIds.length
        ? ReviewScore.find({ blogId: { $in: reviewedBlogObjectIds }, reviewerId: userId }).lean()
        : Promise.resolve([]),
    ]);

    // Collect ALL reviewer IDs from rawBlogs AND reviewedBlogDocs in one pass
    const allReviewerIdSet = new Set();
    [...rawBlogs, ...reviewedBlogDocs].forEach((b) => {
      (b.reviewedBy || []).forEach((r) => {
        const id = r?.ReviewedBy?.Id;
        if (id && r?.ReviewedBy?.Role !== "Admin") allReviewerIdSet.add(id.toString());
      });
    });
    const allReviewerObjectIds = [...allReviewerIdSet].map((id) => new mongoose.Types.ObjectId(id));
    const reviewerUsers = allReviewerObjectIds.length
      ? await User.find({ _id: { $in: allReviewerObjectIds } }, "fullName _id").lean()
      : [];
    const reviewerNameMap = new Map(reviewerUsers.map((r) => [r._id.toString(), r.fullName]));

    // Helper to transform raw reviewedBy array
    const transformReviewedBy = (raw) =>
      (raw || [])
        .filter((r) => r?.ReviewedBy?.Role !== "Admin" && r?.ReviewedBy?.Id)
        .map((r) => ({ reviewerId: r.ReviewedBy.Id.toString(), reviewerName: reviewerNameMap.get(r.ReviewedBy.Id.toString()) }));

    // Transform author blogs
    const blogs = rawBlogs.map((b) => ({ ...b, reviewedBy: transformReviewedBy(b.reviewedBy) }));

    // Build map for reviewed blog docs
    const reviewedBlogDataMap = new Map(
      reviewedBlogDocs.map((b) => [b._id.toString(), {
        gems: b.gems,
        authorDetails: b.authorDetails,
        blogReviewedBy: transformReviewedBy(b.reviewedBy),
      }]),
    );

    // Map of blogId → existing reviewer score for this reviewer (Phase 6)
    const reviewScoreMap = new Map(
      existingReviewScores.map((rs) => [rs.blogId.toString(), rs.score]),
    );

    // Attach gems + dialog data + reviewer score to each reviewed blog entry
    if (rawReviewed.length > 0) {
      user.reviewedBlogs = rawReviewed.map((rb) => {
        const blogId = rb.BlogObjectId?.toString();
        const blogData = blogId ? reviewedBlogDataMap.get(blogId) : null;
        const gems = blogData?.gems;
        let reviewerGems = 0;
        if (gems?.awarded) {
          if (gems.reviewerAwards?.length) {
            const award = gems.reviewerAwards.find((a) => a.userId?.toString() === userId);
            reviewerGems = award?.gems || 0;
          } else if (gems.reviewerUserId?.toString() === userId) {
            reviewerGems = gems.reviewerGems || 0;
          }
        }
        return {
          ...rb,
          blogId: blogId || null,
          reviewerGems,
          gemsAwarded: gems?.awarded || false,
          blogGems: gems
            ? {
                authorGems: gems.authorGems,
                reviewerAwards: gems.reviewerAwards,
                reviewerUserId: gems.reviewerUserId?.toString(),
                reviewerGems: gems.reviewerGems,
              }
            : null,
          blogAuthor: blogData?.authorDetails
            ? { fullName: blogData.authorDetails.fullName, email: blogData.authorDetails.email }
            : null,
          blogReviewedBy: blogData?.blogReviewedBy || [],
          // Phase 6 — existing admin-assigned review score for this entry (null = not yet scored)
          reviewScore: blogId != null ? (reviewScoreMap.get(blogId) ?? null) : null,
        };
      });
    }

    res.json({ user, blogs, communityPosts });
  } catch (error) {
    console.error("Error fetching user content:", error);
    res.status(500).json({ error: "Failed to fetch user content" });
  }
};

exports.adminForceDeleteBlog = async (req, res) => {
  const { blogId } = req.params;
  const id = blogId;
  const adminId = req.query.userId;
  try {
    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    await deductGemsForBlog(blog, adminId);
    await Blog.findByIdAndDelete(id);
    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Error force-deleting blog:", error);
    res.status(500).json({ error: "Failed to delete blog" });
  }
};

// ─── Gems update (edit already-awarded gems) ─────────────────────────────────
exports.updateGems = async (req, res) => {
  const { blogId } = req.params;
  const { authorGems, reviewerAwards } = req.body;
  const adminId = req.query.userId;
  try {
    const blog = await Blog.findById(blogId).populate("authorDetails", "email fullName userName");
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    if (!blog.gems || !blog.gems.awarded)
      return res.status(400).json({ error: "No gems awarded yet — use award first" });

    const newAuthorGems = Math.max(0, parseInt(authorGems) || 0);
    const newReviewerAwards = (Array.isArray(reviewerAwards) ? reviewerAwards : [])
      .map((a) => ({ userId: a.userId?.toString(), gems: Math.max(0, parseInt(a.gems) || 0) }))
      .filter((a) => a.userId);

    // ── Per-blog cap enforcement (Phase 2) ──
    // The cap applies to the resulting per-blog total. Since `Blog.gems.authorGems`
    // and each `reviewerAwards[i].gems` already represent cumulative per-blog
    // values (not deltas), validating the new value <= cap is enough.
    const { authorCap, reviewerCap } = await loadPerBlogCaps();
    if (newAuthorGems > authorCap) {
      return res.status(400).json({
        error: `Author gems exceed cap (${newAuthorGems} > ${authorCap}). Max ${authorCap} gems per blog for the author.`,
      });
    }
    const overReviewer = newReviewerAwards.find((a) => a.gems > reviewerCap);
    if (overReviewer) {
      return res.status(400).json({
        error: `Reviewer gems exceed cap (${overReviewer.gems} > ${reviewerCap}). Max ${reviewerCap} gems per blog per reviewer.`,
      });
    }

    const ops = [];

    // Author diff
    const authorDiff = newAuthorGems - (blog.gems.authorGems || 0);
    if (authorDiff !== 0 && blog.authorDetails) {
      ops.push(
        User.findByIdAndUpdate(blog.authorDetails._id, { $inc: { gems: authorDiff } }),
        GemsTransaction.create({
          userId: blog.authorDetails._id,
          blogId: blog._id, blogTitle: blog.title, blogSlug: blog.slug,
          type: authorDiff > 0 ? "AWARD" : "DEDUCT",
          role: "AUTHOR", amount: Math.abs(authorDiff), awardedBy: adminId,
        }),
      );
    }

    // Build old reviewer awards map
    const oldAwards = blog.gems.reviewerAwards?.length
      ? blog.gems.reviewerAwards
      : blog.gems.reviewerUserId && blog.gems.reviewerGems > 0
        ? [{ userId: blog.gems.reviewerUserId.toString(), gems: blog.gems.reviewerGems }]
        : [];
    const oldMap = new Map(oldAwards.map((a) => [a.userId.toString(), a.gems]));
    const newMap = new Map(newReviewerAwards.map((a) => [a.userId, a.gems]));
    const allIds = new Set([...oldMap.keys(), ...newMap.keys()]);

    for (const uid of allIds) {
      const diff = (newMap.get(uid) ?? 0) - (oldMap.get(uid) ?? 0);
      if (diff !== 0) {
        ops.push(
          User.findByIdAndUpdate(uid, { $inc: { gems: diff } }),
          GemsTransaction.create({
            userId: uid,
            blogId: blog._id, blogTitle: blog.title, blogSlug: blog.slug,
            type: diff > 0 ? "AWARD" : "DEDUCT",
            role: "REVIEWER", amount: Math.abs(diff), awardedBy: adminId,
          }),
        );
      }
    }

    await Promise.all(ops);

    const totalReviewerGems = newReviewerAwards.reduce((s, a) => s + a.gems, 0);
    blog.gems.authorGems = newAuthorGems;
    blog.gems.reviewerGems = totalReviewerGems;
    blog.gems.reviewerAwards = newReviewerAwards;
    blog.gems.reviewerUserId = newReviewerAwards[0]?.userId || blog.gems.reviewerUserId || null;
    blog.gems.awardedBy = adminId;
    blog.markModified("gems");
    await blog.save();

    res.json({ message: "Gems updated successfully", gems: blog.gems });
  } catch (error) {
    console.error("Error updating gems:", error);
    res.status(500).json({ error: "Failed to update gems" });
  }
};

// ─── Community post comments (admin view) ────────────────────────────────────
exports.getPostComments = async (req, res) => {
  const { postId } = req.params;
  try {
    const post = await Community.findById(postId)
      .populate("communityPostComments.replyCommunityPostAuthor", "fullName email userName")
      .lean();
    if (!post) return res.status(404).json({ error: "Post not found" });

    const comments = post.communityPostComments.map((c) => {
      let content = c.replyCommunityPostContent ?? "";
      try {
        const buf = Buffer.from(content, "base64");
        content = pako.inflate(buf, { to: "string" });
      } catch {}
      return {
        _id: c._id,
        content,
        author: c.replyCommunityPostAuthor,
        likes: c.replyCommunityPostLikes?.length ?? 0,
        createdAt: c.createdAt,
        repliesCount: c.replyCommunityPostComments?.length ?? 0,
      };
    });

    res.json({ postId, total: comments.length, comments });
  } catch (error) {
    console.error("Error fetching post comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
};

