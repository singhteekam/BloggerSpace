// routes/users.js
const express = require("express");
const router = express.Router();
const {
  signup,
  login,
  verifyAccount,
  verifyAccountget,
  verifyOtp,
  resendOtp,
  logout,
  deleteAccount,
  deactivateAccount,
  forgetPassword,
  resetPassword,
  changePassword,
  uploadProfilePicture,
  loggedInUserInfo,
  userProfile,
  updateUserPersonalDetails,
  setNewsletterOptIn,
  addReadingHistory,
  getReadingHistory,
  incrementVisitCount,
  getVisitorCount,
  addBlogToSavedBlogs,
  removeBlogFromSavedBlogs,
  getSavedBlogsOfUser,
  followUser,
  unfollowUser,
  getFollowStatus,
  contactUs,
  oauthGoogleCallback,
  authGithubCallback,
  authPassportCallback,
  fileUpload,
  fetchUploadedFiles,
  uploadProfilePicture2,
  requestLoginOtp,
  verifyLoginOtp,
  forgotPasswordRequestOtp,
  forgotPasswordVerifyOtp,
  forgotPasswordReset,
  sendReverifyOtp,
  verifyReverifyOtp,
} = require("../controllers/userscontroller");

const authenticate = require("../middlewares/authenticate");
const multer = require("multer");
const { checkUserName } = require("../utils/checkUsername");
const { discardBlogFromDB } = require("../utils/discardBlog");

// const passport = require('./../services/oauth2.js');  bkp
const passport= require("passport");

const storage = multer.memoryStorage(); // Use memory storage for storing the uploaded file
const upload = multer({ storage });

////////////////////////////////////////////////////////////////////////////////

// Route for verifying the user account
router.post("/verify-account", verifyAccount);

router.get("/verify-account", verifyAccountget);

// Route for the verification success page
router.get("/verification-success", (req, res) => {
  res.send("Account verification successful!");
});

// Signup route
router.post("/signup", signup);

// Login route
router.post("/login", login);

// OTP verification routes (used after signup and for unverified accounts on login)
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

// Passwordless OTP login
router.post("/login-otp/request", requestLoginOtp);
router.post("/login-otp/verify", verifyLoginOtp);

// Forgot password via OTP (replaces email-link flow)
router.post("/forgot-password/request-otp", forgotPasswordRequestOtp);
router.post("/forgot-password/verify-otp", forgotPasswordVerifyOtp);

// Periodic re-verification (Email-auth users only)
router.post("/reverify-otp/send", sendReverifyOtp);
router.post("/reverify-otp/verify", verifyReverifyOtp);
router.post("/forgot-password/reset", forgotPasswordReset);

// Login with Google
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
router.get("/auth/google/callback", passport.authenticate("google", {
  session: false, // Disable session in callback
  // successRedirect: `${process.env.FRONTEND_URL}`,
  // failureRedirect: "/auth/login/failed"
}), authPassportCallback);

// Login with Github
router.get('/auth/github',
  passport.authenticate('github', { scope: [ 'user:email' ] })
);
router.get("/auth/github/callback", passport.authenticate("github", {
  session: false, // Disable session in callback
}), authPassportCallback);

// // Login with Microsoft
// router.get('/auth/microsoft',
//   passport.authenticate('azuread-openidconnect')
// );
// router.post("/auth/microsoft/callback", passport.authenticate("azuread-openidconnect", {
//   session: false, // Disable session in callback
// }), authPassportCallback);


// // Login with Facebook
// router.get('/auth/facebook',
//   passport.authenticate('facebook', { scope: ['email'] })
// );

// router.get("/auth/facebook/callback", passport.authenticate("facebook", {
//   session: false, // Disable session in callback
// }), authFacebookCallback);


// // Login with Linkedin
// router.get('/auth/linkedin',
//   passport.authenticate('linkedin',{ scope: ['r_basicprofile', 'r_emailaddress'] })
// );

