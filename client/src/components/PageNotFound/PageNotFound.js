import React, { useState, useEffect } from "react";
import { Button, Alert, Spinner } from "react-bootstrap";
import { Helmet } from "react-helmet";
import "bootstrap/dist/css/bootstrap.css";

function PageNotFound() {
  return (
    <div>
      <Helmet>
        <title>Page Not Found - BloggerSpace</title>
      </Helmet>
      <div className="verify-account-page">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 col-sm-8">
              <div>
                <h2>404 - Not Found</h2>
                <p>Sorry, the page you are looking for does not exist.</p>
                {/* You can add additional content or styling here */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PageNotFound;
