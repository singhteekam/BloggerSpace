import React from 'react'
import { Container, Row, Col  } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { FaLocationArrow } from "react-icons/fa";
import { motion } from "framer-motion";
import { imageHoverVariant } from 'utils/motionVariants/variants';
import { ToastContainer, toast } from "react-toastify";
import myImg from "assets/my_image.jpg";

const DeveloperInfo = () => {
  return (
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
                <img src={myImg} className="myroundimg" />
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

  )
}

export default DeveloperInfo
