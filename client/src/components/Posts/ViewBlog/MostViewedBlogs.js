import React, { useContext, useMemo } from 'react';
import { FaEye } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { BsBoxArrowUpRight } from 'react-icons/bs';
import PreLoader from 'utils/PreLoader';
import { useBlogs } from 'contexts/BlogContext';

const MostViewedBlogs = () => {
  const { blogs, loading } = useBlogs();

  const topViewedBlogs = useMemo(() => {
    if (!blogs) return [];
    return [...blogs]
      .sort((a, b) => b.blogViews - a.blogViews)
      .slice(0, 10);
  }, [blogs]);

  if (loading || !blogs) {
    return <PreLoader isLoading={true} />;
  }

  return (
    <div>
      <h5 className="color-teal-green">Most Viewed Blogs:</h5>
      <div className="view-blog-most-viewed">
        <ul>
          {topViewedBlogs.map((blog) => (
            <li key={blog._id}>
              <Link to={`/${blog.slug}`}>
                {blog.title} <BsBoxArrowUpRight />
              </Link>
              <br />
              <FaEye className="color-teal-green" />{' '}
              <span className="color-teal-green">{blog.blogViews}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default MostViewedBlogs;
