
import React, { useState, useContext } from "react";
import { Container, Tabs, Tab, Badge } from "react-bootstrap";
import { Helmet } from "react-helmet";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";

import { AuthContext } from "contexts/AuthContext";
import BlogsTabContent from "components/Posts/MyBlogs/BlogsTabContent";
import { useMyBlogsTab } from "utils/hooks/useMyBlogsTab";
import PreLoader from "utils/PreLoader";

const MyBlogs = () => {
  const { user, loading } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("pendingreview");

  const userId = user?._id;

  const savedDraft = useMyBlogsTab("saveddraft", userId, activeTab === "saveddraft");
  const pendingReview = useMyBlogsTab("pendingreview", userId, activeTab === "pendingreview");
  const underReview = useMyBlogsTab("underreview", userId, activeTab === "underreview");
  const awaitingAuthor = useMyBlogsTab("awaitingauthorblogs", userId, activeTab === "awaitingauthorblogs");
  const published = useMyBlogsTab("authorpublishedblogs", userId, activeTab === "authorpublishedblogs");

  const handleTabSelect = (key) => setActiveTab(key);

  const handleDiscardBlog = async (blogId, authorEmail, slug) => {
    if (!window.confirm(`Discard this blog?\nTitle: ${slug}`)) return;

    try {
      await axios.post(`/api/users/discard/blog/${blogId}?userId=${userId}`, { authorEmail, slug });
      toast.success("Blog discarded successfully");
      window.location.reload();
    } catch (error) {
      toast.error("Error discarding blog");
    }
  };

  if (loading) return <PreLoader isLoading={true} />;

  return (
    <section className="newpage-section">
      <Helmet>
        <title>My Blogs - BloggerSpace</title>
      </Helmet>
      <Container>
        <h2 className="page-title">My Blogs</h2>
        <div className="heading-underline"></div>
        <ToastContainer />

        <Tabs activeKey={activeTab} onSelect={handleTabSelect} className="mb-3" justify>
          <Tab
            eventKey="saveddraft"
            title={
              <>
                Draft
                <Badge bg="dark" className="mx-1">{savedDraft.blogs?.length || 0}</Badge>
              </>
            }
          >
            <BlogsTabContent
              title="Saved Draft"
              blogs={savedDraft.blogs}
              loading={savedDraft.loading}
              handleDiscardBlog={handleDiscardBlog}
            />
          </Tab>

          <Tab
            eventKey="pendingreview"
            title={
              <>
                Pending Review
                <Badge bg="dark" className="mx-1">{pendingReview.blogs?.length || 0}</Badge>
              </>
            }
          >
            <BlogsTabContent
              title="Pending Review"
              blogs={pendingReview.blogs}
              loading={pendingReview.loading}
              handleDiscardBlog={handleDiscardBlog}
            />
          </Tab>

          <Tab
            eventKey="underreview"
            title={
              <>
                Under Review
                <Badge bg="dark" className="mx-1">{underReview.blogs?.length || 0}</Badge>
              </>
            }
          >
            <BlogsTabContent
              title="Under Review"
              blogs={underReview.blogs}
              loading={underReview.loading}
            />
          </Tab>

          <Tab
            eventKey="awaitingauthorblogs"
            title={
              <>
                Awaiting Author
                <Badge bg="dark" className="mx-1">{awaitingAuthor.blogs?.length || 0}</Badge>
              </>
            }
          >
            <BlogsTabContent
              title="Awaiting Author"
              blogs={awaitingAuthor.blogs}
              loading={awaitingAuthor.loading}
              handleDiscardBlog={handleDiscardBlog}
            />
          </Tab>

          <Tab
            eventKey="authorpublishedblogs"
            title={
              <>
                Published
                <Badge bg="dark" className="mx-1">{published.blogs?.length || 0}</Badge>
              </>
            }
          >
            <BlogsTabContent
              title="Published"
              blogs={published.blogs}
              loading={published.loading}
            />
          </Tab>
        </Tabs>
      </Container>
    </section>
  );
};

export default MyBlogs;








// import React, { useEffect, useState, useContext } from "react";
// import { Link, useLocation, Navigate } from "react-router-dom";
// import {
//   Container,
//   Card,
//   ListGroup,
//   Form,
//   Button,
//   Alert,
//   Spinner,
//   Tab,
//   Tabs,
//   Badge,
// } from "react-bootstrap";
// import axios from "axios";
// import { Helmet } from "react-helmet";
// import { ToastContainer, toast } from "react-toastify";

// import { AuthContext } from "contexts/AuthContext";
// import PreLoader from "utils/PreLoader";

