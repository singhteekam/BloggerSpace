import React from "react";
import { FaEye } from "react-icons/fa";
import { Link } from "react-router-dom";
import { BsBoxArrowUpRight } from "react-icons/bs";
import PreLoader from "utils/PreLoader";
import { useTopViewedBlogs } from "utils/hooks/useTopViewedBlogs";

const TopViewedBlogs = () => {
  const { data: topViewedBlogs, isLoading, isError } = useTopViewedBlogs();

  if (isLoading) return <PreLoader isLoading={true} />;
  if (isError) return <p className="text-danger">Failed to load most viewed blogs.</p>;

  return (
    <div>
      <h5 className="color-teal-green">Top Viewed Blogs:</h5>
      <div className="view-blog-most-viewed">
        <ul>
          {topViewedBlogs?.map((blog) => (
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
      </div>
    </div>
  );
};

export default TopViewedBlogs;
