import React, { useEffect, useState } from "react";
import {
  Carousel,
  Container,
  Card,
  Spinner,
  ListGroup,
  Badge,
  Button,
  Row,
  Col,
  Form,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import "./HomePage.css";
import axios from "axios";
import CarouselImage from "../../utils/CarouselImage";
import { motion } from "framer-motion";
import { FaLocationArrow } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import ContactUs from "./ContactUs";

const carouselVariant = {
  hidden: {
    opacity: 0,
    x: -50,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      delay: 0.5,
      duration: 2,
    },
  },
};
const imageHoverVariant = {
  hover: {
    scale: 1.2,
    fontWeight: "bold",
    // originX: 0,
    // textShadow:"0px 0px 8px rgb(255,255,255)",
    // boxShadow:"0px 0px 8px rgb(255,255,255)",
    transition: {
      type: "spring",
      stiffness: 300,
      yoyo: Infinity, // We can give any value like 100 etc
    },
  },
};

const buttonVariant = {
  hover: {
    scale: 1.1,
    transition: {
      type: "spring",
      stiffness: 300,
      yoyo: Infinity, // We can give any value like 100 etc
    },
  },
};

const marqueVariants = {
  animate: {
    x: [-25, -1000],
    transition: {
      x: {
        repeat: Infinity,
        repeatType: "loop",
        duration: 6,
        ease: "linear",
        stiffness: 500,
      },
    },
  },
};

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
      <ToastContainer />
      <div>
        <Carousel>
          <Carousel.Item>
            <CarouselImage />
            <Carousel.Caption>
              <motion.h3
                variants={carouselVariant}
                initial="hidden"
                animate="visible"
                // initial={{x:-20}}
                // animate={{x:20}}
                // transition={{type:"tween", duration:2}}
              >
                Welcome to BloggerSpace
              </motion.h3>
              <motion.p
                variants={carouselVariant}
                initial="hidden"
                animate="visible"
              >
                Write on any topic of your choice. Please refer the basic
                guidelines so that we can review your blog and publish it.
              </motion.p>
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
              <h4>Explore Reviewer Panel </h4>
              <small>
                If you want to review blogs written by other authors then
                register yourself and verify your account. After successful
                verification, Admin will approve your request within a day.
              </small>{" "}
              <br />
              <a className="btn btn-danger">
                Go to Reviewer Panel<i className="fas fa-chevron-right"></i>
              </a>
            </Carousel.Caption>
          </Carousel.Item>
          <Carousel.Item>
            <CarouselImage />
            <Carousel.Caption>
              <h4>Community</h4>
              <small>
                If you want to share your opinion or want to ask any question
                then post it on Community page. There is no review process. The
                submitted posts will be published immediately.
              </small>{" "}
              <br />
              <a className="btn btn-danger">
                Go to Community<i className="fas fa-chevron-right"></i>
              </a>
            </Carousel.Caption>
          </Carousel.Item>
        </Carousel>
      </div>

      {/* Adding more sections */}
      <section className="section2">
        <Container>
          <Row>
            <Col md={12} className="text-center">
              <h3 className="section2heading">About BloggerSpace</h3>
              <div className="underline mx-auto"></div>
              <p>
                A blogging website where users can write a blog on any topic.
                There are two panels: Writing and Reviewing panel. In writing
                panel, anyone can signup and start writing blogs. The reviewer
                requests would be sent to admin for approval and then user can
                start reviewing the assigned blogs. The admin can delete any
                user, revoke/grant reviewer access.
              </p>
              <motion.div variants={buttonVariant} whileHover="hover">
                <Link to="/about" className="btn btn-warning shadow mx-1">
                  Read more
                </Link>
              </motion.div>
            </Col>
          </Row>
        </Container>
      </section>
      {/* Adding more sections end */}

      {/* Adding more sections */}
      <section className="section2 bgcolor border-top">
        <Container>
          <Row>
            <Col md={12} className="text-center mb-3">
              <h3 className="section2heading">What You can do</h3>
              <div className="underline mx-auto"></div>
            </Col>
            <Col md={4} className="text-center">
              <h5>Write Blogs</h5>
              <p>
                A blogging website where users can write a blog on any topic.
                There are two panels: Writing and Reviewing panel. In writing
                panel, anyone can signup and start writing blogs. The reviewer
                requests would be sent to admin for approval and then user can
                start reviewing the assigned blogs. The admin can delete any
                user, revoke/grant reviewer access.
              </p>
              <Link to={"/newblog"} className="btn btn-outline-success mb-3">
                Write a blog <FaLocationArrow />
              </Link>
            </Col>
            <Col md={4} className="text-center">
              <h5>Post your query in Community</h5>
              <p>
                A blogging website where users can write a blog on any topic.
                There are two panels: Writing and Reviewing panel. In writing
                panel, anyone can signup and start writing blogs. The reviewer
                requests would be sent to admin for approval and then user can
                start reviewing the assigned blogs. The admin can delete any
                user, revoke/grant reviewer access.
              </p>
              <Link to={"/community"} className="btn btn-outline-success mb-3">
                Create community post <FaLocationArrow />
              </Link>
            </Col>
            <Col md={4} className="text-center">
              <h5>Become a Reviewer</h5>
              <p>
                A blogging website where users can write a blog on any topic.
                There are two panels: Writing and Reviewing panel. In writing
                panel, anyone can signup and start writing blogs. The reviewer
                requests would be sent to admin for approval and then user can
                start reviewing the assigned blogs. The admin can delete any
                user, revoke/grant reviewer access.
              </p>
              <Link to={"/newblog"} className="btn btn-outline-success mb-3">
                Become a Reviewer <FaLocationArrow />
              </Link>
            </Col>
          </Row>
        </Container>
      </section>
      {/* Adding more sections end */}

      {/* Adding more sections */}
      <section className="section2 border-top">
        <Container>
          <Row>
            <Col md={12} className="text-center mb-3">
              <h3 className="section2heading">Reviews from the Users</h3>
              <div className="underline mx-auto"></div>
            </Col>
            <Col md={4}>
              <Card className="shadow reviews-card">
                <Card.Img
                  src="/assets/mohit.jpeg"
                  className="w-100 border-bottom review-card-img"
                  alt="Services"
                ></Card.Img>
                <Card.Body>
                  <h6>Mohit Sharma</h6>
                  <div className="underline"></div>
                  <p>
                    <cite>
                      ❝ My experience as a reviewer and writer has reached new
                      heights. The platform’s draft and editing tools feature
                      allowing me to focus on creating high-quality content. The
                      supportive community further enhance the overall
                      experience, making BloggerSpace a standout choice for
                      serious bloggers.❞
                    </cite>
                  </p>
                </Card.Body>
                <Card.Footer>
                  <Link to="#" className="btn btn-outline-success">
                    View Profile
                  </Link>
                </Card.Footer>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="shadow reviews-card">
                <Card.Img
                  src="/assets/swara.jpeg"
                  className="w-100 border-bottom review-card-img"
                  alt="Services"
                ></Card.Img>
                <Card.Body>
                  <h6>Swaranjali</h6>
                  <div className="underline"></div>
                  <p>
                    <cite>
                      ❝ As a dedicated blogger who values both creativity and
                      efficiency, my experience with BloggerSpace has been
                      exceptional. The platform's focus on enhancing the writing
                      process through innovative features sets it apart in the
                      crowded world of blogging tools.❞
                    </cite>
                  </p>
                </Card.Body>
                <Card.Footer>
                  <Link to="#" className="btn btn-outline-success">
                    View Profile
                  </Link>
                </Card.Footer>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="shadow reviews-card">
                <Card.Img
                  src="/assets/saksham.jpeg"
                  // src="https://source.unsplash.com/random/100×100"
                  className="w-100 border-bottom review-card-img"
                  alt="Services"
                ></Card.Img>
                <Card.Body>
                  <h6>Saksham Kumar</h6>
                  <div className="underline"></div>
                  <p>
                    <cite>
                      ❝ BloggerSpace has exceeded my expectations with its
                      exceptional writing features and user-friendly interface.
                      The advanced editing tools, collaborative features, and
                      powerful SEO capabilities have transformed my blogging
                      experience, making it more productive and enjoyable.❞
                    </cite>
                  </p>
                </Card.Body>
                <Card.Footer>
                  <Link to="#" className="btn btn-outline-success">
                    View Profile
                  </Link>
                </Card.Footer>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
      {/* Adding more sections end */}

      {/* <div className="homepage-blogs">
        <Container>
          <b className="m-3">Most Viewed Blogs:</b>
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
                    <motion.div
                      variants={blogItemVariant}
                      whileHover="hover"
                      className="row align-items-center"
                    >
                      <Link
                        to={`/${blog.slug}`}
                        // target="_blank"
                        style={{ textDecoration: "none" }}
                        onClick={() =>
                          window.scrollTo({ top: 0, behavior: "smooth" })
                        }
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
                    </motion.div>
                  </ListGroup.Item>
                ))}
                <Link to={"/sitemap"}>Show more</Link>
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
                {blogs.slice(-4)?.map((blog) => (
                  <ListGroup.Item
                    key={blog.slug}
                    className="mb-2 border blogitem"
                  >
                    <div className="row align-items-center">
                      <Link
                        to={`/${blog.slug}`}
                        // target="_blank"
                        style={{ textDecoration: "none" }}
                        onClick={() =>
                          window.scrollTo({ top: 0, behavior: "smooth" })
                        }
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
      </div> */}

      {/* Tech stack used */}
      <section className="section2">
        <Container>
          <h3 className="section2heading text-center">Tech Stack used</h3>
          <div className="underline mx-auto mb-3"></div>
          <div className="logos">
            <motion.div
              variants={marqueVariants}
              animate="animate"
              className="logos-slide"
            >
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/2300px-React-icon.svg.png" />
              <img src="https://cdn.buttercms.com/4XpulFfySpWyYTXuaVL2" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Node.js_logo.svg/2560px-Node.js_logo.svg.png" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/MongoDB_Logo.svg/2560px-MongoDB_Logo.svg.png" />
              <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSa5ZSJpLPqVsS-3h_GuNL6MVQWOq822oOzO9bx8BEuYQ&s" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/2300px-React-icon.svg.png" />
              <img src="https://cdn.buttercms.com/4XpulFfySpWyYTXuaVL2" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Node.js_logo.svg/2560px-Node.js_logo.svg.png" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/MongoDB_Logo.svg/2560px-MongoDB_Logo.svg.png" />
              <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSa5ZSJpLPqVsS-3h_GuNL6MVQWOq822oOzO9bx8BEuYQ&s" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/2300px-React-icon.svg.png" />
              <img src="https://cdn.buttercms.com/4XpulFfySpWyYTXuaVL2" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Node.js_logo.svg/2560px-Node.js_logo.svg.png" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/MongoDB_Logo.svg/2560px-MongoDB_Logo.svg.png" />
              <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSa5ZSJpLPqVsS-3h_GuNL6MVQWOq822oOzO9bx8BEuYQ&s" />
            </motion.div>
          </div>
        </Container>
      </section>

      {/* About Developer */}
      <section className="section2">
        <Container>
          <h3 className="section2heading text-center">About Developer</h3>
          <div className="underline mx-auto mb-3"></div>
          <Row>
            <Col md={4}>
              <h6>Teekam Singh</h6>
              <div className="underline"></div>
              <p>
                Hi, I'm Teekam Singh currently working on this website and
                adding new features, fixing bugs, adding animations, running
                server 24x7 without a downtime.
              </p>
              <Link
                className="btn btn-outline-success"
                to={"https://www.singhteekam.in/"}
                target="_blank"
              >
                View Portfolio <FaLocationArrow />
              </Link>
              <br />
              <i>
                It would be a great help if you give me your 2 minutes and
                explore this website and give me your suggestions/feedback.
              </i>
            </Col>
            <Col md={4} className="text-center">
              <motion.div variants={imageHoverVariant} whileHover="hover">
                <img src="my_image.jpg" className="myroundimg" />
              </motion.div>
            </Col>
            <Col md={4}>
              <h5>More projects:</h5>
              <div>
                <b>BrainQuiz: </b>
                <Link
                  className="btn btn-outline-info m-1"
                  to={"https://brainquiz.singhteekam.in/"}
                  target="_blank"
                >
                  Live demo
                </Link>
                <Link
                  className="btn btn-outline-info m-1"
                  to={"https://github.com/singhteekam/Kaun-Banega-Crorepati"}
                  target="_blank"
                >
                  Source code
                </Link>
                <Link
                  className="btn btn-outline-info m-1"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      "https://brainquiz.singhteekam.in/"
                    );
                    toast.success("URL Copied to clipboard");
                  }}
                >
                  Copy URL
                </Link>
              </div>
              <div className="mt-2">
                <b>MyDiary: </b>
                <Link
                  className="btn btn-outline-info m-1"
                  to={"https://mydiary.singhteekam.in/"}
                  target="_blank"
                >
                  Live demo
                </Link>
                <Link
                  className="btn btn-outline-info m-1"
                  to={"https://github.com/singhteekam/My-Diary"}
                  target="_blank"
                >
                  Source code
                </Link>
                <Link
                  className="btn btn-outline-info m-1"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      "https://mydiary.singhteekam.in/"
                    );
                    toast.success("URL Copied to clipboard");
                  }}
                >
                  Copy URL
                </Link>
              </div>
              <br />
              <div>
                <h5>Social Media Links:</h5>
                <ul className="list-inline">
                  <li className="list-inline-item">
                    <a
                      target="_blank"
                      href="https://in.linkedin.com/in/singhteekam"
                    >
                      <i className="fab fa-linkedin fa-lg"></i>
                    </a>
                  </li>
                  <li className="list-inline-item mx-2">
                    <a target="_blank" href="https://github.com/singhteekam">
                      <i className="fab fa-github fa-lg"></i>
                    </a>
                  </li>
                  <li className="list-inline-item mx-2">
                    <a
                      target="_blank"
                      href="mailto:contact.singhteekam@gmail.com"
                    >
                      {/* <i className="fab fa-facebook fa-lg"></i> */}
                      <i className="fa fa-envelope fa-lg"></i>
                    </a>
                  </li>
                  <li className="list-inline-item mx-2">
                    <a
                      target="_blank"
                      href="https://www.instagram.com/singh__teekam/"
                    >
                      <i className="fab fa-instagram fa-lg"></i>
                    </a>
                  </li>
                </ul>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Contact us */}
      <ContactUs />
    </div>
  );
}

export default HomePage;
