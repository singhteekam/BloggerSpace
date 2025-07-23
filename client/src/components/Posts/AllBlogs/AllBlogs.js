import React, { useMemo, useState } from "react";
import {
  Container,
  Card,
  Badge,
  Row,
  InputGroup,
  Form,
  Col,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaEye, FaHeart } from "react-icons/fa";
import "styles/style.css"; // Assuming you have a CSS file for styles
import PreLoader from "utils/PreLoader";
import { useBlogs } from "contexts/BlogContext";

const blogItemVariant = {
  hover: {
    fontWeight: "bold",
    transition: {
      type: "spring",
      stiffness: 300,
      yoyo: Infinity,
    },
  },
};

const AllBlogs = () => {
  const { blogs, loading } = useBlogs();

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const limit = 6;

  const filteredBlogs = useMemo(() => {
    return blogs.filter((blog) =>
      blog.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [blogs, searchTerm]);

  const totalPages = Math.ceil(filteredBlogs.length / limit);
  const currentBlogs = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredBlogs.slice(startIndex, endIndex);
  }, [filteredBlogs, page]);

  if (loading) {
    return <PreLoader isLoading={loading} />;
  }

  const prePage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const changeCPage = (id) => {
    setPage(id);
  };

  const nextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const numbers = [...Array(totalPages + 1).keys()].slice(1);

  return (
    <section className="newpage-section">
      <Container>
        <h3 className="page-title">Blogs</h3>
        <div className="heading-underline"></div>
        <i>
          Showing total results: {filteredBlogs.length}, Page {page} of{" "}
          {totalPages}
        </i>

        <InputGroup className="mb-3">
          <InputGroup.Text>Search by title</InputGroup.Text>
          <Form.Control
            placeholder="Search any blog..."
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search"
          />
        </InputGroup>

        {currentBlogs.length === 0 ? (
          <div>No blogs found</div>
        ) : (
          <Row className="m-3">
            {currentBlogs.map((blog) => (
              <Col md={4} key={blog.slug}>
                <div className="mb-2 border blogitem">
                  <motion.div
                    variants={blogItemVariant}
                    whileHover="hover"
                    className="row align-items-center"
                  >
                    <Link
                      to={`/${blog.slug}`}
                      style={{ textDecoration: "none" }}
                      onClick={() =>
                        window.scrollTo({ top: 0, behavior: "smooth" })
                      }
                    >
                      <Card className="blogcard bgcolor-mint">
                        <div className="blogcard-container">
                          <div className="blogcard-container-img bgcolor-teal-green"></div>
                          <div className="blogcard-container-text">
                            {blog.category}
                          </div>
                        </div>
                        <Card.Body>
                          <h6>{blog.title}</h6>
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
                            {blog.status === "ADMIN_PUBLISHED" ? (
                              <i className="text-muted">Author: ADMIN</i>
                            ) : (
                              <i className="text-muted">
                                Author: {blog.authorDetails?.userName}
                              </i>
                            )}
                            <br />
                            <i className="text-muted">
                              Last Updated: {blog.lastUpdatedAt.slice(11, 19)},
                              {blog.lastUpdatedAt.slice(0, 10)}
                            </i>
                            <br />
                            <FaEye className="color-teal-green" />{" "}
                            <span className="color-teal-green">
                              {blog.blogViews}
                            </span>
                            <FaHeart className="color-teal-green" />{" "}
                            <span className="color-teal-green">
                              {blog.blogLikes.length}
                            </span>
                          </p>
                        </Card.Body>
                      </Card>
                    </Link>
                  </motion.div>
                </div>
              </Col>
            ))}
          </Row>
        )}

        {/* Pagination */}
        <nav>
          <ul className="pagination">
            <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={prePage}
                disabled={page === 1}
              >
                Prev
              </button>
            </li>

            {numbers.map((n) => (
              <li className={`page-item ${page === n ? "active" : ""}`} key={n}>
                <button className="page-link" onClick={() => changeCPage(n)}>
                  {n}
                </button>
              </li>
            ))}

            <li
              className={`page-item ${page === totalPages ? "disabled" : ""}`}
            >
              <button
                className="page-link"
                onClick={nextPage}
                disabled={page === totalPages}
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      </Container>
    </section>
  );
};

export default AllBlogs;
