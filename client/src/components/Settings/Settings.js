import React, { useState, useEffect, useContext } from "react";
import {
  Container,
  Card,
  Button,
  Alert,
  Modal,
  Spinner,
} from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";

import { AuthContext } from "contexts/AuthContext";

const Settings = () => {
  const { user, loading, logout } = useContext(AuthContext);
  // const [user, setUser] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  // const [loading, setloading] = useState(true);
  // const isLoggedIn = localStorage.getItem("token");
  const navigate = useNavigate();

  const [userId, setUserId]= useState(user?._id);

//   useEffect(()=>{
//     setUserId(user?._id);
//     console.log(user?._id);
// },[user]);

  // console.log(user);

  // useEffect(() => {
  //   if (isLoggedIn) {
  //     axios
  //       .get("/api/users/userinfo", {
  //         headers: {
  //           Authorization: `Bearer ${isLoggedIn}`, // Include the token in the request
  //         },
  //       })
  //       .then((response) => {
  //         const userData = response.data;
  //         setloading(false);
  //         setUser(userData);
  //       })
  //       .catch((error) => {
  //         setloading(false);
  //         console.error("Error fetching user information:", error);
  //       });
  //   }
  // }, [isLoggedIn]);

  const handleVerifyAccount = () => {
    navigate("/verify-account", {
      state: {
        email: user.email,
        fullName: user.fullName,
      },
    });
  };

  const handleDeleteAccount = () => {
    setShowConfirmModal(true); // Show the confirmation modal
  };

  const handleConfirmDelete = () => {
    // Remove the token from localStorage
    localStorage.removeItem("token");
    axios
      .delete(`/api/users/delete?userId=${userId}`)
      .then((response) => {
        console.log(response.data.message);
        setShowConfirmModal(false);
        setDeleteSuccess(true); // Set the delete success state to true
        // Perform any additional cleanup or actions
        setTimeout(() => {
          navigate("/");
        }, 2000); // Navigate to the home page after 2 seconds
      })
      .catch((error) => {
        console.error("Account deletion failed:", error);
        // Handle any errors
      });
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }


  return (
    <section className="newpage-section">
      <Helmet>
        <title>Settings - BloggerSpace</title>
      </Helmet>
      <Container>
      <h3 className="page-title">Settings</h3>
        <div className="heading-underline"></div>
        {/* Account deletion success alert */}
        {deleteSuccess && (
          <Alert
            variant="success"
            onClose={() => setDeleteSuccess(false)}
            dismissible
          >
            Account deleted successfully.
          </Alert>
        )}

        <Card>
          <Card.Body>
            <Card.Title>Account Details</Card.Title>
            {user && (
              <>
                <p>
                  <strong>Name:</strong> {user.fullName}
                </p>
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
                <div>
                  <strong>Verification Status:</strong>{" "}
                  {user.isVerified ? "Verified" : "Not Verified"}
                  {!user.isVerified && (
                    <Button
                      variant="primary mx-2"
                      onClick={handleVerifyAccount}
                    >
                      Verify Account
                    </Button>
                  )}
                </div>
              </>
            )}
          </Card.Body>
        </Card>

        <Card className="mt-4">
          <Card.Body>
            <Card.Title>Account Actions</Card.Title>
            <Button variant="danger" onClick={handleDeleteAccount}>
              Delete Account
            </Button>
          </Card.Body>
        </Card>

        {/* Confirmation Modal */}
        <Modal
          show={showConfirmModal}
          onHide={() => setShowConfirmModal(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title>Confirm Delete</Modal.Title>
          </Modal.Header>
          <Modal.Body>Are you sure you want to delete your account?</Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </section>
  );
};

export default Settings;
