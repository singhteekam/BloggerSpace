import React, { useState } from "react";
import { Form, Button, Alert, Spinner } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.css";
import axios from "axios";
import { Helmet } from "react-helmet";
import "./ForgotPasswordPage.css";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Create the request body
    const requestBody = {
      email: email,
    };

    // Send the forgot password request to the backend
    axios
      .post("/api/users/forgotpassword", requestBody)
      .then((response) => {
        setSuccess(response.data.message + " to: " + email);
        // setSuccess("Password reset email sent successfully");
        setLoading(false);
      })
      .catch((error) => {
        if (
          error.response &&
          error.response.data &&
          error.response.data.error
        ) {
          setError(error.response.data.error);
        } else {
          setError("Failed to send password reset email");
        }
        setLoading(false);
      });
  };

  return (
    <div>
      <Helmet>
        <title>Forgot password - BloggerSpace</title>
      </Helmet>
      <div className="forgot-password-page">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 col-sm-8">
              <div className="forgot-password-form">
                <h2 className="text-center mb-4">Forgot Password</h2>
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

                  <Button
                    variant="primary"
                    type="submit"
                    className="forgot-password-button"
                    block
                    disabled={loading}
                  >
                    {loading ? (
                      <Spinner animation="border" role="status" size="sm" />
                    ) : (
                      "Send Password Reset Link"
                    )}
                  </Button>
                </Form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
