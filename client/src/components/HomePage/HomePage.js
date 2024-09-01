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
import "./../../styles/style.css";
import axios from "axios";
import { motion } from "framer-motion";
import { FaLocationArrow } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import ContactUs from "./ContactUs";
import {carouselVariant,imageHoverVariant,buttonVariant,marqueVariants} from "./../../utils/motionVariants/variants"



function HomePage() {
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const isLoggedIn = localStorage.getItem("token");

  return (
    <section className="newpage-section">
      <ToastContainer />
      <div>
        <Carousel>
          <Carousel.Item>
            <div className="carousel-image"></div>
            <Carousel.Caption className="color-teal-green">
              <motion.h3
                variants={carouselVariant}
                initial="hidden"
                animate="visible"
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
          <div className="carousel-image"></div>
            <Carousel.Caption className="color-teal-green">
              <h3>Features to explore</h3>
              <p>
                Create new blog, save as draft the blog, Change password, Email
                verification for new users, View public profile of users, etc
              </p>
            </Carousel.Caption>
          </Carousel.Item>
          <Carousel.Item>
          <div className="carousel-image"></div>
            <Carousel.Caption className="color-teal-green">
              <h4>Explore Reviewer Panel </h4>
              <small>
                If you want to review blogs written by other authors then
                register yourself and verify your account. After successful
                verification, Admin will approve your request within a day.
              </small>{" "}
              <br />
              <Link className="btn bs-button">
                Go to Reviewer Panel<i className="fas fa-chevron-right"></i>
              </Link>
            </Carousel.Caption>
          </Carousel.Item>
          <Carousel.Item>
          <div className="carousel-image"></div>
            <Carousel.Caption className="color-teal-green">
              <h4>Community</h4>
              <small>
                If you want to share your opinion or want to ask any question
                then post it on Community page. There is no review process. The
                submitted posts will be published immediately.
              </small>{" "}
              <br />
              <Link className="btn bs-button">
                Go to Community<i className="fas fa-chevron-right"></i>
              </Link>
            </Carousel.Caption>
          </Carousel.Item>
        </Carousel>
      </div>

      {/* Adding more sections */}
      <section className="page-new-section">
        <Container>
          <Row>
            <Col md={12} className="text-center">
              <h3 className="new-section-heading">About BloggerSpace</h3>
              <div className="heading-underline mx-auto"></div>
              <p>
                A blogging website where users can write a blog on any topic.
                There are two panels: Writing and Reviewing panel. In writing
                panel, anyone can signup and start writing blogs. The reviewer
                requests would be sent to admin for approval and then user can
                start reviewing the assigned blogs. The admin can delete any
                user, revoke/grant reviewer access.
              </p>
              <motion.div variants={buttonVariant} whileHover="hover">
                <Link to="/about" className="btn mx-1 bs-button">
                  Read more
                </Link>
              </motion.div>
            </Col>
          </Row>
        </Container>
      </section>
      {/* Adding more sections end */}

      {/* Adding more sections */}
      <section className="page-new-section bgcolor-mint">
        <Container>
          <Row>
            <Col md={12} className="text-center mb-3">
              <h3 className="new-section-heading">What You can do</h3>
              <div className="heading-underline mx-auto"></div>
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
              <Link to={"/newblog"} className="btn mb-3 bs-button-outline">
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
              <Link to={"/community"} className="btn mb-3 bs-button-outline">
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
              <Link to={"https://reviewbloggerspace.singhteekam.in/signup"} target="_blank" className="btn mb-3 bs-button-outline">
                Become a Reviewer <FaLocationArrow />
              </Link>
            </Col>
          </Row>
        </Container>
      </section>
      {/* Adding more sections end */}

      {/* Adding more sections */}
      <section className="page-new-section">
        <Container>
          <Row>
            <Col md={12} className="text-center mb-3">
              <h3 className="new-section-heading">Reviews from the Users</h3>
              <div className="heading-underline mx-auto"></div>
            </Col>
            <Col md={4}>
              <Card className="bgcolor-mint">
                <Card.Img
                  src="/assets/mohit.jpeg"
                  className="w-100 border-bottom review-card-img"
                  alt="Services"
                ></Card.Img>
                <Card.Body>
                  <h6>Mohit Sharma</h6>
                  <div className="heading-underline"></div>
                  <p>
                    <cite>
                      ❝ My experience as a reviewer and writer has reached new
                      heights. The platform’s draft and editing tools feature
                      allowing me to focus on creating high-quality content. The
                      supportive community further enhance the overall
                      experience, making BloggerSpace a standout choice.❞
                    </cite>
                  </p>
                </Card.Body>
                <Card.Footer>
                  <Link to="#" className="btn bs-button-outline">
                    View Profile
                  </Link>
                </Card.Footer>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="bgcolor-mint">
                <Card.Img
                  src="/assets/swara.jpeg"
                  className="w-100 border-bottom review-card-img"
                  alt="Services"
                ></Card.Img>
                <Card.Body>
                  <h6>Swaranjali</h6>
                  <div className="heading-underline"></div>
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
                  <Link to="#" className="btn bs-button-outline">
                    View Profile
                  </Link>
                </Card.Footer>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="bgcolor-mint">
                <Card.Img
                  src="/assets/saksham.jpeg"
                  // src="https://source.unsplash.com/random/100×100"
                  className="w-100 border-bottom review-card-img"
                  alt="Services"
                ></Card.Img>
                <Card.Body>
                  <h6>Saksham Kumar</h6>
                  <div className="heading-underline"></div>
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
                  <Link to="#" className="btn bs-button-outline">
                    View Profile
                  </Link>
                </Card.Footer>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
      {/* Adding more sections end */}

      {/* Tech stack used */}
      <section className="page-new-section">
        <Container>
          <h3 className="new-section-heading text-center">Tech Stack used</h3>
          <div className="heading-underline mx-auto mb-3"></div>
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
      <section className="page-new-section bgcolor-mint">
        <Container>
          <h3 className="new-section-heading text-center">About Developer</h3>
          <div className="heading-underline mx-auto mb-3"></div>
          <Row>
            <Col md={4}>
              <h6>Teekam Singh</h6>
              <div className="heading-underline"></div>
              <p>
                Hi, I'm Teekam Singh currently working on this website and
                adding new features, fixing bugs, adding animations, running
                server 24x7 without a downtime.
              </p>
              <Link
                className="btn bs-button-outline"
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
                  className="btn bs-button-outline m-1"
                  to={"https://brainquiz.singhteekam.in/"}
                  target="_blank"
                >
                  Live demo
                </Link>
                <Link
                  className="btn bs-button-outline m-1"
                  to={"https://github.com/singhteekam/Kaun-Banega-Crorepati"}
                  target="_blank"
                >
                  Source code
                </Link>
                <Link
                  className="btn bs-button-outline m-1"
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
                  className="btn bs-button-outline m-1"
                  to={"https://mydiary.singhteekam.in/"}
                  target="_blank"
                >
                  Live demo
                </Link>
                <Link
                  className="btn bs-button-outline m-1"
                  to={"https://github.com/singhteekam/My-Diary"}
                  target="_blank"
                >
                  Source code
                </Link>
                <Link
                  className="btn bs-button-outline m-1"
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
                      href="mailto:singhteekam.in@gmail.com"
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
    </section>
  );
}

export default HomePage;
