import React, { useEffect, useState } from "react";
import { Container, Card, Spinner, ListGroup, Badge } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import "./HomePage.css";
import axios from "axios";

function HomePage() {

  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const isLoggedIn = localStorage.getItem("token");
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await axios.get("/api/blogs");
        setBlogs(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching Blogs:", error);
      }
    };
    fetchBlogs();
  // }, [isLoggedIn, blogs]);
  }, [blogs]);

  if (isLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" /> 
      </Container>
    );
  }

  if (blogs.length===0) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <div>Blogs not found.</div>
      </Container>
    );
  }

  return (
    <div className="homepage">
      <div className="container">
        {blogs?.length === 0 ? (
          <div>No blogs found</div>
        ) : (
          <>
            <ListGroup className="m-3">
              {blogs?.map((blog) => (
                <ListGroup.Item
                  key={blog.slug}
                  className="mb-2 border hoverblog"
                >
                  <div className="row align-items-center">
                    <Link
                      to={`/${blog.slug}`}
                      // target="_blank"
                      style={{ textDecoration: "none" }}
                    >
                      <div className="col">
                        <b>{blog.title}</b>
                        {blog.tags &&
                          blog.tags.map((tag) => (
                            <Badge
                              key={tag}
                              pill
                              bg="secondary"
                              className="mx-1"
                            >
                              {tag}
                            </Badge>
                          ))}
                        <p>
                          <i className="text-muted">
                            Author: {blog.authorDetails.userName}
                          </i>
                          <br />
                          <i className="text-muted">
                            Last Updated: {blog.lastUpdatedAt.slice(11, 19)},{" "}
                            {blog.lastUpdatedAt.slice(0, 10)}
                          </i>
                        </p>
                      </div>
                    </Link>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </>
        )}
      </div>
    </div>
  );
}

export default HomePage;
