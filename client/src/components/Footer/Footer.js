import React from "react";
import {
  Container,
  Row,
  Col,
  Badge,
  Tooltip,
  OverlayTrigger,
  Button,
} from "react-bootstrap";
import "./Footer.css";
import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const Footer = () => {
  const [visitCount, setVisitCount] = useState(0);

  useEffect(() => {
    const hasVisited = sessionStorage.getItem("hasVisited");
    console.log("Visited?: " + hasVisited);
    if (!hasVisited) {
      // Increment visit count on the server
      incrementVisitCount();
      // Mark the user as visited in the current session
      sessionStorage.setItem("hasVisited", true);
    }
    // Fetch the initial visit count from the backend
    getVisitCount();
  }, []);

  const getVisitCount = async () => {
    try {
      const response = await axios.get("/api/users/visitors");
      setVisitCount(response.data.count);
    } catch (error) {
      console.error("Error fetching visit count:", error);
    }
  };

  const incrementVisitCount = async () => {
    try {
      await axios.post("/api/users/addvisitor");
      setVisitCount((prevCount) => prevCount + 1);
    } catch (error) {
      console.error("Error incrementing visit count:", error);
    }
  };

  const visitorToopTip = (
    <Tooltip id="tooltip">
      This site has been visited {visitCount} times.
    </Tooltip>
  );

  return (
    <footer className="footer bg-light">
      <Container className="col-lg-7 mt-1">
        <Row className="align-items-center">
          <Col md={6} className="text-md-left text-center">
            {/* <p>&copy; 2023 Your Company. All rights reserved.</p> */}
            <p>
              <Link to={"/aboutdeveloper"}>
                Made by <i>Teekam Singh</i>
              </Link>
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
                  {/* <i className="fab fa-facebook fa-lg"></i> */}
                  <i className="fa fa-envelope fa-lg"></i>
                </a>
              </li>
              <li className="list-inline-item mx-2">
                <a href="#">
                  <i className="fab fa-instagram fa-lg"></i>
                </a>
              </li>

              <OverlayTrigger placement="top" overlay={visitorToopTip}>
                <Badge bg="primary" className="mx-3">
                  Visitors {visitCount}
                </Badge>
              </OverlayTrigger>
            </ul>
          </Col>
        </Row>
        {/* <Row>
          <Col className="text-center">
            <p>Additional footer content or social media icons can go here.</p>
          </Col>
        </Row> */}
      </Container>
    </footer>
  );
};

export default Footer;
