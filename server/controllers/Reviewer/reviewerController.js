const bcrypt = require("bcrypt");
const Blog = require("../../models/Blog");
const Reviewer = require("../../models/Reviewer");
const jwt = require("jsonwebtoken");
const Admin = require("../../models/Admin");
const mongoose = require("mongoose");
const pako = require("pako");
const sendEmail = require("../../services/mailer");
const removeDuplicates = require("../../utils/removeDuplicates");
const validateUsername = require("../../utils/validateUsername");

exports.reviewerSignup = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Check if the user already exists
    const existingReviewer = await Reviewer.findOne({ email });
    console.log(existingReviewer);
    if (existingReviewer) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newReviewer = new Reviewer({
      fullName,
      userName: "reviewer" + email.substring(0, email.indexOf("@")),
      email,
      password: hashedPassword,
    });

    console.log(newReviewer);

    await newReviewer.save();

    const receiver = process.env.EMAIL;
    const subject = "New pending request of reviewer";
    const html = `Hi Admin,
              <p>New user is signed up as reviewer. Please verify and approve the request.</p>
                `;

    const receiver2 = email;
    const subject2 = "Signup successful!!";
    const html2 = `Hi ${fullName},
              <p>Thank you so much for signup on reviewer panel. Your request will be approved by the admin soon.</p>
                `;

    res.status(201).json({ message: "Signup successful" });
    await sendEmail(receiver, subject, html);
    await sendEmail(receiver2, subject2, html2);
  } catch (error) {
    res.status(500).json({ message: "Signup failed", error: error.message });
  }
};

