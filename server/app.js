const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet= require("helmet");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo")(session);
const path = require("path");

const app = express();
// Behind Firebase/Cloud Run's proxy — trust X-Forwarded-For so req.ip is the real
// client IP (used by the rate limiter), not the proxy's.
app.set("trust proxy", true);
const adminMiddleware = require("./middlewares/adminMiddleware");
// app.use(helmet());

// Security headers. Allow cross-origin loading of static assets (the frontend
// and email templates pull /assets/logo from this origin), while keeping all
// other hardening defaults (HSTS, X-Content-Type-Options, frameguard, etc.).
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// const functions = require("firebase-functions");

const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");

require("dotenv").config(); // Load environment variables from .env file - Production mode
// require("dotenv").config({ path: ".env.local" }); // development mode

// Honour an injected PORT (local tooling / emulators); fall back to 8191.
// Only used when run directly for local dev — on Firebase, onRequest(app) serves.
const PORT = process.env.PORT || 8191;

const connectDB = require("./db/db");
const blogs = require("./routes/blogs");
const authRoutes = require("./routes/users");

const reviewerRoutes = require("./routes/Reviewer/reviewerRoute");
const adminRoutes = require("./routes/Admin/adminRoute");
const communityRoutes = require("./routes/community");
const reviewsRoutes  = require("./routes/reviewsRoute");
const autoWriteBlogs = require("./routes/autoWriteBlogs");
const analyticsRoutes = require("./routes/analyticsRoute");

const sitemapRouter = require("./routes/sitemap");
const notificationRoutes = require("./routes/notifications");

const passport = require("./services/passportAuth.js");

// Using express-multipart-file-parser for file upload. Firebase-functions doesn't support multer.
const { fileParser } = require("express-multipart-file-parser");

// app.use(require('prerender-node').set('prerenderToken', process.env.PRERENDER_TOKEN).set('host', 'https://bloggerspace.singhteekam.in'));

// Use the fileParser middleware
app.use(
  fileParser({
    rawBodyOptions: {
      limit: "10mb", // Adjust the size limit as needed
    },
    busboyOptions: {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB file size limit
      },
    },
  })
);

// Increase the payload limit to 10MB
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

// Serve server-side static assets (e.g. logo used in email templates)
// Logo accessible at: <BACKEND_URL>/assets/logo128x128.png
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Connect to MongoDB only in the actual function runtime (or local dev / the
// emulator) — NOT during `firebase deploy` source analysis. During deploy the
// code is imported just to read the function signatures; connecting then (and
// the index sync it triggers) is slow global-scope work that blows the 10s
// discovery budget → "Cannot determine backend specification. Timeout after 10000".
const inCloudRuntime = !!(
  process.env.K_SERVICE ||        // gen2 Cloud Run runtime (set only at runtime, not during CLI discovery)
  process.env.FUNCTIONS_EMULATOR  // local emulator
);
if (inCloudRuntime || require.main === module) {
  connectDB();
}

app.use(express.json());
// app.use(cors());

// app.use(
//   cors({
//     origin: [
//       process.env.FRONTEND_URL,
//       process.env.BLOGGERSPACE1,
//       process.env.BLOGGERSPACE2,
//       process.env.PANEL2BLOGGERSPACE1,
//     ],
//     // NEW- Added PATCH method and Authorization header so the Next.js client
//     // can send Bearer JWT tokens and use PATCH for saved-blogs endpoint
//     methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
//     allowedHeaders: ["Content-Type", "Access-Control-Allow-Credentials", "Authorization"],
//     credentials: true, // mandoatory for google auths
//   })
// );


// ── CORS — strict allow-list ──────────────────────────────────────────────────
// Only the configured frontend origin(s) may make browser (cross-origin) calls.
// Falsy env vars are dropped, so leaving the legacy panel vars unset means ONLY
// FRONTEND_URL is permitted. To lock it down to just the main frontend, set only
// FRONTEND_URL and leave the others empty.
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.BLOGGERSPACE1,
  process.env.BLOGGERSPACE2,
  process.env.PANEL2BLOGGERSPACE1,
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // No Origin header → not a browser cross-origin request (Next.js SSR/ISR
    // server-side data fetches, health checks, curl). These aren't subject to the
    // browser same-origin policy and must be allowed, or server rendering breaks.
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  // Authorization → Bearer JWT; PATCH → saved-blogs / settings toggles.
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // required for the Google/GitHub OAuth cookie flow
  maxAge: 86400, // cache preflight 24h → far fewer OPTIONS round-trips
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // answer preflight for every route

// ── IMPORTANT: CORS is NOT a security boundary ───────────────────────────────
// The allow-list above only stops a *browser* on another website from reading our
// responses. It does NOT stop anyone from CALLING these endpoints — curl, Postman,
// scripts and server-to-server requests send no Origin header (and are allowed above
// for SSR), so they bypass CORS entirely and can hit any route with any method.
// What actually protects the API is the JWT auth middleware (authenticate /
// adminMiddleware / reviewerMiddleware) on each route + the guards below.

// ── NoSQL-injection sanitiser (dependency-free) ──────────────────────────────
// Strips keys starting with "$" or containing "." from bodies & query objects so a
// client can't smuggle Mongo operators (e.g. {"email":{"$ne":null}}) into a query.
function sanitizeMongo(obj, depth = 0) {
  if (!obj || typeof obj !== "object" || depth > 8) return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete obj[key];
      continue;
    }
    const val = obj[key];
    if (val && typeof val === "object") sanitizeMongo(val, depth + 1);
  }
}
app.use((req, _res, next) => {
  sanitizeMongo(req.body);
  sanitizeMongo(req.query);
  next();
});

