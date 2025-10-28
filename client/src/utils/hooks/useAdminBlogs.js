// hooks/useAdminBlogs.js
import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";

async function fetchAdminBlogs({ pageParam = 1 }) {
  const { data } = await axios.get(`/api/admin/adminblogs?page=${pageParam}&limit=10`);
  return data;
}

export function useAdminBlogs() {
  return useInfiniteQuery({
    queryKey: ["adminBlogs"],
    queryFn: fetchAdminBlogs,
    getNextPageParam: (lastPage) => {
      if (lastPage.currentPage < lastPage.totalPages) {
        return lastPage.currentPage + 1;
      }
      return undefined;
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
    refetchOnWindowFocus: false,
  });
}
