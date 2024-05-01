import React, { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import Select from "react-select";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "./CommunityPage.css";
import "tinymce/skins/content/default/content.css";
import "tinymce/skins/ui/oxide/skin.min.css";
import "tinymce/skins/ui/oxide/content.min.css"; // Main content styles
import "tinymce/skins/ui/oxide/content.inline.min.css"; // Inline content styles
import "tinymce/skins/ui/oxide/skin.shadowdom.min.css";

import TinymceEditor from "../../utils/TinymceEditor";
import { Button, Form, Card, ListGroup } from "react-bootstrap";
import blogCategory from "../../utils/blogCategory.json";

import Editor from 'ckeditor5-custom-build/build/ckeditor';
import { CKEditor } from '@ckeditor/ckeditor5-react';

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
    <div>
      <Helmet>
        <title>Community - BloggerSpace</title>
      </Helmet>

      <div className="community-page">
        <ToastContainer />
        <h4>Community Page</h4>
        <Form>
          <Form.Group controlId="topic" className="topicfield">
            <Form.Label>
              <b>Topic:</b>
            </Form.Label>
            <Form.Control
              type="text"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                setSlug(slugify(e.target.value.trim()));
              }}
              placeholder="Enter topic"
            />
          </Form.Group>
          <br />

          <b>Content:</b>
          <div className="editor-div">
            {/* <TinymceEditor content={content} onContentChange={setContent} /> */}

            <CKEditor
                editor={ Editor }
                data="<p></p>"
                onChange={ ( event, editor ) => {
                    setContent(editor.getData());
                } }
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
          {userInfo===null?<b>You are not logged in. Please login to post anything you want.</b>:false} <br />
          <Button
            type="submit"
            onClick={handlePostSubmit}
            variant="success"
            size="sm"
            disabled={userInfo===null?true:false}
          >
            Post
          </Button>
          <Button variant="secondary" size="sm" className="mx-2" onClick={()=>navigate(-1)}>
            Go back
          </Button>
        </Form>

        {/* <h5>View Content:</h5>
        <div dangerouslySetInnerHTML={{ __html: content }} /> */}
      </div>

      <hr />

      <div>
        <h4>Recently posted:</h4>
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
    </div>
  );
};

export default Community;