// const MyBlogs = () => {
//   const { user, loading, logout } = useContext(AuthContext);
//   // const [user, setuser] = useState(null);
//   // const [loading, setLoading] = useState(true);
//   const [awaitingAuthorBlogs, setAwaitingAuthorBlogs] = useState(null);
//   const [authorPublishedBlogs, setAuthorPublishedBlogs] = useState(null);
//   const [pendingReviewBlogs, setPendingReviewBlogs] = useState(null);
//   const [underReviewBlogs, setUnderReviewBlogs] = useState(null);
//   const [savedDraftBlogs, setSavedDraftBlogs] = useState(null);
//   const [alert, setAlert] = useState(null);
//   const [isDisabled, setIsDisabled]= useState(false);
//   const [userId, setUserId]= useState(user?._id);

//   const location= useLocation();

//   useEffect(()=>{
//       setUserId(user?._id);
//       console.log(user?._id);
//   },[user]);


//   var i = 0,
//     j = 0,
//     k = 0,
//     l = 0,
//     m = 0;

//   useEffect(() => {
//     // const fetchuser = async () => {
//     //   try {
//     //     const response = await axios.get("/api/users/userinfo",{
//     //       headers: {
//     //         Authorization: `Bearer ${token}`, // Include the token in the request
//     //       },
//     //     });
//     //     setuser(response.data);
//     //     setLoading(false);
//     //   } catch (error) {
//     //     console.error("Error fetching user profile:", error);
//     //     setLoading(false);
//     //   }
//     // };


//     const fetchSavedDraftBlogs = async () => {
//       try {
//         const response = await axios.get(`/api/blogs/myblogs/saveddraft?userId=${userId}`);
//         setSavedDraftBlogs(response.data);
//         console.log(savedDraftBlogs);
//       } catch (error) {
//         console.error("Error fetching saved draft blogs:", error);
//       }
//     };

//     const fetchPendingReviewBlogs = async () => {
//       try {
//         const response = await axios.get(`/api/blogs/myblogs/pendingreview?userId=${userId}`);
//         setPendingReviewBlogs(response.data);
//         console.log(pendingReviewBlogs);
//       } catch (error) {
//         console.error("Error fetching pending review blogs:", error);
//       }
//     };

//     const fetchUnderReviewBlogs = async () => {
//       try {
//         const response = await axios.get(`/api/blogs/myblogs/underreview?userId=${userId}`);
//         setUnderReviewBlogs(response.data);
//         console.log(underReviewBlogs);
//       } catch (error) {
//         console.error("Error fetching under review blogs:", error);
//       }
//     };

//     const fetchAwaitingAuthorBlogs = async () => {
//       try {
//         const response = await axios.get(
//           `/api/blogs/myblogs/awaitingauthorblogs?userId=${userId}`
//         );
//         setAwaitingAuthorBlogs(response.data);
//         console.log(awaitingAuthorBlogs);
//       } catch (error) {
//         console.error("Error fetching awaiting blogs:", error);
//       }
//     };

//     const fetchAuthorPublishedBlogs = async () => {
//       try {
//         const response = await axios.get(
//           `/api/blogs/myblogs/authorpublishedblogs?userId=${userId}`
//         );
//         setAuthorPublishedBlogs(response.data);
//         console.log(authorPublishedBlogs);
//       } catch (error) {
//         console.error("Error fetching published blogs:", error);
//       }
//     };

//     // fetchuser();
//     fetchSavedDraftBlogs();
//     fetchPendingReviewBlogs();
//     fetchUnderReviewBlogs();
//     fetchAwaitingAuthorBlogs();
//     fetchAuthorPublishedBlogs();
//   }, [userId]);

//   const handleDiscardBlog = async (blogId, authorEmail, slug) => {
//     const confirmDiscard = window.confirm(
//       "Are you sure you want to discard this blog?\n" + "Title: " + slug
//     );
//     if (confirmDiscard) {
//       setIsDisabled(true);
//       try {
//         const response = await axios.post(`/api/users/discard/blog/${blogId}?userId=${userId}`, {
//           authorEmail,
//           slug,
//         });
//         // Handle the response
//         toast.success("Blog discarded!!");
//         // setAlert({ type: "success", message: "blog discarded successfully" });
//         setTimeout(() => {
//           window.location.reload();
//         }, 2000);
//       } catch (error) {
//         setIsDisabled(false);
//         toast.error("Error discarding blog");
//         // setAlert({ type: "danger", message: "error saving blog" });
//         console.error("Error discarding blog:", error.response.data);
//       }
//     }
//   };

//   if (loading) {
//     return <PreLoader isLoading={loading} />
//   }

