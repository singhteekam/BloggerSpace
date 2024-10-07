import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import {toast} from "react-toastify";
// Create AuthContext
export const AuthContext = createContext();

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      // Fetch user info using the token
      axios
        .get("/api/users/userinfo", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          setUser(response.data);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching user information:", error);
          setLoading(false);
        });
    } else {
      setLoading(false); // User is not logged in
    }
  }, []);

  // Function to handle user logout
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    // toast.info("Logged out success!!");
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
