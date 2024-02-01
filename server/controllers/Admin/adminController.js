const bcrypt = require("bcrypt");
const Admin= require("../../models/Admin");
const Reviewer= require("../../models/Reviewer");
const User= require("../../models/User");
const jwt = require("jsonwebtoken");
const Blog = require("../../models/Blog");
const mongoose = require("mongoose");
const pako = require("pako");
const sendEmail = require("../../services/mailer");
const generateSitemap = require('../../utils/generateSitemap');

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


exports.adminLogin=async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the user exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    if (!admin.isVerified) {
      return res.status(404).json({ message: "Admin not verified" });
    }

    // Compare the password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // You can generate a JWT token here if you want to implement authentication
    // Generate JWT token
    const token = jwt.sign(
      { currentuserId: admin._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h", // Token expiration time
      }
    );
    console.log(token);
    const adminDetails = {
      email: admin.email,
      fullName: admin.fullName,
      isVerified: admin.isVerified,
      role: admin.role
    };

    req.session.currentuserId = admin._id;
    req.session.currenttoken = token;
    req.session.currentemail = admin.email;
    req.session.currentrole = admin.role;
    console.log("userId: " + req.session.currentuserId);

    res.status(200).json({ message: "Login successful", token, adminDetails });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
}


exports.inReviewBlogs = async (req, res) => {
  try {
    if (req.session.currentemail) {
      // Query the Blog model for pending blogs assigned to the reviewer
      const pendingBlogs = await Blog.find({
        status: "IN_REVIEW",
      }).populate("authorDetails").exec();

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

    // Find the blog by ID
    const blog = await Blog.findById({
      _id: new mongoose.Types.ObjectId(req.params.id),
    });

    if (!blog) {
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
    blog.currentReviewer = "";
    blog.status = "PUBLISHED";
    // blog.reviewedBy.push(req.session.currentemail);
    blog.reviewedBy.push({
      // ReviewedBy: req.session.currentemail,
      ReviewedBy: {
        Id: new mongoose.Types.ObjectId(req.session.currentuserId),
        Email: req.session.currentemail,
        Role: req.session.currentrole,
      },
      Rating: rating,
      Remarks: reviewRemarks,
      statusTransition: "INREVIEW-PUBLISHED",
      LastUpdatedAt: new Date(new Date().getTime() + 330 * 60000),
    });
    // blog.lastUpdatedAt= Date.now();
    blog.lastUpdatedAt = new Date(new Date().getTime() + 330 * 60000);
    blog.tags=tags;

    // Save the updated blog
    await blog.save();
    await generateSitemap();

    res.json({ message: "blog updated successfully" });
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


exports.publishedBlogs = async (req, res) => {
  try {
    if (req.session.currentemail) {
      // Query the Blog model for pending blogs assigned to the reviewer
      const pendingBlogs = await Blog.find({
        status: "PUBLISHED",
      });

      res.json(pendingBlogs);
    } else {
      res.status(500).json({ error: "Failed to fetch PUBLISHED blogs" });
    }
  } catch (error) {
    console.error("Error fetching PUBLISHED blogs:", error);
    res.status(500).json({ error: "Failed to fetch PUBLISHED blogs" });
  }
}; 


exports.allReviewersFromDB = async (req, res) => {
  try {
    if (req.session.currentemail) {
      // Query the Blog model for pending blogs assigned to the reviewer
      const allReviewers = await Reviewer.find({isVerified:true});

      res.json(allReviewers);
    } else {
      res.status(500).json({ error: "Failed to fetch Reviewers" });
    }
  } catch (error) {
    console.error("Error fetching Reviewers:", error);
    res.status(500).json({ error: "Failed to fetch Reviewers" });
  }
}; 

exports.allPendingBlogsfromDB = async (req, res) => {
  try {
    if (req.session.currentemail) {
      // Query the Blog model for pending blogs assigned to the reviewer
      const allPendingBlogs = await Blog.find({
        status: "PENDING_REVIEW",
        currentReviewer: "",
      }).populate("authorDetails").exec();

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
    const subject = "New blog assigned to you for review";
    const html = `Hi,
              <p>New blog is assigned to you for review. Please review it within 3 days.\n
              Blog Title: ${blog.title}\n
              <b>BloggerSpace Reviewer panel:</b> ${process.env.REVIEWER_PANEL_URL}
              </p>
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
    if (req.session.currentemail) {
      // Query the Blog model for pending blogs assigned to the reviewer
      const allUnderReviewBlogs = await Blog.find({
        status: "UNDER_REVIEW",
      }).populate("authorDetails").exec();

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
    if (req.session.currentemail) {
      // Query the Blog model for pending blogs assigned to the reviewer
      const allDiscardQueueBlogs = await Blog.find({
        status: "DISCARD_QUEUE",
      });

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
    if (req.session.currentemail) {
      // Query the Blog model for pending blogs assigned to the reviewer
      const allAwaitingAuthorBlogs = await Blog.find({
        status: "AWAITING_AUTHOR",
      }).populate("authorDetails").exec();

      res.json(allAwaitingAuthorBlogs);
    } else {
      res.status(500).json({ error: "Failed to fetch AWAITING_AUTHOR Blogs" });
    }
  } catch (error) {
    console.error("Error fetching AWAITING_AUTHOR Blogs:", error);
    res.status(500).json({ error: "Failed to fetch AWAITING_AUTHOR Blogs" });
  }
}; 

exports.fetchAllVerifiedReviewers= async(req, res)=>{
  try {
    const allVerifiedReviewers = await Reviewer.find({ isVerified : true});
    res.json(allVerifiedReviewers);
  } catch (error) {
    console.log("Error fetching verified reviewers")
    res.status(500).json({ error: "Failed to fetch All verified reviewers" });
  }
}

exports.fetchAllPendingRequestReviewers= async(req, res)=>{
  try {
    const allPendingRequestReviewers = await Reviewer.find({ isVerified : false});
    res.json(allPendingRequestReviewers);
  } catch (error) {
    console.log("Error fetching pending request reviewers")
    res.status(500).json({ error: "Failed to fetch pending request reviewers" });
  }
}

exports.approveReviewerRequest= async(req, res)=>{
  const {id}= req.params;
  try {
    const reviewer= await Reviewer.findById(id);
    reviewer.isVerified=true;
    await reviewer.save();

    const receiver = reviewer.email;
    const subject = "Congratulations! Your request is approved";
    const html = `Hi ${reviewer.fullName},
              <p>Your reviewer request is approved. You can now review the assiged blogs. </p>
                `;

    res.json({ message: "Reviewer verified successfully" });
    await sendEmail(receiver, subject, html);
  } catch (error) {
    console.log("Error when approving request of the reviewer");
  }
}

exports.removeFromReviewerRole= async(req, res)=>{
  const {id}= req.params;
  try {
    const reviewer= await Reviewer.findById(id);
    reviewer.isVerified=false;
    await reviewer.save();

    const receiver = reviewer.email;
    const subject = "Sorry to say Goodbye!";
    const html = `Hi ${reviewer.fullName},
              <p>You are no longer reviewer now. If you wish to re-apply for reviewer then send reminder again to verify your account. </p>
                `;

    res.json({ message: "Reviewer removed successfully" });
    await sendEmail(receiver, subject, html);
  } catch (error) {
    console.log("Error when removing the reviewer");
  }
}

exports.fetchAllUsers= async(req, res)=>{
  try {
    const allUsers = await User.find({});
    res.json(allUsers);
  } catch (error) {
    console.log("Error fetching all users")
    res.status(500).json({ error: "Failed to fetch all users" });
  }
}

exports.deleteUserAccount = async (req, res) => {
  const { id } = req.params;
  try {
    await User.findByIdAndDelete(id);

    const receiver = req.body.email;
    const subject = "Sorry to say Goodbye!";
    const html = `Hi,
              <p>Your account is deleted by admin. If you have any query then please mail to the below email id.\nEmail:${process.env.EMAIL}</p>
                `;

    res.json({ message: "User Account deleted by admin successfully" });
    await sendEmail(receiver, subject, html);
  } catch (error) {
    console.log("Error when deleting user account by admin");
  }
};