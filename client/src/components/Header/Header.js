import React, { useState, useEffect } from "react";
import { Button, Offcanvas } from "react-bootstrap";
import { Container, ListGroup } from "react-bootstrap";
import Form from "react-bootstrap/Form";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import { RxDragHandleHorizontal } from "react-icons/rx";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import SearchBlogs from "../Posts/SearchBlogs/SearchBlogs";
import './Header.css';

function Header() {
  const [user, setUser] = useState(null);
  // Placeholder for user login status
  const isLoggedIn = localStorage.getItem("token"); // Set to true if user is logged in, false otherwise
  const navigate = useNavigate();

  const [showCanvas, setShowCanvas] = useState(false);

  const handleCloseCanvas = () => setShowCanvas(false);
  const handleShowCanvas = () => setShowCanvas(true);

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
    <div className="header-page">
        <Navbar bg="light" expand="lg" fixed="top" >
      <Container>
        <RxDragHandleHorizontal
          size="35px"
          className="mx-2 mt-1"
          onClick={handleShowCanvas}
        />
        {isLoggedIn ? (
          <Offcanvas show={showCanvas} onHide={handleCloseCanvas}>
            <Offcanvas.Header closeButton>
              <Offcanvas.Title>
                Welcome, {user?.fullName || "Profile"}
              </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <div className="d-grid gap-2">
                <Button variant="secondary" href="/">
                  <i className="fas fa-home"></i> Home
                </Button>
                <Button variant="secondary" href="/myprofile">
                  <i className="fas fa-user"></i> My Profile
                </Button>
                <Button variant="secondary" href="/newblog">
                  <i className="fas fa-blog"></i> New Post
                </Button>
                <Button variant="secondary" href="/myblogs">
                  <i className="fas fa-blog"></i> My Blogs
                </Button>
                <Button variant="secondary" href="/savedblogs">
                  <i className="fas fa-bookmark"></i> Saved Blogs
                </Button>
                <Button variant="secondary" href="/settings">
                  <i className="fas fa-gear"></i> Settings
                </Button>
                <Button variant="secondary" href="changepassword">
                  <i className="fas fa-key"></i> Change Password
                </Button>
                
                <Button variant="danger" onClick={handleLogout}>
                  <i className="fas fa-sign-out"></i> Sign Out
                </Button>
                <hr />
                <Button variant="secondary" href="guidelines">
                  <i className="fas fa-book"></i> Writing Guidelines
                </Button>
                <Button
                  variant="secondary"
                  href="https://reviewbloggerspace.singhteekam.in/"
                  target="_blank"
                >
                  <i className="fas fa-globe"></i> Reviewer Panel
                </Button>
                <Button variant="secondary" href="/sitemap">
                  <i className="fas fa-globe"></i> Sitemap
                </Button>
                <Button variant="secondary" href="/aboutdeveloper">
                  <i className="fas fa-user"></i> About Developer
                </Button>
              </div>
            </Offcanvas.Body>
          </Offcanvas>
        ) : (
          <Offcanvas show={showCanvas} onHide={handleCloseCanvas}>
            <Offcanvas.Header closeButton>
              <Offcanvas.Title>Hi, User</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <div className="d-grid gap-2">
              <Button variant="secondary" href="/">
                  <i className="fas fa-home"></i> Home
                </Button>
                <Button variant="secondary" href="/login">
                  <i className="fas fa-user"></i> Login
                </Button>
                <Button variant="secondary" href="/signup">
                  <i className="fas fa-user"></i> SignUp
                </Button>
                <hr />
                <Button variant="secondary" href="guidelines">
                  <i className="fas fa-book"></i> Writing Guidelines
                </Button>
                <Button
                  variant="secondary"
                  href="https://reviewbloggerspace.singhteekam.in/"
                  target="_blank"
                >
                  <i className="fas fa-globe"></i> Reviewer Panel
                </Button>
                <Button variant="secondary" href="/sitemap">
                  <i className="fas fa-globe"></i> Sitemap
                </Button>
                <Button variant="secondary" href="/aboutdeveloper">
                  <i className="fas fa-user"></i> About Developer
                </Button>
              </div>
            </Offcanvas.Body>
          </Offcanvas>
        )}

        <Navbar.Brand href="/" className="fw-bold">
          <img src="/favicon2.ico" height={25} className="mx-2"></img>
          BloggerSpace
        </Navbar.Brand>

        <div>
          <Button variant="light" onClick={handleSearchClick}>
            <i className="fas fa-search"></i> Search
          </Button>
          <SearchBlogs show={showSearchModal} onHide={handleSearchModalClose} />

          {/* {isLoggedIn ? <b>Hi, {user?.fullName.split(" ")[0] || "Profile"}</b>:
          <Button variant="outline-success" onClick={() => navigate("/login")}>
            Login
          </Button>} */}
        </div>

        {/* <Navbar.Toggle aria-controls="navbarScroll" />
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
            <Nav.Link
              href="https://reviewbloggerspace.singhteekam.in/"
              target="_blank"
            >
              Reviewer Panel
            </Nav.Link>
            <Nav.Link href="/sitemap">Sitemap</Nav.Link>
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
              <b className="mt-2">
                Hi, {user?.fullName.split(" ")[0] || "Profile"}
              </b>
            ) : (
              // <NavDropdown
              //   title={user?.fullName.split(" ")[0] || "Profile"}
              //   id="navbarScrollingDropdown"
              //   className="mt-2"
              //   // drop="down-centered"
              // >
              //   <NavDropdown.Item href="/myprofile">
              //     <i className="fas fa-user"></i> My Profile
              //   </NavDropdown.Item>
              //   <NavDropdown.Item href="/myblogs">
              //     <i className="fas fa-blog"></i> My Blogs
              //   </NavDropdown.Item>
              //   <NavDropdown.Item href="/savedblogs">
              //     <i className="fas fa-bookmark"></i> Saved Blogs
              //   </NavDropdown.Item>
              //   <NavDropdown.Item href="/settings">
              //     <i className="fas fa-gear"></i> Settings
              //   </NavDropdown.Item>
              //   <NavDropdown.Item href="/changepassword">
              //     <i className="fas fa-key"></i> Change Password
              //   </NavDropdown.Item>
              //   <NavDropdown.Item href="/guidelines">
              //     <i className="fas fa-book"></i> Writing Guidelines
              //   </NavDropdown.Item>
              //   <NavDropdown.Divider />
              //   <NavDropdown.Item onClick={handleLogout}>
              //     <i className="fas fa-sign-out"></i> Signout
              //   </NavDropdown.Item>
              // </NavDropdown>
              <Button
                variant="outline-success"
                onClick={() => navigate("/login")}
              >
                Login
              </Button>
            )}
          </Form>
        </Navbar.Collapse> */}
      </Container>
    </Navbar>
    </div>
    
  );
}

export default Header;
