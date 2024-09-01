import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Card,
  ListGroup,
  Form,
  Button,
  Alert,
  Spinner,
  Tab,
  Tabs,
  Badge,
} from "react-bootstrap";
import axios from "axios";
import { Helmet } from "react-helmet";
import { ToastContainer, toast } from "react-toastify";

const MyBlogs = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [awaitingAuthorBlogs, setAwaitingAuthorBlogs] = useState(null);
  const [authorPublishedBlogs, setAuthorPublishedBlogs] = useState(null);
  const [pendingReviewBlogs, setPendingReviewBlogs] = useState(null);
  const [underReviewBlogs, setUnderReviewBlogs] = useState(null);
  const [savedDraftBlogs, setSavedDraftBlogs] = useState(null);
  const [alert, setAlert] = useState(null);
  const [isDisabled, setIsDisabled]= useState(false);

  const token = localStorage.getItem("token");

  var i = 0,
    j = 0,
    k = 0,
    l = 0,
    m = 0;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get("/api/users/userinfo");
        setUserProfile(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setLoading(false);
      }
    };

    const fetchSavedDraftBlogs = async () => {
      try {
        const response = await axios.get("/api/blogs/myblogs/saveddraft");
        setSavedDraftBlogs(response.data);
        console.log(savedDraftBlogs);
      } catch (error) {
        console.error("Error fetching saved draft blogs:", error);
      }
    };

    const fetchPendingReviewBlogs = async () => {
      try {
        const response = await axios.get("/api/blogs/myblogs/pendingreview");
        setPendingReviewBlogs(response.data);
        console.log(pendingReviewBlogs);
      } catch (error) {
        console.error("Error fetching pending review blogs:", error);
      }
    };

    const fetchUnderReviewBlogs = async () => {
      try {
        const response = await axios.get("/api/blogs/myblogs/underreview");
        setUnderReviewBlogs(response.data);
        console.log(underReviewBlogs);
      } catch (error) {
        console.error("Error fetching under review blogs:", error);
      }
    };

    const fetchAwaitingAuthorBlogs = async () => {
      try {
        const response = await axios.get(
          "/api/blogs/myblogs/awaitingauthorblogs"
        );
        setAwaitingAuthorBlogs(response.data);
        console.log(awaitingAuthorBlogs);
      } catch (error) {
        console.error("Error fetching awaiting blogs:", error);
      }
    };

    const fetchAuthorPublishedBlogs = async () => {
      try {
        const response = await axios.get(
          "/api/blogs/myblogs/authorpublishedblogs"
        );
        setAuthorPublishedBlogs(response.data);
        console.log(authorPublishedBlogs);
      } catch (error) {
        console.error("Error fetching published blogs:", error);
      }
    };

    fetchUserProfile();
    fetchSavedDraftBlogs();
    fetchPendingReviewBlogs();
    fetchUnderReviewBlogs();
    fetchAwaitingAuthorBlogs();
    fetchAuthorPublishedBlogs();
  }, []);

  const handleDiscardBlog = async (blogId, authorEmail, slug) => {
    const confirmDiscard = window.confirm(
      "Are you sure you want to discard this blog?\n" + "Title: " + slug
    );
    if (confirmDiscard) {
      setIsDisabled(true);
      try {
        const response = await axios.post(`/api/users/discard/blog/${blogId}`, {
          authorEmail,
          slug,
        });
        // Handle the response
        toast.success("Blog discarded!!");
        // setAlert({ type: "success", message: "blog discarded successfully" });
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        setIsDisabled(false);
        toast.error("Error discarding blog");
        // setAlert({ type: "danger", message: "error saving blog" });
        console.error("Error discarding blog:", error.response.data);
      }
    }
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
        <title>My Blogs - BloggerSpace</title>
      </Helmet>
      {/* <Container className="myblogs-page col-lg-7"> */}
      <Container>
        <h2 className="page-title">My Blogs</h2>
        <div className="heading-underline"></div>

        <ToastContainer />

        {alert && (
          <Alert
            variant={alert.type}
            onClose={() => setAlert(null)}
            dismissible
          >
            {alert.message}
          </Alert>
        )}
        {/* <Card>
        <Card.Body>
          <Card.Title>{userProfile?.fullName}</Card.Title>
          <Card.Text>Email: {userProfile?.email}</Card.Text>
        </Card.Body>
      </Card> */}

        <Tabs
          defaultActiveKey="pending"
          id="justify-tab-example"
          className="mb-3"
          justify
        >
          <Tab
            eventKey="saveddraft"
            title={
              <React.Fragment>
                Draft
                <Badge variant="light" className="mx-1">
                  {savedDraftBlogs?.length}
                </Badge>
              </React.Fragment>
            }
          >
            <h5 className="mt-4">
              <b>Saved Draft Blogs:</b>
            </h5>
            {savedDraftBlogs?.length === 0 ? (
              <div>No saved draft Blogs found</div>
            ) : (
              <>
                <ListGroup>
                  {savedDraftBlogs?.map((blog) => (
                    <ListGroup.Item key={blog.slug}>
                      <div className="row align-items-center">
                        <div className="col">
                          <b>
                            {++i}. {blog.title}
                          </b>
                          <p>
                            <i>Current Reviewer: {blog.currentReviewer}</i>
                            <br />
                            <i>
                              Last Updated at:{" "}
                              {blog.lastUpdatedAt.slice(11, 19)},{" "}
                              {blog.lastUpdatedAt.slice(0, 10)}
                            </i>
                          </p>
                        </div>

                        <div className="col-auto">
                          <Link
                            to={`/editblog/${blog._id}`}
                            className="btn btn-primary"
                          >
                            Edit
                          </Link>
                        </div>
                        <div className="col-auto">
                          <Button
                            variant="danger"
                            size="sm"
                            className="m-2"
                            disabled={isDisabled}
                            onClick={() =>
                              handleDiscardBlog(
                                blog._id,
                                blog.authorEmail,
                                blog.slug
                              )
                            }
                          >
                            Discard
                          </Button>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </>
            )}
          </Tab>

          <Tab
            eventKey="pending"
            title={
              <React.Fragment>
                Pending Review
                <Badge variant="light" className="mx-1">
                  {pendingReviewBlogs?.length}
                </Badge>
              </React.Fragment>
            }
          >
            <h5 className="mt-4">
              <b>Pending Review Blogs:</b>
            </h5>
            {pendingReviewBlogs?.length === 0 ? (
              <div>No Pending Review Blogs found</div>
            ) : (
              <>
                <ListGroup>
                  {pendingReviewBlogs?.map((blog) => (
                    <ListGroup.Item key={blog.slug}>
                      <div className="row align-items-center">
                        <div className="col">
                          <b>
                            {++j}. {blog.title}
                          </b>
                          <p>
                            <i>Current Reviewer: {blog.currentReviewer}</i>
                            <br />
                            <i>
                              Last Updated at:{" "}
                              {blog.lastUpdatedAt.slice(11, 19)},{" "}
                              {blog.lastUpdatedAt.slice(0, 10)}
                            </i>
                          </p>
                        </div>

                        <div className="col-auto">
                          <Button
                            variant="danger"
                            size="sm"
                            className="m-2"
                            disabled={isDisabled}
                            onClick={() =>
                              handleDiscardBlog(
                                blog._id,
                                blog.authorEmail,
                                blog.slug
                              )
                            }
                          >
                            Discard
                          </Button>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </>
            )}
          </Tab>

          <Tab
            eventKey="underreview"
            title={
              <React.Fragment>
                Under Review
                <Badge variant="light" className="mx-1">
                  {underReviewBlogs?.length}
                </Badge>
              </React.Fragment>
            }
          >
            <h5 className="mt-4">
              <b>Under Review Blogs:</b>
            </h5>
            {underReviewBlogs?.length === 0 ? (
              <div>No Under Review Blogs found</div>
            ) : (
              <>
                <ListGroup>
                  {underReviewBlogs?.map((blog) => (
                    <ListGroup.Item key={blog.slug}>
                      <div className="row align-items-center">
                        <div className="col">
                          <b>
                            {++k}. {blog.title}
                          </b>
                          <p>
                            <i>Current Reviewer: {blog.currentReviewer}</i>
                            <br />
                            <i>
                              Last Updated at:{" "}
                              {blog.lastUpdatedAt.slice(11, 19)},{" "}
                              {blog.lastUpdatedAt.slice(0, 10)}
                            </i>
                          </p>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </>
            )}
          </Tab>

          <Tab
            eventKey="awaitingauthor"
            title={
              <React.Fragment>
                Awaiting Author
                <Badge variant="light" className="mx-1">
                  {awaitingAuthorBlogs?.length}
                </Badge>
              </React.Fragment>
            }
          >
            <h5 className="mt-4">
              <b>Awaiting Author Blogs:</b>
            </h5>
            {awaitingAuthorBlogs?.length === 0 ? (
              <div>No Awaiting Author Blogs found</div>
            ) : (
              <>
                <ListGroup>
                  {awaitingAuthorBlogs?.map((blog) => (
                    <ListGroup.Item key={blog.slug}>
                      <div className="row align-items-center">
                        <div className="col">
                          <b>
                            {++l}. {blog.title}
                          </b>
                          <p>
                            <i>Current Reviewer: {blog.currentReviewer}</i>
                            <br />
                            <i>
                              Last Updated at:{" "}
                              {blog.lastUpdatedAt.slice(11, 19)},{" "}
                              {blog.lastUpdatedAt.slice(0, 10)}
                            </i>
                          </p>
                        </div>

                        <div className="col-auto">
                          <Link
                            to={`/editblog/${blog._id}`}
                            className="btn btn-primary"
                          >
                            Edit
                          </Link>
                        </div>
                        <div className="col-auto">
                          <Button
                            variant="danger"
                            size="sm"
                            className="m-2"
                            onClick={() =>
                              handleDiscardBlog(
                                blog._id,
                                blog.authorEmail,
                                blog.slug
                              )
                            }
                          >
                            Discard
                          </Button>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </>
            )}
          </Tab>

          <Tab
            eventKey="published"
            title={
              <React.Fragment>
                Published
                <Badge variant="light" className="mx-1">
                  {authorPublishedBlogs?.length}
                </Badge>
              </React.Fragment>
            }
          >
            <h5 className="mt-4">
              <b>Published Blogs:</b>
            </h5>
            {authorPublishedBlogs?.length === 0 ? (
              <div>No Published Blogs found</div>
            ) : (
              <>
                <ListGroup>
                  {authorPublishedBlogs?.map((blog) => (
                    <ListGroup.Item key={blog.slug}>
                      <div className="row align-items-center">
                        <div className="col">
                          <b>
                            {++m}. {blog.title}
                          </b>
                          <p>
                            <i>
                              Last Updated at:{" "}
                              {blog.lastUpdatedAt.slice(11, 19)},{" "}
                              {blog.lastUpdatedAt.slice(0, 10)}
                            </i>
                          </p>
                        </div>

                        <div className="col-auto">
                          <Link
                            to={`/${blog.slug}`}
                            className="btn btn-primary"
                            // target="_blank"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </>
            )}
          </Tab>
        </Tabs>
      </Container>
    </section>
  );
};

export default MyBlogs;
