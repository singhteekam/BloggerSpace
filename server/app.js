const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo")(session);
const path = require("path");

// const functions = require("firebase-functions");

const { onRequest } = require('firebase-functions/v2/https');

require("dotenv").config(); // Load environment variables from .env file - Production mode
// require("dotenv").config({ path: ".env.local" }); // development mode

const PORT = process.env.PORT || 5000; // For development
// const PORT = 8183;  // For production

const connectDB = require("./db/db");
const blogs = require("./routes/blogs");
const authRoutes = require("./routes/users");

const reviewerRouted = require("./routes/Reviewer/reviewerRoute");
const adminRoutes = require("./routes/Admin/adminRoute");
const communityRoutes = require("./routes/community");

const sitemapRouter = require("./routes/sitemap");

const passport = require("./services/passportAuth.js");

// Using express-multipart-file-parser for file upload. Firebase-functions doesn't support multer.
const { fileParser } = require("express-multipart-file-parser");

// app.use(require('prerender-node').set('prerenderToken', process.env.PRERENDER_TOKEN).set('host', 'https://bloggerspace.singhteekam.in'));

// Use the fileParser middleware
app.use(fileParser({
  rawBodyOptions: {
      limit: '10mb', // Adjust the size limit as needed
  },
  busboyOptions: {
      limits: {
          fileSize: 5 * 1024 * 1024, // 5MB file size limit
      },
  },
}));

////////////////////////////////////////////////////////////////////

app.use("/api", sitemapRouter);

// Increase the payload limit to 10MB
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

connectDB();

app.use(express.json());
// app.use(cors());

app.use(
  cors({
    origin:
     [
      process.env.FRONTEND_URL,
      process.env.BLOGGERSPACE1,
      process.env.BLOGGERSPACE2,
      process.env.PANEL2BLOGGERSPACE1,
    ],
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Access-Control-Allow-Credentials"],
    credentials: true, // mandoatory for google auths
  })
);

// Assuming you have already connected to your MongoDB database using Mongoose
// Get the default connection
const dbConnection = mongoose.connection;

app.use(cookieParser());
app.use(
  session({
    store: new MongoStore({ mongooseConnection: dbConnection }), // Use connect-mongo
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 1800000, // Set session expiration to 1 minute (60,000 ms) 1800000 means 30 minutes
    }, // Adjust this based on your deployment configuration (e.g., true for HTTPS)
    // cookie: { secure: true }, // Adjust this based on your deployment configuration (e.g., true for HTTPS)
  })
);

// Passport Login/Signup
app.use(passport.initialize());
app.use(passport.session(false));

// User Routes
app.use("/api/users", authRoutes);

//Blog routes
app.use("/api/blogs", blogs);

//Reviewer Panel
app.use("/api/reviewer/", reviewerRouted);

//Admin Panel
app.use("/api/admin/", adminRoutes);

// Community
app.use("/api/community", communityRoutes);

//For capturing logs
const { uploadLogsToGitHub, fetchLogsFile } = require("./utils/uploadToGitHub");
app.get("/api/logs", (req, res) => {
  uploadLogsToGitHub();
  res.json(
    "Logs uploaded to GitHub: " +
      new Date(new Date().getTime() + 330 * 60000).toISOString()
  );
});

app.get("/api/viewlogs", async (req, res) => {
  const viewLogFile = await fetchLogsFile();
  res.header("Content-Type", "application/json");
  res.send(viewLogFile);
  // res.sendFile(path.join(__dirname, "/utils/Logging/", "logs.log"));
});

// Running update queries
// const {addFollowersFields, addFollowingFields}= require("./utils/dbQueries");
// addFollowersFields();
// addFollowingFields();

// app.get("/heavy", (req, res) => {
//   let total = 0;
//   for (let i = 0; i < 5_000_000; i++) {
//     total++;
//   }
//   res.send(`The result of the CPU intensive task is ${total}\n`);
// });

// const cluster = require('cluster');
// const os = require('os');
// const numCPUs = os.cpus().length;

// if (cluster.isMaster) {
//   console.log(`Master process ${process.pid} is running`);

//   for (let i = 0; i < numCPUs; i++) {
//     cluster.fork();
//   }

//   cluster.on('exit', (worker, code, signal) => {
//     console.log(`Worker process ${worker.process.pid} died. Restarting...`);
//     cluster.fork();
//   });
// }
// else{
// }
app.listen(PORT, console.log("Server started at " + PORT+ " and pid: "+ process.pid));


exports.bloggerspacebackend2 = onRequest(app);
// exports.bloggerspacebackend = functions.https.onRequest(app);
