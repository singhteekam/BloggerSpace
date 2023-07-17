const sendEmail = require("../services/mailer");
const Blog = require("../models/Blog");
const mongoose = require("mongoose");

exports.discardBlogFromDB = async (req, res) => {
  try {
    const blogId = req.params.id;
    const { authorEmail, slug } = req.body;

    // Find the blog by its ID and remove it from the database
    const discardedBlog = await Blog.findByIdAndRemove({
      _id: new mongoose.Types.ObjectId(blogId),
    });

    if (!discardedBlog) {
      return res.status(404).json({ error: "Blog not found." });
    }

    // Sending Mail to Admin and User
    // Sending mail
    const receiver = authorEmail;
    const subject = "Blog discarded!";
    const html = `Hi,
              <p>Blog discarded: ${slug}</p>
                `;

    if (
      req.session.currentrole === "Admin" ||
      req.session.currentrole === "Reviewer"
    ) {
      await sendEmail(receiver, subject, html);
      await sendEmail(req.session.currentemail, subject, html);
    }
    res.json({ message: "Blog discarded successfully." });
  } catch (error) {
    console.error("Error discarding blog:", error);
    res
      .status(500)
      .json({ error: "An error occurred while discarding the blog." });
  }
};
