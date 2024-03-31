import React, { useState } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.css";
import "./SignupPage.css";

import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet";

function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [isDisabled, setIsDisabled]= useState(false);

  const navigate = useNavigate();

  const handleFullNameChange = (e) => {
    setFullName(e.target.value);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setError("");
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setError("");
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    setError("");
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
      setError("Passwords do not match");
      return;
    }

    // Password complexity validation
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()])[A-Za-z\d!@#$%^&*()]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError(
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
          setError(error.response.data.message);
        } else {
          // setError("Signup failed");
          setError(error);
          console.log(error);
        }
      });
  };

  return (
    <div>
      <Helmet>
        <title>Sign up - BloggerSpace</title>
      </Helmet>
      <div className="signup-page">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 col-sm-8">
              <div className="signup-form">
                <h2 className="text-center mb-4">Signup</h2>
                {error && <Alert variant="danger">{error}</Alert>}
                {signupSuccess && (
                  <Alert variant="success">Signup successful!</Alert>
                )}
                <Form onSubmit={handleSubmit}>
                  <Form.Group controlId="fullName">
                    <Form.Label>Full Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={handleFullNameChange}
                      required
                    />
                  </Form.Group>

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

                  <Form.Group controlId="confirmPassword">
                    <Form.Label>Confirm Password</Form.Label>
                    <div className="confirmpassword-input">
                      <Form.Control
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        required
                      />
                      <i
                        className={`toggle-confirmpassword fas ${
                          showConfirmPassword ? "fa-eye-slash" : "fa-eye"
                        }`}
                        onClick={toggleConfirmPasswordVisibility}
                      ></i>
                    </div>
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    className="signbutton"
                    block
                    disabled={isDisabled}
                  >
                    SignUp
                  </Button>

                  <div>
                    Already have an account? <Link to="/login">Login</Link>
                  </div>
                </Form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
