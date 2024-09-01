import React, { useState, useEffect } from "react";
import { Modal, FormControl, Button, ListGroup } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const SearchBlogs = ({ show, onHide }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.trim() !== "") {
      searchBlogs();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchBlogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/blogs/searchblogs/${searchQuery}`
      );
      console.log(response.data);
      setSearchResults(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error searching blogs:", error);
      setLoading(false);
    }
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
            placeholder="Enter keywords"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button onClick={searchBlogs} className="mt-2 mb-2 bs-button">
            Search
          </Button>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="search-results">
            {searchResults.length === 0 ? (
              <div>No results found.</div>
            ) : (
              <ListGroup>
                {searchResults.map((blog) => (
                  <ListGroup.Item key={blog._id} className="mb-3">
                    <Link to={`/${blog.slug}`}
                     target="_blank" style={{ textDecoration: "none" }}>
                      <h5>{blog.title}</h5>
                      <p>{blog.author}</p>
                    </Link>

                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default SearchBlogs;
