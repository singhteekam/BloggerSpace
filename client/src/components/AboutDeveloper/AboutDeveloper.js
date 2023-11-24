import React from "react";
import { Container, Card, Button, Badge, Stack } from "react-bootstrap";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./AboutDeveloper.css";

function AboutDeveloper() {
  return (
    <Container className="developer-page">
      <h2 className="developer-heading">About Developer</h2>
      <Card>
        <Card.Body>
          <div className="profile-section">
            <div className="profile-picture">
              <img
                src="https://scontent.fdel27-1.fna.fbcdn.net/v/t39.30808-1/387805322_3529854184009562_6613907963940194751_n.jpg?stp=dst-jpg_p320x320&_nc_cat=111&ccb=1-7&_nc_sid=5f2048&_nc_ohc=iT7udbG14xUAX_gsD_y&_nc_ht=scontent.fdel27-1.fna&oh=00_AfCBtKXio621hGXC7IZ6-FT6ayNFqDDzKs-sGBQQmRWjcw&oe=65668350"
                alt="Profile"
              />
              <h4>Teekam Singh</h4>
            </div>
            <div className="profile-details">
              <p>
                Hello, I’m Teekam Singh currently working in Tata Consultancy
                Services(TCS) having 1 year of Experience and completed by
                B.Tech from ABES Engineering College, Ghaziabad.
              </p>
              <Stack direction="horizontal" gap={2}>
                <b>Skills: </b>
                <Badge bg="secondary">Flutter</Badge>
                <Badge bg="secondary">Firebase</Badge>
                <Badge bg="secondary">React.js</Badge>
                <Badge bg="secondary">Node.js</Badge>
              </Stack>
              <Stack direction="horizontal" className="mx-5" gap={2}>
                <Badge bg="secondary">MongoDB</Badge>
                <Badge bg="secondary">Java</Badge>
                <Badge bg="secondary">C++</Badge>
              </Stack>
              <br />
              <p>
                <ul className="list-inline">
                  <strong>Connect on: </strong>
                  <li className="list-inline-item mx-2">
                    <a
                      target="_blank"
                      href="https://in.linkedin.com/in/teekam-singh-26476a185"
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
                      href="https://www.facebook.com/teekam.singh.9480/"
                    >
                      <i className="fab fa-facebook fa-lg"></i>
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
              </p>
            </div>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default AboutDeveloper;
