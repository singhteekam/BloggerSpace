import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";


const BlogContext = createContext();

export const useBlogs = () => useContext(BlogContext);

async function fetchAllBlogs() {
  const { data } = await axios.get("/api/blogs/fetchallblogs");
  return data.blogs.sort(
    (a, b) => new Date(b.lastUpdatedAt) - new Date(a.lastUpdatedAt)
  );
}

export const BlogProvider = ({ children }) => {
  const { data, isLoading, error } = useQuery({
  queryKey: ['allBlogs'],
  queryFn: fetchAllBlogs,
});

  // const [blogs, setBlogs] = useState([]);
  // const [loading, setLoading] = useState(true);

  // const fetchAllBlogs = async () => {
  //   try {
  //     const response = await axios.get("/api/blogs/fetchallblogs");

  //     const blogs = response.data.blogs;

  //     blogs.sort(
  //       (a, b) => new Date(b.lastUpdatedAt) - new Date(a.lastUpdatedAt)
  //     );

  //     setBlogs(blogs);
  //     setLoading(false);
  //   } catch (error) {
  //     console.error("Error fetching all blogs:", error);
  //     setLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   fetchAllBlogs();
  // }, []);

  return (
    <BlogContext.Provider
      value={{
        blogs: data || [],
        loading: isLoading,
        error,
      }}
    >
      {children}
    </BlogContext.Provider>
  );
};
