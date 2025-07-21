import React, { useState, useMemo, useEffect } from "react";
import { Modal, FormControl, ListGroup, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useBlogs } from "contexts/BlogContext";

const ITEMS_PER_LOAD = 10;

const SearchBlogs = ({ show, onHide }) => {
  const { blogs, loading } = useBlogs();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);

  // Debounce input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setVisibleCount(ITEMS_PER_LOAD); // Reset visible count when query changes
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter blogs on search
  const filteredBlogs = useMemo(() => {
    if (debouncedQuery.length < 2) return [];
    return blogs.filter((blog) =>
      blog.title.toLowerCase().includes(debouncedQuery.toLowerCase())
    );
  }, [debouncedQuery, blogs]);

  // Show only limited (lazy loaded)
  const visibleBlogs = useMemo(() => {
    return filteredBlogs.slice(0, visibleCount);
  }, [filteredBlogs, visibleCount]);

  const handleSeeMore = () => {
    setVisibleCount((prev) => prev + ITEMS_PER_LOAD);
  };

  return (
    <Modal show={show} onHide={onHide} centered className="bgcolor-mint">
      <Modal.Header closeButton className="bgcolor-spearmint">
        <Modal.Title>Search Blogs</Modal.Title>
      </Modal.Header>
      <Modal.Body className="bgcolor-spearmint">
        <div className="search-bar">
          <FormControl
            type="text"
            placeholder="Enter at least 2 characters"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : debouncedQuery.length < 2 ? (
          <div className="text-muted mt-3">Start typing to search blogs...</div>
        ) : filteredBlogs.length === 0 ? (
          <div className="mt-3">No results found.</div>
        ) : (
          <>
            <ListGroup className="mt-3">
              {visibleBlogs.map((blog) => (
                <ListGroup.Item key={blog._id} className="mb-2">
                  <Link
                    to={`/${blog.slug}`}
                    target="_blank"
                    style={{ textDecoration: "none" }}
                  >
                    <h5>{blog.title}</h5>
                    <p>{blog.author}</p>
                  </Link>
                </ListGroup.Item>
              ))}
            </ListGroup>

            {visibleBlogs.length < filteredBlogs.length && (
              <div className="text-center mt-3">
                <Button onClick={handleSeeMore} variant="secondary">
                  See More
                </Button>
              </div>
            )}
          </>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default SearchBlogs;
