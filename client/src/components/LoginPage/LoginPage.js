import React, { useState } from "react";
import {
  Form,
  Button,
  Container,
  Row,
  Col,
  FloatingLabel,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.css";
import "./LoginPage.css";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Helmet } from "react-helmet";
import { ToastContainer, toast } from "react-toastify";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Create the request body
    const requestBody = {
      email: email,
      password: password,
    };

    // Send the login request to the backend
    axios
      .post("/api/users/login", requestBody)
      .then(async (response) => {
        // Handle the login response here
        console.log(response.data.token);
        console.log(response.data.userDetails);

        // Retrieve the token from the response
        const { token } = response.data;

        // Store the token in localStorage
        localStorage.setItem("token", token);

        // Check if the login was successful
        if (response.status === 200) {
          // setSuccess("Login successful");
          // setError("");

          const headers = {
            Authorization: `Bearer ${token}`,
          };
          console.log(headers);

          if (response.data.userDetails.isVerified) {
            await axios.get("/api/blogs", { headers });

            toast.success("Login successful!");

            // Redirect to the homepage
            setTimeout(() => {
              navigate("/");
            }, 500);
          } else {
            setTimeout(() => {
              navigate("/verify-account", {
                state: {
                  email: response.data.userDetails.email,
                  fullName: response.data.userDetails.fullName,
                },
              });
            }, 1000);
          }
        } else {
          toast.error("Login Failed.");
        }
      })
      .catch((error) => {
        // Handle any errors here
        console.error(error);
        toast.error(error.response.data.message);
      });
  };

  return (
    <div className="new-page-container loginpage-container">
      <Helmet>
        <title>Login - BloggerSpace</title>
      </Helmet>
      <Container>
        <Row className="pt-3">
          <Col md={6}>
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9bb9Mz7yTmUO-Ky9T9pTXHb2W5cUW9_L4FWcxCyGq5A&s"
              className="loginpage-image"
            />
          </Col>
          <Col md={6}>
            <div className="login-form">
              <h2 className="text-center loginpage-heading">Login</h2>
              <div className="underline mx-auto"></div>

              <Form onSubmit={handleSubmit}>
                <Form.Group controlId="email">
                  {/* <Form.Label>Email address</Form.Label> */}
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
                  {/* <Form.Label>Password</Form.Label> */}
                  <div className="password-input">
                    <FloatingLabel
                      controlId="floatingInput"
                      label="Password"
                      className="mb-3"
                      key="password"
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

                <Button
                  variant="success"
                  type="submit"
                  className="loginbutton"
                  block
                >
                  Login
                </Button>
                <Button
                  variant="secondary"
                  type="submit"
                  onClick={() => navigate("/forgotpassword")}
                  className="forgotpassbutton"
                  block
                >
                  Forgot password?
                </Button>
                <div>
                  Don't have an account? <Link to="/signup">Sign up</Link>
                </div>
              </Form>
            </div>
          </Col>
        </Row>
        <ToastContainer />
      </Container>
      {/* <div className="login-page">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 col-sm-8">
              
            </div>
          </div>
        </div>
      </div> */}
    </div>
  );
}

export default LoginPage;
