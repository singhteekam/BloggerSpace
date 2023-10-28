import React, { useState, useEffect } from "react";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SearchBlogs from "../Posts/SearchBlogs/SearchBlogs";

function Header() {
  const [user, setUser] = useState(null);
  // Placeholder for user login status
  const isLoggedIn = localStorage.getItem("token"); // Set to true if user is logged in, false otherwise
  const navigate = useNavigate();

  const [showSearchModal, setShowSearchModal] = useState(false);
  const handleSearchClick = () => {
    setShowSearchModal(true);
  };

  const handleSearchModalClose = () => {
    setShowSearchModal(false);
  };

  useEffect(() => {
    if (isLoggedIn) {
      axios
        .get("/api/users/userinfo")
        .then((response) => {
          const userData = response.data;
          setUser(userData);
        })
        .catch((error) => {
          console.error("Error fetching user information:", error);
          if (error.response.status === 404) {
            handleLogout();
          }
        });
    }
  }, [isLoggedIn]);

  const handleLogout = () => {
    axios
      .post("/api/users/logout")
      .then((response) => {
        // Handle the logout response here
        console.log(response.data.message);

        // Remove the token from localStorage
        localStorage.removeItem("token");

        // Redirect to the login page
        navigate("/login");
      })
      .catch((error) => {
        // Handle any errors here
        console.error("Logout failed:", error);
      });
  };

  return (
    <Navbar bg="light" expand="lg" fixed="top" className="mb-4">
      <Container>
        <Navbar.Brand href="/" className="fw-bold">
          BloggerSpace
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="navbarScroll" />
        <Navbar.Collapse id="navbarScroll">
          <Nav
            className="me-auto my-2 my-lg-0"
            style={{ maxHeight: "100px" }}
            navbarScroll
          >
            <Nav.Link href="/">Home</Nav.Link>
            {!isLoggedIn && (
              <>
                <Nav.Link href="/login">Login</Nav.Link>
                <Nav.Link href="/signup">Signup</Nav.Link>
              </>
            )}
            {isLoggedIn && (
              <>
                <Nav.Link href="/newblog">New Post</Nav.Link>
              </>
            )}
          </Nav>
          <Form className="d-flex">
            <Button
              variant="light"
              onClick={handleSearchClick}
              className="me-4"
            >
              <i className="fas fa-search"></i> Search
            </Button>
            <SearchBlogs
              show={showSearchModal}
              onHide={handleSearchModalClose}
            />

            {isLoggedIn ? (
              <NavDropdown
                title={user?.fullName.split(" ")[0] || "Profile"}
                id="navbarScrollingDropdown"
                className="mt-2"
              >
                <NavDropdown.Item href="/myprofile">
                  <i className="fas fa-user"></i> My Profile
                </NavDropdown.Item>
                <NavDropdown.Item href="/myblogs">
                  <i className="fas fa-blog"></i> My Blogs
                </NavDropdown.Item>
                <NavDropdown.Item href="/settings">
                  <i className="fas fa-gear"></i> Settings
                </NavDropdown.Item>
                <NavDropdown.Item href="/changepassword">
                  <i className="fas fa-key"></i> Change Password
                </NavDropdown.Item>
                <NavDropdown.Item href="/guidelines">
                  <i className="fas fa-book"></i> Writing Guidelines
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  <i className="fas fa-sign-out"></i> Signout
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <Button
                variant="outline-success"
                onClick={() => navigate("/login")}
              >
                Login
              </Button>
            )}
          </Form>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Header;
