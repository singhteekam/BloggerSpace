import React, { createContext, useContext } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";

// Create context
const BlogContext = createContext();

// Hook to use blogs anywhere
export const useBlogs = () => useContext(BlogContext);

// ✅ Fetch all published blogs (basic list)
async function fetchAllBlogs() {
  const { data } = await axios.get("/api/blogs/fetchallblogs", {
    params: { page: 1, limit: 100 }, // optional: limit to 100 blogs max
  });

  // Sort newest first
  return data.blogs.sort(
    (a, b) => new Date(b.lastUpdatedAt) - new Date(a.lastUpdatedAt)
  );
}

// ✅ Provider
export const BlogProvider = ({ children }) => {
  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["allBlogs"],
    queryFn: fetchAllBlogs,
    staleTime: 5 * 60 * 1000, // 5 min: keeps data fresh
    cacheTime: 4 * 60 * 60 * 1000, // 4 hrs: retain cached data
    refetchOnWindowFocus: false,
  });

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
