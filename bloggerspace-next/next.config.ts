import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Outer monorepo has its own package-lock.json — pin Turbopack to this app's
  // directory so it doesn't infer the parent as the workspace root.
  turbopack: {
    root: path.join(__dirname),
  },

  images: {
    remotePatterns: [
      // Local dev backend
      { protocol: "http", hostname: "localhost", port: "5000" },
      // GitHub-hosted user uploads (existing pattern in legacy app)
      { protocol: "https", hostname: "raw.githubusercontent.com" },
      { protocol: "https", hostname: "github.com" },
      // Common avatar hosts (Google/GitHub OAuth)
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },

  allowedDevOrigins: ['192.168.1.38'],

  // Baseline security headers. Full CSP is tuned in Phase 13 once we know all
  // third-party origins (AdSense, Sentry, OAuth, etc.).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
