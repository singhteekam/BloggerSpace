import React, { useEffect, useState, useContext } from "react";
import { Card, Container } from "react-bootstrap";
import axios from "axios";
import { AuthContext } from "contexts/AuthContext";
import PreLoader from "utils/PreLoader";
import { toast } from "react-toastify";

const SavedBlogs = () => {
  const { user } = useContext(AuthContext);
  const userId = user?._id;

  const [savedBlogs, setSavedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSavedBlogs = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/users/savedblogs?userId=${userId}`);
      setSavedBlogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching saved blogs:", err);
      toast.error("Failed to fetch saved blogs. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedBlogs();
  }, [userId]);

  const removeSavedBlog = async (slug) => {
    if (!window.confirm("Do you want to remove this blog from saved blogs?"))
      return;

    try {
      await axios.delete(`/api/users/removefromsavedblogs/${slug}?userId=${userId}`);
      setSavedBlogs((prev) => prev.filter((b) => b.slug !== slug));
      toast.info("Blog removed from Saved Blogs");
    } catch (error) {
      console.error("Error removing blog from saved blogs:", error);
      toast.error("Failed to remove blog. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <PreLoader isLoading={true} text="Loading your saved blogs..." />
      </div>
    );
  }

  if (savedBlogs.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 flex-column">
        <h5 className="color-teal-green mb-2">No saved blogs yet</h5>
        <p className="text-muted">You can save blogs to view them later.</p>
      </div>
    );
  }

  return (
    <section className="newpage-section">
      <Container>
        <h3 className="page-title color-teal-green">Saved Blogs</h3>
        <div className="heading-underline"></div>

        <div className="savedblogs-items">
          {savedBlogs.map((blog) => (
            <Card className="savedblogs-card shadow-sm mb-3" key={blog.slug}>
              <Card.Body>
                <b>
                  <a
                    href={`/${blog.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="color-teal-green text-decoration-none"
                  >
                    {blog.title}
                  </a>
                </b>
                <Card.Subtitle className="mt-1 text-muted">
                  Category: {blog.category || "Uncategorized"}
                </Card.Subtitle>

                {blog.tags?.length > 0 && (
                  <div className="mt-1">
                    <b>Tags: </b>
                    {blog.tags.map((tag) => (
                      <Card.Link
                        href="#"
                        key={tag}
                        className="text-muted small"
                      >
                        #{tag}
                      </Card.Link>
                    ))}
                  </div>
                )}
              </Card.Body>

              <Card.Footer
                className="card-footer2 text-danger fw-bold text-center"
                onClick={() => removeSavedBlog(blog.slug)}
                style={{ cursor: "pointer" }}
              >
                Remove
              </Card.Footer>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default SavedBlogs;
