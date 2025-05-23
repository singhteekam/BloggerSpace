import React, { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
import PreLoader from './PreLoader';

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
  const from = location.state?.from?.pathname || "/";
  // const token2="dhwwwwwwwww3y277gdug";

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    // const token = token2;
    const token = params.get('token');
    // const decoded= decodeJWT(token);

    console.log("Token in auth success: ", token);

    if (token) {
      // Save token to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('lastLogin', params.get('lastLogin'));
      // Redirect to homepage
      navigate(from, { replace: true });
    } else {
      // Handle login failure
      navigate('/login');
    }
  }, [navigate, location]);

  return <PreLoader isLoading="true" />;
};

export default AuthSuccess
