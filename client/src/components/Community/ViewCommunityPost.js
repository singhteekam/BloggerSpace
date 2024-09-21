import React, { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import Select from "react-select";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";

import "tinymce/skins/content/default/content.css";
import "tinymce/skins/ui/oxide/skin.min.css";
import "tinymce/skins/ui/oxide/content.min.css"; // Main content styles
import "tinymce/skins/ui/oxide/content.inline.min.css"; // Inline content styles
import "tinymce/skins/ui/oxide/skin.shadowdom.min.css";

// import TinymceEditor from "./../../utils/TinymceEditor";
import TinymceEditor from "utils/TinymceEditor";
import { Image } from "react-bootstrap";

import {
  Button,
  Form,
  Card,
  ListGroup,
  Spinner,
  Container,
} from "react-bootstrap";
import blogCategory from "../../utils/blogCategory.json";

import Editor from "ckeditor5-custom-build/build/ckeditor";
import { CKEditor } from "@ckeditor/ckeditor5-react";

const ViewCommunityPost = () => {
  const { communityPostSlug, communityPostId } = useParams();

  const [communityPost, setCommunityPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [content, setContent] = useState("");
  const [userInfo, setUserInfo] = useState(null);

  const isLoggedIn = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {

    const fetchLoggedInUser = async () => {
        await axios
          .get("/api/users/userinfo")
          .then((response) => {
            const user = response.data;
            setUserInfo(user);
          })
          .catch((error) => {
            console.error("Error fetching user information:", error);
          });
      };

    const fetchCommunityPost = async () => {
      try {
        const response = await axios.get(
          `/api/community/post/${communityPostSlug}`
        );
        setCommunityPost(response.data);
        setLoading(false);
      } catch (error) {
        console.log("Error fetching post");
      }
    };
    fetchLoggedInUser();
    fetchCommunityPost();
  }, []);




  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (!communityPost) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <div>Post not found.</div>
      </Container>
    );
  }

  function getHTMLContent(html) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const textContent = tempDiv.textContent || tempDiv.innerText;
    return textContent;
  }

  const handleCommunityPostReply = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      navigate("/login");
      return null; // or display a loading indicator while redirecting
    }

    try {
      const response = await axios.post(
        `/api/community/${communityPostId}/addreply`,
        {
          communityPostContent: content,
        }
      );
      console.log(response.data);

      toast.success("Replied to this post !!");
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      //   setCommunityPost(...communityPost, response.data);
    } catch (error) {
      toast.error("Error replying on this post!!");
      console.error("Error replying on this post:", error);
    }
  };

  return (
    <div className="newpage-section">
      <Helmet>
        <meta
          name="description"
          content={getHTMLContent(communityPost?.communityPostContent)}
        />
        <title>{communityPost?.communityPostTopic} - BloggerSpace</title>

        <meta property="og:title" content={communityPost?.communityPostTopic} />
        <meta
          property="og:description"
          content={getHTMLContent(communityPost?.communityPostContent)}
        />

        <meta
          name="twitter:title"
          content={communityPost?.communityPostTopic}
        />
        <meta
          name="twitter:description"
          content={getHTMLContent(communityPost?.communityPostContent)}
        />
      </Helmet>

      {communityPost && (
        <Container>
          {/* <h4>{window.location.href}</h4> */}
          <h3 className="page-title">View Community post</h3>
        <div className="heading-underline"></div>
          
          <ToastContainer />
          <Card className="view-blog-card">
            <Card.Body>
              <Card.Title>
                <b>{communityPost?.communityPostTopic}</b>
              </Card.Title>
              <i>Category: {communityPost?.communityPostCategory}</i>

              <hr />
              <div
                dangerouslySetInnerHTML={{
                  __html: communityPost?.communityPostContent,
                }}
              />
            </Card.Body>
            <Card.Footer className="d-flex justify-content-left">
              {communityPost?.communityPostAuthor.profilePicture ? (
                <img className="viewcommynitypost-img"
                  src={`data:image/jpeg;base64,${communityPost?.communityPostAuthor.profilePicture}`}
                  alt="Profile"
                />
              ) : (
                <img className="viewcommynitypost-img"
                  src="https://img.freepik.com/free-icon/user_318-159711.jpg"
                  alt="Profile"
                />
              )}

              <div>
                <Link
                  to={`/profile/${communityPost?.communityPostAuthor.userName}`}
                  target="_blank"
                >
                  <b className="mx-3">
                    {communityPost?.communityPostAuthor.userName}
                  </b>
                </Link>
                <br />
                {/* <i className="mx-3">{blog?.lastUpdatedAt?.slice(0, 10)}</i> */}

                <Button
                  variant="success"
                  size="sm"
                  className="mx-3"
                  onClick={null}
                  disabled
                >
                  Follow +
                </Button>
              </div>
            </Card.Footer>
          </Card>
          <br />
          <div>
            <b>Replies:</b>
            {communityPost.communityPostComments.map((comment) => (
              <Card className="mt-2" key={comment.communityPostSlug}>
                <Card.Body>
                  <Image
                    src={
                      comment?.replyCommunityPostAuthor.profilePicture
                        ? `data:image/jpeg;base64,${comment?.replyCommunityPostAuthor.profilePicture}`
                        : "https://img.freepik.com/free-icon/user_318-159711.jpg"
                        // : "https://img.freepik.com/free-icon/user_318-159711.jpg"
                    }
                    roundedCircle
                    className="avatar-icon"
                    style={{ width: "30px", height: "30px" }}
                  />
                  
                  <Link
                    to={`/profile/${comment?.replyCommunityPostAuthor.userName}`}
                    target="_blank"
                    style={{ textDecoration: "none" }}
                  >
                    <b className="mx-3">
                      {comment?.replyCommunityPostAuthor.userName}
                    </b>
                  </Link>
                  <small>
                    {comment.createdAt.slice(11, 19) +
                      ", " +
                      comment.createdAt.slice(0, 10)}
                  </small>
                  <hr />
                  <div
                    dangerouslySetInnerHTML={{
                      __html: comment?.replyCommunityPostContent,
                    }}
                  />
                </Card.Body>
              </Card>
            ))}
          </div>

          <br />

          <b> Add your reply:</b>
          <div>
            {/* <TinymceEditor content={content} onContentChange={setContent} /> */}
            <CKEditor
              editor={Editor}
              data="<p></p>"
              onChange={(event, editor) => {
                setContent(editor.getData());
              }}
            />
            <br />
            {userInfo===null?<b>You are not logged in. Please login to post your response.</b>:false} <br />
            <Button
              className="bs-button"
              size="sm"
              onClick={handleCommunityPostReply}
              disabled={userInfo===null?true:false}
            >
              Post this reply
            </Button>
          </div>
        </Container>
      )}
    </div>
  );
};

export default ViewCommunityPost;
