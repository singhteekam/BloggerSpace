import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom';

const decodeJWT = (token) => {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  
    return JSON.parse(jsonPayload);
  };

const AuthSuccess = () => {

    const navigate = useNavigate();
  const location = useLocation();
  // const token2="dhwwwwwwwww3y277gdug";

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    // const token = token2;
    const token = params.get('token');
    // const decoded= decodeJWT(token);

    if (token) {
      // Save token to localStorage
      localStorage.setItem('token', token);
      // Redirect to homepage
      navigate('/');
    } else {
      // Handle login failure
      navigate('/login');
    }
  }, [navigate, location]);

  return <div>Loading...</div>;
};

export default AuthSuccess
