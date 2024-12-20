import React, { useState, useEffect, useContext } from "react";
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
import bgImg from "assets/BLOGGERSPACE.png";
import { FaBook, FaGlobeAsia, FaHome, FaSitemap, FaUser } from "react-icons/fa";
import { CgNotes } from "react-icons/cg";
import { IoLogIn, IoLogInOutline, IoPeople, IoPerson } from "react-icons/io5";
import { authheaderLinks, headerLinks } from "./HeaderItems";
import { ToastContainer, toast } from "react-toastify";

import { AuthContext } from "contexts/AuthContext";

function Header() {
  const { user, setUser, logout } = useContext(AuthContext);
  // const [user, setUser] = useState(null);
  // Placeholder for user login status
  // const isLoggedIn = localStorage.getItem("token"); // Set to true if user is logged in, false otherwise
  // const navigate = useNavigate();

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


  // const handleLogout = () => {
  //   axios
  //     .post("/api/users/logout")
  //     .then((response) => {
  //       // Handle the logout response here
  //       console.log(response.data.message);

  //       // Remove the token from localStorage
  //       localStorage.removeItem("token");

  //       // Redirect to the login page
  //       // navigate("/login");
  //       window.location.reload();
  //       toast.info("Logged out!!");
  //     })
  //     .catch((error) => {
  //       // Handle any errors here
  //       toast.error("Error occured: ", error);
  //       console.error("Logout failed:", error);
  //     });
  // };

  // useEffect(()=>{
  //   const getUser= ()=>{
  //     fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/auth/login/success`,{
  //       method:"GET",
  //       credentials:"include",
  //       headers:{
  //         Accept:"application/json",
  //         "Content-Type":"application/json",
  //         "Access-Control-Allow-Credentials":true
  //       }
  //     }).then((response)=>{
  //       if(response.status===200) return response.json();
  //       throw new Error("Failed sign in");
  //     }).then(resObj=>{
  //       setUser(resObj.user);
  //       localStorage.setItem('token', resObj.token);
  //       toast.success("Sign in with Google success!!")
  //     }).catch((err)=>{
  //       console.log(err);
  //       toast.error("Error occured when sign in with google", err);
  //     })
  //   }
  //   getUser();
  // },[]);



  // console.log("User::::: ", user);

  // useEffect(() => {
  //     if (isLoggedIn) {
  //       axios
  //         .get("/api/users/userinfo", {
  //           headers: {
  //             Authorization: `Bearer ${isLoggedIn}`, // Include the token in the request
  //           },
  //         })
  //         .then((response) => {
  //           const userData = response.data;
  //           setUser(userData);
  //         })
  //         .catch((error) => {
  //           console.error("Error fetching user information:", error);
  //           if (error.response.status === 404) {
  //             // handleLogout();
  //             console.log("Error in log out: ", error);
  //           }
  //         });
  //     }
  // }, [isLoggedIn]);

  return (
    <div className="bgcolor-teal-green">
      <ToastContainer />
      {/* <Navbar bg="dark" data-bs-theme="dark" expand="lg" fixed="top" className="text-white"> */}
      <Navbar expand="lg" fixed="top" className="text-white bgcolor-teal-green">
        <Container>
          <RxDragHandleHorizontal
            size="35px"
            className="mx-2 mt-1"
            onClick={handleShowCanvas}
          />
          {user ? (
            <Offcanvas
              show={showCanvas}
              onHide={handleCloseCanvas}
              className="bgcolor-spearmint text-white header-offcanvas"
            >
              <Offcanvas.Header closeButton>
                <Offcanvas.Title className="color-teal-green">
                  Welcome, {user?.fullName || "Profile"}{" "}
                  {user?.isVerified ? <MdVerified color="blue" /> : null}
                </Offcanvas.Title>
              </Offcanvas.Header>
              <Offcanvas.Body>
                <small className="color-teal-green">Last Login: <em>{localStorage.getItem('lastLogin')?.slice(11,19)} {localStorage.getItem('lastLogin')?.slice(0,10)}</em> </small>
                <div className="d-grid gap-2">
                  {authheaderLinks.map((link) => (
                    <>
                      <Link
                        className={`btn ${
                          link.name === "Logout" ? "btn-danger" : "bs-button"
                        }`}
                        to={link.to}
                        target={link.target}
                        onClick={
                          link.onclick === "closeCanvas"
                            ? handleCloseCanvas
                            : logout
                        }
                      >
                        {link.icon} {link.name}
                      </Link>
                      {link.name === "Logout" ? <hr /> : null}
                    </>
                  ))}
                </div>
              </Offcanvas.Body>
            </Offcanvas>
          ) : (
            <Offcanvas
              show={showCanvas}
              onHide={handleCloseCanvas}
              className="bgcolor-spearmint text-white header-offcanvas"
            >
              <Offcanvas.Header closeButton>
                <Offcanvas.Title className="color-teal-green">
                  Hi, User
                </Offcanvas.Title>
              </Offcanvas.Header>
              <Offcanvas.Body>
                <div className="d-grid gap-2">
                  {headerLinks.map((link) => (
                    <>
                      <Link
                        className={`btn bs-button`}
                        to={link.to}
                        target={link.target}
                        onClick={
                          link.onclick === "closeCanvas"
                            ? handleCloseCanvas
                            : logout
                        }
                      >
                        {link.icon} {link.name}
                      </Link>
                      {link.name === "Sign Up" ? <hr /> : null}
                    </>
                  ))}
                </div>
              </Offcanvas.Body>
            </Offcanvas>
          )}

          <Navbar.Brand href="/" className="fw-bold">
            <img src={bgImg} height={25} className="mx-2"></img>
            <b className="text-white">BloggerSpace</b>
          </Navbar.Brand>

          <div>
            <Button onClick={handleSearchClick} className="bs-button-outline">
              <i className="fas fa-search"></i>
            </Button>
            <SearchBlogs
              show={showSearchModal}
              onHide={handleSearchModalClose}
            />
          </div>
        </Container>
      </Navbar>
    </div>
  );
}

export default Header;