//   return (
//     <section className="newpage-section">
//       <Helmet>
//         <title>My Blogs - BloggerSpace</title>
//       </Helmet>
//       {/* <Container className="myblogs-page col-lg-7"> */}
//       <Container>
//         <h2 className="page-title">My Blogs</h2>
//         <div className="heading-underline"></div>

//         <ToastContainer />

//         {alert && (
//           <Alert
//             variant={alert.type}
//             onClose={() => setAlert(null)}
//             dismissible
//           >
//             {alert.message}
//           </Alert>
//         )}
//         {/* <Card>
//         <Card.Body>
//           <Card.Title>{user?.fullName}</Card.Title>
//           <Card.Text>Email: {user?.email}</Card.Text>
//         </Card.Body>
//       </Card> */}

//         <Tabs
//           defaultActiveKey="pending"
//           id="justify-tab-example"
//           className="mb-3"
//           justify
//         >
//           <Tab
//             eventKey="saveddraft"
//             title={
//               <React.Fragment>
//                 Draft
//                 <Badge variant="light" className="mx-1">
//                   {savedDraftBlogs?.length}
//                 </Badge>
//               </React.Fragment>
//             }
//           >
//             <h5 className="mt-4">
//               <b>Saved Draft Blogs:</b>
//             </h5>
//             {savedDraftBlogs?.length === 0 ? (
//               <div>No saved draft Blogs found</div>
//             ) : (
//               <>
//                 <ListGroup>
//                   {savedDraftBlogs?.map((blog) => (
//                     <ListGroup.Item key={blog.slug}>
//                       <div className="row align-items-center">
//                         <div className="col">
//                           <b>
//                             {++i}. {blog.title}
//                           </b>
//                           <p>
//                             <i>Current Reviewer: {blog.currentReviewer}</i>
//                             <br />
//                             <i>
//                               Last Updated at:{" "}
//                               {blog.lastUpdatedAt.slice(11, 19)},{" "}
//                               {blog.lastUpdatedAt.slice(0, 10)}
//                             </i>
//                           </p>
//                         </div>

//                         <div className="col-auto">
//                           <Link
//                             to={`/editblog/${blog._id}`}
//                             className="btn btn-primary"
//                           >
//                             Edit
//                           </Link>
//                         </div>
//                         <div className="col-auto">
//                           <Button
//                             variant="danger"
//                             size="sm"
//                             className="m-2"
//                             disabled={isDisabled}
//                             onClick={() =>
//                               handleDiscardBlog(
//                                 blog._id,
//                                 blog.authorEmail,
//                                 blog.slug
//                               )
//                             }
//                           >
//                             Discard
//                           </Button>
//                         </div>
//                       </div>
//                     </ListGroup.Item>
//                   ))}
//                 </ListGroup>
//               </>
//             )}
//           </Tab>

//           <Tab
//             eventKey="pending"
//             title={
//               <React.Fragment>
//                 Pending Review
//                 <Badge variant="light" className="mx-1">
//                   {pendingReviewBlogs?.length}
//                 </Badge>
//               </React.Fragment>
//             }
//           >
//             <h5 className="mt-4">
//               <b>Pending Review Blogs:</b>
//             </h5>
//             {pendingReviewBlogs?.length === 0 ? (
//               <div>No Pending Review Blogs found</div>
//             ) : (
//               <>
//                 <ListGroup>
//                   {pendingReviewBlogs?.map((blog) => (
//                     <ListGroup.Item key={blog.slug}>
//                       <div className="row align-items-center">
//                         <div className="col">
//                           <b>
//                             {++j}. {blog.title}
//                           </b>
//                           <p>
//                             <i>Current Reviewer: {blog.currentReviewer}</i>
//                             <br />
//                             <i>
//                               Last Updated at:{" "}
//                               {blog.lastUpdatedAt.slice(11, 19)},{" "}
//                               {blog.lastUpdatedAt.slice(0, 10)}
//                             </i>
//                           </p>
//                         </div>

//                         <div className="col-auto">
//                           <Button
//                             variant="danger"
//                             size="sm"
//                             className="m-2"
//                             disabled={isDisabled}
//                             onClick={() =>
//                               handleDiscardBlog(
//                                 blog._id,
//                                 blog.authorEmail,
//                                 blog.slug
//                               )
//                             }
//                           >
//                             Discard
//                           </Button>
//                         </div>
//                       </div>
//                     </ListGroup.Item>
//                   ))}
//                 </ListGroup>
//               </>
//             )}
//           </Tab>

