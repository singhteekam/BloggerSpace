import React from "react";

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div
      role="alert"
      className="fallback-ui-container"
    >
      <h3>⚠️ Oops! Something went wrong</h3>
      <p className="text-danger">{error?.message}</p>
      <button
        className="btn btn-outline-teal-green mt-3"
        onClick={resetErrorBoundary}
      >
        Try Again
      </button>
    </div>
  );
};

export default ErrorFallback;
