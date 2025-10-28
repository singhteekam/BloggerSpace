import React from "react";
import { Button, Container, ListGroup, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAdminBlogs } from "utils/hooks/useAdminBlogs"; // adjust path
import PreLoader from "utils/PreLoader";

const AdminBlogs = () => {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    error,
  } = useAdminBlogs();

  if (isLoading) return <PreLoader isLoading={true} />;
  if (error) return <p className="text-center mt-4">Failed to load blogs.</p>;

  const adminBlogs = data?.pages.flatMap((page) => page.blogs) || [];

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

        {hasNextPage && (
          <div className="text-center mt-4">
            <Button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="bs-button"
            >
              {isFetchingNextPage ? (
                <>
                  <Spinner animation="border" size="sm" /> Loading...
                </>
              ) : (
                "Load More"
              )}
            </Button>
          </div>
        )}
      </Container>
    </section>
  );
};

export default AdminBlogs;
