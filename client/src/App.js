import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import LoginPage from "components/LoginPage/LoginPage.js";
import SignupPage from "components/SignUpPage/SignupPage.js";
import Header from "components/Header/Header.js";
import Footer from "components/Footer/Footer.js";
import HomePage from "components/HomePage/HomePage.js";
import ViewBlog from "components/Posts/ViewBlog/ViewBlog.js";
import NewBlog from "components/Posts/NewBlog/NewBlog.js";
import EditBlog from "components/Posts/EditBlog/EditBlog.js";
import VerifyAccountPage from "components/VerifyAccount/VerifyAccountPage.js";
import Settings from "components/Settings/Settings.js";
import ForgotPasswordPage from "components/PasswordPage/ForgotPassword/ForgotPasswordPage.js";
import ResetPasswordPage from "components/PasswordPage/ResetPassword/ResetPasswordPage.js";
import ChangePasswordPage from "components/PasswordPage/ChangePassword/ChangePasswordPage.js";
import MyProfilePage from "components/MyProfile/MyProfilePage.js";
import UserProfile from "components/UserProfilePage/UserProfile.js";
import MyBlogs from "components/Posts/MyBlogs/MyBlogs.js";
import AboutDeveloper from "components/AboutDeveloper/AboutDeveloper.js";
import WritingGuidelines from "components/WritingGuidelines/WritingGuidelines.js";
import PageNotFound from "components/PageNotFound/PageNotFound.js";
import { Helmet } from "react-helmet";
import Sitemap from "components/Sitemap/Sitemap.js";
import SavedBlogs from "components/Posts/SavedBlogs/SavedBlogs.js";
import PrivacyPolicy from "components/Footer/PrivacyPolicy/PrivacyPolicy.js";
import TermsAndConditions from "components/Footer/TermsAndConditions/TermsAndConditions.js";
import AboutBloggerSpace from "components/Footer/AboutBloggerSpace/AboutBloggerSpace.js";
import CommunityPage from "components/Community/CommunityPage.js";
import ViewCommunityPost from "components/Community/ViewCommunityPost.js";
import AllBlogs from "components/Posts/AllBlogs/AllBlogs.js";
import AuthSuccess from "utils/AuthSuccess.js";
import ImproveBlog from "components/Posts/ImproveBlog/ImproveBlog.js";
import AdminBlogs from "components/Posts/AdminBlogs/AdminBlogs";
import ScrollToTop from "utils/ScrollToTop";

const App = () => {
  return (
    <>
      <BrowserRouter>
        <Header />

        <Helmet>
          <meta
            name="description"
            content="A blogging website where anyone can signup and start writing blogs on any topic. Features: Create new blog, save as draft the blog, Change password, Email verification for new
    users, View public profile of any user, Change username, like and comment, visitors count, admin dashboard. This website is developed by Teekam Singh"
          />
          <title>BloggerSpace</title>

          <meta
            name="keywords"
            content="blogging, blogs, technicalblogs, teekam, singhteekam, singh_teekam, singh__teekam, bloggerspace, bloggingwebsite, articles, technical, tcs, abes, react "
          />
          <meta name="apple-mobile-web-app-title" content="BloggerSpace" />

          <meta property="og:title" content="BloggerSpace" />
          <meta
            property="og:description"
            content="A blogging website where anyone can signup and start writing blogs on any topic. Features: Create new blog, save as draft the blog, Change password, Email verification for new
    users, View public profile of any user, Change username, like and comment, visitors count, admin dashboard. This website is developed by Teekam Singh"
          />
          <meta property="og:image" content="%PUBLIC_URL%/BLOGGERSPACE.png" />
          <meta
            property="og:url"
            content={window.location.href}
          />
          <meta property="og:type" content="website" />

          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="BloggerSpace" />
          <meta
            name="twitter:description"
            content="A blogging website where anyone can signup and start writing blogs on any topic. Features: Create new blog, save as draft the blog, Change password, Email verification for new
    users, View public profile of any user, Change username, like and comment, visitors count, admin dashboard. This website is developed by Teekam Singh"
          />
          <meta name="twitter:image" content="%PUBLIC_URL%/BLOGGERSPACE.png" />
          <meta name="twitter:site" content="@singh__teekam" />

          <link rel="canonical" href={window.location.href} />

          
        <script charset="utf-8" src="//cdn.iframe.ly/embed.js?api_key=0737793c1d093bd321e4d7"></script>
        </Helmet>

        <main>
        <ScrollToTop />
          <Routes>
            <Route path="/" element={<HomePage />} exact />
            <Route path="/blogs" element={<AllBlogs />} />
            <Route path="/login" element={<LoginPage />} />
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
            <Route path="/aboutdeveloper" element={<AboutDeveloper />} />
            <Route path="/guidelines" element={<WritingGuidelines />} />
            <Route path="/savedblogs" element={<SavedBlogs />} />
            <Route path="/improveblog/:blogId" element={<ImproveBlog />} />
            <Route path="/sitemap" element={<Sitemap />} />
            <Route path="/privacypolicy" element={<PrivacyPolicy />} />
            <Route path="/termsandconditions" element={<TermsAndConditions />} />
            <Route path="/about" element={<AboutBloggerSpace />} />
            
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/community/post/:communityPostId/:communityPostSlug" element={<ViewCommunityPost />} />

            <Route path="/adminblogs" element={<AdminBlogs />} />

            <Route path="/auth-success" element={<AuthSuccess />} />
            <Route path="*" element={<PageNotFound />} />
            {/* <Route path="*" element={<Navigate to="/" />} /> */}
            {/* <Route element={<PageNotFound />} /> */}
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </>
  );
};

export default App;
