import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Container,
  Form,
  Button,
  Alert,
  Spinner,
  Badge,
  CloseButton,
  Modal,
  ListGroup,
  Accordion,
} from "react-bootstrap";
import { QuillEditor } from "../../QuillEditor/QuillEditor"; // Import the QuillEditor component
import TinymceEditor from "../../../utils/TinymceEditor";
import axios from "axios";
import "./EditBlog.css";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { ToastContainer, toast } from "react-toastify";
import blogCategory from "../../../utils/blogCategory.json";
import blogTags from "../../../utils/blogTags.json";

const EditBlog = () => {
  const { id } = useParams();
  // const [blog, setBlog] = useState(null);
  const [titleOrig, setTitleOrig] = useState("");
  const [title, setTitle] = useState("");
  const [authorDetails, setAuthorDetails] = useState(null);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [slug, setSlug] = useState("");
  const [alert, setAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackComments, setFeedbackComments] = useState("");
  const [otherCategory, setOtherCategory] = useState(null);
  const [selectedTag, setSelectedTag] = useState("");
  const [tags, setTags] = useState([]);
  const [isUniqueTitle, setIsUniqueTitle] = useState([]);
  const [contentSize, setContentSize] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [searchTitleResults, setTitleSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDisabled, setIsDisabled]= useState(false);

  const navigate = useNavigate();

  const [initialContent, setInitialContent]= useState("");

  useEffect(() => {
    if (titleOrig !== title) {
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
    }
  }, [title]);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const response = await axios.get(`/api/blogs/editblog/${id}`);
        const {
          slug,
          title,
          content,
          authorDetails,
          category,
          feedbackToAuthor,
          tags,
        } = response.data;
        setSlug(slug);
        setTitle(title);
        setTitleOrig(title);
        setAuthorDetails(authorDetails);
        setContent(content);
        setInitialContent(content);
        setCategory(category);
        setFeedbackComments(feedbackToAuthor);
        setTags(tags);
        // setBlog(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching Blog:", error);
        navigate("/login");
      }
    };

    fetchBlog();
  }, [id, navigate]);

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

    if (!isUniqueTitle) {
      // setAlert({ type: "danger", message: "Title already exists" });
      toast.error("Title already exists");
      return null;
    }

    try {
      setIsDisabled(true);
      const response = await axios.put(`/api/blogs/editblog/save/${id}`, {
        slug,
        title,
        content,
        category,
        tags,
      });
      console.log(response.data);
      // Handle success or redirect to a different page
      // Show success alert
      toast.success("Blog updated successfully!!");
      // setAlert({ type: "success", message: "blog updated successfully" });

      // Redirect to the homepage
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      setIsDisabled(false);
      console.error("Error updating blog:", error);
      // Handle error
      // Show error alert
      toast.error("Failed to update blog.");
      // setAlert({ type: "danger", message: "Failed to update blog" });
    }
  };

  const handleSaveAsDraft = async () => {
    if (!isUniqueTitle) {
      // setAlert({ type: "danger", message: "Title already exists" });
      toast.error("Title already exists");
      return null;
    }
    try {
      setIsDisabled(true);
      const response = await axios.post("/api/blogs/saveasdraft", {
        id,
        slug,
        title,
        content,
        category: category === "Other" ? otherCategory : category,
        tags,
      });
      console.log(response.data);

      toast.success("Blog saved successfully!!");
      setIsDisabled(false);
      // setAlert({ type: "success", message: "blog saved successfully" });

      // Redirect to the homepage
      // setTimeout(() => {
      //   navigate(-1);
      // }, 2000);
    } catch (error) {
      setIsDisabled(false);
      toast.error("Error saving blog..");
      // setAlert({ type: "danger", message: "Failed to save blog" });
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

  // if (!blog) {
  //   return <div>Loading...</div>;
  // }

  if (isLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

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
        <title>Edit Blog - {title}</title>
      </Helmet>
      <Container className="editblogpage">
        <h2 className="edit-blog-heading">Edit Blog</h2>
        <ToastContainer />
        {/* {alert && (
          <Alert
            variant={alert.type}
            onClose={() => setAlert(null)}
            dismissible
          >
            {alert.message}
          </Alert>
        )} */}
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="blogTitle" className="editblogfields">
            <Form.Label>Title: </Form.Label>
            <Form.Control
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                // setSlug(slugify(title.trim()));
                setSlug(slugify(e.target.value.trim()));
                searchSimilarTitles(e.target.value);
              }}
              placeholder="Enter blog title"
            />
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

          <Form.Group controlId="blogAuthor" className="editblogfields">
            <Form.Label>Author:</Form.Label>
            <Form.Control
              type="text"
              value={authorDetails.userName}
              // onChange={(e) => setAuthor(e.target.value)}
              placeholder="Enter author name"
              disabled
            />
          </Form.Group>

          <Form.Group controlId="blogCategory" className="editblogfields">
            <Form.Label>Category:</Form.Label>
            <Form.Control
              as="select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Select category"
              required
            >
              {/* <option value="">Select Category</option> */}
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

          <Form.Group controlId="blogContent" className="editblogfields">
            <Form.Label>Content:</Form.Label>
            {/* <QuillEditor content={content} onContentChange={setContent} /> */}
            <TinymceEditor content={content} onContentChange={setContent} initialValue={initialContent} />
          </Form.Group>

          <h6>Content size: {contentSize} KB</h6>

          <h6>Feedbacks:</h6>
          <ul>
            {feedbackComments.map((comment, index) => (
              <li key={index}>
                <p className="comment-content">{comment.feedback}</p>
                <p className="comment-user">
                  <strong>Feedback by:</strong> {comment.reviewer}
                </p>
              </li>
            ))}
          </ul>

          <Button
            variant="secondary"
            className="submit-editedblog"
            onClick={() => setShowConfirmModal(true)}
          >
            Preview Blog
          </Button>

          <Button
            variant="secondary"
            className="submit-editedblog mx-2"
            onClick={handleSaveAsDraft}
            disabled={isDisabled}
          >
            Save Draft
          </Button>
          <Button variant="primary" type="submit" className="submit-editedblog" disabled={isDisabled}>
            Save
          </Button>
          <Button
            variant="primary"
            className="goback-editedblog"
            onClick={() => navigate(-1)}
          >
            Go Back
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

export default EditBlog;
