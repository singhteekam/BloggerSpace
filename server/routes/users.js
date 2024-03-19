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
} = require("../controllers/userscontroller");

const authenticate = require("../middlewares/authenticate");
const multer = require("multer");
const { checkUserName } = require("../utils/checkUsername");
const { discardBlogFromDB } = require("../utils/discardBlog");

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

// Visitors
router.get("/visitors", getVisitorCount);
router.post("/addvisitor",incrementVisitCount);

module.exports = router;
