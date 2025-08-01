import React, { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Card,
  Button,
  Spinner,
  Badge,
  Image,
} from "react-bootstrap";
import {
  FacebookShareButton,
  WhatsappShareButton,
  WhatsappIcon,
  FacebookIcon,
  TwitterShareButton,
  TwitterIcon,
  LinkedinShareButton,
  LinkedinIcon,
  TelegramShareButton,
  TelegramIcon,
  FacebookMessengerShareButton,
  FacebookMessengerIcon,
} from "react-share";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { IoBookmarkOutline, IoBookmark } from "react-icons/io5";
import { FaEye, FaReply } from "react-icons/fa";
import LoginPageModal from "../../../utils/LoginPageModal";
import PageNotFound from "../../PageNotFound/PageNotFound";
import { motion, useScroll, useSpring } from "framer-motion";
import TableOfContent from "./TOC/TableOfContent";
import PreLoader from "utils/PreLoader";

import { AuthContext } from "contexts/AuthContext";
import MostViewedBlogs from "./MostViewedBlogs";
import RelatedBlogs from "./RelatedBlogs";
import { MdDownload } from "react-icons/md";
import { useBlogs } from "contexts/BlogContext";
import decompressBase64Content from "utils/decompressBase64Content";

const ViewBlog = () => {
  const { blogs, loading } = useBlogs();
  const { user, logout } = useContext(AuthContext);
  const { blogSlug } = useParams();
  const [blog, setBlog] = useState(null);
  // const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState("");
  const [replyCommentContent, setReplyCommentContent] = useState("");
  const [comments, setComments] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [thumbColor, setThumbColor] = useState("regular");
  const [isBlogSaved, setIsBlogSaved] = useState(false);
  const [disableLikeButton, setDisableLikeButton] = useState(false);
  const [disableFollowButton, setDisableFollowButton] = useState(true);

  const [commentThumbColor, setCommentThumbColor] = useState("regular");
  const [disableCommentLikeButton, setDisableCommentLikeButton] =
    useState(false);
  // const [notFound, setNotFound] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const token = localStorage.getItem("token");
  const [userId, setUserId] = useState(user?._id);

  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setUserId(user?._id);
      setDisableFollowButton(false);
      for (let index = 0; index < user.savedBlogs.length; index++) {
        if (
          user.savedBlogs[index].slug ===
          window.location.href.slice(window.location.href.lastIndexOf("/") + 1)
        ) {
          setIsBlogSaved(true);
          break;
        }
      }
    }
  }, [user]);

  useEffect(() => {
    const fetchBlogViews = async () => {
      const blogTotalViews0 = sessionStorage.getItem("blogTotalViews");
      let blogTotalViews = JSON.parse(blogTotalViews0);
      console.log("1: " + blogTotalViews);

      if (blogTotalViews === null || !blogTotalViews.includes(blogSlug)) {
        if (blogTotalViews === null) blogTotalViews = [];
        blogTotalViews.push(blogSlug);
        sessionStorage.setItem(
          "blogTotalViews",
          JSON.stringify(blogTotalViews)
        );
        const response = await axios.patch(`/api/blogs/updateblogviews`, {
          blogSlug,
        });
        setBlog((prevBlog) => ({
          ...prevBlog,
          blogViews: response.data.totalViews,
        }));
      }
    };

    // const fetchLoggedInUser = async () => {
    //   await axios
    //     .get("/api/users/userinfo", {
    //       headers: { Authorization: `Bearer ${token}` },
    //     })
    //     .then((response) => {
    //       const user = response.data;
    //       // console.log(user);
    //       setUserInfo(user);
    //       setDisableFollowButton(false);
    //       for (let index = 0; index < user.savedBlogs.length; index++) {
    //         if (
    //           user.savedBlogs[index].slug ===
    //           window.location.href.slice(
    //             window.location.href.lastIndexOf("/") + 1
    //           )
    //         ) {
    //           setIsBlogSaved(true);
    //           break;
    //         }
    //       }
    //       // setLoading(false);
    //     })
    //     .catch((error) => {
    //       console.error("Error fetching user information:", error);
    //       // setLoading(false);
    //     });
    // };

    // const fetchBlog = async () => {
    //   try {
    //     const response = await axios.get(`/api/blogs/${blogSlug}`);
    //     setBlog(response.data.blog);
    //     console.log("Blog fetched at: " + new Date());
    //     if (response.data.alreadyLiked === true) setThumbColor("solid");

    //     setLoading(false);

    //   } catch (error) {
    //     console.error("Error fetching Blog:", error);
    //     setLoading(false);
    //     // setNotFound(true);
    //   }
    // };

    // const fetchComments = async () => {
    //   try {
    //     const response = await axios.get(`/api/blogs/${blogSlug}/comments`);
    //     setComments(response.data);
    //   } catch (error) {
    //     console.error("Error fetching comments:", error);
    //   }
    // };

    // fetchLoggedInUser();
    fetchBlog();
    // fetchComments();
    fetchBlogViews();
  }, [blogSlug, blogs]);

  const fetchBlog = async () => {
    try {
      const blog = blogs?.find((b) => b.slug === blogSlug);
      if (blog) {
        setBlog(blog);
        setBlog((prevBlog) => ({
          ...prevBlog,
          content: decompressBase64Content(blog.content),
        }));
        // setLoading(false);
      }
      const response = await axios.get(`/api/blogs/${blogSlug}`);
      // setBlog(response.data.blog);
      console.log("Blog fetched at: " + new Date());
      if (response.data.alreadyLiked === true) setThumbColor("solid");

      // setLoading(false);
    } catch (error) {
      console.error("Error fetching Blog:", error);
      // setLoading(false);
      // setNotFound(true);
    }
  };

  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    if (commentContent.trim().length === 0) {
      toast.info("Comment content is empty");
      return;
    }

    try {
      const response = await axios.post(
        `/api/blogs/${blogSlug}/comments?userId=${userId}`,
        {
          content: commentContent,
          userId: userId,
        }
      );
      // fetchBlog();
      console.log("Comment submitted at: ", response.data.content);
      setBlog((prevBlog) => ({
        ...prevBlog,
        comments: response.data,
      }));
      setCommentContent("");
      toast.success("Comment submitted!!");
    } catch (error) {
      toast.error("Error submitting comment!");
      console.error("Error submitting comment:", error);
    }
  };

  const handleReplyCommentSubmit = async (e, commentId) => {
    e.preventDefault();
    if (replyCommentContent.trim().length === 0) {
      toast.info("Comment content is empty");
      return;
    }

    try {
      const response = await axios.post(
        `/api/blogs/${blogSlug}/comments/reply?userId=${userId}`,
        {
          repliedToCommentId: commentId,
          replyCommentContent: replyCommentContent,
        }
      );
      // fetchBlog();
      // setBlog((prevBlog) => ({
        //   ...prevBlog,
        //   comments: response.data,
        // }));
        setReplyCommentContent("");
        toast.success("Replied to comment!");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
    } catch (error) {
      toast.error("Error submitting comment!");
      console.error("Error submitting comment:", error);
    }
  };

  const handleBlogLikes = async () => {
    if (!userId) {
      toast.error("Please login to like the blog");
      return;
      // return <LoginPageModal show={true} handleClose={null} />;
    }
    try {
      setDisableLikeButton(true);
      const response = await axios.post(
        `/api/blogs/bloglikes/${blog._id}?userId=${userId}`,
        {
          thumbColor,
        }
      );
      setThumbColor(response.data.newThumbColor);
      setBlog((prevBlog) => ({
        ...prevBlog,
        // likes: response.data.newLikes,
        blogLikes: response.data.newLikes,
      }));
      setDisableLikeButton(false);
      if (response.data.newThumbColor === "regular")
        toast.info("You disliked this blog");
      else toast.success("You liked this blog");
      // window.location.reload();
    } catch (error) {
      toast.error("Error occured when liking the blog..");
      console.error("Error submitting like:", error);
    }
  };

  const handleCommentLike = async (commentId) => {
    if (!user) {
      console.log("Inside if");
      navigate("/login");
      // return <LoginPageModal show={true} handleClose={null} />;
    }
    try {
      console.log(commentId);
      setDisableCommentLikeButton(true);
      const response = await axios.post(
        `/api/blogs/blogcommentlike/${blog._id}?userId=${userId}`,
        { commentId, commentThumbColor }
      );
      console.log(response.data);
      setCommentThumbColor(response.data.newCommentThumbColor);
      setComments([...response.data.updatedComments]);
      setDisableCommentLikeButton(false);
      // window.location.reload();
    } catch (error) {
      console.error("Error submitting like:", error);
    }
  };

  const addToSavedBlogs = async () => {
    try {
      const blogDetails = {
        title: blog.title,
        slug: blog.slug,
        category: blog.category,
        tags: blog.tags,
      };
      const response = await axios.patch(
        `/api/users/addtosavedblogs?userId=${userId}`,
        blogDetails
      );
      setIsBlogSaved(true);
      toast.success("Blog saved to SavedBlogs");
    } catch (error) {
      toast.error("Error saving blog to savedBlogs");
      console.error("Error saving blog to savedBlogs:", error);
    }
  };

  const removeFromSavedBlogs = async () => {
    try {
      const response = await axios.delete(
        `/api/users/removefromsavedblogs/${blog.slug}?userId=${userId}`
      );
      console.log("Removed from savedBlogs");
      setIsBlogSaved(false);
      toast.info("Blog removed from SavedBlogs");
    } catch (error) {
      console.error("Error removing blog from savedBlogs:", error);
    }
  };

  const handleFollowUser = async (idToFollow) => {
    try {
      console.log("Userid: ", userId);
      setDisableFollowButton(true);
      const response = await axios.patch(
        `/api/users/follow/${idToFollow}?userId=${userId}`
      );
      toast.success("Following.");
      console.log("Following....");
      setIsFollowing(true);
      setDisableFollowButton(false);
      fetchBlog();
      // window.location.reload();
    } catch (error) {
      setDisableFollowButton(false);
      toast.error("Error occured!! Please try again");
      console.log("Error: ", error);
    }
  };

  const handleUnfollowUser = async (idToUnfollow) => {
    try {
      setDisableFollowButton(true);
      const response = await axios.patch(
        `/api/users/unfollow/${idToUnfollow}?userId=${userId}`
      );
      toast.success("Unfollowed.");
      console.log("Unfollowed....");
      setIsFollowing(false);
      setDisableFollowButton(false);
      fetchBlog();
      // window.location.reload();
    } catch (error) {
      setDisableFollowButton(false);
      toast.error("Error occured!! Please try again");
      console.log(error);
    }
  };

  const handleDownloadBlog = async () => {
    const pdfData = {
      title: blog.title,
      category: blog.category,
      lastUpdated: blog.lastUpdatedAt,
      tags: blog.tags,
      content: stripHtmlTags(blog.content),
      author: blog.authorDetails.fullName,
    };
    console.log(pdfData);
    axios
      .post("/api/blogs/downloadblog", pdfData, {
        responseType: "blob", // important to handle binary data (PDF file)
      })
      .then((response) => {
        // Create a Blob from the PDF data
        const url = window.URL.createObjectURL(new Blob([response.data]));

        // Create a temporary link element to trigger the file download
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${blog.slug}.pdf`); // Specify file name
        document.body.appendChild(link);
        link.click(); // Trigger the download
      })
      .catch((error) => {
        console.error("Error generating PDF report", error);
      });
  };

  if ( loading) {
    return <PreLoader isLoading={loading} />;
  }

  if (!blog) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <div>Blog not found.</div>
      </Container>
    );
  }

  // if (notFound) {
  //   // Render the PageNotFound component when an error occurs
  //   console.log("blog not found")
  //   return <PageNotFound />;
  // }

  function stripHtmlTags(html) {
    // Create a temporary div element
    const tempDiv = document.createElement("div");

    // Set the innerHTML of the div to your HTML content
    tempDiv.innerHTML = html;

    // Retrieve the text content without HTML tags
    const textContent = tempDiv.textContent || tempDiv.innerText;

    return textContent;
  }

  return (
    <section className="newpage-section">
      <ToastContainer />

      <Helmet>
        <meta name="description" content={stripHtmlTags(blog?.content)} />
        <title>{blog?.title} - BloggerSpace</title>

        <meta property="og:title" content={blog?.title} />
        <meta
          property="og:description"
          content={stripHtmlTags(blog?.content)}
        />

        <meta name="twitter:title" content={blog?.title} />
        <meta
          name="twitter:description"
          content={stripHtmlTags(blog?.content)}
        />
      </Helmet>

      <Container>
        {blog && (
          <div className="viewblog-flex">
            <div className="viewblog-flex1">

              <Card className="view-blog-card">
                <Card.Body>
                  <Card.Title>{blog?.title}</Card.Title>
                  <i>Category: {blog?.category}</i>
                  <br />
                  {blog?.tags &&
                    blog?.tags.map((tag) => (
                      <Badge key={tag} pill bg="secondary" className="mx-1">
                        {tag}
                      </Badge>
                    ))}{" "}
                  <hr />
                  <div dangerouslySetInnerHTML={{ __html: blog?.content }} />
                </Card.Body>
                <div>
                  <i className="mx-3">
                    Last Updated: {blog?.lastUpdatedAt?.slice(0, 10)}
                  </i>
                  <i
                    className={`fa-${thumbColor} fa-thumbs-up fa-xl`}
                    onClick={
                      disableLikeButton === false ? handleBlogLikes : null
                    }
                  ></i>{" "}
                  {/* {blog?.likes.length} */}
                  {blog?.blogLikes?.length}
                  {isBlogSaved ? (
                    <IoBookmark
                      size="25px"
                      onClick={() => removeFromSavedBlogs()}
                    />
                  ) : (
                    <IoBookmarkOutline
                      size="25px"
                      onClick={() => addToSavedBlogs()}
                    />
                  )}
                </div>
                <h6>
                  <FaEye size="20px" /> {blog.blogViews} views
                </h6>
                {blog.status === "PUBLISHED" && (
                  <div>
                    <Link
                      className="btn bs-button-outline"
                      // to={`/improveblog/${blog.blogId}`}
                      to="#"
                    >
                      <i className="fa-solid fa-pen-to-square"></i> Improve Blog
                    </Link>
                  </div>
                )}
                <br />
                <Card.Footer className="d-flex justify-content-left">
                  {blog.status === "PUBLISHED" &&
                  blog?.authorDetails.profilePicture ? (
                    <img
                      className="viewblog-img"
                      src={`data:image/jpeg;base64,${blog?.authorDetails.profilePicture}`}
                      alt="Profile"
                    />
                  ) : (
                    <img
                      className="viewblog-img"
                      src="https://img.freepik.com/free-icon/user_318-159711.jpg"
                      alt="Profile"
                    />
                  )}

                  {blog.status === "PUBLISHED" ? (
                    <div>
                      <Link
                        to={`/profile/${blog?.authorDetails.userName}`}
                        target="_blank"
                      >
                        <b className="mx-3">{blog?.authorDetails.userName}</b>
                      </Link>
                      <br />

                      {blog.authorDetails._id === userId ? (
                        ""
                      ) : blog.authorDetails.followers.find(
                          (element) => element === userId
                        ) ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="mx-3"
                          onClick={() =>
                            handleUnfollowUser(blog?.authorDetails._id)
                          }
                          disabled={disableFollowButton}
                        >
                          Following
                        </Button>
                      ) : (
                        <Button
                          variant="success"
                          size="sm"
                          className="mx-3"
                          onClick={() =>
                            handleFollowUser(blog?.authorDetails._id)
                          }
                          disabled={disableFollowButton}
                        >
                          Follow +
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="mx-2 my-2">
                      <h5 className="color-teal-green">
                        <b>Admin</b>
                      </h5>
                    </div>
                  )}

                  {/* <img src={blog.authorDetails.profilePicture} alt="No Image" /> */}
                </Card.Footer>
              </Card>
              <br />

              <div>
                <Button
                  className="bs-button-outline"
                  size="sm"
                  onClick={handleDownloadBlog}
                  disabled
                >
                  <MdDownload title="Download" />
                  Download blog
                </Button>
              </div>
              <br />

              <div>
                <b>Share to:</b>
                <FacebookShareButton
                  className="mx-2"
                  title={
                    "Title: " +
                    window.location.href.slice(
                      window.location.href.lastIndexOf("/") + 1
                    )
                  }
                  url={window.location.href}
                  quote="Please like and share this blog"
                  hashtag="#bloggerspace"
                >
                  <FacebookIcon size={30} round={true} />
                </FacebookShareButton>
                <WhatsappShareButton
                  title={
                    "Title: " +
                    window.location.href.slice(
                      window.location.href.lastIndexOf("/") + 1
                    )
                  }
                  url={window.location.href}
                  quote="Please like and share this blog"
                  hashtag="#bloggerspace"
                >
                  <WhatsappIcon size={30} round={true} />
                </WhatsappShareButton>
                <TwitterShareButton
                  className="mx-2"
                  title={
                    "Title: " +
                    window.location.href.slice(
                      window.location.href.lastIndexOf("/") + 1
                    )
                  }
                  url={window.location.href}
                  quote="Please like and share this blog"
                  hashtag="#bloggerspace"
                >
                  <TwitterIcon size={30} round={true} />
                </TwitterShareButton>
                <LinkedinShareButton
                  title={
                    "Title: " +
                    window.location.href.slice(
                      window.location.href.lastIndexOf("/") + 1
                    )
                  }
                  url={window.location.href}
                  quote="Please like and share this blog"
                  hashtag="#bloggerspace"
                >
                  <LinkedinIcon size={30} round={true} />
                </LinkedinShareButton>
                <TelegramShareButton
                  className="mx-2"
                  title={
                    "Title: " +
                    window.location.href.slice(
                      window.location.href.lastIndexOf("/") + 1
                    )
                  }
                  url={window.location.href}
                  quote="Please like and share this blog"
                  hashtag="#bloggerspace"
                >
                  <TelegramIcon size={30} round={true} />
                </TelegramShareButton>
                <FacebookMessengerShareButton
                  title={
                    "Title: " +
                    window.location.href.slice(
                      window.location.href.lastIndexOf("/") + 1
                    )
                  }
                  url={window.location.href}
                  quote="Please like and share this blog"
                  hashtag="#bloggerspace"
                >
                  <FacebookMessengerIcon size={30} round={true} />
                </FacebookMessengerShareButton>
              </div>

              <div className="mt-4 p-2 bgcolor-mint">
                <h5>
                  <b>Comments:</b>
                </h5>
                {blog?.comments?.length === 0 ? (
                  <p>No comments yet.</p>
                ) : (
                  <ul>
                    {blog?.comments?.map((comment, index) => (
                      <li key={index} style={{ listStyleType: "none" }}>
                        {comment?.user?.profilePicture ? (
                          <div>
                            <Image
                              src={`data:image/jpeg;base64,${comment?.user?.profilePicture}`}
                              roundedCircle
                              className="avatar-icon"
                              style={{ width: "30px", height: "30px" }}
                            />
                            <Link
                              to={`/profile/${comment?.user?.userName}`}
                              target="_blank"
                              style={{ textDecoration: "none" }}
                            >
                              <b className="mx-3">{comment?.user?.userName}</b>
                            </Link>
                            <small className="mx-3">
                              {comment?.createdAt?.slice(0, 10)}{" "}
                              {comment?.createdAt?.slice(11, 16)}
                            </small>
                          </div>
                        ) : (
                          <div>
                            <Image
                              src="https://img.freepik.com/free-icon/user_318-159711.jpg"
                              roundedCircle
                              className="avatar-icon"
                              style={{ width: "30px", height: "30px" }}
                            />
                            <Link
                              to={`/profile/${comment?.user?.userName}`}
                              target="_blank"
                              style={{ textDecoration: "none" }}
                            >
                              <b className="mx-3">{comment?.user?.userName}</b>
                            </Link>
                            <small className="mx-3">
                              {comment?.createdAt?.slice(0, 10)}{" "}
                              {comment?.createdAt?.slice(11, 16)}
                            </small>
                          </div>
                        )}
                        <p className="mx-2">{comment?.content}</p>
                        <small
                          style={{ cursor: "pointer", }}
                          onClick={() => {
                            setShowReplyInput(comment?._id);
                            setReplyCommentContent(
                              "@" + comment?.user?.userName + " "
                            );
                          }}
                        >
                          <FaReply /> Reply
                        </small>

                        {comment?.commentReplies ? (
                          <ul>
                            {comment.commentReplies.map(
                              (nestedReply, index) => (
                                <li
                                  key={index}
                                  style={{ listStyleType: "none" }}
                                  className="mt-3"
                                >
                                  {nestedReply.replyCommentUser
                                    ?.profilePicture ? (
                                    <div>
                                      <Image
                                        src={`data:image/jpeg;base64,${nestedReply.replyCommentUser.profilePicture}`}
                                        roundedCircle
                                        className="avatar-icon"
                                        style={{
                                          width: "30px",
                                          height: "30px",
                                        }}
                                      />
                                      <Link
                                        to={`/profile/${nestedReply.replyCommentUser.userName}`}
                                        target="_blank"
                                        style={{ textDecoration: "none" }}
                                      >
                                        <b className="mx-3">
                                          {
                                            nestedReply.replyCommentUser
                                              .userName
                                          }
                                        </b>
                                      </Link>
                                      <small className="mx-3">
                                        {nestedReply.createdAt.slice(0, 10)}{" "}
                                        {nestedReply.createdAt.slice(11, 16)}
                                      </small>
                                    </div>
                                  ) : (
                                    <div>
                                      <Image
                                        src="https://img.freepik.com/free-icon/user_318-159711.jpg"
                                        roundedCircle
                                        className="avatar-icon"
                                        style={{
                                          width: "30px",
                                          height: "30px",
                                        }}
                                      />
                                      <Link
                                        to={`/profile/${nestedReply.replyCommentUser.userName}`}
                                        target="_blank"
                                        style={{ textDecoration: "none" }}
                                      >
                                        <b className="mx-3">
                                          {
                                            nestedReply.replyCommentUser
                                              .userName
                                          }
                                        </b>
                                      </Link>
                                      <small className="mx-3">
                                        {nestedReply.createdAt.slice(0, 10)}{" "}
                                        {nestedReply.createdAt.slice(11, 16)}
                                      </small>
                                    </div>
                                  )}
                                  {nestedReply.replyCommentContent}
                                </li>
                              )
                            )}
                            <br />
                          </ul>
                        ) : null}

                        {user &&
                          user?.isVerified &&
                          showReplyInput === comment?._id && (
                            <div>
                              <small>
                                <i>Replying to: {comment?.user?.userName}</i>
                              </small>
                              <form
                                onSubmit={(e) =>
                                  handleReplyCommentSubmit(e, comment?._id)
                                }
                              >
                                <div className="form-group">
                                  <label htmlFor="commentContent">
                                    <b>Add Comment:</b>
                                  </label>
                                  <textarea
                                    id="commentContent"
                                    className="form-control"
                                    value={replyCommentContent}
                                    onChange={(e) =>
                                      setReplyCommentContent(e.target.value)
                                    }
                                    required
                                  />
                                </div>
                                <Button
                                  type="submit"
                                  size="sm"
                                  className="bs-button mt-2 mb-3"
                                >
                                  Submit
                                </Button>
                              </form>
                            </div>
                          )}

                        {/* <div>
                  <i
                    className={`fa-${commentThumbColor} fa-thumbs-up fa-xl`}
                    onClick={
                      disableCommentLikeButton === false ? ()=>handleCommentLike(comment._id) : null
                    }
                  ></i>{" "}
                  {comment?.likes.length}
                </div> */}
                        {/* <p className="comment-user">
                  <strong>Commented by:</strong> {comment.userName}
                </p> */}
                      </li>
                    ))}
                  </ul>
                )}

                {user && user?.isVerified ? (
                  <form onSubmit={handleCommentSubmit}>
                    <div className="form-group">
                      <label htmlFor="commentContent">
                        <b>Add Comment:</b>
                      </label>
                      <textarea
                        id="commentContent"
                        className="form-control"
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" size="sm" variant="success mt-2">
                      Submit
                    </Button>
                  </form>
                ) : (
                  <p>
                    You need to be logged in and verified to post comments.{" "}
                    <Link to="/login">Login</Link> or{" "}
                    <Link to="/signup">Sign up</Link> now.
                  </p>
                )}
              </div>
            </div>
            <div className="viewblog-flex2 bgcolor-mint">
              <TableOfContent />
              <RelatedBlogs blogId={blog?._id} />
              <MostViewedBlogs />
            </div>
          </div>
        )}
      </Container>
    </section>
  );
};

export default ViewBlog;
