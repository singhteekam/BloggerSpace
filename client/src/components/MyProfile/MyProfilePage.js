import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Button,
  Alert,
  Spinner,
  ListGroup,
  Modal,
  FormControl,
} from "react-bootstrap";
import axios from "axios";
import { Helmet } from "react-helmet";
import { Link, useNavigate } from "react-router-dom";
import ImageCompressor from "image-compressor.js";
import { MdVerified } from "react-icons/md";


const MyProfilePage = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const isLoggedIn = localStorage.getItem("token");
  const navigate = useNavigate();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [fullName, setFullName] = useState("");
  const [userName, setUserName] = useState("");
  const [userNameAvailable, setUserNameAvailable] = useState(null);
  const [showSuccess, setShowSuccess] = useState(null);
  const [showError, setShowError] = useState(null);

  let i = 0;

  useEffect(() => {
    axios
      .get("/api/users/userinfo")
      .then((response) => {
        const userData = response.data;

        setIsLoading(false);
        setUser(userData);
        setFullName(userData?.fullName);
        setUserName(userData?.userName);
      })
      .catch((error) => {
        setIsLoading(false);
        console.error("Error fetching user information:", error);
        // localStorage.removeItem("token");
        // navigate("/login");
      });
  }, []);

  const checkUserNameAvailable = async (userName) => {
    await axios
      .post("/api/users/checkusername", { userName })
      .then((response) => {
        const userData = response.data.message;

        console.log(userData);
        setUserNameAvailable(true);
      })
      .catch((error) => {
        setUserNameAvailable(false);
        console.log("Error: " + error.response.data.message);
      });
  };

  const handleVerifyAccount = () => {
    navigate("/verify-account", {
      state: {
        email: user.email,
        fullName: user.fullName,
      },
    });
  };

  const handleFileChange = async (e) => {
    // setSelectedFile(e.target.files[0]);

    const file = e.target.files[0];
    // Check if the file size is greater than 64KB
    if (file.size > 0.064 * 1024 * 1024) {
      try {
        // Compress the image to a maximum of 64KB
        const compressedFile = await new ImageCompressor().compress(file, {
          quality: 0.6, // Adjust the quality as per your preference
          maxWidth: 800, // Adjust the maximum width as per your preference
          maxHeight: 800, // Adjust the maximum height as per your preference
          maxSizeMB: 0.064, // Maximum size in MB (64KB)
        });

        console.log(
          "Compressed Image Size: ",
          compressedFile.size / 1024 + " KB"
        );
        setSelectedFile(compressedFile);
      } catch (error) {
        console.error("Error compressing image:", error);
        // Handle the error
      }
    } else {
      console.log("Image Size: ", file.size / 1024 + " KB");
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append("profilePicture", selectedFile);

      axios
        .post("/api/users/uploadprofilepicture", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        .then((response) => {
          console.log(response.data);
          setUploadSuccess(true);
          setUploadError(null);

          // Reload the current page
          window.location.reload();
        })
        .catch((error) => {
          console.error("Error uploading profile picture:", error);
          setUploadSuccess(false);
          setUploadError("Failed to upload profile picture");
        });
    }
  };

  if (isLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  const handleshowEditPersonalDetailsModal = () => {
    setShowConfirmModal(true); // Show the confirmation modal
  };

  const updatePersonalDetails = async () => {
    try {
      const response = await axios.patch("/api/users/updateusername", {
        fullName,
        userName,
      });
      setShowSuccess(response.data.message);
      setShowError("");
      setUserName("");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      setShowError(error.response.data.error);
      setShowSuccess("");
    }
  };

  // const validateUsername = (username) => {
  //   if (!username) {
  //     return "Username cannot be empty.";
  //   }

  //   if (username.length < 3 || username.length > 20) {
  //     return "Username must be between 3 and 20 characters long.";
  //   }

  //   if (/\s/.test(username)) {
  //     return "Username cannot contain spaces.";
  //   }

  //   if (!/^[a-zA-Z0-9]+$/.test(username)) {
  //     return "Username can only contain letters and numbers.";
  //   }

  //   return ""; // Empty string indicates the username is valid
  // };

  return (
    <section className="newpage-section">
      <Helmet>
        <title>My Profile - BloggerSpace</title>
      </Helmet>
      <Container>
      <h3 className="page-title">My Profile</h3>
        <div className="heading-underline"></div>

        <Card className="bgcolor-mint">
          <Card.Body>
            {uploadSuccess && (
              <Alert variant="success">
                Profile picture uploaded successfully
              </Alert>
            )}
            {uploadError && <Alert variant="danger">{uploadError}</Alert>}
            <div className="profile-section">
              <div className="profile-picture">
                {/* Display the user's profile picture */}
                {user && (
                  <>
                    {user.profilePicture ? (
                      <img
                        src={`data:image/jpeg;base64,${user.profilePicture}`}
                        alt="Profile"
                      />
                    ) : (
                      <img
                        src="https://img.freepik.com/free-icon/user_318-159711.jpg"
                        alt="Profile"
                      />
                    )}

                    {selectedFile ? (
                      <p className="file-name">{selectedFile.name}</p>
                    ) : (
                      <div className="file-input">
                        <label className="custom-file-upload">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                          />
                          Change Picture
                        </label>
                      </div>
                    )}
                    {selectedFile && (
                      <Button variant="success" onClick={handleUpload}>
                        Upload
                      </Button>
                    )}
                  </>
                )}
              </div>
              <div className="profile-details">
                {user && (
                  <>
                    <p>
                      <strong>Name:</strong> {user.fullName}
                    </p>
                    <p>
                      <strong>Email:</strong> {user.email}
                    </p>
                    <p>
                      <strong>Username:</strong> {user.userName}
                    </p>
                    <p>
                      <strong>Public Profile:</strong>{" "}
                      <Link to={`/profile/${user.userName}`} target="_blank">
                        View Profile
                      </Link>
                    </p>
                    <div className="verification-status">
                      <strong>Verification Status:</strong>{" "}
                      {user.isVerified ? <MdVerified size="25px" color="blue" /> : "Not Verified"}
                      {!user.isVerified && (
                        <Button
                          variant="primary mx-2"
                          onClick={handleVerifyAccount}
                        >
                          Verify Account
                        </Button>
                      )}
                    </div>

                    <Button
                      className="bs-button"
                      onClick={handleshowEditPersonalDetailsModal}
                    >
                      Edit Personal Details
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card.Body>
        </Card>

        <Modal
          show={showConfirmModal}
          onHide={() => setShowConfirmModal(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title>Personal Details</Modal.Title>
          </Modal.Header>
          <Modal.Body >
            {showError && <Alert variant="danger">{showError}</Alert>}
            {showSuccess && <Alert variant="success">{showSuccess}</Alert>}
            <b>Full Name:</b>
            <FormControl
              type="text"
              placeholder={user?.fullName}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <b>Username:</b>
            <FormControl
              type="text"
              placeholder={user?.userName}
              value={userName}
              onChange={(e) => {
                checkUserNameAvailable(e.target.value);
                setUserName(e.target.value);
              }}
            />
            {userNameAvailable !== null ? (
              userNameAvailable === true ? (
                <Alert variant="success">Username Available</Alert>
              ) : (
                <Alert variant="danger">Username not Available</Alert>
              )
            ) : null}
          </Modal.Body>

          <Modal.Footer>
            <Button
              className="bs-button-outline"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="bs-button"
              onClick={updatePersonalDetails}
              disabled={!userNameAvailable}
            >
              Save Details
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </section>
  );
};

export default MyProfilePage;
