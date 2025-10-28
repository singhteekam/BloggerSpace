import React from "react";
import { Link } from "react-router-dom";
import { FaEye } from "react-icons/fa";
import { BsBoxArrowUpRight } from "react-icons/bs";
import PreLoader from "utils/PreLoader";
import { useRelatedBlogs } from "utils/hooks/useRelatedBlogs";

const RelatedBlogs = ({ blogId }) => {
  const { data: relatedBlogs, isLoading, isError } = useRelatedBlogs(blogId);

  if (isLoading) return <PreLoader isLoading={true} />;
  if (isError) return <p className="text-danger">Failed to load related blogs.</p>;

  return (
    <div>
      <h5 className="color-teal-green">Related Blogs:</h5>
      <div className="view-blog-most-viewed">
        {relatedBlogs?.length === 0 ? (
          <p className="text-muted">No related blogs found.</p>
        ) : (
          <ul>
            {relatedBlogs.map((blog) => (
              <li key={blog._id}>
                <Link to={`/${blog.slug}`}>
                  {blog.title} <BsBoxArrowUpRight />
                </Link>
                <br />
                <FaEye className="color-teal-green" />{" "}
                <span className="color-teal-green">{blog.blogViews}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RelatedBlogs;
