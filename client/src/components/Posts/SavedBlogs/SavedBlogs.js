import React, { useEffect, useState } from "react";
import { Card, Button, Container } from "react-bootstrap";
import axios from "axios";

const SavedBlogs = () => {
  const [savedBlogs, setSavedBlogs] = useState([]);

  useEffect(() => {
    const fetchSavedBlogs = async () => {
      try {
        const response = await axios.get("/api/users/savedblogs");
        setSavedBlogs(response.data);
        console.log(response.data);
      } catch (error) {
        console.log("Error occured when fetching saved blogs");
      }
    };
    fetchSavedBlogs();
  }, []);

  const removeSavedBlog = async (slug) => {
    if (!window.confirm("Do you want to remove this blog from saved blogs?"))
      return;
    try {
      const response = await axios.delete(
        `/api/users/removefromsavedblogs/${slug}`
      );
      console.log("Removed from savedBlogs");
      window.location.reload();
    } catch (error) {
      console.error("Error removing blog from savedBlogs:", error);
    }
  };

  if (savedBlogs === null) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div>Saved Blogs not found.</div>
      </div>
    );
  }

  return (
    <section className="newpage-section">
      <Container>
        <h3 className="page-title">Saved Blogs</h3>
        <div className="heading-underline"></div>
        <div className="savedblogs-items">
          {savedBlogs?.map((blog) => (
            <Card className="savedblogs-card">
              <Card.Body>
                <b>
                  <a
                    href={
                      window.location.href.slice(
                        0,
                        window.location.href.indexOf("/")
                      ) + blog.slug
                    }
                  >
                    {blog.title}
                  </a>
                </b>
                <Card.Subtitle className="mt-1 text-muted">
                  Category: {blog.category}
                </Card.Subtitle>
                <b>Tags: </b>
                {blog.tags.map((tag) => (
                  <Card.Link href="#" key={tag}>
                    {tag}
                  </Card.Link>
                ))}
              </Card.Body>
              <Card.Footer
                className="card-footer2"
                onClick={() => removeSavedBlog(blog.slug)}
              >
                <b>Remove</b>
              </Card.Footer>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default SavedBlogs;
