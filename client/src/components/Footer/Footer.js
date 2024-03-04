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
      <div className="footer-container">
        <div className="footer-row1">
          <Link to="/about" className="footer-row1-item" onClick={()=>window.scrollTo({ top: 0, behavior: 'smooth' })}><b>About</b></Link>
          <Link to="/privacypolicy" className="footer-row1-item" onClick={()=>window.scrollTo({ top: 0, behavior: 'smooth' })}><b>Privacy Policy</b></Link>
          <Link to="/termsandconditions" className="footer-row1-item" onClick={()=>window.scrollTo({ top: 0, behavior: 'smooth' })}><b>Terms & Conditions</b></Link>
        </div>

        <div>
          <ul className="list-inline">
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
              <a target="_blank" href="mailto:contact.singhteekam@gmail.com">
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

            <OverlayTrigger placement="top" overlay={visitorToopTip}>
              <Badge bg="primary" className="mx-3">
                Visitors {visitCount}
              </Badge>
            </OverlayTrigger>
          </ul>
        </div>

        <div>
          <p className="text-muted">Copyright © 2024 BloggerSpace</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
