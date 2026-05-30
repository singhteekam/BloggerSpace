/**
 * Central route registry for the BloggerSpace Next.js app.
 *
 * Import from here instead of hardcoding path strings in Link/router calls.
 * Update this file whenever a route is added, renamed, or removed.
 *
 * Domain: www.singhteekam.in
 */

// ── Public / Discovery ────────────────────────────────────────────────────────
// Indexed by Google. No auth required.

export const ROUTES = {

  // Core
  HOME:               "/",
  BLOGS:              "/blogs",
  BLOG:               (slug: string) => `/blogs/${slug}`,
  COMMUNITY:          "/community",
  COMMUNITY_POST:     (id: string, slug: string) => `/community/${id}/${slug}`,
  REVIEWS:            "/reviews",
  ADMIN_BLOGS:        "/adminblogs",       // admin-curated public blog listing

  // Static info pages
  ABOUT:              "/about",
  ABOUT_DEVELOPER:    "/aboutdeveloper",
  GUIDELINES:         "/guidelines",
  PRIVACY_POLICY:     "/privacypolicy",
  TERMS:              "/termsandconditions",

  // Public profiles
  USER_PROFILE:       (username: string) => `/user/${username}`,

  // System
  MAINTENANCE:        "/maintenance",

  // ── Auth ───────────────────────────────────────────────────────────────────
  // Flat at root — standard convention.

  LOGIN:              "/login",
  SIGNUP:             "/signup",
  FORGOT_PASSWORD:    "/forgotpassword",
  RESET_PASSWORD:     "/resetpassword",
  VERIFY_OTP:         "/verify-otp",
  AUTH_SUCCESS:       "/auth-success",

  // ── BloggerSpace Platform (user dashboard) ─────────────────────────────────
  // All require auth. Namespaced under /bloggerspace/ for clear URL identity.

  BS_WRITE:           "/bloggerspace/newblog",
  BS_EDIT:            (id: string) => `/bloggerspace/newblog?edit=${id}`,
  BS_MY_BLOGS:        "/bloggerspace/myblogs",
  BS_PROFILE:         "/bloggerspace/profile",
  BS_SAVED:           "/bloggerspace/saved",
  BS_SETTINGS:        "/bloggerspace/settings",
  BS_SECURITY:        "/bloggerspace/security",
  BS_APPLY_REVIEWER:  "/bloggerspace/apply-reviewer",
  BS_COMMUNITY_NEW:   "/bloggerspace/community/new",

  // ── Reviewer Portal ────────────────────────────────────────────────────────
  // Separate login + dashboard for approved reviewers.

  REVIEWER:                 "/reviewer",
  REVIEWER_DASHBOARD:       "/reviewer/dashboard",
  REVIEWER_BLOG:            (id: string) => `/reviewer/blog/${id}`,
  REVIEWER_LOGIN:           "/reviewer/login",
  REVIEWER_PROFILE:         "/reviewer/profile",
  REVIEWER_SETTINGS:        "/reviewer/settings",
  REVIEWER_CHANGE_PASSWORD: "/reviewer/changepassword",

  // ── Admin Portal ───────────────────────────────────────────────────────────
  // Separate login + full management panel.

  ADMIN_LOGIN:              "/admin/login",
  ADMIN_DASHBOARD:          "/admin/dashboard",
  ADMIN_ANALYTICS:          "/admin/analytics",
  ADMIN_MANAGE_BLOGS:       "/admin/manage/blogs",
  ADMIN_MANAGE_COMMUNITY:   "/admin/manage/community",
  ADMIN_MANAGE_TEAM:        "/admin/manage/team",
  ADMIN_MANAGE_TEAM_MEMBER: (userId: string) => `/admin/manage/team/${userId}`,
  ADMIN_MANAGE_ADMIN_BLOGS: "/admin/manage/adminblogs",
  ADMIN_MANAGE_MAINTENANCE: "/admin/manage/maintenance",
  ADMIN_BLOG_EDIT:          (id: string) => `/admin/blogs/edit/${id}`,
  ADMIN_BLOG_WRITE:         "/admin/adminblogs/write",
  ADMIN_ADMIN_BLOG_EDIT:    (id: string) => `/admin/adminblogs/edit/${id}`,
  ADMIN_REVIEWS:            "/admin/reviews",
  ADMIN_REDEMPTIONS:        "/admin/redemptions",
  ADMIN_NEWSLETTER:         "/admin/newsletter",
  ADMIN_PROFILE:            "/admin/profile",
  ADMIN_SETTINGS:           "/admin/settings",
  ADMIN_SAVED_BLOGS:        "/admin/savedblogs",
  ADMIN_CHANGE_PASSWORD:    "/admin/changepassword",
  ADMIN_MAINTENANCE:        "/admin/maintenance",

  // ── API Routes ─────────────────────────────────────────────────────────────
  // Internal Next.js API endpoints (not navigable pages).

  API_CHAT:           "/api/chat",

} as const;

// ── Old routes → new routes (for reference) ──────────────────────────────────
// These old paths are handled via 301 redirects on Vercel/Cloudflare.
// Do NOT use these in new code — they exist only as a migration reference.
//
// /newblog          → /bloggerspace/newblog
// /myblogs          → /bloggerspace/myblogs
// /myprofile        → /bloggerspace/profile
// /savedblogs       → /bloggerspace/saved
// /settings         → /bloggerspace/settings
// /changepassword   → /bloggerspace/security
// /apply-reviewer   → /bloggerspace/apply-reviewer
// /community/new    → /bloggerspace/community/new
