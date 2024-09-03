import React, { useState, useEffect } from 'react'
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
import { QuillEditor } from "components/QuillEditor/QuillEditor"; // Import the QuillEditor component
import TinymceEditor from "utils/TinymceEditor";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { ToastContainer, toast } from "react-toastify";
import blogCategory from "utils/blogCategory.json";
import blogTags from "utils/blogTags.json";

import Editor from 'ckeditor5-custom-build/build/ckeditor';
import { CKEditor } from '@ckeditor/ckeditor5-react';


const ImproveBlog = () => {
    const { blogId } = useParams();
    
    const [blog, setBlog] = useState(null);
    const [titleOrig, setTitleOrig] = useState("");
    const [title, setTitle] = useState("");
    const [authorDetails, setAuthorDetails] = useState(null);
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [otherCategory, setOtherCategory] = useState(null);
    const [selectedTag, setSelectedTag] = useState("");
    const [tags, setTags] = useState([]);
    const [contentSize, setContentSize] = useState(0);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isDisabled, setIsDisabled]= useState(false);
  
    const navigate = useNavigate();
  
    const [initialContent, setInitialContent]= useState("");
  
  
    useEffect(() => {
      const fetchBlog = async () => {
        try {
          const response = await axios.get(`/api/blogs/fetchblog/${blogId}`);
          setBlog(response.data);
          setContent(response.data.content);
          setInitialContent(response.data.content);
          setCategory(response.data.category);
          setTags(response.data.tags);
          setIsLoading(false);
        } catch (error) {
          console.error("Error fetching Blog:", error);
          navigate("/login");
        }
      };
  
      fetchBlog();
    }, [blogId, navigate]);
  
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

      try {
        setIsDisabled(true);
        const response = await axios.put(`/api/blogs/improveblog/save/${blogId}`, {
          // slug,
          // title,
          content,
          category,
          tags,
        });
        console.log(response.data);
        // Handle success or redirect to a different page
        // Show success alert
        toast.success("Blog submitted for improvement successfully!!");
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

    if (isLoading) {
      return (
        <Container className="d-flex justify-content-center align-items-center vh-100">
          <div class="loader"></div>
        </Container>
      );
    }

  return (
    <>
    <div className="newpage-section">
      <Helmet>
        <title>Improve Blog</title>
      </Helmet>
      <Container>
        <h2 className="page-title">Improve Blog - Id:{blogId}</h2>
        <div className="heading-underline"></div>

        <Form onSubmit={handleSubmit}>
        <Form.Group controlId="blogTitle" className="editblogfields">
            <Form.Label>Title: </Form.Label>
            <Form.Control
              type="text"
              value={blog.title}
              placeholder="Enter blog title"
              disabled
            />
          </Form.Group>

          <Form.Group controlId="blogAuthor" className="editblogfields">
            <Form.Label>Author:</Form.Label>
            <Form.Control
              type="text"
              value={blog.authorDetails.userName}
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
            <CKEditor
                    editor={ Editor }
                    data={initialContent}
                    onChange={ ( event, editor ) => {
                        setContent(editor.getData());
                    } }
                />

          </Form.Group>

          <h6>Content size: {contentSize} KB</h6>

          <Button
            variant="secondary"
            className="submit-editedblog"
            onClick={() => setShowConfirmModal(true)}
          >
            Preview Blog
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
            Slug: {blog.slug}
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
    </>
  )
}

export default ImproveBlog
