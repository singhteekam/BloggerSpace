import React, { useState, useEffect } from "react";
import { Container, Card, ListGroup, Spinner, Image } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { Helmet } from "react-helmet";

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
    <section className="newpage-section">
      <Helmet>
        <title>{username} - User Profile - BloggerSpace</title>
      </Helmet>
      <Container>
        <h2 className="page-title">User Profile</h2>
        <Card className="bgcolor-mint">
          <Card.Body>
            <Card.Title>{fullName}</Card.Title>
            <Card.Text>
              <p>
                Email:{" "}
                {email.slice(0, 4) + "*****" + email.slice(email.indexOf("@"))}
              </p>
            </Card.Text>
            <div>
              <b>Followers: {userProfile.followers.length}</b>
              <ul>
                {userProfile.followers.map((follower, index) => (
                  <li key={index} style={{ listStyleType: "none" }}>
                    <div className="mt-2">
                      <Image
                        src={
                          follower.profilePicture
                            ? `data:image/jpeg;base64,${follower.profilePicture}`
                            : "https://img.freepik.com/free-icon/user_318-159711.jpg"
                        }
                        roundedCircle
                        className="avatar-icon"
                        style={{ width: "30px", height: "30px" }}
                      />
                      <Link
                        to={`/profile/${follower.userName}`}
                        target="_blank"
                        style={{ textDecoration: "none" }}
                      >
                        <b className="mx-3">{follower.userName}</b>
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <b>Following: {userProfile.following.length}</b>
              <ul>
                {userProfile.following.map((f, index) => (
                  <li key={index} style={{ listStyleType: "none" }}>
                    <div className="mt-2">
                      <Image
                        src={
                          f.profilePicture
                            ? `data:image/jpeg;base64,${f.profilePicture}`
                            : "https://img.freepik.com/free-icon/user_318-159711.jpg"
                        }
                        roundedCircle
                        className="avatar-icon"
                        style={{ width: "30px", height: "30px" }}
                      />
                      <Link
                        to={`/profile/${f.userName}`}
                        target="_blank"
                        style={{ textDecoration: "none" }}
                      >
                        <b className="mx-3">{f.userName}</b>
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
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
    </section>
  );
};

export default UserProfile;
