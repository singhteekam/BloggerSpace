import React, { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import Select from "react-select";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";

import "tinymce/skins/content/default/content.css";
import "tinymce/skins/ui/oxide/skin.min.css";
import "tinymce/skins/ui/oxide/content.min.css"; // Main content styles
import "tinymce/skins/ui/oxide/content.inline.min.css"; // Inline content styles
import "tinymce/skins/ui/oxide/skin.shadowdom.min.css";

import TinymceEditor from "utils/TinymceEditor";
import { Button, Form, Card, ListGroup, Container } from "react-bootstrap";
import blogCategory from "../../utils/blogCategory.json";

import Editor from "ckeditor5-custom-build/build/ckeditor";
// import Editor from "ckeditor5-custom-build/build/ckeditor";
import { CKEditor } from "@ckeditor/ckeditor5-react";

const Community = () => {
  const [slug, setSlug] = useState("");
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState(null);
  const [content, setContent] = useState("");
  const [userInfo, setUserInfo] = useState(null);

  const [allPosts, setAllPosts] = useState(null);

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

    const getCommunityPosts = async (req, res) => {
      try {
        const response = await axios.get("/api/community/communityposts");
        setAllPosts(response.data);
      } catch (error) {
        console.log("Error getting posts.....");
      }
    };
    fetchLoggedInUser();
    getCommunityPosts();
  }, []);

  const handlePostSubmit = async (e) => {
    e.preventDefault();

    if (topic.length === 0 || content.length === 0 || category === null) {
      toast.error("Please enter required details..");
    }

    if (!isLoggedIn) {
      navigate("/login");
      return null; // or display a loading indicator while redirecting
    }

    try {
      const response = await axios.post("/api/community/newpost", {
        communityPostSlug: slug,
        communityPostTopic: topic,
        communityPostContent: content,
        communityPostCategory: category.value,
      });
      console.log(response.data);

      toast.success("New post created !!");
      setAllPosts([...allPosts, response.data]);
    } catch (error) {
      toast.error("Error creating new post!!");
      console.error("Error creating new post:", error);
    }
  };

  const slugify = (topic) => {
    return topic
      .toLowerCase()
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .replace(/\s+/g, "-");
  };

  return (
    <section className="newpage-section">
      <Helmet>
        <title>Community - BloggerSpace</title>
      </Helmet>

      <Container>
      <div>
        <ToastContainer />
        <h3 className="page-title">Community</h3>
        <div className="heading-underline"></div>
        <Form>
          <Form.Group controlId="topic" className="topicfield">
            <Form.Label>
              <b>Issue Title:</b>
            </Form.Label>
            <Form.Control
              type="text"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                setSlug(slugify(e.target.value.trim()));
              }}
              placeholder="Enter Issue title"
            />
          </Form.Group>
          <br />
          <b>Explain the issue:</b>
          <div className="editor-div">
            {/* <TinymceEditor content={content} onContentChange={setContent} /> */}

            <CKEditor
              editor={Editor}
              data="<p></p>"
              onChange={(event, editor) => {
                setContent(editor.getData());
              }}
            />
          </div>
          <br />
          <b>Category:</b>
          <Select
            className="react-select-dropdown"
            defaultValue={category}
            onChange={setCategory}
            options={blogCategory}
            required
          />
          <br />
          {userInfo === null ? (
            <b>
              You are not logged in. Please login to post anything you want.
            </b>
          ) : (
            false
          )}{" "}
          <br />
          <Button
            type="submit"
            onClick={handlePostSubmit}
            className="bs-button"
            size="sm"
            disabled={userInfo === null ? true : false}
          >
            Post
          </Button>
          <Button
            size="sm"
            className="mx-2 bs-button-outline"
            onClick={() => navigate(-1)}
          >
            Go back
          </Button>
        </Form>

        {/* <h5>View Content:</h5>
        <div dangerouslySetInnerHTML={{ __html: content }} /> */}
      </div>

      <hr />

      <b>Note:</b><small>If you want to embed youtube video then copy the below code and use Insert HTML toolbar item. Replace VIDEO_ID with your youtube video id. 
        Ex: https://youtu.be/cfbepul-yHY?si=Xt6YWbm1M2AgWfjx
        VIDEO_ID: cfbepul-yHY?si=Xt6YWbm1M2AgWfjx
      </small>
      <br />
      <button
      className="btn bs-button-outline"
        onClick={() =>{
          navigator.clipboard.writeText(`
          <div style="position: relative; padding-bottom: 100%; height: 0; padding-bottom: 56.2493%;">
            <iframe src="https://www.youtube.com/embed/VIDEO_ID"
                style="position: absolute; width: 100%;height:100%; top: 0; left: 0;"
                frameborder="0" allow="autoplay; encrypted-media" allowfullscreen>
            </iframe>
          </div>
          `)
          toast.success("Copied to clipboard");
        }
        }
      >
        Copy code
      </button>

      <hr />

      <div>
        <h5>Recently posted:</h5>
        <ListGroup className="m-3">
          {allPosts &&
            allPosts.map((post) => (
              <ListGroup.Item
                key={post.communityPostSlug}
                className="mb-2 border blogitem"
              >
                <div className="row align-items-center">
                  <Link
                    to={`/community/post/${post.communityPostId}/${post.communityPostSlug}`}
                    // target="_blank"
                    style={{ textDecoration: "none" }}
                    onClick={() =>
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }
                  >
                    <div className="col">
                      <b>{post.communityPostTopic}</b>

                      <p>
                        <i className="text-muted">
                          Author: {post.communityPostAuthor.userName}
                        </i>
                        <br />
                        <i className="text-muted">
                          Last Updated: {post.lastUpdatedAt.slice(11, 19)},{" "}
                          {post.lastUpdatedAt.slice(0, 10)}
                        </i>
                      </p>
                    </div>
                  </Link>
                </div>
              </ListGroup.Item>
            ))}
        </ListGroup>
      </div>

      </Container>

    </section>
  );
};

export default Community;
