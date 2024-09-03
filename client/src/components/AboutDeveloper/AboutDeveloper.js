import React from "react";
import { Container, Card, Button, Badge, Stack } from "react-bootstrap";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import myImg from "assets/my_image.jpg";
function AboutDeveloper() {
  return (
    <section className="newpage-section">
      <Helmet>
        <title>About Developer - BloggerSpace</title>
      </Helmet>
      <Container>
        <h2 className="page-title">About Developer</h2>
        <div className="heading-underline"></div>
        <Card className="bgcolor-mint">
          <Card.Body>
            <div>
              <div className="profile-picture">
                <img
                  // src="https://avatars.githubusercontent.com/u/55067104?s=400&u=804fb40a8cbd314f8ec4bb37c4091946780b1ac2&v=4"
                  src={myImg}
                  alt="Profile"
                />
                <h4>Teekam Singh</h4>
              </div>
              <div>
                <p>
                  Hello, I’m Teekam Singh currently working in Tata Consultancy
                  Services(TCS) having 2+ years of Experience and completed my
                  B.Tech from ABES Engineering College, Ghaziabad.
                </p>
                <Stack direction="horizontal" gap={2}>
                  <b>Skills: </b>
                  <Badge bg="secondary">React.js</Badge>
                  <Badge bg="secondary">Node.js</Badge>
                  <Badge bg="secondary">MongoDB</Badge>
                  <Badge bg="secondary">Flutter</Badge>
                </Stack>
                <Stack direction="horizontal" className="mx-5" gap={2}>
                  <Badge bg="secondary">Firebase</Badge>
                  <Badge bg="secondary">C++</Badge>
                  <Badge bg="secondary">Java</Badge>
                </Stack>
                <br />
                <p>
                  <ul className="list-inline">
                    <strong>Connect on: </strong>
                    <li className="list-inline-item mx-2">
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
                        href="https://www.facebook.com/singhteekam.in"
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
    </section>
  );
}

export default AboutDeveloper;