// router.get("/auth/linkedin/callback", passport.authenticate("linkedin", {
//   session: false, // Disable session in callback
// }), authLinkedinCallback);

// // Login with Twitter
// router.get('/auth/twitter',
//   passport.authenticate('twitter',{ scope: ['tweet.read', 'users.read', 'offline.access'] })
// );

// router.get("/auth/twitter/callback", passport.authenticate("twitter", {
//   session: false, // Disable session in callback
// }), authTwitterCallback);

// router.get('/auth/google/auth/login/success', oauthGoogleCallback);

// router.get('/auth/login/success', async(req, res)=>{
//   console.log("Req user 74 users: ", req.user);
//   if(req.user){
//     console.log("222Req user 76 users: ", req.user);
//     res.status(200).json({
//       success:true,
//       message: "successful",
//       user: req.user,
//       cookies: req.cookies
//     })
//   }
// });
// router.get('/auth/login/success', oauthGoogleCallback);

router.get('/auth/login/failed', async(req, res) => {
  return res.status(401).json({
      success: false,
      message: "Sign in with google failed"
  })
});


// Logout route
router.post("/logout", logout);

// Delete user account route (soft-delete; auth ensures users delete only their own)
router.delete("/delete", authenticate, deleteAccount);

router.patch("/deactivate", authenticate, deactivateAccount);

// Password reset POST route for sending the password reset email
router.post("/forgotpassword", forgetPassword);

// Post request to update password in db
router.post("/resetpassword", resetPassword);

//Change Password
router.post("/changepassword", authenticate, changePassword);

//Update Profil pic
router.post("/uploadprofilepicture", uploadProfilePicture2);
// router.post("/uploadprofilepicture", upload.single("profilePicture"), uploadProfilePicture);

// User Info
router.get("/userinfo", loggedInUserInfo);

// User Profile
router.get("/profile/:username", userProfile);

// Check username
router.post("/checkusername", checkUserName);

//Update username
router.patch("/updateusername", authenticate, updateUserPersonalDetails);

// Newsletter opt-in toggle
router.patch("/newsletter-optin", authenticate, setNewsletterOptIn);

// Reading history
router.post("/reading-history", authenticate, addReadingHistory);
router.get("/reading-history", authenticate, getReadingHistory);

router.post("/discard/blog/:id", authenticate, discardBlogFromDB);

// add to savedBlogs
router.patch("/addtosavedblogs", authenticate, addBlogToSavedBlogs);

// remove from savedBlogs
router.delete("/removefromsavedblogs/:blogSlug", authenticate, removeBlogFromSavedBlogs);

//Get Saved blogs
router.get("/savedblogs", authenticate, getSavedBlogsOfUser);

// Follow and Unfollow
router.patch("/follow/:idToFollow", authenticate, followUser);
router.patch("/unfollow/:idToUnfollow", authenticate, unfollowUser);
router.get("/followstatus/:targetId", getFollowStatus);

// Contact us
router.post("/contactus",contactUs);

// Visitors
router.get("/visitors", getVisitorCount);
router.post("/addvisitor",incrementVisitCount);

router.post("/fileupload", fileUpload);
// router.post("/fileupload", upload.single("file"), fileUpload);

router.get("/uploadedfiles/fetch", fetchUploadedFiles);

// Redemption requests (Phase 4)
const { createRedemption, listOwnRedemptions } = require("../controllers/redemptionController");
router.post("/redemptions", authenticate, createRedemption);
router.get("/redemptions/me", authenticate, listOwnRedemptions);

// Gems transaction history for logged-in user
const GemsTransaction = require("../models/GemsTransaction");
router.get("/gems/history", authenticate, async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip  = (page - 1) * limit;
    const userId = req.user?._id || req.query.userId;
    const [transactions, total] = await Promise.all([
      GemsTransaction.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      GemsTransaction.countDocuments({ userId }),
    ]);
    res.json({ transactions, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch gems history" });
  }
});

module.exports = router;
