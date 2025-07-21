import React from "react";
import { Button, Container, ListGroup } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useBlogs } from "contexts/BlogContext"; // Adjust path as needed
import PreLoader from "utils/PreLoader";

const AdminBlogs = () => {
  const { blogs, loading } = useBlogs();
  const adminBlogs = blogs.filter((blog) => blog.status === "ADMIN_PUBLISHED");

  if (loading) {
    return <PreLoader isLoading="true" />;
  }

  if (adminBlogs.length === 0) {
    return <p className="text-center mt-4">No published blogs available.</p>;
  }

  return (
    <section className="newpage-section">
      <Container>
        <h3 className="page-title">Admin Blogs</h3>
        <div className="heading-underline"></div>

        <ListGroup>
          {adminBlogs.map((blog, index) => (
            <ListGroup.Item key={blog._id}>
              <div className="row align-items-center">
                <div className="col">
                  <b>
                    {index + 1}. {blog.title}
                  </b>
                </div>
                <div className="col-auto">
                  <Link to={`/${blog.slug}`}>
                    <Button className="bs-button" size="sm">
                      View Blog
                    </Button>
                  </Link>
                </div>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Container>
    </section>
  );
};

export default AdminBlogs;
