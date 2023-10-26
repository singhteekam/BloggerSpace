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
                src="https://img.freepik.com/free-icon/user_318-159711.jpg"
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
                <Badge bg="secondary">MongoDB</Badge>
                <Badge bg="secondary">Java</Badge>
                <Badge bg="secondary">C++</Badge>
              </Stack>
              <br />
              <p>
                <ul className="list-inline">
                <strong>Connect on: </strong>
                  <li className="list-inline-item mx-2">
                    <a href="#">
                      <i className="fab fa-linkedin fa-lg"></i>
                    </a>
                  </li>
                  <li className="list-inline-item mx-2">
                    <a href="#">
                      <i className="fab fa-github fa-lg"></i>
                    </a>
                  </li>
                  <li className="list-inline-item mx-2">
                    <a href="#">
                      <i className="fab fa-facebook fa-lg"></i>
                    </a>
                  </li>
                  <li className="list-inline-item mx-2">
                    <a href="#">
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
