import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button, Alert, Spinner } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";

function VerifyAccountPage() {
  const location = useLocation();
  const { email, fullName } = location.state || {};

  const [error, setError] = useState("");
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [verificationLater, setverificationLater] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Check if the required user details are available
    if (!email || !fullName) {
      setError("Invalid verification link");
    }

    const isLoggedIn = localStorage.getItem("token");

    if (!isLoggedIn) {
      navigate("/login");
      return; // or display a loading indicator while redirecting
    }
  }, [email, fullName, navigate]);

  const handleVerification = () => {
    setVerificationSuccess(false);
    setError("");
    setIsSendingVerification(true);

    // Create the request body
    const requestBody = {
      email: email,
      fullName: fullName,
    };

    // Send the verification request to the backend
    axios
      .post("/api/users/verify-account", requestBody)
      .then((response) => {
        // Handle the verification response here
        console.log(response.data);

        // Set the verification success flag
        setVerificationSuccess(true);
        setIsSendingVerification(false);

        // Check if the user is verified
        if (response.data.isVerified) {
          setTimeout(() => {
            navigate("/");
          }, 2000);
        }
        // else {
        //   setError("Account verification failed");
        // }
      })
      .catch((error) => {
        // Handle the error response here
        if (
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          setError(error.response.data.message);
        } else {
          setError("Verification failed");
        }
      });
  };

  const handleVerificationLater = () => {
    setVerificationSuccess(false);
    setError("");
    setIsSendingVerification(false);
    setverificationLater(true);
    setTimeout(() => {
      navigate("/");
    }, 2000);
  };

  return (
    <section className="newpage-section">
      <Helmet>
        <title>Verify account - BloggerSpace</title>
      </Helmet>
      <div>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 col-sm-8">
              <div className="verify-account-form">
                <h2 className="text-center mb-4">Verify Account</h2>
                {error && <Alert variant="danger">{error}</Alert>}
                {verificationSuccess && (
                  <Alert variant="success">
                    Account verification link sent to {email}! Please verify
                    your account by clicking the link.
                  </Alert>
                )}
                {verificationLater && (
                  <Alert variant="info">Account Verification pending..</Alert>
                )}

                <div className="text-center">
                  <Button
                    variant="primary"
                    onClick={handleVerification}
                    className="verify-button"
                  >
                    {isSendingVerification ? (
                      <Spinner animation="border" role="status" size="sm" />
                    ) : (
                      "Send Verification Link"
                    )}
                  </Button>
                </div>
                <div className="text-center">
                  <Button
                    variant="secondary"
                    onClick={handleVerificationLater}
                    className="verify-button"
                  >
                    Verify later
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default VerifyAccountPage;
