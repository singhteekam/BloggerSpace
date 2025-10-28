// hooks/useRelatedBlogs.js
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export function useRelatedBlogs(blogId) {
  return useQuery({
    queryKey: ["relatedBlogs", blogId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/blogs/${blogId}/related`);
      return data.blogs;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 mins
    refetchOnWindowFocus: false,
    enabled: !!blogId, // only run when blogId is available
  });
}
