import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import "./Footer.css";
const Footer = () => {
  return (
    <footer className="footer bg-light">
      <Container className="col-lg-7 mt-2">
        <Row className="align-items-center">
          <Col md={6} className="text-md-left text-center">
            <p>
              Made by <i>Teekam Singh</i>
            </p>
          </Col>
          <Col md={6} className="text-md-right text-center">
            <ul className="list-inline">
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
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
