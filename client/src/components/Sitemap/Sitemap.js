import React, { useEffect, useState } from "react";
import {
  Container,
  Card,
  Button,
  Spinner,
  Badge,
  Image,
} from "react-bootstrap";
import axios from "axios";
import { Helmet } from "react-helmet";
import "./Sitemap.css";

const Sitemap = () => {
  const [blogs, setBlogs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await axios.get("/api/blogs");
        setBlogs(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching Blogs:", error);
      }
    };
    fetchBlogs();
  }, [blogs]);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <div>
      <Helmet>
        <title>Sitemap - BloggerSpace</title>
      </Helmet>
      <div className="sitemap-page">
        <div>
          <div className="col-md-6 col-sm-8">
            <section>
              <h5>Main Pages</h5>
              <ul>
                <li>
                  <a href="/">Home</a>
                </li>
                <li>
                  <a href="/login">Login</a>
                </li>
                <li>
                  <a href="/signup">Sign up</a>
                </li>
                <li>
                  <a href="/aboutdeveloper">About Developer</a>
                </li>
              </ul>
            </section>
            <section>
              <h5>Published Blogs</h5>
              <ul>
                {blogs?.map((blog) => (
                  <li>
                    <a href={`/${blog?.slug}`}>{blog?.title}</a>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sitemap;
