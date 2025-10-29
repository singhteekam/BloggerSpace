// src/hooks/useMyBlogsTab.js
import { useState, useEffect } from "react";
import axios from "axios";

export const useMyBlogsTab = (tabKey, userId, isActive) => {
  const [blogs, setBlogs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isActive || !userId || blogs) return; // don't fetch if not active or already loaded

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/blogs/myblogs/${tabKey}?userId=${userId}`);
        setBlogs(response.data);
      } catch (err) {
        console.error(`Error fetching ${tabKey} blogs:`, err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isActive, userId]);

  return { blogs, loading, error };
};
