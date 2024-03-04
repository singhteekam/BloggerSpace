import React, { useEffect, useState } from "react";
import {
  Carousel,
  Container,
  Card,
  Spinner,
  ListGroup,
  Badge,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import "./HomePage.css";
import axios from "axios";
import CarouselImage from "../../utils/CarouselImage";

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

  if (blogs.length === 0) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <div>Blogs not found.</div>
      </Container>
    );
  }

  return (
    <div className="homepage">
      <div className="carousel-div">
        <Carousel>
          <Carousel.Item>
            <CarouselImage />
            <Carousel.Caption>
              <h3>Welcome to BloggerSpace</h3>
              <p>
                Write on any topic of your choice. Please refer the basic
                guidelines so that we can review your blog and publish it.
              </p>
            </Carousel.Caption>
          </Carousel.Item>
          <Carousel.Item>
            <CarouselImage />
            <Carousel.Caption>
              <h3>Features to explore</h3>
              <p>
                Create new blog, save as draft the blog, Change password, Email
                verification for new users, View public profile of users, etc
              </p>
            </Carousel.Caption>
          </Carousel.Item>
          <Carousel.Item>
            <CarouselImage />
            <Carousel.Caption>
              <h3>Explore Reviewer Panel </h3>
              <p>
                if you want to review blogs written by other authors then
                register yourself and verify your account. After successful
                verification, Admin will approve your request within a day.
              </p>
            </Carousel.Caption>
          </Carousel.Item>
        </Carousel>
      </div>

      <div className="homepage-blogs">
        <Container>
          <b className="m-3">Blogs you may like to read:</b>
          {blogs?.length === 0 ? (
            <div>No blogs found</div>
          ) : (
            <>
              <ListGroup className="m-3">
                {blogs.slice(0, 10)?.map((blog) => (
                  <ListGroup.Item
                    key={blog.slug}
                    className="mb-2 border blogitem"
                  >
                    <div className="row align-items-center">
                      <Link
                        to={`/${blog.slug}`}
                        // target="_blank"
                        style={{ textDecoration: "none" }}
                        onClick={()=>window.scrollTo({ top: 0, behavior: 'smooth' })}
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
        </Container>

        <Container>
          <b className="m-3">Recently published:</b>
          {blogs?.length === 0 ? (
            <div>No blogs found</div>
          ) : (
            <>
              <ListGroup className="m-3">
                {blogs.slice(-3)?.map((blog) => (
                  <ListGroup.Item
                    key={blog.slug}
                    className="mb-2 border blogitem"
                  >
                    <div className="row align-items-center">
                      <Link
                        to={`/${blog.slug}`}
                        // target="_blank"
                        style={{ textDecoration: "none" }}
                        onClick={()=>window.scrollTo({ top: 0, behavior: 'smooth' })}
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
        </Container>
      </div>
    </div>
  );
}

export default HomePage;
