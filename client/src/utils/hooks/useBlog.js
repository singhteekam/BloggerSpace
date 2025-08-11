// hooks/useBlog.js
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export function useBlog(blogSlug) {
  return useQuery({
    queryKey: ["blog", blogSlug],
    queryFn: async () => {
      const res = await axios.get(`/api/blogs/${blogSlug}`);
      return res.data.blog;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}
