"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#0b0f19",
          background: "#faf9f7",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "1.875rem", fontWeight: 600, margin: 0 }}>
          BloggerSpace is offline.
        </h1>
        <p style={{ maxWidth: "32rem", color: "#6b7280", margin: 0 }}>
          A fatal error prevented this page from rendering. We&apos;ve been notified.
        </p>
        {error.digest && (
          <p style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#6b7280" }}>
            Reference: {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={() => reset()}
          style={{
            marginTop: "1rem",
            height: "2.75rem",
            padding: "0 1.5rem",
            borderRadius: "9999px",
            background: "#4f46e5",
            color: "white",
            fontSize: "0.875rem",
            fontWeight: 500,
            border: "none",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
