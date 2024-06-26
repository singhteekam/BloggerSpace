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
import Select from "react-select";
import blogCategory from "../../../utils/blogCategory.json";


import { useDispatch, useSelector } from "react-redux";
import { fetchAllBlog } from "../../../redux/slice/allblog";

const blogItemVariant = {
  hover: {
    // scale: 1.1,
    fontWeight: "bold",
    // originX: 0,
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
  const [filterCategory, setFilterCategory] = useState(null);
  const navigate = useNavigate();

  const [total, setTotal]= useState(0);
  const [page, setPage]= useState(1);
  const limit=6;

  // const dispatch= useDispatch();
  // const state= useSelector((state)=>state.allblog);
  // console.log("State",state)

  useEffect(() => {
    // dispatch(fetchAllBlog());
    // const fetchBlogs = async () => {
    //   try {
    //     const response = await axios.get("/api/blogs");
    //     setBlogs(response.data);
    //     setIsLoading(false);
    //   } catch (error) {
    //     console.error("Error fetching Blogs:", error);
    //   }
    // };
    const fetchBlogs = async () => {
      try {
        const response = await axios.get(`/api/blogs/allblogs?page=${page}&limit=${limit}`);
        setBlogs(response.data.blogs);
        setTotal(response.data.total);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching Blogs:", error);
      }
    };
    fetchBlogs();
    // }, [isLoggedIn, blogs]);
  }, [page]);

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

  
  const prePage = () => {
    if(page>1){
      setPage(page-1);
    }
  };
  
  const changeCPage = (id) => {
    setPage(id);
  };
  
  const nextPage = () => {
    if(page<totalPages){
      setPage(page+1);
    }
  };
  
  const totalPages= Math.ceil(total/limit);
  const numbers = [...Array(totalPages + 1).keys()].slice(1);
  
  return (
    <div className="new-page-container">
      <Container>
        <h3 className="page-title">Blogs</h3>
        <div className="underline"></div>
        <i>
          Showing total results: {total}, Page {page} of {totalPages}
        </i>
        <div>
          <b>Filter by category: </b>
          <Select
            className="react-select-dropdown m-1"
            defaultValue={filterCategory}
            onChange={setFilterCategory}
            options={blogCategory}
          />
          <Button variant="success" size="sm" onClick={()=>null}>Search</Button>
        </div>

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
              {blogs?.map((blog) => (
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
                          <div class="blogcard-container">
                            <img
                              src="carousel_img1.png"
                              alt="Image"
                              className="blogcard-container-img"
                            />
                            <div class="blogcard-container-text">{blog.category}</div>
                          </div>
                          <Card.Body className="">
                            <h6>{blog.title}</h6>
                            {/* <div className="underline"></div> */}
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
                    <button className="page-link" onClick={prePage}>
                      Prev
                    </button>
                  </li>
                  {numbers.slice(0, 3).map((n, i) => (
                    <li
                      className={`page-item ${
                        page === n ? "active" : ""
                      }`}
                      key={i}
                    >
                      <button
                        className="page-link"
                        onClick={() => changeCPage(n)}
                      >
                        {n}
                      </button>
                    </li>
                  ))}
                  <li className="page-item">
                    <button className="page-link">
                      ...
                    </button>
                  </li>
                  <li className="page-item">
                    <button
                      className="page-link"
                      onClick={() => changeCPage(totalPages)}
                    >
                      {totalPages}
                    </button>
                  </li>
                  <li className="page-item">
                    <button className="page-link" onClick={nextPage}>
                      Next
                    </button>
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
