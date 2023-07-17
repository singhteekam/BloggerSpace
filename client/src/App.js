import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import LoginPage from "./components/LoginPage/LoginPage.js";
import SignupPage from "./components/SignUpPage/SignupPage.js";
import Header from "./components/Header/Header.js";
import Footer from "./components/Footer/Footer.js";
import HomePage from "./components/HomePage/HomePage.js";
import ViewBlog from "./components/Posts/ViewBlog/ViewBlog.js";
import NewBlog from "./components/Posts/NewBlog/NewBlog.js";
import EditBlog from "./components/Posts/EditBlog/EditBlog.js";
import VerifyAccountPage from "./components/VerifyAccount/VerifyAccountPage.js";
import Settings from "./components/Settings/Settings.js";
import ForgotPasswordPage from "./components/PasswordPage/ForgotPassword/ForgotPasswordPage.js";
import ResetPasswordPage from "./components/PasswordPage/ResetPassword/ResetPasswordPage.js";
import ChangePasswordPage from "./components/PasswordPage/ChangePassword/ChangePasswordPage.js";
import MyProfilePage from "./components/MyProfile/MyProfilePage.js";
import UserProfile from "./components/UserProfilePage/UserProfile.js";
import MyBlogs from "./components/Posts/MyBlogs/MyBlogs.js";

const App = () => {

  return (
    <>
      <BrowserRouter>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} exact />
            <Route path="/login" element={<LoginPage />} exact />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/mynotes" element={<SignupPage />} />
            <Route path="/:blogSlug" element={<ViewBlog />} />
            <Route path="/newblog" element={<NewBlog />} />
            <Route path="/editblog/:id" element={<EditBlog />} />
            <Route path="/verify-account" element={<VerifyAccountPage />} />
            <Route path="/myprofile" element={<MyProfilePage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/forgotpassword" element={<ForgotPasswordPage />} />
            <Route path="/profile/:username" element={<UserProfile />} />
            <Route
              path="/resetpassword/:resetToken"
              element={<ResetPasswordPage />}
            />
            <Route path="/changepassword" element={<ChangePasswordPage />} />
            <Route path="/myblogs" element={<MyBlogs />} />


          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </>
  );
};

export default App;
