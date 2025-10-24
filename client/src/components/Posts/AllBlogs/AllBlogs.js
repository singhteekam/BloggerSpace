import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Card,
  Badge,
  Row,
  InputGroup,
  Form,
  Col,
} from "react-bootstrap";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FaEye, FaHeart } from "react-icons/fa";
import "styles/style.css"; // Assuming you have a CSS file for styles
import PreLoader from "utils/PreLoader";
import { useBlogs } from "contexts/BlogContext";
import Pagination from "react-bootstrap/Pagination";
import { Helmet } from "react-helmet";

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

  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialSearchTerm = searchParams.get("search") || "";
  const initialFilterType = searchParams.get("filterType") || "";
  const initialFilterValue = searchParams.get("filterValue") || "";

  const [page, setPage] = useState(initialPage);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [filterType, setFilterType] = useState(initialFilterType);
  const [filterValue, setFilterValue] = useState(initialFilterValue);
  const [filtersChangedByUser, setFiltersChangedByUser] = useState(false);

  // Whenever page changes, update URL
  useEffect(() => {
    setSearchParams({
      page,
      search: searchTerm,
      filterType,
      filterValue,
    });
  }, [page, searchTerm, filterType, filterValue, setSearchParams]);
  const limit = 6;

  // let filteredBlogs = useMemo(() => {
  //   setPage(1); // Reset to first page on search
  //   if (!searchTerm) return blogs;
  //   return blogs.filter((blog) =>
  //     blog.title.toLowerCase().includes(searchTerm.toLowerCase())
  //   );
  // }, [blogs, searchTerm]);

  useEffect(() => {
    if (filtersChangedByUser && (searchTerm || filterType || filterValue)) {
      setPage(1);
      setFiltersChangedByUser(false);
    }
  }, [searchTerm, filterType, filterValue]);

  let filteredBlogs = useMemo(() => {
    //setPage(1); // reset pagination

    return blogs.filter((blog) => {
      const matchesSearch = blog.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesCategory =
        filterType === "category" && filterValue
          ? blog.category === filterValue
          : true;

      const matchesTag =
        filterType === "tag" && filterValue
          ? blog.tags?.includes(filterValue)
          : true;

      return matchesSearch && matchesCategory && matchesTag;
    });
  }, [blogs, searchTerm, filterType, filterValue]);

  const totalPages = Math.ceil(filteredBlogs.length / limit);
  filteredBlogs = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredBlogs.slice(startIndex, endIndex);
  }, [filteredBlogs, page]);

  if (loading) {
    return <PreLoader isLoading={loading} />;
  }

  // logic start for simple pagination
  // const totalPages = Math.ceil(blogs.length / limit);
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
  // logic end for simple pagination

  // const totalPages = Math.ceil(filteredBlogs.length / limit);

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisible = 3;

    let startPage = page - 1;
    if (startPage < 1) startPage = 1;

    let endPage = startPage + maxVisible - 1;
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = endPage - maxVisible + 1;
      if (startPage < 1) startPage = 1;
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  return (
    <section className="newpage-section">
      <Helmet>
        <meta
          name="description"
          content="Here is a list of all the published blogs. Read these blogs."
        />
        <title>All Published Blogs</title>

        <meta name="apple-mobile-web-app-title" content="All Published Blogs" />

        <meta property="og:title" content="All Published Blogs" />
        <meta
          property="og:description"
          content="Here is a list of all the published blogs. Read these blogs."
        />
        <meta property="og:image" content="%PUBLIC_URL%/BLOGGERSPACE.png" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="All Published Blogs" />
        <meta
          name="twitter:description"
          content="Here is a list of all the published blogs. Read these blogs."
        />
        <meta name="twitter:image" content="%PUBLIC_URL%/BLOGGERSPACE.png" />
        <meta name="twitter:site" content="@singh__teekam" />

        <link rel="canonical" href={window.location.href} />
      </Helmet>

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
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setFiltersChangedByUser(true);
            }}
            aria-label="Search"
          />
        </InputGroup>

        <Row className="mb-3 align-items-center">
          <Col md={6}>
            <InputGroup>
              <InputGroup.Text>Filter Type</InputGroup.Text>
              <Form.Select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setFilterValue("");
                  setFiltersChangedByUser(true);
                }}
              >
                <option value="">Select Filter</option>
                <option value="category">Filter by Category</option>
                <option value="tag">Filter by Tag</option>
              </Form.Select>
            </InputGroup>
          </Col>

          {filterType && (
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  {filterType === "category" ? "Category" : "Tag"}
                </InputGroup.Text>
                <Form.Select
                  value={filterValue}
                  onChange={(e) => {
                    setFilterValue(e.target.value);
                    setFiltersChangedByUser(true);
                  }}
                >
                  <option value="">All</option>
                  {[
                    ...new Set(
                      blogs.flatMap((b) =>
                        filterType === "category" ? [b.category] : b.tags || []
                      )
                    ),
                  ].map((val) => (
                    <option key={val} value={val}>
                      {val}
                    </option>
                  ))}
                </Form.Select>
              </InputGroup>
            </Col>
          )}
        </Row>

        {filteredBlogs.length === 0 ? (
          <div>No blogs found</div>
        ) : (
          <Row className="m-3">
            {filteredBlogs.map((blog) => (
              <Col md={4} key={blog.blogId}>
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
                            blog.tags
                              .map((tag) => (
                                <Badge
                                  key={tag}
                                  pill
                                  bg="secondary"
                                  className="mx-1"
                                >
                                  {tag}
                                </Badge>
                              ))
                              .slice(0, 2)}
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
                            </span>{" "}
                            {"    "}
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
        {/* <nav>
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

            {numbers.slice(0, 3).map((n, i) => (
                    <li
                      className={`page-item ${page === n ? "active" : ""}`}
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
                    <button className="page-link">...</button>
                  </li>
                  <li className="page-item">
                    <button
                      className="page-link"
                      onClick={() => changeCPage(totalPages)}
                    >
                      {totalPages}
                    </button>
                  </li>

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
        </nav> */}

        <Pagination className="justify-content-center mt-3">
          <Pagination.First onClick={() => setPage(1)} disabled={page === 1} />

          <Pagination.Prev
            onClick={() => page > 1 && setPage(page - 1)}
            disabled={page === 1}
          />

          {getPageNumbers().map((n) => (
            <Pagination.Item
              key={n}
              active={n === page}
              onClick={() => setPage(n)}
            >
              {n}
            </Pagination.Item>
          ))}

          {getPageNumbers().slice(-1)[0] < totalPages && (
            <>
              <Pagination.Ellipsis disabled />
              <Pagination.Item onClick={() => setPage(totalPages)}>
                {totalPages}
              </Pagination.Item>
            </>
          )}

          <Pagination.Next
            onClick={() => page < totalPages && setPage(page + 1)}
            disabled={page === totalPages}
          />

          <Pagination.Last
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
          />
        </Pagination>
      </Container>
    </section>
  );
};

export default AllBlogs;