//           <Tab
//             eventKey="underreview"
//             title={
//               <React.Fragment>
//                 Under Review
//                 <Badge variant="light" className="mx-1">
//                   {underReviewBlogs?.length}
//                 </Badge>
//               </React.Fragment>
//             }
//           >
//             <h5 className="mt-4">
//               <b>Under Review Blogs:</b>
//             </h5>
//             {underReviewBlogs?.length === 0 ? (
//               <div>No Under Review Blogs found</div>
//             ) : (
//               <>
//                 <ListGroup>
//                   {underReviewBlogs?.map((blog) => (
//                     <ListGroup.Item key={blog.slug}>
//                       <div className="row align-items-center">
//                         <div className="col">
//                           <b>
//                             {++k}. {blog.title}
//                           </b>
//                           <p>
//                             <i>Current Reviewer: {blog.currentReviewer}</i>
//                             <br />
//                             <i>
//                               Last Updated at:{" "}
//                               {blog.lastUpdatedAt.slice(11, 19)},{" "}
//                               {blog.lastUpdatedAt.slice(0, 10)}
//                             </i>
//                           </p>
//                         </div>
//                       </div>
//                     </ListGroup.Item>
//                   ))}
//                 </ListGroup>
//               </>
//             )}
//           </Tab>

//           <Tab
//             eventKey="awaitingauthor"
//             title={
//               <React.Fragment>
//                 Awaiting Author
//                 <Badge variant="light" className="mx-1">
//                   {awaitingAuthorBlogs?.length}
//                 </Badge>
//               </React.Fragment>
//             }
//           >
//             <h5 className="mt-4">
//               <b>Awaiting Author Blogs:</b>
//             </h5>
//             {awaitingAuthorBlogs?.length === 0 ? (
//               <div>No Awaiting Author Blogs found</div>
//             ) : (
//               <>
//                 <ListGroup>
//                   {awaitingAuthorBlogs?.map((blog) => (
//                     <ListGroup.Item key={blog.slug}>
//                       <div className="row align-items-center">
//                         <div className="col">
//                           <b>
//                             {++l}. {blog.title}
//                           </b>
//                           <p>
//                             <i>Current Reviewer: {blog.currentReviewer}</i>
//                             <br />
//                             <i>
//                               Last Updated at:{" "}
//                               {blog.lastUpdatedAt.slice(11, 19)},{" "}
//                               {blog.lastUpdatedAt.slice(0, 10)}
//                             </i>
//                           </p>
//                         </div>

//                         <div className="col-auto">
//                           <Link
//                             to={`/editblog/${blog._id}`}
//                             className="btn btn-primary"
//                           >
//                             Edit
//                           </Link>
//                         </div>
//                         <div className="col-auto">
//                           <Button
//                             variant="danger"
//                             size="sm"
//                             className="m-2"
//                             onClick={() =>
//                               handleDiscardBlog(
//                                 blog._id,
//                                 blog.authorEmail,
//                                 blog.slug
//                               )
//                             }
//                           >
//                             Discard
//                           </Button>
//                         </div>
//                       </div>
//                     </ListGroup.Item>
//                   ))}
//                 </ListGroup>
//               </>
//             )}
//           </Tab>

//           <Tab
//             eventKey="published"
//             title={
//               <React.Fragment>
//                 Published
//                 <Badge variant="light" className="mx-1">
//                   {authorPublishedBlogs?.length}
//                 </Badge>
//               </React.Fragment>
//             }
//           >
//             <h5 className="mt-4">
//               <b>Published Blogs:</b>
//             </h5>
//             {authorPublishedBlogs?.length === 0 ? (
//               <div>No Published Blogs found</div>
//             ) : (
//               <>
//                 <ListGroup>
//                   {authorPublishedBlogs?.map((blog) => (
//                     <ListGroup.Item key={blog.slug}>
//                       <div className="row align-items-center">
//                         <div className="col">
//                           <b>
//                             {++m}. {blog.title}
//                           </b>
//                           <p>
//                             <i>
//                               Last Updated at:{" "}
//                               {blog.lastUpdatedAt.slice(11, 19)},{" "}
//                               {blog.lastUpdatedAt.slice(0, 10)}
//                             </i>
//                           </p>
//                         </div>

//                         <div className="col-auto">
//                           <Link
//                             to={`/${blog.slug}`}
//                             className="btn btn-primary"
//                             // target="_blank"
//                           >
//                             View
//                           </Link>
//                         </div>
//                       </div>
//                     </ListGroup.Item>
//                   ))}
//                 </ListGroup>
//               </>
//             )}
//           </Tab>
//         </Tabs>
//       </Container>
//     </section>
//   );
// };

// export default MyBlogs;
