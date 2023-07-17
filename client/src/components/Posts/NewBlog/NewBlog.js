import React, { useState, useEffect } from "react";
import { Container, Form, Button, Alert, Badge, CloseButton } from "react-bootstrap";
import { QuillEditor } from "../../QuillEditor/QuillEditor"; // Import the QuillEditor component
import axios from "axios";
import "./NewBlog.css";
import { useNavigate } from "react-router-dom";
import blogCategory from "../../../utils/blogCategory.json";
import blogTags from "../../../utils/blogTags.json"

const NewBlog = () => {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [author, setAuthor] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otherCategory, setOtherCategory]= useState(null);
  const [saveAsDraft, setSaveAsDraft]= useState(null);
  const [selectedTag, setSelectedTag] = useState("");
  const [tags, setTags] = useState([]);

  
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem("token");

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
  }, [isLoggedIn,navigate, author]);
  

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      navigate("/login");
      return null; // or display a loading indicator while redirecting
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

      setSuccess("New blog created with pending review status!!");
      setError("");

      // Redirect to the homepage
      setTimeout(() => {
        navigate("/");
      }, 2000);

      // Handle success or redirect to a different page
    } catch (error) {
      setSuccess("");
      setError("Error occured..");
      console.error("Error creating new blog:", error);
      // Handle error
    }
  };

  const handleSaveAsDraft= async ()=>{
    try {
      const response = await axios.post("/api/blogs/saveasdraft", {
        slug,
        title,
        content,
        category: category==="Other"?otherCategory:category,
        tags
      });
      console.log(response.data);

      setSuccess("New blog saved as draft!!");
      setError("");

      // Redirect to the homepage
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      setSuccess("");
      setError("Error occured..");
      console.error("Error saving blog:", error);
      // Handle error
    }
  }

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


  return (
    <Container className="newblogpage">
      <h2 className="new-blog-heading">New Blog</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="blogTitle" className="newblogfields">
          <Form.Label>Title:</Form.Label>
          <Form.Control
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSlug(slugify(e.target.value));
            }}
            placeholder="Enter blog title"
            required
          />
        </Form.Group>
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
              <CloseButton variant="white" onClick={() => handleTagDismiss(tag)}></CloseButton>
            </Badge>
          ))}
        </Form.Group>

        <Form.Group controlId="blogContent" className="newblogfields">
          <Form.Label>Content:</Form.Label>
          <QuillEditor content={content} onContentChange={setContent} />
        </Form.Group>
        <Button
          variant="secondary"
          className="submit-newblog"
          onClick={handleSaveAsDraft}
        >
          Save Draft
        </Button>
        <Button variant="primary" type="submit" className="submit-newblog mx-2">
          Submit
        </Button>
      </Form>
    </Container>
  );
};

export default NewBlog;
