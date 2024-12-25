// mailer.js

const nodemailer = require("nodemailer");

// <!-- Main Content with Expandable Sections -->
// <div class="content">
//   <h2>Hello, [User's Name]!</h2>
//   <p>We have some exciting updates just for you:</p>
//   <ul>
//     <li><strong>📈 Feature Highlight:</strong> <span style="color: #777;">Explore our newest feature designed to improve your experience.</span></li>
//     <li><strong>📅 Upcoming Events:</strong> Join us for an exclusive event and connect with experts.</li>
//     <li><strong>💸 Special Offer:</strong> Enjoy an exclusive discount just for subscribers. <a href="[Your_Link]" style="text-decoration: underline;">Learn More</a></li>
//   </ul>
//   <p><a href="[Your_Link_Here]" class="button">Discover More</a></p>
// </div>

const emailTemplate = (content) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interactive Newsletter</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #98d7c2; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ddffe7; border-radius: 8px; overflow: hidden; }
    .header { background-color: #167d7f; color: white; padding: 20px; text-align: center; }
    .header img { width: 80px; height: auto; }
    .content { padding: 20px; color: #333; }
    .content h2 { color: #167d7f; }
    .content p, .content li { line-height: 1.6; }
    .button { display: inline-block; padding: 12px 25px; color: white !important; background-color: #29a0b1; border-radius: 5px; text-decoration: none; font-weight: bold; transition: background-color 0.3s ease; }
    .button:hover { background-color: #167d7f; }
    .bs-image{ width: 24px; height: 24px; margin: 0 5px; }
    .footer { background-color: #f1f1f1; color: #777; text-align: center; padding: 20px; font-size: 12px; }
    .footer a { color: #4CAF50; text-decoration: none; }
    .social-icons img { width: 24px; height: 24px; margin: 0 5px; }
    .blog-content{ background-color: #f1f1f1; border: 2px solid black}
    .teal-green{ color:#167d7f}
  </style>
</head>
<body>
  <div class="container">
    <!-- Header with Hero Image -->
    <div class="header">
      <img src="https://bloggerspace.singhteekam.in/static/media/BLOGGERSPACE.56707dc4ef9b3b4b6147.png" alt="Hero Image">
      <h1>BloggerSpace</h1>
      <p>Bringing you the latest news and insights</p>
    </div>

    ${content}

    <center>
      <img class="bs-image" src="https://bloggerspace.singhteekam.in/static/media/BLOGGERSPACE.56707dc4ef9b3b4b6147.png" alt="Hero Image">
      <h3>BloggerSpace</h3>
    </center>

    <!-- Social Media Section -->
    <div class="footer">
      <p>Connect with us on</p>
      <div class="social-icons">
        <a href="#"><img src="https://cdn-icons-png.freepik.com/256/15707/15707884.png?semt=ais_hybrid" alt="Facebook"></a>
        <a href="#"><img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" alt="Linkedin"></a>
        <a href="#"><img src="https://cdn-icons-png.flaticon.com/512/25/25231.png" alt="Github"></a>
      </div>
      <p>You have received this mail because your e-mail ID is registered with BloggerSpace. If you wish to unsubscribe, click <a href="#">here</a>.</p>
      <p>&copy; 2024 BloggerSpace. All rights reserved.</p>
    </div>
  </div>
</body>
</html>

`;
};

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const sendEmail = (receiver, subject, html, attachments=[]) => {
  const mailOptions = {
    from: process.env.EMAIL,
    to: receiver,
    subject: subject,
    html: emailTemplate(html),
    attachments: attachments
    // html: html,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        reject(error);
      } else {
        console.log("Email sent:", info.response);
        resolve(info.response);
      }
    });
  });
};

module.exports = sendEmail;
