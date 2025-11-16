const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const pako = require("pako");
const { GoogleGenAI } = require("@google/genai");

const fs = require("fs");
const { google } = require("googleapis");
const Blog = require("../models/Blog");
const sendEmail = require("../services/mailer");
const credentials = JSON.parse(
  fs.readFileSync("./config/gsheets-service-account.json", "utf8")
);

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

const fetchNextRowFromSheet = async () => {
  try {
    const dataGsheet = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: "Sheet1!2:2",
    });
    // console.log("D Sheet: ", dataGsheet)
    return dataGsheet.data.values[0];
  } catch (error) {
    console.log("Error occured: ", error);
    return {};
  }
};

const slugify = (title) => {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .replace(/\s+/g, "-");
};

const createNewAIContent = async (title) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });

    // const prompt = `Write a blog in HTML format for the title: "${title}".
    //   Use proper HTML tags like <h1>, <p>, <ul>, <li>, <strong>, etc.
    //   Do NOT include <html>, <head>, or <body> tags. Only the content inside.`;

    const prompt = `
Write a detailed, well-structured blog post in clean HTML format for the title: "${title}". 

Guidelines:
- Use proper semantic HTML tags like <h1>, <h2>, <p>, <ul>, <li>, <code>, <pre>, <strong>, <em>, etc.
- Do NOT include <html>, <head>, or <body> tags — only the inner HTML content.
- Ensure the content is SEO-friendly, informative, and easy to read.
- If the topic is technical, include clear explanations with accurate and formatted code examples inside <pre><code> blocks.
- Avoid restating the title at the beginning of the content.
- Do NOT end with phrases like "Would you like me to create visuals or examples for this?" or similar meta text.
- Maintain a professional and engaging tone throughout.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    const data = response.text;

    const compressedContentBuffer = pako.deflate(data, { to: "string" });
    const compressedContent = Buffer.from(compressedContentBuffer).toString(
      "base64"
    );
    // console.log(data);
    return compressedContent;
  } catch (error) {
    console.log("Error generating AI blog:", error);
  }
};

const deleteRowFromSheet = async () => {
  try {
    const spreadsheetId = process.env.SHEET_ID;
    const sheetName = "Sheet1";
    const rowNumber = 2; // delete row 2

    // get sheetId (required for batchUpdate)
    const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = sheetMeta.data.sheets.find(
      (s) => s.properties.title === sheetName
    );
    const sheetId = sheet.properties.sheetId;

    sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: "ROWS",
                startIndex: rowNumber - 1, // 0-based index
                endIndex: rowNumber, // exclusive
              },
            },
          },
        ],
      },
    });
    console.log("1 Row deleted");
  } catch (error) {
    console.log("Error....", error);
  }
};

router.get("/nextblog", async (req, res) => {
  try {
    const fetchedRow = await fetchNextRowFromSheet();
    if (!fetchedRow || Object.keys(fetchedRow).length === 0) {
      console.log("No data found!!");
      return res.status(404).json({ message: "No record found in sheet!!" });
    }
    console.log(fetchedRow);
    const aiContent= await createNewAIContent(fetchedRow[0]);
    const tags = fetchedRow[2]
      ? fetchedRow[2]
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag)
      : [];
    const blogPayload = new Blog({
      slug: slugify(fetchedRow[0]),
      title: fetchedRow[0],
      content: aiContent,
      category: fetchedRow[1],
      tags: tags,
      authorDetails: new mongoose.Types.ObjectId(
        process.env.AUTO_WRITTEN_BLOG_USERID
      ),
      lastUpdatedAt: new Date(new Date().getTime() + 330 * 60000),
    });
    const savedBlog = await blogPayload.save();
    console.log(savedBlog);
    await deleteRowFromSheet();

    // Sending mail to author
    const receiver = process.env.EMAIL;
    const subject = "Admin- New Blog submitted for review";
    const html = `
  <div class="content">
    <h2>Hello, ${receiver}!</h2>
    <p>New Auto AI blog is submitted for review.</p>
    <p>Topic: <span style="color:#167d7f; font-weight:bold">${fetchedRow[0]}</span></p>
    <p>Category: <span style="color:#167d7f; font-weight:bold">${fetchedRow[1]}</span></p>
    <p>Tags: <span style="color:#167d7f; font-weight:bold">${fetchedRow[2]}</span></p>
    <p>Content:</p> <div class="blog-content">${aiContent}</div>
    <br />
  </div>
    `;

    await sendEmail(receiver, subject, html)
      .then((response) => {
        console.log(`Email sent to ${receiver}:`, response);
      })
      .catch((error) => {
        console.error("Error sending email:", error);
      });

    res.status(201).json({ message: "New blog from sheet: " + fetchedRow[0] });
  } catch (error) {
    console.log("Error--", error);
    await deleteRowFromSheet();
    res.status(500).json({ message: "Something went wrong", error: error });
  }
});

router.get("/autopublish", async (req, res) => {
  try {
    const blogs = await Blog.find({
      status: "PENDING_REVIEW",
      authorDetails: new mongoose.Types.ObjectId(
        process.env.AUTO_WRITTEN_BLOG_USERID
      ),
    })
      .populate("authorDetails")
      .exec();

    if (!blogs) {
      return res.status(404).json({ error: "blogs not found" });
    }

    blogs.map(async (blog) => {
      blog.status = "PUBLISHED";
      blog.reviewedBy.push({
        ReviewedBy: {
          Id: new mongoose.Types.ObjectId(process.env.AUTOWRITE_ADMIN_USERID),
          Email: process.env.AUTOWRITE_ADMIN_EMAIL,
          Role: "Admin",
        },
        Revision: "NA",
        Rating: 5,
        Remarks: "Auto-Ok",
        statusTransition: "PENDING_REVIEW-PUBLISHED",
        LastUpdatedAt: new Date(new Date().getTime() + 330 * 60000),
      });
      // blog.lastUpdatedAt = new Date(new Date().getTime() + 330 * 60000);

      await blog.save();

      console.log(blog.authorDetails.email);

      const receiver = blog.authorDetails.email;
      const subject = "Published!!";
      const html = `
  <div class="content">
    <h2>Hi ${blog.authorDetails.fullName},</h2>
    <p>Congratulations!! Your blog is published.</p>
    <p>Topic: <span style="color:#167d7f; font-weight:bold">${blog.title}</span></p>
    <p>Published Link: <a href="${process.env.FRONTEND_URL}/${blog.slug}">${process.env.FRONTEND_URL}/${blog.slug}</a></p>
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
      const subject2 = "Auto-Blog Published!!";
      const html2 = `
    <div class="content">
    <h2>Hi Admin,</h2>
    <p>Congratulations!! New auto-blog is published.</p>
    <p>Topic: <span style="color:#167d7f; font-weight:bold">${blog.title}</span></p>
    <p>Published Link: <a href="${process.env.FRONTEND_URL}/${blog.slug}">${process.env.FRONTEND_URL}/${blog.slug}</a></p>
  </div>
    `;

      sendEmail(receiver2, subject2, html2)
        .then((response) => {
          console.log(`Email sent to ${receiver}:`, response);
        })
        .catch((error) => {
          console.error("Error sending email:", error);
        });
    });

    res.status(200).json({ message: "auto-blogs published successfully" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error: error });
  }
});

