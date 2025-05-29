const bcrypt = require("bcrypt");
const Admin= require("../../models/Admin");
const Reviewer= require("../../models/Reviewer");
const User= require("../../models/User");
const Community= require("../../models/Community");
const jwt = require("jsonwebtoken");
const Blog = require("../../models/Blog");
const mongoose = require("mongoose");
const pako = require("pako");
const sendEmail = require("../../services/mailer");
const generateSitemap = require('../../utils/generateSitemap');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

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
      process.env.CURRENT_JWT_SECRET,
      {
        expiresIn: "3d", // Token expiration time
      }
    );
    console.log(token);
    const adminDetails = {
      _id: admin._id,
      email: admin.email,
      fullName: admin.fullName,
      isVerified: admin.isVerified,
      role: admin.role
    };

    // req.session.currentuserId = admin._id;
    // req.session.currenttoken = token;
    // req.session.currentemail = admin.email;
    // req.session.currentrole = admin.role;
    // console.log("userId: " + req.session.currentuserId);

    res.status(200).json({ message: "Login successful", token, adminDetails });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
}


exports.inReviewBlogs = async (req, res) => {
  try {
    // if (req.session.currentemail) {
    if (req.query.userId) {
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
        Email: req.query.email,
        Role: req.query.role,
      },
      Revision:"NA",
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

    // Sending mail to author
    const receiver = blog.authorDetails.email;
    const subject = "Published!!";
    const html = `
  <div class="content">
    <h2>Hi ${blog.authorDetails.fullName},</h2>
    <p>Congratulations!! Your blog is published.</p>
    <p>Topic: <span style="color:#167d7f; font-weight:bold">${title}</span></p>
    <p>Published Link: <a href="${process.env.FRONTEND_URL}/${slug}">${process.env.FRONTEND_URL}/${slug}</a></p>
  </div>
    `;

    sendEmail(receiver, subject, html)
      .then((response) => {
        console.log(`Email sent to ${receiver}:`, response);
        // Handle success
      })
      .catch((error) => {
        console.error("Error sending email:", error);
        // Handle error
      });

    // Sending mail to admin
    const receiver2 = process.env.EMAIL;
    const subject2 = "Blog Published!!";
    const html2 = `
    <div class="content">
    <h2>Hi Admin,</h2>
    <p>Congratulations!! New blog is published.</p>
    <p>Topic: <span style="color:#167d7f; font-weight:bold">${title}</span></p>
    <p>Published Link: <a href="${process.env.FRONTEND_URL}/${slug}">${process.env.FRONTEND_URL}/${slug}</a></p>
  </div>
    `;

    sendEmail(receiver2, subject2, html2)
      .then((response) => {
        console.log(`Email sent to ${receiver}:`, response);
        // Handle success
      })
      .catch((error) => {
        console.error("Error sending email:", error);
        // Handle error
      });


    res.json({ message: "blog updated successfully" });
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


exports.publishedBlogs = async (req, res) => {
  try {
    if (req.query.userId) {
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
    if (req.query.userId) {
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
    if (req.query.userId) {
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
    const html = `
          <div class="content">
            <h2>Hi ${assignedUser}</h2>
            <p>New blog is assigned to you for review. Please review it within 3 days.</p>
            <p>Title: ${blog.title}</p>
            <p>BloggerSpace Reviewer panel: <span>${process.env.REVIEWER_PANEL_URL}</span></p> 
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
    if (req.query.userId) {
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
    if (req.query.userId) {
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
    reviewer.status="ACTIVE";
    await reviewer.save();

    const receiver = reviewer.email;
    const subject = "Congratulations! Your request is approved";
    const html = `
            <div class="content">
            <h2>Hi ${reviewer.fullName},</h2>
            <p>Congratulations!! Your Reviewer request is approved and you are now a Reviewer.</p>
            <p>Kindly review the assigned blogs before deadline. If failed to review then that blog will be assigned to some other Reviewer. Repeating the same practice multiple times could revoke your Reviewer access.</p>
            <p>BloggerSpace Reviewer panel: <span>${process.env.REVIEWER_PANEL_URL}</span></p> 
          </div>
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
    reviewer.status="INACTIVE";
    await reviewer.save();

    const receiver = reviewer.email;
    const subject = "Sorry to say Goodbye!";
    const html = `
          <div class="content">
            <h2>Hi ${reviewer.fullName},</h2>
            <p>You are no longer a reviewer now. If you wish to re-apply for reviewer then send reminder again to verify your account. </p>
            <p>BloggerSpace Reviewer panel: <span>${process.env.REVIEWER_PANEL_URL}</span></p> 
          </div>
                `;

    res.json({ message: "Reviewer removed successfully" });
    await sendEmail(receiver, subject, html);
  } catch (error) {
    console.log("Error when removing the reviewer");
  }
}

exports.fetchAllUsers= async(req, res)=>{

  try {
    const allUsers = await User.find({status:"ACTIVE"});
    res.json(allUsers);
  } catch (error) {
    console.log("Error fetching all users")
    res.status(500).json({ error: "Failed to fetch all users" });
  }
}

exports.deleteUserAccount = async (req, res) => {
  const { id } = req.params;
  try {
    const user= await User.findById(id);
    user.status="DELETED";
    await user.save();
    // await User.findByIdAndDelete(id);

    const receiver = req.query.useremail;
    const subject = "Sorry to say Goodbye!";
    const html = `
          <div class="content">
            <h2>Hi ${req.query.useremail},</h2>
            <p>Your account is deleted by admin. If you have any query then please drop a mail to below email id.\nEmail:${process.env.EMAIL}</p>
          </div>
          `;

    res.json({ message: "User Account deleted by admin successfully" });
    await sendEmail(receiver, subject, html);
  } catch (error) {
    console.log("Error when deleting user account by admin");
  }
};

// Community
exports.getCommunityPosts = async (req, res) => {
  const page= parseInt(req.query.page) || 1;
  const limit= parseInt(req.query.limit) || 6;
  const skip= (page-1)*limit;
  try {
    const posts = await Community.find({}).skip(skip).limit(limit)
      .sort({ createdAt: -1 })
      .populate("communityPostAuthor") // Populate the author field with the User document
      .exec();

    // console.log(typeof posts[1].communityPostContent);

    for (let i = 0; i < posts.length; i++) {
      const compressedContentBuffer = Buffer.from(posts[i].communityPostContent, "base64");
      const decompressedContent = pako.inflate(compressedContentBuffer, {
        to: "string",
      });
      posts[i].communityPostContent= decompressedContent
    }
 
    const total= await Community.countDocuments({});
    
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
    await generateSitemap();

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
    // Perform the search query based on the provided search query
    const blogs = await Blog.find({
      status: "ADMIN_DRAFT",
    });
    // console.log(blogs);

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
    // Perform the search query based on the provided search query
    const blogs = await Blog.find({
      status: "ADMIN_PUBLISHED",
    });
    // console.log(blogs);

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
    // Perform the search query based on the provided search query
    const blogs = await Blog.find({
      status: "ADMIN_DISCARDED",
    });
    // console.log(blogs);

    res.json(blogs);
  } catch (error) {
    console.error("Error searching discarded blogs:", error);
    res
      .status(500)
      .json({ error: "An error occurred while searching discarded blogs." });
  }
};

exports.adminWrittenDiscardBlogFromDB = async (req, res) => {
  const {id}= req.params;
  try {
    const blog = await Blog.findById({
      _id: new mongoose.Types.ObjectId(id),
    });
    blog.status="ADMIN_DISCARDED";
    await blog.save();

    res.json({ message: "Blog discarded successfully" });
  } catch (error) {
    console.error("Error discarding blogs:", error);
    res
      .status(500)
      .json({ error: "An error occurred while discarding blogs." });
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
    const decompressedContent = pako.inflate(compressedContentBuffer, {
      to: "string",
    });
    blog.content = decompressedContent;
    console.debug("Blog opened in Edit mode. Blog title: "+ blog.title);

    res.json(blog);
  } catch (error) {
    console.error("Error fetching blog blog:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.adminSaveEditedBlog = async (req, res) => {
  try {
    // const { id } = req.params;
    const { slug, title, content, category } = req.body;

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
    blog.status = "ADMIN_PUBLISHED";

    // Save the updated blog
    await blog.save();
    await generateSitemap();
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

    const {selectedUsers, subject, message}= req.body;
    selectedUsers.forEach(async (receiver) => {
      await sendEmail(receiver.value, subject, `<div class="content">${message}</div>`);
    });
    // Sending mail to admin
    await sendEmail(process.env.EMAIL, subject, message);
    
    res.json({ message: "Mail sent successfully!!" });
  } catch (error) {
    console.error("Error sending emails...", error);
    res
      .status(500)
      .json({ error: "Error sending emails..." });
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