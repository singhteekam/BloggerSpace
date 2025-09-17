import React, { useContext, useState } from "react";
import {
  Navbar,
  Container,
  Nav,
  Button,
  Offcanvas,
  NavDropdown,
  Form,
  FormControl,
  Image,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { AuthContext } from "contexts/AuthContext";
import { FaSearch } from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import { RxDragHandleHorizontal } from "react-icons/rx";
import logoImg from "assets/BLOGGERSPACE.png"; // Replace with your actual logo image path
import { authNavbarLinks, dropdownItems, navbarLinks } from "./HeaderItems";
import SearchBlogs from "components/Posts/SearchBlogs/SearchBlogs";
import { IoIosLogOut } from "react-icons/io";

function ResponsiveNavbar() {
  const { user, logout, loading } = useContext(AuthContext);
  const [showOffcanvas, setShowOffcanvas] = useState(false);

  const handleClose = () => setShowOffcanvas(false);
  const handleShow = () => setShowOffcanvas(true);

  const [showSearchModal, setShowSearchModal] = useState(false);
  const handleSearchClick = () => {
    setShowSearchModal(true);
  };

  const handleSearchModalClose = () => {
    setShowSearchModal(false);
  };

  return (
    <Navbar
      expand="lg"
      className="bgcolor-teal-green text-white shadow-sm"
      fixed="top"
    >
      <Container className="d-flex justify-content-between align-items-center">
        {/* Hamburger (Left, Mobile Only) */}
        <RxDragHandleHorizontal
          size="30px"
          className="text-white d-lg-none"
          style={{ cursor: "pointer" }}
          onClick={handleShow}
        />

        {/* Logo + Site Name */}
        <Navbar.Brand
          as={Link}
          to="/"
          className="text-white mx-auto mx-lg-0"
          style={{ justifyContent: "center" }}
        >
          <div className="responsive-brand">
          <img src={logoImg} height={30} className="me-2" alt="Logo" />
          <b>BloggerSpace</b>
          </div>
        </Navbar.Brand>

        {/* Desktop: Links + Dropdown */}
        <Nav className="d-none d-lg-flex align-items-center me-auto">
          {user
            ? authNavbarLinks.slice(0, 5).map((item, i) => (
                <Nav.Link
                  as={Link}
                  to={item.to}
                  className="text-white mx-2"
                  key={i}
                >
                  {item.name}
                </Nav.Link>
              ))
            : !loading && navbarLinks.slice(0, 5).map((item, i) => (
                <Nav.Link
                  as={Link}
                  to={item.to}
                  className="text-white mx-2"
                  key={i}
                >
                  {item.name}
                </Nav.Link>
              ))}

          <NavDropdown title="More" className="text-white">
            {user &&
              navbarLinks.slice(2, 5).map((link, idx) => (
                <NavDropdown.Item
                  as={Link}
                  to={link.to}
                  key={idx}
                  target={link.target}
                >
                  {link.name}
                </NavDropdown.Item>
              ))}
            {navbarLinks.slice(5).map((link, idx) => (
              <NavDropdown.Item
                as={Link}
                to={link.to}
                key={idx}
                target={link.target}
              >
                {link.name}
              </NavDropdown.Item>
            ))}
          </NavDropdown>
        </Nav>

        {/* Search Bar on large screens */}
        {/* <Form className="d-none d-lg-flex align-items-center me-3">
          <Button variant="outline-light" onClick={handleSearchClick}>
            <FaSearch /> Search
          </Button>
        </Form> */}

        {/* Right Section (Always Visible) */}
        <div className="d-flex align-items-center">
          <Button
            variant="outline-light"
            className="mx-2"
            onClick={handleSearchClick}
          >
            <FaSearch />
          </Button>
          {user ? (
            <NavDropdown
              title={
                <Image
                  src={
                    user
                      ? `data:image/jpeg;base64,${user?.profilePicture}`
                      : logoImg
                  }
                  roundedCircle
                  height={40}
                  width={40}
                  alt="User"
                />
              }
              align="end"
            >
              <NavDropdown.Item className="color-teal-green">
                <b>{user?.fullName}</b>
              </NavDropdown.Item>
              <NavDropdown.Divider />
              {dropdownItems.map((link, idx) => (
                <NavDropdown.Item as={Link} to={link.to} key={idx}>
                  {link.icon} {link.name}
                </NavDropdown.Item>
              ))}
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={logout}>
                <IoIosLogOut /> Logout
              </NavDropdown.Item>
            </NavDropdown>
          ) : (
            <>
              {!loading && (
                <Button as={Link} to="/login" variant="outline-light">
                  Login
                </Button>
              )}
            </>
          )}
        </div>

        <SearchBlogs show={showSearchModal} onHide={handleSearchModalClose} />

        {/* Offcanvas for Mobile Menu */}
        <Offcanvas
          show={showOffcanvas}
          onHide={handleClose}
          className="bgcolor-spearmint color-teal-green"
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>
              {user && user?.fullName ? `Welcome ${user?.fullName}` : "Hi user"}{" "}
              {user?.isVerified ? <MdVerified color="blue" /> : null}
            </Offcanvas.Title>
          </Offcanvas.Header>

          <Offcanvas.Body
            className="d-flex flex-column"
            style={{ maxHeight: "90vh", overflowY: "auto" }}
          >
            <small className="color-teal-green">
              Last Login:{" "}
              <em>
                {localStorage.getItem("lastLogin")?.slice(11, 19)}{" "}
                {localStorage.getItem("lastLogin")?.slice(0, 10)}
              </em>{" "}
            </small>
            <Nav className="flex-column">
              {user ? (
                <>
                  {authNavbarLinks.map((item, idx) => (
                    <Nav.Link
                      as={Link}
                      className="btn bs-button m-1"
                      to={item.to}
                      onClick={handleClose}
                    >
                      {item.icon} {item.name}
                    </Nav.Link>
                  ))}
                  <hr color="text-white" />
                  {navbarLinks.slice(4).map((item, idx) => (
                    <Nav.Link
                      as={Link}
                      className="btn bs-button m-1"
                      to={item.to}
                      onClick={handleClose}
                    >
                      {item.icon} {item.name}
                    </Nav.Link>
                  ))}
                </>
              ) : (
                !loading &&
                navbarLinks.map((item, idx) => (
                  <Nav.Link
                    as={Link}
                    className="btn bs-button m-1"
                    to={item.to}
                    onClick={handleClose}
                  >
                    {item.icon} {item.name}
                  </Nav.Link>
                ))
              )}
            </Nav>
          </Offcanvas.Body>
        </Offcanvas>
      </Container>
    </Navbar>
  );
}

export default ResponsiveNavbar;
