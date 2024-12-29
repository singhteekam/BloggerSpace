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
  oauthGoogleCallback,
  authGithubCallback,
  authPassportCallback,
  fileUpload,
  fetchUploadedFiles,
  uploadProfilePicture2,
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

// Delete user account route
router.delete("/delete", deleteAccount);

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

router.post("/fileupload", fileUpload);
// router.post("/fileupload", upload.single("file"), fileUpload);

router.get("/uploadedfiles/fetch", fetchUploadedFiles);

module.exports = router;