// Shared secret guard for internal/expensive endpoints (logs, auto-write). Accepts
// the secret via ?secret= or the x-internal-secret header.
function requireSecret(envName, { failClosed = true } = {}) {
  return (req, res, next) => {
    const expected = process.env[envName];
    if (!expected) {
      if (failClosed) return res.status(403).json({ error: "Forbidden" });
      console.warn(`[security] ${envName} not set — this endpoint is UNPROTECTED.`);
      return next();
    }
    const got = req.query.secret || req.headers["x-internal-secret"];
    if (got !== expected) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}

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
      // Secure (HTTPS-only) in the Cloud runtime; false for local http dev.
      secure: !!process.env.K_SERVICE,
      httpOnly: true,        // not readable by client-side JS (XSS hardening)
      sameSite: "lax",       // sent on top-level OAuth redirects, blocked on cross-site POSTs
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days — keeps OAuth sessions alive across tab/browser restarts
    },
  })
);

// Sitemap (must be after CORS so cross-origin admin requests work)
app.use("/api", sitemapRouter);

// Maintenance mode is now controlled by the MAINTENANCE_MODE env var on the
// frontend (read in Next.js middleware) — no backend polling endpoint needed.

// Passport Login/Signup
app.use(passport.initialize());
app.use(passport.session(false));

// User Routes
app.use("/api/users", authRoutes);

//Blog routes
app.use("/api/blogs", blogs);

//Reviewer Panel
app.use("/api/reviewer/", reviewerRoutes);

//Admin Panel
app.use("/api/admin/", adminRoutes);

// Community
app.use("/api/community", communityRoutes);

// Reviews (public + user-submitted + admin moderation)
app.use("/api/reviews", reviewsRoutes);

//Auto Writing Blogs — AI generation + auto-publish is triggered ONLY from the admin
// dashboard ("Write next AI blog"), so it's locked behind admin auth. The admin client
// sends its Bearer token, which adminMiddleware verifies.
app.use("/api/autowrite", adminMiddleware, autoWriteBlogs);

// Analytics
app.use("/api/analytics", analyticsRoutes);

// Push notifications — FCM token registration (logged-in users)
app.use("/api/notifications", notificationRoutes);

// Log-capture endpoint disabled (not needed). It exposed internal logs (PII/errors),
// so it stays off. To re-enable: uncomment + keep it behind requireSecret("LOGS_SECRET").
// const { uploadLogsToGitHub } = require("./utils/uploadToGitHub");
// app.get("/api/logs", requireSecret("LOGS_SECRET"), (req, res) => {
//   uploadLogsToGitHub();
//   res.json(
//     "Logs uploaded to GitHub: " +
//       new Date(new Date().getTime() + 330 * 60000).toISOString()
//   );
// });

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
// ── Central error handler (last middleware) ──────────────────────────────────
// Maps CORS rejections to a clean 403 and prevents stack traces / internal details
// from leaking to clients. Must be defined after all routes.
app.use((err, req, res, next) => {
  if (err && err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "Origin not allowed by CORS" });
  }
  console.error("Unhandled error:", err && err.stack ? err.stack : err);
  if (res.headersSent) return next(err);
  res.status(err && err.status ? err.status : 500).json({ error: "Internal server error" });
});

// Only start a standalone HTTP server when this file is run directly
// (e.g. `node app.js` for local dev). On Firebase, the function is served by
// `onRequest(app)` below — calling app.listen() at import time would start a
// stray server that keeps the deploy-time code analysis from settling and
// causes "Cannot determine backend specification. Timeout after 10000".
if (require.main === module) {
  app.listen(PORT, () =>
    console.log("Server started at " + PORT + " and pid: " + process.pid)
  );
}

// 512 MiB (up from the 256 MiB default): the Express app serves heavy blog
// endpoints (full article content is decompressed in-memory) and gen2 functions
// run many requests concurrently per instance — 256 MiB was being exceeded under
// load, crashing the instance and 503-ing in-flight requests.
exports.bloggerspacebackend2 = onRequest({ memory: "512MiB" }, app);
// exports.bloggerspacebackend = functions.https.onRequest(app);

// ── Scheduled trending-blog digest (FCM) ──────────────────────────────────────
// Runs once daily at 09:00 IST. Cost-optimised: it exits almost immediately
// unless a digest is actually due (per the admin-configured frequency) AND new
// trending content exists. ~30 invocations/month. Requires the Blaze plan.
const { runNotificationCycle } = require("./services/notifications");
exports.dailyTrendingNotification = onSchedule(
  { schedule: "every day 09:00", timeZone: "Asia/Kolkata", memory: "256MiB", timeoutSeconds: 120 },
  async () => {
    try {
      const summary = await runNotificationCycle();
      console.log("dailyTrendingNotification:", JSON.stringify(summary));
    } catch (err) {
      console.error("dailyTrendingNotification failed:", err);
    }
  },
);
