import React from 'react'
import { Container, Row, Col  } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { FaLocationArrow } from "react-icons/fa";

const WhatYouCanDo = () => {
  return (
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
  )
}

export default WhatYouCanDo
