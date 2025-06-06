import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import "styles/style.css";
import { motion } from "framer-motion";
import { ToastContainer } from "react-toastify";
import ContactUs from "./ContactUs";
import { buttonVariant } from "./../../utils/motionVariants/variants";
import UsersReview from "./UsersReview";
import WhatYouCanDo from "./WhatYouCanDo";
import DeveloperInfo from "./DeveloperInfo";
import TechStack from "./TechStack";
import CarouselSection from "./CarouselSection";
import PreLoader from "utils/PreLoader";
import { ImArrowUpRight2 } from "react-icons/im";
import BSUsersReview from "./BSUsersReview";

function HomePage() {
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  }, []);

  if (isLoading) {
    return <PreLoader isLoading={isLoading} />;
  }

  return (
    <section className="newpage-section">
      <ToastContainer />

      {/* Carousel section  */}
      <CarouselSection />

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
          <br />
          <Row>
            <Col md={12} className="text-center">
            <Link to="/blogs" className="btn mx-1 bs-button ">
                  All Blogs <ImArrowUpRight2  />
                </Link>
                <Link to="/community" className="btn mx-1 bs-button">
                  Community <ImArrowUpRight2  />
                </Link>
            {/* <Link to="/guidelines" className="btn mx-1 bs-button">
                  Guidelines <ImArrowUpRight2  />
                </Link> */}
            
            </Col>
          </Row>
        </Container>
      </section>
      {/* Adding more sections end */}

      {/* What you can do section */}
      <WhatYouCanDo />

      {/* Users Review */}
      {/* <UsersReview /> */}
      <BSUsersReview />
      {/* Users Review end */}


      {/* Tech stack used */}
      <TechStack />

      {/* About Developer */}
      <DeveloperInfo />

      {/* Contact us */}
      <ContactUs />
    </section>
  );
}

export default HomePage;
