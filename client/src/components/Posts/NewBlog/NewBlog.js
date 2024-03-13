import React, { useState, useEffect } from "react";
import {
  Container,
  Form,
  Button,
  Alert,
  Badge,
  CloseButton,
  Modal,
  ListGroup,
  Accordion,
} from "react-bootstrap";
import { QuillEditor } from "../../QuillEditor/QuillEditor"; // Import the QuillEditor component
import axios from "axios";
import { Helmet } from "react-helmet";
import "./NewBlog.css";
import { Link, useNavigate } from "react-router-dom";
import blogCategory from "../../../utils/blogCategory.json";
import blogTags from "../../../utils/blogTags.json";

const NewBlog = () => {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [author, setAuthor] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [alert, setAlert] = useState(null);
  const [otherCategory, setOtherCategory] = useState(null);
  const [selectedTag, setSelectedTag] = useState("");
  const [tags, setTags] = useState([]);
  const [isUniqueTitle, setIsUniqueTitle] = useState(null);
  const [contentSize, setContentSize] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [searchTitleResults, setTitleSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem("token");

  useEffect(() => {
    axios
      .post("/api/blogs/isuniquetitle", { title })
      .then((response) => {
        const res = response.data;
        console.log("isuniquetitle: " + res);
        if (res === "Available") setIsUniqueTitle(true);
        else setIsUniqueTitle(false);
      })
      .catch((error) => {
        console.error("Error fetching isuniquetitle information:", error);
      });
  }, [title]);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return; // or display a loading indicator while redirecting
    }

    axios
      .get("/api/users/userinfo")
      .then((response) => {
        const user = response.data;
        console.log(user);
        setAuthorEmail(user.email);
        // Handle the user data as needed
        if (!user.isVerified) {
          navigate("/verify-account", {
            state: { email: user.email, fullName: user.fullName },
          });
        }
        setAuthor(user.userName);
        console.log(author);
      })
      .catch((error) => {
        console.error("Error fetching user information:", error);
        // Handle the error
      });
  }, [isLoggedIn, navigate, author]);

  //  Size of the content
  useEffect(() => {
    const findContentSize = (content) => {
      setContentSize(
        (new TextEncoder().encode(content).length / 1024).toFixed(4)
      );
    };
    findContentSize(content);
  }, [content]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      navigate("/login");
      return null; // or display a loading indicator while redirecting
    }
    if (!isUniqueTitle) {
      setAlert({ type: "danger", message: "Title already exists" });
      return null;
    }

    try {
      const response = await axios.post("/api/blogs/newblog", {
        slug,
        title,
        content,
        category: category === "Other" ? otherCategory : category,
        tags,
      });
      console.log(response.data);

      setAlert({
        type: "success",
        message: "New blog created with pending review status!!",
      });

      // Redirect to the homepage
      setTimeout(() => {
        navigate("/");
      }, 2000);

      // Handle success or redirect to a different page
    } catch (error) {
      setAlert({ type: "danger", message: "Error occured.." });
      console.error("Error creating new blog:", error);
      // Handle error
    }
  };

  const handleSaveAsDraft = async () => {
    if (!isUniqueTitle) {
      setAlert({ type: "danger", message: "Title already exists" });
      return null;
    }
    console.log("Content: " + content);
    try {
      const response = await axios.post("/api/blogs/saveasdraft", {
        slug,
        title,
        content,
        category: category === "Other" ? otherCategory : category,
        tags,
      });
      console.log(response.data);

      setAlert({ type: "success", message: "New blog saved as draft!!" });

      // Redirect to the homepage
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      setAlert({ type: "danger", message: "Error occured.." });
      console.error("Error saving blog:", error);
      // Handle error
    }
  };

  const handleSelectedTag = (e) => {
    setSelectedTag(e.target.value);
  };

  const handleTagDismiss = (tag) => {
    const updatedTags = tags.filter((t) => t !== tag);
    setTags(updatedTags);
  };

  const handleTagAdd = () => {
    if (selectedTag !== "" && !tags.includes(selectedTag)) {
      setTags([...tags, selectedTag]);
      setSelectedTag("");
    }
  };

  const slugify = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .replace(/\s+/g, "-");
  };

  async function searchSimilarTitles(searchQuery) {
    try {
      setLoading(true);
      const response = await axios.get(`/api/blogs/searchblogs/${searchQuery}`);
      console.log(response.data);
      setTitleSearchResults(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error searching similar blogs:", error);
      setLoading(false);
    }
  }

  return (
    <div>
      <Helmet>
        <title>New Blog - BloggerSpace</title>
      </Helmet>

      <Container className="newblogpage">
        <h2 className="new-blog-heading">New Blog</h2>
        {alert && (
          <Alert
            variant={alert.type}
            onClose={() => setAlert(null)}
            dismissible
          >
            {alert.message}
          </Alert>
        )}
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="blogTitle" className="newblogfields">
            {/* <Form.Label>This article url after publish: {slug}</Form.Label> <br /> */}
            <Form.Label>Title:</Form.Label>
            <Form.Control
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setSlug(slugify(e.target.value.trim()));
                searchSimilarTitles(e.target.value);
                // setSlug(slugify(title.trim()));
              }}
              placeholder="Enter blog title"
              required
            />
            {title.trim().length !== 0 && isUniqueTitle !== null ? (
              isUniqueTitle === true ? (
                <Alert variant="success">Title Available</Alert>
              ) : (
                <Alert variant="danger">Title already exists</Alert>
              )
            ) : null}
          </Form.Group>

          <Accordion defaultActiveKey="0">
            <Accordion.Item eventKey="0">
              <Accordion.Header>
                Published Blogs with Similar title:
              </Accordion.Header>
              <Accordion.Body>
                <ListGroup>
                  {searchTitleResults.map((blog) => (
                    <ListGroup.Item key={blog._id} className="">
                      <Link
                        to={`/${blog.slug}`}
                        target="_blank"
                        style={{ textDecoration: "none" }}
                      >
                        <h6>{blog.title}</h6>
                      </Link>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>

          <Form.Group controlId="blogAuthor" className="newblogfields">
            <Form.Label>Author:</Form.Label>
            <Form.Control
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Enter author name"
              disabled
            />
          </Form.Group>

          <Form.Group controlId="blogCategory" className="newblogfields">
            {" "}
            {/* New form group for category */}
            <Form.Label>Category:</Form.Label>
            <Form.Control
              as="select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Select category"
              required
            >
              <option value="">Select Category</option>
              {blogCategory.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
              {/* Add more category options as needed */}
            </Form.Control>
          </Form.Group>

          {category === "Other" ? (
            <Form.Group controlId="otherCategory" className="newblogfields">
              <Form.Label>Specify other category:</Form.Label>
              <Form.Control
                type="text"
                value={otherCategory}
                onChange={(e) => {
                  setOtherCategory(e.target.value);
                }}
                placeholder="Enter category"
                required
              />
            </Form.Group>
          ) : null}

          <Form.Group controlId="blogCategory" className="newblogfields">
            <Form.Label>Tags:</Form.Label>
            <Form.Control
              as="select"
              value={selectedTag}
              onChange={handleSelectedTag}
              placeholder="Select tag"
            >
              <option value="">Select Tag</option>
              {blogTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </Form.Control>
            <Button
              variant="success"
              size="sm"
              onClick={handleTagAdd}
              className="my-2"
            >
              Add Tag
            </Button>
            <br />
            {tags.map((tag) => (
              <Badge key={tag} pill bg="secondary">
                {tag}
                <CloseButton
                  variant="white"
                  onClick={() => handleTagDismiss(tag)}
                ></CloseButton>
              </Badge>
            ))}
          </Form.Group>

          <Form.Group controlId="blogContent" className="newblogfields">
            <Form.Label>Content:</Form.Label>
            <QuillEditor content={content} onContentChange={setContent} />
          </Form.Group>
          <h6>Content size: {contentSize} KB</h6>
          <Button
            variant="secondary"
            className="submit-newblog"
            onClick={() => setShowConfirmModal(true)}
          >
            Preview Blog
          </Button>
          {/* <div dangerouslySetInnerHTML={{ __html: content }} /> */}

          <Button
            variant="secondary"
            className="submit-newblog mx-2"
            onClick={handleSaveAsDraft}
          >
            Save Draft
          </Button>
          <Button variant="primary" type="submit" className="submit-newblog">
            Submit
          </Button>
        </Form>

        <Modal
          show={showConfirmModal}
          onHide={() => setShowConfirmModal(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title>Preview Blog</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Title: {title}
            <br />
            Slug: {slug}
            <br />
            <br />
            Content: <br />
            <div dangerouslySetInnerHTML={{ __html: content }} />
            <h6>Content size: {contentSize} KB</h6>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default NewBlog;
