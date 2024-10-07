import React, { useContext, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "contexts/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user,loading, logout } = useContext(AuthContext);
//   console.log("Userrrrrr:v ", user);
const location = useLocation();

  useEffect(()=>{
    console.log("10Loading ",loading);
    console.log("11user",user?.email);
    if(!loading && !user){
        logout();
        return <Navigate to="/login" state={{ from: location }} replace />
    }
  },[loading]);

//   if (!user) {
//     console.log("Pro route 9: ", user)
//     // If the user is not logged in, redirect to the login page
//     // return <Navigate to="/login" />;
//   }

  // If the user is logged in, render the child component (protected component)
  return children;
};

export default ProtectedRoute;
