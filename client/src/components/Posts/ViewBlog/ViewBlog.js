import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { Container, Card,Button, Spinner, Badge, Image } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Helmet } from 'react-helmet';
import "./ViewBlog.css";
import LoginPageModal from "../../../utils/LoginPageModal";
import PageNotFound from "../../PageNotFound/PageNotFound";

const ViewBlog = () => {
  const { blogSlug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState("");
  const [comments, setComments] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [thumbColor, setThumbColor]= useState("regular");
  const [disableLikeButton, setDisableLikeButton]= useState(false);

  const [commentThumbColor, setCommentThumbColor] = useState("regular");
  const [disableCommentLikeButton, setDisableCommentLikeButton] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const navigate = useNavigate();

  // useEffect(() => {
  //   // Get the current page URL
  //   const currentUrl = window.location.href;

  //   // Update the canonical URL dynamically
  //   const canonicalLink = document.querySelector('link[rel="canonical"]');
  //   if (canonicalLink) {
  //     canonicalLink.href = currentUrl;
  //   }
  // }, []); // Empty dependency array ensures the effect runs only once on mount


  useEffect(()=>{
    const fetchoggedInUser= async()=>{
      await axios
        .get("/api/users/userinfo")
        .then((response) => {
          const user = response.data;
          // console.log(user);
          setUserInfo(user);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching user information:", error);
          setLoading(false);
        });
    }

    const fetchBlog = async () => {
      try {
        const response = await axios.get(`/api/blogs/${blogSlug}`);
        setBlog(response.data.blog);
        if (response.data.alreadyLiked === true) 
          setThumbColor("solid");
        setLoading(false);
      } catch (error) {
        console.error("Error fetching blog Blog:", error);
        setLoading(false);
        setNotFound(true);
      }
    };

    const fetchComments = async () => {
      try {
        const response = await axios.get(`/api/blogs/${blogSlug}/comments`);
        setComments(response.data);
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    };

    fetchComments();

    fetchBlog();
    fetchoggedInUser();
  },[])
  

  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    // console.log("islog: " + isLoggedIn);

    try {
      const response = await axios.post(`/api/blogs/${blogSlug}/comments`, {
        content: commentContent,
      });
      setComments([...comments, response.data]);
      setCommentContent("");
      window.location.reload();
    } catch (error) {
      console.error("Error submitting comment:", error);
    }
  };

  const handleBlogLikes= async ()=>{
    if(!userInfo){
      console.log("Inside if");
      navigate("/login");
      // return <LoginPageModal show={true} handleClose={null} />;
    }
    console.log("Likes");
    try {
      setDisableLikeButton(true);
      const response= await axios.post(`/api/blogs/bloglikes/${blog._id}`, {thumbColor});
      console.log(response.data);
      setThumbColor(response.data.newThumbColor);
      setBlog((prevBlog) => ({
        ...prevBlog,
        // likes: response.data.newLikes,
        blogLikes: response.data.newLikes,
      }));
      setDisableLikeButton(false);
      // window.location.reload();
    } catch (error) {
      console.error("Error submitting like:", error);
    }
  }

  const handleCommentLike= async(commentId)=>{
        if (!userInfo) {
          console.log("Inside if");
          navigate("/login");
          // return <LoginPageModal show={true} handleClose={null} />;
        }
        try {
          console.log(commentId);
          setDisableCommentLikeButton(true);
          const response = await axios.post(
            `/api/blogs/blogcommentlike/${blog._id}`,
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
  }

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  // if (!blog) {
  //   return (
  //     <Container className="d-flex justify-content-center align-items-center vh-100">
  //       <div>Blog not found.</div>
  //     </Container>
  //   );
  // }

  if (notFound) {
    // Render the PageNotFound component when an error occurs
    console.log("blog not found")
    return <PageNotFound />;
  }

  function stripHtmlTags(html) {
    // Create a temporary div element
    const tempDiv = document.createElement('div');
  
    // Set the innerHTML of the div to your HTML content
    tempDiv.innerHTML = html;
  
    // Retrieve the text content without HTML tags
    const textContent = tempDiv.textContent || tempDiv.innerText;
  
    return textContent;
  }


  return (
    <div>
      <Helmet>
        <meta name="description" content={stripHtmlTags(blog?.content)} />
        <title>{blog?.title} - BloggerSpace</title>

        <meta property="og:title" content={blog?.title} />
        <meta property="og:description" content={stripHtmlTags(blog?.content)} />

        <meta name="twitter:title" content={blog?.title} />
        <meta name="twitter:description" content={stripHtmlTags(blog?.content)} />
       </Helmet>

      <Container className="view-blog-container">
      {/* <h4>{window.location.href}</h4> */}
      <h2 className="view-blog-heading">View Blog</h2>
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
          {/* {userInfo && blog.authorDetails.userName === userInfo.userName && (
            <Link
              to={`/api/blogs/editblog/${blog._id}`}
              className="btn btn-primary"
            >
              Edit Blog
            </Link>
          )} */}
        </Card.Body>
        <div>
          <i className="mx-3">
            Last Updated: {blog?.lastUpdatedAt?.slice(0, 10)}
          </i>
          <i
            className={`fa-${thumbColor} fa-thumbs-up fa-xl`}
            onClick={disableLikeButton === false ? handleBlogLikes : null}
          ></i>{" "}
          {/* {blog?.likes.length} */}
          {blog?.blogLikes.length}
        </div>
        <div>
          <Button size="sm" variant="secondary">
            <i className="fa-solid fa-pen-to-square"></i> Improve Blog
          </Button>
        </div>
        <Card.Footer className="d-flex justify-content-left">
          {blog?.authorDetails.profilePicture ? (
            <img
              src={`data:image/jpeg;base64,${blog?.authorDetails.profilePicture}`}
              alt="Profile"
            />
          ) : (
            <img
              src="https://img.freepik.com/free-icon/user_318-159711.jpg"
              alt="Profile"
            />
          )}

          <div>
            <Link
              to={`/profile/${blog?.authorDetails.userName}`}
              target="_blank"
            >
              <b className="mx-3">{blog?.authorDetails.userName}</b>
            </Link>
            <br />
            <i className="mx-3">{blog?.lastUpdatedAt?.slice(0, 10)}</i>
          </div>

          {/* <img src={blog.authorDetails.profilePicture} alt="No Image" /> */}
        </Card.Footer>
      </Card>

      <div className="comments-section mt-4">
        <h5>
          <b>Comments:</b>
        </h5>
        {comments?.length === 0 ? (
          <p>No comments yet.</p>
        ) : (
          <ul>
            {comments?.map((comment, index) => (
              <li key={index} style={{ listStyleType: "none" }}>
                {comment.userProfilePic ? (
                  <div>
                    <Image
                      src={`data:image/jpeg;base64,${comment.userProfilePic}`}
                      roundedCircle
                      className="avatar-icon"
                      style={{ width: "30px", height: "30px" }}
                    />
                    <Link
                      to={`/profile/${comment.userName}`}
                      target="_blank"
                      style={{ textDecoration: "none" }}
                    >
                      <b className="mx-3">{comment.userName}</b>
                    </Link>
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
                      to={`/profile/${comment.userName}`}
                      target="_blank"
                      style={{ textDecoration: "none" }}
                    >
                      <b className="mx-3">{comment.userName}</b>
                    </Link>
                  </div>
                )}
                <p className="comment-content">
                  {comment.content}
                </p>

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

        {userInfo && userInfo?.isVerified ? (
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
            <button type="submit" className="btn btn-primary mt-2">
              Submit Comment
            </button>
          </form>
        ) : (
          <p>
            You need to be logged in and verified to post comments.{" "}
            <Link to="/login">Login</Link> or <Link to="/signup">Sign up</Link>{" "}
            now.
          </p>
        )}
      </div>
    </Container>

    </div>
  );
};

export default ViewBlog;
