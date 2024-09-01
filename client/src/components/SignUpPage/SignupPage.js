import React, { useState } from "react";
import {
  Form,
  Button,
  Alert,
  Container,
  Row,
  Col,
  FloatingLabel,
} from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";

import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { FaGoogle, FaFacebook } from "react-icons/fa";
import { CiLock } from "react-icons/ci";

function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [signupSuccess, setSignupSuccess] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  const navigate = useNavigate();

  const handleFullNameChange = (e) => {
    setFullName(e.target.value);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Password complexity validation
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()])[A-Za-z\d!@#$%^&*()]{8,}$/;
    if (!passwordRegex.test(password)) {
      toast.error(
        "Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one digit, and one special character"
      );
      return;
    }

    setIsDisabled(true);

    // Create the request body
    const requestBody = {
      fullName: fullName,
      email: email,
      password: password,
    };
    console.log(requestBody);

    // Send the signup request to the backend
    axios
      .post("/api/users/signup", requestBody)
      .then((response) => {
        // Handle the signup response here
        console.log(response.data);

        // Set the signup success flag
        setSignupSuccess(true);

        // Clear form fields
        setFullName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");

        // Redirect to the homepage after a delay
        setTimeout(() => {
          navigate("/verify-account", {
            state: { email: email, fullName: fullName },
          });
        }, 1000);
      })
      .catch((error) => {
        setIsDisabled(false);
        // Handle the error response here
        if (
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          toast.error(error.response.data.message);
        } else {
          // setError("Signup failed");
          toast.error(error);
          console.log(error);
        }
      });
  };

  return (
    <div className="newpage-section">
      <Helmet>
        <title>Sign up - BloggerSpace</title>
      </Helmet>

      <Container>
        <Row className="pt-3">
          <Col md={6}>
            {/* <img
              src="assets/signup.png"
              // src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9bb9Mz7yTmUO-Ky9T9pTXHb2W5cUW9_L4FWcxCyGq5A&s"
              className="loginpage-image"
            /> */}
            <CiLock className="lock-icon" />
          </Col>
          <Col md={6}>
            <div className="signup-form">
              <h2 className="text-center loginpage-heading">Sign Up</h2>
              <div className="underline mx-auto"></div>

              <Form onSubmit={handleSubmit}>
                <Form.Group controlId="fullName">
                  <FloatingLabel
                    controlId="floatingInput"
                    label="Full Name"
                    className="mb-3"
                    key="name"
                  >
                    <Form.Control
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={handleFullNameChange}
                      required
                    />
                  </FloatingLabel>
                </Form.Group>

                <Form.Group controlId="email">
                  <FloatingLabel
                    controlId="floatingInput"
                    label="Email address"
                    className="mb-3"
                    key="email"
                  >
                    <Form.Control
                      type="email"
                      placeholder="Enter email"
                      value={email}
                      onChange={handleEmailChange}
                      required
                    />
                  </FloatingLabel>
                </Form.Group>

                <Form.Group controlId="password">
                  <div className="password-input">
                    <FloatingLabel
                      controlId="floatingInput"
                      label="Password"
                      className="mb-3"
                      key="pass"
                    >
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={handlePasswordChange}
                        required
                      />
                    </FloatingLabel>
                    <i
                      className={`toggle-password fas ${
                        showPassword ? "fa-eye-slash" : "fa-eye"
                      }`}
                      onClick={togglePasswordVisibility}
                    ></i>
                  </div>
                </Form.Group>

                <Form.Group controlId="confirmPassword">
                  <div className="confirmpassword-input">
                    <FloatingLabel
                      controlId="floatingInput"
                      label="Confirm Password"
                      className="mb-3"
                      key="confirmpass"
                    >
                      <Form.Control
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        required
                      />
                    </FloatingLabel>
                    <i
                      className={`toggle-confirmpassword fas ${
                        showConfirmPassword ? "fa-eye-slash" : "fa-eye"
                      }`}
                      onClick={toggleConfirmPasswordVisibility}
                    ></i>
                  </div>
                </Form.Group>

                <Button
                  variant="success"
                  type="submit"
                  block
                  disabled={isDisabled}
                >
                  Create Account
                </Button>

                <div>
                  Already have an account? <Link to="/login">Login</Link>
                </div>

                <center>or</center> <br />
                <Link className="btn btn-danger" to={`${process.env.REACT_APP_BACKEND_URL}/api/users/auth/google`}><FaGoogle title="Google" className="mb-1" /> Sign in with Google</Link>
              </Form>
            </div>{" "}
          </Col>
        </Row>
        <ToastContainer />
      </Container>

      {/* <div className="signup-page">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 col-sm-8"></div>
          </div>
        </div>
      </div> */}
    </div>
  );
}

export default SignupPage;
