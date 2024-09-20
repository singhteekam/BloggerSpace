import axios from "axios";
import React, { useEffect, useState } from "react";
import { Button, Container, ListGroup } from "react-bootstrap";
import { Link } from "react-router-dom";
import PreLoader from "utils/PreLoader";

const AdminBlogs = () => {
  const [adminBlogs, setAdminBlogs] = useState([]);

  useEffect(() => {
    const fetchAdminBlogs = async () => {
      try {
        const res = await axios.get("/api/admin/blogs/published");
        setAdminBlogs(res.data);
      } catch (error) {
        console.log("Error fetching admin blogs");
      }
    };
    fetchAdminBlogs();
  }, []);

  let k=0;

  if(adminBlogs.length===0){
    return (
      <PreLoader isLoading="true" />
    );
  }

  return (
    <section className="newpage-section">
      <Container>
        <h3 className="page-title">Admin Blogs</h3>
        <div className="heading-underline"></div>

        <ListGroup>
          {adminBlogs &&
            adminBlogs.map((blog) => (
              <ListGroup.Item>
                <div className="row align-items-center">
                  <div className="col">
                    <b>
                      {++k}. {blog.title}{" "}
                    </b>
                  </div>
                  <div className="col-auto">
                    <Link
                      to={`/${blog.slug}`}
                      //   target="_blank"
                      //   rel="noopener noreferrer"
                    >
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
