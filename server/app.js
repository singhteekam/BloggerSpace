const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors= require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo")(session);
const path = require('path');


require("dotenv").config(); // Load environment variables from .env file
const connectDB = require("./db/db");
const blogs= require('./routes/blogs');
const authRoutes = require("./routes/users");

const reviewerRouted= require("./routes/Reviewer/reviewerRoute")
const adminRoutes= require("./routes/Admin/adminRoute");

const sitemapRouter = require('./routes/sitemap');

app.use('/', sitemapRouter);

app.get('/robots.txt', async (req, res) => {
  try {
    console.log(path.join(__dirname,"../", 'robots.txt'))
  res.sendFile(path.join(__dirname,"../", 'robots.txt'));
} catch (error) {
  console.error('Error getting robots.txt:', error);
  res.status(500).send('Internal Server Error');
}}
);


// Increase the payload limit to 10MB
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));


connectDB();

app.use(express.json());
// app.use(cors());

app.use(
  cors({
    origin: [process.env.BLOGGERSPACE1, process.env.BLOGGERSPACE2, process.env.PANEL2BLOGGERSPACE1],
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
    saveUninitialized: true,
    cookie: { secure: false }, // Adjust this based on your deployment configuration (e.g., true for HTTPS)
    // cookie: { secure: true }, // Adjust this based on your deployment configuration (e.g., true for HTTPS)
  })
); 

// User Routes
app.use('/api/users', authRoutes);

//Blog routes
app.use("/api/blogs", blogs);

//Reviewer Panel
app.use("/api/reviewer/", reviewerRouted);

//Admin Panel
app.use("/api/admin/", adminRoutes);

//For capturing logs
const uploadToGitHub= require("./utils/uploadToGitHub");
app.get("/api/logs", (req, res)=>{
  uploadToGitHub();
  res.json("Logs uploaded to GitHub: "+ new Date(new Date().getTime() + 330 * 60000).toISOString())
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, console.log("Server started at " + PORT));
