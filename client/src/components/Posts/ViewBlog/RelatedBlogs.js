import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaEye } from 'react-icons/fa';
import { BsBoxArrowUpRight } from 'react-icons/bs';
import PreLoader from 'utils/PreLoader';
import { useBlogs } from 'contexts/BlogContext';

const RelatedBlogs = ({ blogId }) => {
  const { blogs, loading } = useBlogs();

  const currentBlog = blogs.find((blog) => blog._id === blogId);

  const extractKeywords = (title) => {
    const stopWords = ["the", "a", "an", "and", "or", "in", "on", "of", "to", "for", "with"];
    return title
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => !stopWords.includes(word) && word.length > 2);
  };

  const relatedBlogs = useMemo(() => {
    if (!currentBlog || !currentBlog.title) return [];

    const currentKeywords = extractKeywords(currentBlog.title);

    return blogs
      .filter((blog) => blog._id !== blogId)
      .map((blog) => {
        const otherKeywords = extractKeywords(blog.title);
        const commonWords = otherKeywords.filter((word) =>
          currentKeywords.includes(word)
        );
        return { ...blog, matchScore: commonWords.length };
      })
      .filter((blog) => blog.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore) // highest match first
      .slice(0, 5); // top 5 matches
  }, [blogs, currentBlog, blogId]);

  return (
    <div>
      <h5 className="color-teal-green">Related Blogs:</h5>
      <div className="view-blog-most-viewed">
        {loading || !currentBlog ? (
          <PreLoader isLoading={true} />
        ) : relatedBlogs.length === 0 ? (
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