exports.reviewerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the user exists
    const reviewer = await Reviewer.findOne({ email });
    if (!reviewer) {
      return res.status(404).json({ message: "Reviewer not found" });
    }
    if (!reviewer.isVerified) {
      return res.status(404).json({ message: "Reviewer not verified" });
    }

    // Compare the password
    const isPasswordValid = await bcrypt.compare(password, reviewer.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // You can generate a JWT token here if you want to implement authentication
    // Generate JWT token
    const token = jwt.sign(
      { currentuserId: reviewer._id },
      process.env.CURRENT_JWT_SECRET,
      {
        expiresIn: "1h", // Token expiration time
      }
    );
    console.log(token);
    const reviewerDetails = {
      email: reviewer.email,
      fullName: reviewer.fullName,
      isVerified: reviewer.isVerified,
      role: reviewer.role,
    };

    req.session.currentuserId = reviewer._id;
    req.session.currenttoken = token;
    req.session.currentemail = reviewer.email;
    req.session.currentrole = reviewer.role;
    console.log("userId: " + req.session.currentuserId);

    res
      .status(200)
      .json({ message: "Login successful", token, reviewerDetails });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

exports.uploadUserProfilePicture = async (req, res) => {
  try {
    // Get the user ID from the authenticated user (you may have your own authentication logic)
    const userId = req.session.currentuserId;

    // Get the uploaded file from the request
    const profilePicture = req.file;

    // Convert the file data to a string
    // const profilePictureData = profilePicture.toString();
    const profilePictureData = profilePicture.buffer.toString("base64");

    // Save the profile picture URL to the database
    if (req.session.currentuserId && req.session.currentrole === "Admin") {
      const user = await Admin.findById(userId);
      user.profilePicture = profilePictureData;
      await user.save();
    } else if (
      req.session.currentuserId &&
      req.session.currentrole === "Reviewer"
    ) {
      const user = await Reviewer.findById(userId);
      user.profilePicture = profilePictureData;
      await user.save();
    } else {
      res.status(500).json({ error: "Failed to upload profile picture" });
    }
    // const user = await Reviewer.findById(userId);
    // user.profilePicture = profilePictureData;
    // await user.save();

    res.status(200).json({ message: "Profile picture uploaded successfully" });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({ error: "Failed to upload profile picture" });
  }
};

// Pending Review
exports.pendingReviewBlogs = async (req, res) => {
  try {
    if (req.session.currentemail) {
      // Query the Blog model for pending blogs assigned to the reviewer
      const pendingBlogs = await Blog.find({
        status: "UNDER_REVIEW",
        currentReviewer: req.session.currentemail,
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

exports.editPendingBlog = async (req, res) => {
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

exports.saveEditedPendingBlog = async (req, res) => {
  try {
    // const { id } = req.params;
    const { slug, title, content, category, rating, reviewRemarks, tags } = req.body;

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
    blog.status = "IN_REVIEW";
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
      statusTransition: "UNDERREVIEW-INREVIEW",
      LastUpdatedAt: new Date(new Date().getTime() + 330 * 60000),
    });
    // blog.lastUpdatedAt = Date.now();
    blog.lastUpdatedAt = new Date(new Date().getTime() + 330 * 60000);
    blog.tags= tags;

    // Save the updated blog
    await blog.save();

    // Add to the reviewer array
    const reviewedBlog = {
      BlogObjectId: blog._id,
      BlogId: blog.blogId,
      BlogTitle: title,
      BlogSlug: slug,
      BlogReviewedTime: new Date(new Date().getTime() + 330 * 60000)
    };
    const user = await Reviewer.findById(req.session.currentuserId);
    user.reviewedBlogs.push(reviewedBlog);
    // user.reviewedBlogs = removeDuplicates(user.reviewedBlogs, "slug");
    await user.save();

    // Sending mail
    const receiver = user.email;
    const subject = "Blog status updated- IN_REVIEW";
    const html = `Hi,
              <p>Blog status updated: IN_REVIEW</p>
              <p>Blog Title: ${blog.title}</p>
                `;
    res.json({ message: "blog updated successfully" });
    await sendEmail(receiver, subject, html);
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.userDetails = async (req, res) => {
  try {
    // Get the user ID from the session or token (depending on your authentication setup)
    const userId = req.session.currentuserId; // Assuming you're using sessions
    const token = req.session.currenttoken; // Assuming you're using sessions
    const role = req.session.currentrole;
    // console.log("Tokn: " + req.session.currenttoken);

    if (!userId && !token) {
      return res.status(404).json({ error: "Please login!!....." });
    }
    if (userId && token && role === "Admin") {
      const user = await Admin.findById({
        _id: new mongoose.Types.ObjectId(userId),
      });
      const userDetails = {
        fullName: user.fullName,
        userName: user.userName,
        email: user.email,
        isVerified: user.isVerified,
        profilePicture: user.profilePicture,
        role: user.role,
      };
      res.json(userDetails);
    } else if (userId && token && role === "Reviewer") {
      const user = await Reviewer.findById({
        _id: new mongoose.Types.ObjectId(userId),
      });
      const userDetails = {
        fullName: user.fullName,
        userName: user.userName,
        email: user.email,
        isVerified: user.isVerified,
        profilePicture: user.profilePicture,
        role: user.role,
        reviewedBlogs: user.reviewedBlogs,
      };
      res.json(userDetails);
    } else {
      return res.status(404).json({ error: "Please login!!" });
    }

  } catch (error) {
    console.error("Error fetching user information:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete Account permanently
exports.deleteReviewerAccount = async (req, res) => {
  try {
    // Get the userId from the session or request body, depending on your implementation
    const currentrole = req.session.currentrole;
    const currentuserId = req.session.currentuserId;

    // Delete the user account from the database
    if (currentrole === "Admin") await Admin.findByIdAndDelete(currentuserId);
    else await Reviewer.findByIdAndDelete(currentuserId);

    // Return a success message
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    // Handle any errors
    console.error("Account deletion failed:", error);
    res.status(500).json({ error: "Failed to delete the account" });
  }
};

//Feedback to author
exports.feedbackToAuthor = async (req, res) => {
  try {
    const feedback = req.body.feedback;
    const blogId = req.body.id;
    // Get the userId from the session or request body, depending on your implementation
    const currentReviewer = req.session.currentemail;
    // const currentuserId = req.session.currentuserId;

    // Find the blog by ID
    const blog = await Blog.findById({
      _id: new mongoose.Types.ObjectId(blogId),
    }).populate("authorDetails");
    blog.status = "AWAITING_AUTHOR";
    // blog.lastUpdatedAt = Date.now();
    blog.lastUpdatedAt = new Date(new Date().getTime() + 330 * 60000);
    blog.feedbackToAuthor.push({
      ReviewerId: new mongoose.Types.ObjectId(req.session.currentuserId),
      ReviewerEmail: currentReviewer,
      Feedback: feedback,
      LastUpdated: new Date(new Date().getTime() + 330 * 60000)
    });
    await blog.save();
    // console.log("Blog feedback given");
    // console.log("Author email: "+blog.authorDetails?.email)

    // Sending mail
    const receiver1 = blog.authorDetails.email;
    const receiver2 = req.session.currentemail;
    const subject = "Blog status updated- AWAITING_AUTHOR";
    const html = `Hi,
              <p>Blog status updated: AWAITING_AUTHOR</p>
              <p>Blog: ${blog.slug}</p>
              <p>Feedback: ${feedback}</p>
              <br>
              <p>Regards,</p>
              <b>Teekam Singh</b>
                `;

    // Return a success message
    res.json({ message: "Feedback sent successfully" });
    await sendEmail(receiver1, subject, html);
    await sendEmail(receiver2, subject, html);
  } catch (error) {
    // Handle any errors
    console.error("Failed to send feedback:", error);
    res.status(500).json({ error: "Failed to send feedback" });
  }
};

// Change username
exports.changeUsername = async (req, res) => {
  try {
    const { fullName, userName } = req.body;
    const validationError = validateUsername(userName);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    if (req.session.currentrole === "Admin") {
      const updatedUser = await Admin.findById({
        _id: new mongoose.Types.ObjectId(req.session.currentuserId),
      });
      updatedUser.fullName = fullName;
      updatedUser.userName = userName;
      await updatedUser.save();
    } else if (req.session.currentrole === "Reviewer") {
      const updatedUser = await Reviewer.findById({
        _id: new mongoose.Types.ObjectId(req.session.currentuserId),
      });
      updatedUser.fullName = fullName;
      updatedUser.userName = userName;
      await updatedUser.save();
    } else {
      return res.status(400).json({ error: "Failed to change username" });
    }

    res.json({ message: "Username updated successfully" });
  } catch (error) {
    console.error("Error updating username:", error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the username" });
  }
};

exports.discardQueueBlog = async (req, res) => {
  try {
    const blogId = req.params.id;
    const reviewRemarks= req.body.reviewRemarks;
    const rating= req.body.rating;
    const blog = await Blog.findById({
      _id: new mongoose.Types.ObjectId(req.params.id),
    });
    console.log(blogId);

    if (!blog) {
      console.log("Blog not found");
      return res.status(404).json({ error: "Blog not found." });
    }
    blog.status = "DISCARD_QUEUE";
    // blog.lastUpdatedAt = Date.now();
    blog.reviewedBy.push({
      // ReviewedBy: req.session.currentemail,
      ReviewedBy: {
        Id: new mongoose.Types.ObjectId(req.session.currentuserId),
        Email: req.session.currentemail,
        Role: req.session.currentrole,
      },
      Rating: rating,
      Remarks: reviewRemarks,
      statusTransition: "UNDERREVIEW-DISCARDQUEUE",
      LastUpdatedAt: new Date(new Date().getTime() + 330 * 60000),
    });
    blog.lastUpdatedAt = new Date(new Date().getTime() + 330 * 60000);

    await blog.save();


    console.log("Blog discarded");
    res.json({ message: "Blog moved to discard queue" });
  } catch (error) {
    res.status(500).json({ error: "An error occurred while discarding blog" });
  }
};
