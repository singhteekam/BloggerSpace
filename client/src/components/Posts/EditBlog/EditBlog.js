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
} from "react-bootstrap";
import { QuillEditor } from "../../QuillEditor/QuillEditor"; // Import the QuillEditor component
import axios from "axios";
import "./EditBlog.css";
import { useNavigate } from "react-router-dom";
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

  const navigate = useNavigate();

  useEffect(() => {
    if(titleOrig!== title){
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
        const { slug, title, content, authorDetails, category, feedbackToAuthor, tags } =
          response.data;
        setSlug(slug);
        setTitle(title);
        setTitleOrig(title);
        setAuthorDetails(authorDetails);
        setContent(content);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isUniqueTitle) {
      setAlert({ type: "danger", message: "Title already exists" });
      return null;
    }

    try {
      const response = await axios.put(`/api/blogs/editblog/save/${id}`, {
        slug,
        title,
        content,
        category,
        tags
      });
      console.log(response.data);
      // Handle success or redirect to a different page
      // Show success alert
      setAlert({ type: "success", message: "blog updated successfully" });

      // Redirect to the homepage
      setTimeout(() => {
        navigate("/");
      }, 2000);

    } catch (error) {
      console.error("Error updating blog:", error);
      // Handle error
      // Show error alert
      setAlert({ type: "danger", message: "Failed to update blog" });
    }
  };

  const handleSaveAsDraft = async () => {
    if (!isUniqueTitle) {
      setAlert({ type: "danger", message: "Title already exists" });
      return null;
    }
    try {
      const response = await axios.post("/api/blogs/saveasdraft", {
        id,
        slug,
        title,
        content,
        category: category === "Other" ? otherCategory : category,
        tags
      });
      console.log(response.data);

      setAlert({ type: "success", message: "blog saved successfully" });

      // Redirect to the homepage
      setTimeout(() => {
        navigate(-1);
      }, 2000);
    } catch (error) {
      setAlert({ type: "danger", message: "Failed to save blog" });
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

  return (
    <Container className="editblogpage">
      <h2 className="edit-blog-heading">Edit Blog</h2>
      {alert && (
        <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible>
          {alert.message}
        </Alert>
      )}
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="blogTitle" className="editblogfields">
          <Form.Label>Title: </Form.Label>
          <Form.Control
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSlug(slugify(e.target.value));
            }}
            placeholder="Enter blog title"
          />
        </Form.Group>
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
          <QuillEditor content={content} onContentChange={setContent} />
        </Form.Group>

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
          className="submit-editedblog mx-2"
          onClick={handleSaveAsDraft}
        >
          Save Draft
        </Button>
        <Button variant="primary" type="submit" className="submit-editedblog">
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
    </Container>
  );
};

export default EditBlog;
