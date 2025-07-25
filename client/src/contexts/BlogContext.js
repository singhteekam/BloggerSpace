import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const BlogContext = createContext();

export const useBlogs = () => useContext(BlogContext);

export const BlogProvider = ({ children }) => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAllBlogs = async () => {
    try {
      const response = await axios.get("/api/blogs/fetchallblogs");

      const blogs = response.data.blogs;

      blogs.sort(
        (a, b) => new Date(b.lastUpdatedAt) - new Date(a.lastUpdatedAt)
      );

      setBlogs(blogs);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching all blogs:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBlogs();
  }, []);

  return (
    <BlogContext.Provider value={{ blogs, loading }}>
      {children}
    </BlogContext.Provider>
  );
};
