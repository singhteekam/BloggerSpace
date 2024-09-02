import React, { useEffect, useState } from "react";
import { Form, Button, Alert, Container } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";

function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const isLoggedIn = localStorage.getItem("token");

  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return; // or display a loading indicator while redirecting
    }
  }, [isLoggedIn]);

  const handleOldPasswordChange = (e) => {
    setOldPassword(e.target.value);
    setError("");
    setLoading(false);
  };

  const handleNewPasswordChange = (e) => {
    setNewPassword(e.target.value);
    setError("");
    setLoading(false);
  };

  const handleConfirmNewPasswordChange = (e) => {
    setConfirmNewPassword(e.target.value);
    setError("");
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    // Password complexity validation
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()])[A-Za-z\d!@#$%^&*()]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError(
        "Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, one digit, and one special character"
      );
      setLoading(false);
      return;
    }

    // Create the request body
    const requestBody = {
      oldPassword: oldPassword,
      newPassword: newPassword,
    };

    // Send the password reset request to the backend
    axios
      .post("/api/users/changepassword", requestBody)
      .then((response) => {
        setSuccess("Password Changed successful");
        setLoading(false);

        setTimeout(() => {
          navigate("/settings");
        }, 1000);
      })
      .catch((error) => {
        if (error.response) {
          // Request was made and server responded with a status code
          if (error.response.status === 401) {
            setError("Invalid old password");
          } else if (error.response.status === 500) {
            setError("Server error");
          } else {
            setError("Failed to change password");
          }
        } else if (error.request) {
          // Request was made but no response received
          setError("No response from server");
        } else {
          // Error occurred during the request setup
          setError("Error setting up the request");
        }
        setLoading(false);
      });
  };

  const toggleOldPasswordVisibility = () => {
    setShowOldPassword(!showOldPassword);
  };
  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };
  const toggleConfirmNewPasswordVisibility = () => {
    setShowConfirmNewPassword(!showConfirmNewPassword);
  };

  return (
    <section className="newpage-section">
      <Helmet>
        <title>Change Password - BloggerSpace</title>
      </Helmet>
      <Container className="password-page-container">
        <div className="password-change-form">
          <h2 className="text-center mb-4">Change Password</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group controlId="oldPassword">
              <Form.Label>Old Password</Form.Label>
              <div className="password-input">
              <Form.Control
                type={showOldPassword ? "text" : "password"}
                placeholder="Enter old password"
                value={oldPassword}
                onChange={handleOldPasswordChange}
                required
              />
              <i
                className={`toggle-password fas ${
                  showOldPassword ? "fa-eye-slash" : "fa-eye"
                }`}
                onClick={toggleOldPasswordVisibility}
              ></i>
              </div>
            </Form.Group>

            <Form.Group controlId="newPassword">
              <Form.Label>New Password</Form.Label>
              <div className="password-input">
              <Form.Control
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={handleNewPasswordChange}
                required
              />
              <i
                className={`toggle-password fas ${
                  showNewPassword ? "fa-eye-slash" : "fa-eye"
                }`}
                onClick={toggleNewPasswordVisibility}
              ></i>
              </div>
            </Form.Group>

            <Form.Group controlId="confirmNewPassword">
              <Form.Label>Confirm Password</Form.Label>
              <div className="password-input">
              <Form.Control
                type={showConfirmNewPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmNewPassword}
                onChange={handleConfirmNewPasswordChange}
                required
              />
              <i
                className={`toggle-password fas ${
                  showConfirmNewPassword ? "fa-eye-slash" : "fa-eye"
                }`}
                onClick={toggleConfirmNewPasswordVisibility}
              ></i>
              </div>
            </Form.Group>

            <Button
              type="submit"
              className="bs-button my-2"
              block
              disabled={loading}
            >
              {loading ? "Changing Password..." : "Change Password"}
            </Button>
          </Form>
        </div>
      </Container>
    </section>
  );
}

export default ChangePasswordPage;