// const fs= require('fs');
// const { google } = require("googleapis");
// const credentials = JSON.parse(fs.readFileSync("./config/gsheets-service-account.json", "utf8"));

// const auth = new google.auth.GoogleAuth({
//   credentials,
//   scopes: ["https://www.googleapis.com/auth/spreadsheets"],
// });

// async function saveToGoogleSheet(data) {
//   const sheets = google.sheets({ version: "v4", auth });

//   const values = data.map((item) => [
//     item.firstName,
//     item.lastName,
//     item.email,
//     item.phone,
//     item.plan,
//     item.premium_amount,
//     item.start_policy_date,
//     item.end_policy_date,
//   ]);

//   const dataGsheet= await sheets.spreadsheets.values.get({
//     spreadsheetId: process.env.SHEET_ID, range: "Sheet1!3:3"
//   });
//   console.log(dataGsheet.data.values[0])
//   // await sheets.spreadsheets.values.append({
//   //   spreadsheetId: process.env.SHEET_ID,
//   //   range: "Sheet1!A2", // Adjust based on your sheet structure
//   //   valueInputOption: "RAW",
//   //   requestBody: { values },
//   // });

//   console.log("Data saved successfully!");
// }

// const exampleData = [
//   {
//     firstName: "John",
//     lastName: "Doe",
//     email: "johndoe@example.com",
//     phone: "+1234567890",
//     plan: "Gold Plan",
//     premium_amount: 50000,
//     start_policy_date: "2025-01-01",
//     end_policy_date: "2026-01-01",
//   },
// ];

// saveToGoogleSheet(exampleData).catch(console.error);

// router.get("/fetch-next", async (req, res) => {
//   try {
//     const dataGsheet = await sheets.spreadsheets.values.get({
//       spreadsheetId: process.env.SHEET_ID,
//       range: "Sheet1!3:3",
//     });
//     console.log(dataGsheet.data.values[0]);

//     // await sheets.spreadsheets.values.update({
//     //   spreadsheetId: process.env.SHEET_ID,
//     //   range: "Sheet1!A3:D3", // Which cells to update
//     //   valueInputOption: "RAW", // or "USER_ENTERED"
//     //   requestBody: {
//     //     values: [
//     //       ["Updated Title", "Tech", "AI, ML", "completed"], // your row data
//     //     ],
//     //   },
//     // });

//     const spreadsheetId = process.env.SHEET_ID;
//     const sheetName = "Sheet1";
//     const rowNumber = 3; // for example, delete row 5

//     // First, get sheetId (required for batchUpdate)
//     const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId });
//     const sheet = sheetMeta.data.sheets.find(
//       (s) => s.properties.title === sheetName
//     );
//     const sheetId = sheet.properties.sheetId;

//     // Now delete that row
//     // sheets.spreadsheets.batchUpdate({
//     //       spreadsheetId,
//     //       resource: {
//     //           requests: [
//     //               {
//     //                   deleteDimension: {
//     //                       range: {
//     //                           sheetId,
//     //                           dimension: "ROWS",
//     //                           startIndex: rowNumber - 1, // 0-based index
//     //                           endIndex: rowNumber, // exclusive
//     //                       },
//     //                   },
//     //               },
//     //           ],
//     //       },
//     //   });

//     console.log(`✅ Deleted row ${rowNumber} successfully`);

//     const dataGsheet2 = await sheets.spreadsheets.values.get({
//       spreadsheetId: process.env.SHEET_ID,
//       range: "Sheet1!3:3",
//     });
//     console.log(dataGsheet2.data.values[0]);
//   } catch (error) {
//     console.log("Error occured: ", error);
//   }
// });

module.exports = router;
