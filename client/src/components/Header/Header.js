import React, { useState, useEffect } from "react";
import { Button, Offcanvas } from "react-bootstrap";
import { Container, ListGroup } from "react-bootstrap";
import Form from "react-bootstrap/Form";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import { RxDragHandleHorizontal } from "react-icons/rx";
import { MdVerified } from "react-icons/md";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import SearchBlogs from "../Posts/SearchBlogs/SearchBlogs";

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


  return (
    <div className="bgcolor-teal-green">
        {/* <Navbar bg="dark" data-bs-theme="dark" expand="lg" fixed="top" className="text-white"> */}
        <Navbar expand="lg" fixed="top" className="text-white bgcolor-teal-green">
      <Container>
        <RxDragHandleHorizontal
          size="35px"
          className="mx-2 mt-1"
          onClick={handleShowCanvas}
        />
        {isLoggedIn ? (
          <Offcanvas show={showCanvas} onHide={handleCloseCanvas} className="bgcolor-spearmint text-white">
            <Offcanvas.Header closeButton>
              <Offcanvas.Title className="color-teal-green">
                Welcome, {user?.fullName || "Profile"} {user?.isVerified?<MdVerified color="blue" />:null}
              </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <div className="d-grid gap-2">
                <Link className="btn bs-button" to="/" onClick={handleCloseCanvas}>
                  <i className="fas fa-home"></i> Home
                </Link>
                <Link className="btn bs-button" to="/blogs" onClick={handleCloseCanvas}>
                  <i className="fas fa-rectangle-list"></i> Blogs
                </Link>
                <Link className="btn bs-button" to="/myprofile" onClick={handleCloseCanvas}>
                  <i className="fas fa-user"></i> My Profile
                </Link>
                <Link className="btn bs-button" to="/newblog" onClick={handleCloseCanvas}>
                  <i className="fas fa-blog"></i> New Post
                </Link>
                <Link className="btn bs-button" to="/myblogs" onClick={handleCloseCanvas}>
                  <i className="fas fa-blog"></i> My Blogs
                </Link>
                <Link className="btn bs-button" to="/savedblogs" onClick={handleCloseCanvas}>
                  <i className="fas fa-bookmark"></i> Saved Blogs
                </Link>
                <Link className="btn bs-button" to="/settings" onClick={handleCloseCanvas}>
                  <i className="fas fa-gear"></i> Settings
                </Link>
                <Link className="btn bs-button" to="/changepassword" onClick={handleCloseCanvas}>
                  <i className="fas fa-key"></i> Change Password
                </Link>
                
                <Link className="btn btn-danger" to="/" onClick={handleLogout}>
                  <i className="fas fa-sign-out"></i> Sign Out
                </Link>
                <hr />
                <Link className="btn bs-button" to="/community" onClick={handleCloseCanvas}>
                  <i className="fas fa-users"></i> Community
                </Link>
                <Link className="btn bs-button" to="/guidelines" onClick={handleCloseCanvas}>
                  <i className="fas fa-book"></i> Writing Guidelines
                </Link>
                <Link
                  className="btn bs-button"
                  to="https://reviewbloggerspace.singhteekam.in/"
                  target="_blank"
                  onClick={handleCloseCanvas}
                >
                  <i className="fas fa-globe"></i> Reviewer Panel
                </Link>
                <Link className="btn bs-button" to="/sitemap" onClick={handleCloseCanvas}>
                  <i className="fas fa-globe"></i> Sitemap
                </Link>
                <Link className="btn bs-button" to="/aboutdeveloper" onClick={handleCloseCanvas}>
                  <i className="fas fa-user"></i> About Developer
                </Link>
              </div>
            </Offcanvas.Body>
          </Offcanvas>
        ) : (
          <Offcanvas show={showCanvas} onHide={handleCloseCanvas} className="bgcolor-spearmint text-white">
            <Offcanvas.Header closeButton>
              <Offcanvas.Title className="color-teal-green">Hi, User</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <div className="d-grid gap-2 ">
              <Link className="btn bs-button" to="/" onClick={handleCloseCanvas}>
                  <i className="fas fa-home"></i> Home
                </Link>
              <Link className="btn bs-button" to="/blogs" onClick={handleCloseCanvas}>
                  <i className="fas fa-rectangle-list"></i> Blogs
                </Link>
                <Link className="btn bs-button" to="/login" onClick={handleCloseCanvas}>
                  <i className="fas fa-user"></i> Login
                </Link>
                <Link className="btn bs-button" to="/signup" onClick={handleCloseCanvas}>
                  <i className="fas fa-user"></i> SignUp
                </Link>
                <hr />
                <Link className="btn bs-button" to="/community" onClick={handleCloseCanvas}>
                  <i className="fas fa-users"></i> Community
                </Link>
                <Link className="btn bs-button" to="guidelines" onClick={handleCloseCanvas}>
                  <i className="fas fa-book"></i> Writing Guidelines
                </Link>
                <Link
                  className="btn bs-button"
                  to="https://reviewbloggerspace.singhteekam.in/"
                  target="_blank"
                >
                  <i className="fas fa-globe"></i> Reviewer Panel
                </Link>
                <Link className="btn bs-button" to="/sitemap" onClick={handleCloseCanvas}>
                  <i className="fas fa-globe"></i> Sitemap
                </Link>
                <Link className="btn bs-button" to="/aboutdeveloper" onClick={handleCloseCanvas}>
                  <i className="fas fa-user"></i> About Developer
                </Link>
              </div>
            </Offcanvas.Body>
          </Offcanvas>
        )}

        <Navbar.Brand href="/" className="fw-bold">
          <img src="/favicon2.ico" height={25} className="mx-2"></img>
          <b className="text-white">BloggerSpace</b>
        </Navbar.Brand>

        <div>
          <Button onClick={handleSearchClick} className="bs-button-outline">
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
