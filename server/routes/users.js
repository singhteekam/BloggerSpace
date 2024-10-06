// routes/users.js
const express = require("express");
const router = express.Router();
const {
  signup,
  login,
  verifyAccount,
  verifyAccountget,
  logout,
  deleteAccount,
  forgetPassword,
  resetPassword,
  changePassword,
  uploadProfilePicture,
  loggedInUserInfo,
  userProfile,
  updateUserPersonalDetails,
  incrementVisitCount,
  getVisitorCount,
  addBlogToSavedBlogs,
  removeBlogFromSavedBlogs,
  getSavedBlogsOfUser,
  followUser,
  unfollowUser,
  contactUs,
  oauthGoogleSuccess,
  oauthGoogleCallback,
} = require("../controllers/userscontroller");

const authenticate = require("../middlewares/authenticate");
const multer = require("multer");
const { checkUserName } = require("../utils/checkUsername");
const { discardBlogFromDB } = require("../utils/discardBlog");

// const passport = require('./../services/oauth2.js');  bkp

const passport= require("passport");
const jwt = require("jsonwebtoken");

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

// Login with Google
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// router.get('/auth/google/callback', 
//   passport.authenticate('google', { failureRedirect: '/' }),
//   oauthGoogleCallback
// );

router.get("/auth/google/callback", passport.authenticate("google", {
  session: false, // Disable session in callback
  // successRedirect: `${process.env.FRONTEND_URL}`,
  // failureRedirect: "/auth/login/failed"
}), oauthGoogleCallback);

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
router.get('/auth/login/success', oauthGoogleCallback);

router.get('/auth/login/failed', async(req, res) => {
  return res.status(401).json({
      success: false,
      message: "Sign in with google failed"
  })
});


// Logout route
router.post("/logout", logout);

// Delete user account route
router.delete("/delete", deleteAccount);

// Password reset POST route for sending the password reset email
router.post("/forgotpassword", forgetPassword);

// Post request to update password in db
router.post("/resetpassword", resetPassword);

//Change Password
router.post("/changepassword", authenticate, changePassword);

//Update Profil pic
const storage = multer.memoryStorage(); // Use memory storage for storing the uploaded file
const upload = multer({ storage });
router.post("/uploadprofilepicture", upload.single("profilePicture"), uploadProfilePicture);

// User Info
router.get("/userinfo", loggedInUserInfo);

// User Profile
router.get("/profile/:username", userProfile);

// Check username
router.post("/checkusername", checkUserName);

//Update username
router.patch("/updateusername", authenticate, updateUserPersonalDetails);

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

// Contact us
router.post("/contactus",contactUs);

// Visitors
router.get("/visitors", getVisitorCount);
router.post("/addvisitor",incrementVisitCount);

module.exports = router;
