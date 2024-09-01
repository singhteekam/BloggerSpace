import React, { useState } from "react";
import { Form, Button, Alert, Row, Container, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.css";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import "./ResetPasswordPage.css";

function ResetPasswordPage() {
  const { resetToken } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    // Password complexity validation
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()])[A-Za-z\d!@#$%^&*()]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError(
        "Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one digit, and one special character"
      );
      return;
    }

    // Create the request body
    const requestBody = {
      resetToken: resetToken,
      password: password,
      confirmPassword: confirmPassword,
    };

    // Send the password reset request to the backend
    axios
      .post("/api/users/resetpassword", requestBody)
      .then((response) => {
        setSuccess("Password reset successful");
        setLoading(false);

        setTimeout(() => {
          navigate("/login");
        }, 1000);
      })
      .catch((error) => {
        setError("Failed to reset password");
        setLoading(false);
      });
  };

  return (
    <section className="newpage-section">
      <Helmet>
        <title>Reset Password - BloggerSpace</title>
      </Helmet>
        <Container className="password-page-container">
          <Row className="justify-content-center">
            <Col md={6} sm={8}>
              <div className="password-reset-form">
                <h2 className="text-center mb-4">Reset Password</h2>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}
                <Form onSubmit={handleSubmit}>
                  <Form.Group controlId="password">
                    <Form.Label>New Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter new password"
                      value={password}
                      onChange={handlePasswordChange}
                      required
                    />
                  </Form.Group>

                  <Form.Group controlId="confirmPassword">
                    <Form.Label>Confirm Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={handleConfirmPasswordChange}
                      required
                    />
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    className="password-reset-button"
                    block
                    disabled={loading}
                  >
                    {loading ? "Resetting Password..." : "Reset Password"}
                  </Button>
                </Form>
              </div>
            </Col>
          </Row>
        </Container>
    </section>
  );
}

export default ResetPasswordPage;
