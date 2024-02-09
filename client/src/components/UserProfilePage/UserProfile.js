import React, { useState, useEffect } from "react";
import { Container, Card, ListGroup, Spinner } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { Helmet } from "react-helmet";
import "./UserProfile.css";

const UserProfile = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { username } = useParams();
  let i = 0;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(`/api/users/profile/${username}`);
        setUserProfile(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [username]);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (!userProfile) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <div>User not found.</div>
      </Container>
    );
  }

  const { fullName, email, blogs } = userProfile;

  return (
    <div>
      <Helmet>
        <title>{username} - User Profile - BloggerSpace</title>
      </Helmet>
      <Container className="user-profile-page">
        <h2 className="user-profile-heading">User Profile</h2>
        <Card>
          <Card.Body>
            <Card.Title>{fullName}</Card.Title>
            <Card.Text>
              Email:{" "}
              {email.slice(0, 4) + "*****" + email.slice(email.indexOf("@"))}
            </Card.Text>
          </Card.Body>
        </Card>

        <h5 className="mt-4">
          <b>Published blogs:</b>
        </h5>
        {blogs.length === 0 ? (
          <div>No blogs found</div>
        ) : (
          <ListGroup>
            {blogs.map((blog) => (
              <ListGroup.Item key={blog.slug}>
                {++i}. <Link to={`/${blog.slug}`}>{blog.title}</Link>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Container>
    </div>
  );
};

export default UserProfile;
