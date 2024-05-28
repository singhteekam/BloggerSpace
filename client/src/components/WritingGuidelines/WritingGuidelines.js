import React from "react";
import { Container, Card, Button, Badge, Stack } from "react-bootstrap";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import "./WritingGuidelines.css";

const WritingGuidelines = () => {
  return (
    <div className="new-page-container">
      <Helmet>
        <title>Writing Guidelines - BloggerSpace</title>
      </Helmet>
      <Container>
      <h3 className="page-title">Writing Guidelines</h3>
        <div className="underline"></div>
        <Card>
          <Card.Body>
            <div className="guidelines-section">
              <h6>
                Please remember the below guidelines before writing any blog.
              </h6>
              <ul>
                <li>Choose an unique available topic of the blog.</li>
                <li>The content must not be copied directly from any website.</li>
                <li>Choose appropriate Category and Tags</li>
                <li>Explain the topic properly with examples.</li>
                <li>
                  If you get any feedback after you submit the blog then modify
                  your blog according to the feedback provided.
                </li>
                <li>
                  If you are still having a query then drop a mail to:{" "}
                  <a href="mailto:contact.singhteekam@gmail.com">
                    singhteekam.in@gmail.com
                  </a>
                </li>
              </ul>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default WritingGuidelines;
