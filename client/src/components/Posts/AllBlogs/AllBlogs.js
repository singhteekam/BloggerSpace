import React, { useEffect, useState } from "react";
import {
  Container,
  Card,
  Spinner,
  ListGroup,
  Badge,
  Button,
  Row,
  Col,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./AllBlogs.css";
import { motion } from "framer-motion";

import {useDispatch, useSelector} from "react-redux";
import {fetchAllBlog} from "../../../redux/slice/allblog";

const blogItemVariant = {
  hover: {
    scale: 1.1,
    fontWeight: "bold",
    originX: 0,
    // textShadow:"0px 0px 8px rgb(255,255,255)",
    // boxShadow:"0px 0px 8px rgb(255,255,255)",
    transition: {
      type: "spring",
      stiffness: 300,
      yoyo: Infinity, // We can give any value like 100 etc
    },
  },
};

const AllBlogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage, setPostsPerPage] = useState(6);
  const navigate = useNavigate();

  // const dispatch= useDispatch();
  // const state= useSelector((state)=>state.allblog);
  // console.log("State",state)

  useEffect(() => {
    // dispatch(fetchAllBlog());
    const fetchBlogs = async () => {
      try {
        const response = await axios.get("/api/blogs");
        setBlogs(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching Blogs:", error);
      }
    };
    fetchBlogs();
    // }, [isLoggedIn, blogs]);
  }, [blogs]);

  if (isLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (blogs.length === 0) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <div>Blogs not found.</div>
      </Container>
    );
  }

  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = blogs.slice(indexOfFirstPost, indexOfLastPost);

  const npage = Math.ceil(blogs.length / postsPerPage);
  const numbers = [...Array(npage + 1).keys()].slice(1);

  const prePage=()=>{
    if(currentPage!==1){
        setCurrentPage(currentPage-1);
    }
  }

  const changeCPage=(id)=>{
    setCurrentPage(id)
  }

  const nextPage=()=>{
    if(currentPage!==npage){
        setCurrentPage(currentPage+1);
    }
  }


  return (
    <div className="new-page-container">
      <Container>
        <h3 className="page-title">Blogs</h3>
        <div className="underline"></div>
        <i>Showing total results: {blogs.length}, Page {currentPage} of {npage}</i>

        {/* {state.isLoading && <div>Loading..</div>}
        {!state.isLoading && state.isError && <div>Error..{state.error}</div>}
        {!state.isLoading && state.data.length?(
          <ul>
            {
              state.data.map(blog=>(
                <li>{blog.title}</li>
              ))
            }
          </ul>
        ):null} */}

        {blogs?.length === 0 ? (
          <div>No blogs found</div>
        ) : (
          <>
            <Row className="m-3">
              {currentPosts?.map((blog) => (
                <Col md={4}>
                  <div key={blog.slug} className="mb-2 border blogitem">
                    <motion.div
                      variants={blogItemVariant}
                      whileHover="hover"
                      className="row align-items-center"
                    >
                      <Link
                        to={`/${blog.slug}`}
                        // target="_blank"
                        style={{ textDecoration: "none" }}
                        onClick={() =>
                          window.scrollTo({ top: 0, behavior: "smooth" })
                        }
                      >
                        <Card className="blogcard">
                          <Card.Body className="cardbody">
                            <Card.Title>{blog.title}</Card.Title>
                            <div className="underline"></div>
                            {blog.tags &&
                              blog.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  pill
                                  bg="secondary"
                                  className="mx-1"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            <p>
                              <i className="text-muted">
                                Author: {blog.authorDetails.userName}
                              </i>
                              <br />
                              <i className="text-muted">
                                Last Updated: {blog.lastUpdatedAt.slice(11, 19)}
                                , {blog.lastUpdatedAt.slice(0, 10)}
                              </i>
                            </p>
                          </Card.Body>
                        </Card>
                      </Link>
                    </motion.div>
                  </div>
                </Col>
              ))}

              <nav>
                <ul className="pagination">
                  <li className="page-item">
                    <a href="#prev" className="page-link" onClick={prePage}>
                      Prev
                    </a>
                  </li>
                  {numbers.map((n, i) => (
                    <li
                      className={`page-item ${
                        currentPage === n ? "active" : ""
                      }`}
                      key={i}
                    >
                      <a href="#" className="page-link" onClick={()=>changeCPage(n)}>
                        {n}
                      </a>
                    </li>
                    
                  ))}
                  {npage>3??(
                    
                  <li className="page-item">
                    <a href="#" className="page-link" >
                      ...
                    </a>
                  </li>
                  )}
                  {npage>3??(
                  <li className="page-item">
                    <a href="#" className="page-link" >
                      {npage}
                    </a>
                  </li>
                  )}
                  <li className="page-item">
                    <a href="#next" className="page-link" onClick={nextPage}>
                      Next
                    </a>
                  </li>
                </ul>
              </nav>

              {/* <Link to={"/sitemap"}>Show more</Link> */}
            </Row>
          </>
        )}
      </Container>
    </div>
  );
};

export default AllBlogs;
