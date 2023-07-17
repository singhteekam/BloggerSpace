import React, { useState } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.css";
import "./LoginPage.css";

import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setError("");
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setError("");
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
          setSuccess("Login successful");
          setError("");

          const headers = {
            Authorization: `Bearer ${token}`,
          };
          console.log(headers);

          if (response.data.userDetails.isVerified) {
            await axios.get("/api/blogs", { headers });

            // Redirect to the homepage
            setTimeout(() => {
              navigate("/");
            }, 2000);
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
          setSuccess("");
          setError("Login failed");
        }
      })
      .catch((error) => {
        // Handle any errors here
        console.error(error);
        setSuccess("");
        setError("Login failed");
      });
  };

  return (
    <div className="login-page">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-sm-8">
            <div className="login-form">
              <h2 className="text-center mb-4">Login</h2>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group controlId="email">
                  <Form.Label>Email address</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter email"
                    value={email}
                    onChange={handleEmailChange}
                    required
                  />
                </Form.Group>

                <Form.Group controlId="password">
                  <Form.Label>Password</Form.Label>
                  <div className="password-input">
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={handlePasswordChange}
                      required
                    />
                    <i
                      className={`toggle-password fas ${
                        showPassword ? "fa-eye-slash" : "fa-eye"
                      }`}
                      onClick={togglePasswordVisibility}
                    ></i>
                  </div>
                </Form.Group>

                <Button
                  variant="primary"
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
