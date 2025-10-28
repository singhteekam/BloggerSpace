// hooks/useTopViewedBlogs.js
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export function useTopViewedBlogs() {
  return useQuery({
    queryKey: ["topViewedBlogs"],
    queryFn: async () => {
      const { data } = await axios.get("/api/blogs/topviewedblogs");
      return data.blogs;
    },
    staleTime: 30 * 60 * 1000, // 30 min cache
    refetchOnWindowFocus: false,
  });
}
