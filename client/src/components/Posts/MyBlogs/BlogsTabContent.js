// src/components/BlogsTabContent.js
import React from "react";
import { ListGroup, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import PreLoader from "utils/PreLoader";

const BlogsTabContent = ({ title, blogs, loading, handleDiscardBlog }) => {
  if (loading) return <PreLoader isLoading={true} />;
  if (!blogs) return <div className="text-muted">Loading...</div>;
  if (blogs.length === 0) return <div>No {title} Blogs found.</div>;

  return (
    <>
      <h5 className="mt-4">
        <b>{title} Blogs:</b>
      </h5>
      <ListGroup>
        {blogs.map((blog, index) => (
          <ListGroup.Item key={blog._id}>
            <div className="row align-items-center">
              <div className="col">
                <b>
                  {index + 1}. {blog.title}
                </b>
                <p>
                  {blog.currentReviewer && (
                    <>
                      <i>Reviewer: {blog.currentReviewer}</i>
                      <span className="d-block"></span>
                    </>
                  )}
                  <i>
                    Last Updated: {blog.lastUpdatedAt.slice(11, 19)},{" "}
                    {blog.lastUpdatedAt.slice(0, 10)}
                  </i>
                </p>
              </div>
              {handleDiscardBlog && (
                <div className="col-auto">
                  <Button
                    variant="danger"
                    size="sm"
                    className="m-2"
                    onClick={() =>
                      handleDiscardBlog(blog._id, blog.authorEmail, blog.slug)
                    }
                  >
                    Discard
                  </Button>
                </div>
              )}
              <div className="col-auto">
                {title === "Published" ? (
                  <Link to={`/${blog.slug}`} className="btn bs-button">
                    View
                  </Link>
                ) : (
                  <Link to={`/editblog/${blog._id}`} className="btn bs-button">
                    Edit
                  </Link>
                )}
              </div>
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </>
  );
};

export default BlogsTabContent;
