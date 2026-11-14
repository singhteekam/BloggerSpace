# BloggerSpace — Route Map (Frontend ↔ Backend)

A single reference for **every frontend page route** and **every backend API endpoint**, and how
they map to each other.

> **Companion docs:** [ARCHITECTURE.md](ARCHITECTURE.md) (structure, data models, conventions) ·
> [AGENTS.md](AGENTS.md) (2-minute onboarding). This file owns the route tables; cross-cutting
> behaviour (IST dates, deleted authors, caching) is summarised in §9 and detailed in ARCHITECTURE.md.

> **How to keep this file up to date** (edit it whenever you add/rename a route):
> - **Frontend pages** live in `bloggerspace-next/src/app/**/page.tsx` — the folder path *is* the URL.
>   A `[param]` folder is a dynamic segment. `route.ts` files are Next.js server endpoints (`/api/*`).
> - **Backend endpoints** live in `server/routes/*.js`. Each router is mounted under a base path in
>   `server/app.js` (see §2). The full URL = *mount base* + *route path*.
> - **The bridge**: frontend pages don't call the backend directly — they go through typed API client
>   modules in `bloggerspace-next/src/lib/api/*.ts` (axios instance in `client.ts`, base URL from
>   `NEXT_PUBLIC_BACKEND_URL`). When you add an endpoint, add a method to the matching client module
>   and update §3/§6 below.
> - **Auth legend**: 🌐 public · 🔑 user (`authenticate`) · 🛡️ admin (`adminMiddleware`) ·
>   📝 reviewer (`reviewerMiddleware`) · 🔁 passport OAuth.

---

## 1. Architecture at a glance

| Layer | Tech | Location | Notes |
|---|---|---|---|
| Frontend | Next.js (App Router) + React Query | `bloggerspace-next/` | SSR/ISR pages; client data via `src/lib/api/*` |
| Backend | Express on Firebase Functions | `server/` | Exported as `bloggerspacebackend2` (`onRequest`) + `dailyTrendingNotification` (`onSchedule`) |
| API client | axios | `bloggerspace-next/src/lib/api/client.ts` | Base URL = `NEXT_PUBLIC_BACKEND_URL`; attaches auth token |
| DB | MongoDB (Mongoose) | `server/models/` | — |

---

## 2. Backend router mounts (`server/app.js`)

| Mount base | Router file | Domain |
|---|---|---|
| `/api` | `routes/sitemap.js` | `sitemap.xml`, sitemap regeneration |
| `/api/users` | `routes/users.js` | Auth, profile, saved blogs, follow, reading history, gems/redemptions, visitors |
| `/api/blogs` | `routes/blogs.js` | Blog CRUD, listing, comments, likes, MyBlogs, search |
| `/api/reviewer/` | `routes/Reviewer/reviewerRoute.js` | Reviewer panel |
| `/api/admin/` | `routes/Admin/adminRoute.js` | Admin panel (blogs, users, gems, newsletter, config…) |
| `/api/community` | `routes/community.js` | Community posts + replies |
| `/api/reviews` | `routes/reviewsRoute.js` | Site testimonials/reviews |
| `/api/autowrite` | `routes/autoWriteBlogs.js` | AI auto-write / auto-publish jobs |
| `/api/analytics` | `routes/analyticsRoute.js` | Visitor tracking + admin analytics |
| `/api/notifications` | `routes/notifications.js` | FCM push token register/status |

---

## 3. Frontend page routes → backend endpoints

URL = the route a visitor opens. "Primary backend calls" = the main endpoints that page relies on
(via `src/lib/api/*`). Not every minor call is listed — keep it to the meaningful ones.

### 3.1 Public / marketing

| URL | Page file | Auth | Primary backend calls |
|---|---|---|---|
| `/` | `app/page.tsx` | 🌐 | `GET /api/blogs/`, `GET /api/blogs/topviewedblogs`, `GET /api/blogs/recommended` |
| `/blogs` | `app/blogs/page.tsx` | 🌐 | `GET /api/blogs/allblogs`, `/categories`, `/tags`, `/searchblogs/:query` |
| `/blogs/[slug]` | `app/blogs/[slug]/page.tsx` | 🌐 | `GET /api/blogs/:blogSlug`, `/:blogId/related`, comments + likes, `PATCH /api/blogs/updateblogviews` |
| `/adminblogs` | `app/adminblogs/page.tsx` | 🌐 | `GET /api/blogs/adminpublished` |
| `/community` | `app/community/page.tsx` | 🌐 | `GET /api/community/communityposts` |
| `/community/[communityPostId]/[communityPostSlug]` | `app/community/[communityPostId]/[communityPostSlug]/page.tsx` | 🌐 | `GET /api/community/post/:communityPostSlug`, `POST /api/community/:communityPostId/addreply` |
| `/reviews` | `app/reviews/page.tsx` | 🌐 | `GET /api/reviews/approved` |
| `/user/[username]` | `app/user/[username]/page.tsx` | 🌐 | `GET /api/users/profile/:username`, `GET /api/users/profile/:username/blogs`, follow/unfollow |
| `/about`, `/aboutdeveloper`, `/guidelines`, `/privacypolicy`, `/termsandconditions` | respective `page.tsx` | 🌐 | static content |
| `/maintenance` | `app/maintenance/page.tsx` | 🌐 | shown via middleware when maintenance mode on |

### 3.2 Auth

| URL | Page file | Auth | Primary backend calls |
|---|---|---|---|
| `/login` | `app/login/page.tsx` | 🌐 | `POST /api/users/login`, `/login-otp/request`, `/login-otp/verify`, OAuth `GET /api/users/auth/{google,github}` |
| `/signup` | `app/signup/page.tsx` | 🌐 | `POST /api/users/signup`, `/checkusername` |
| `/verify-otp` | `app/verify-otp/page.tsx` | 🌐 | `POST /api/users/verify-otp`, `/resend-otp` |
| `/forgotpassword` | `app/forgotpassword/page.tsx` | 🌐 | `POST /api/users/forgot-password/request-otp`, `/verify-otp` |
| `/resetpassword` | `app/resetpassword/page.tsx` | 🌐 | `POST /api/users/forgot-password/reset` |
| `/reverify` | `app/reverify/page.tsx` | 🔑 | `POST /api/users/reverify-otp/send`, `/verify` |
| `/auth-success` | `app/auth-success/page.tsx` | 🌐 | OAuth landing → stores token, `GET /api/users/userinfo` |

### 3.3 Logged-in user area (`/bloggerspace/*`)

| URL | Page file | Auth | Primary backend calls |
|---|---|---|---|
| `/bloggerspace/myblogs` | `app/bloggerspace/myblogs/page.tsx` | 🔑 | `GET /api/blogs/myblogs/{saveddraft,pendingreview,underreview,awaitingauthorblogs,authorpublishedblogs}`, `POST /api/users/discard/blog/:id` |
| `/bloggerspace/newblog` · `/bloggerspace/write` | `.../newblog/page.tsx`, `.../write/page.tsx` | 🔑 | `POST /api/blogs/saveasdraft`, `/newblog`, `/isuniquetitle`, `/generateblog`, `GET/PUT /api/blogs/editblog/...` |
| `/bloggerspace/saved` | `app/bloggerspace/saved/page.tsx` | 🔑 | `GET /api/users/savedblogs`, `DELETE /api/users/removefromsavedblogs/:slug` |
| `/bloggerspace/profile` | `app/bloggerspace/profile/page.tsx` | 🔑 | `GET /api/users/userinfo`, `PATCH /api/users/updateusername`, reading-history, gems history |
| `/bloggerspace/settings` | `app/bloggerspace/settings/page.tsx` | 🔑 | `PATCH /api/users/newsletter-optin`, `DELETE /api/users/delete`, `PATCH /api/users/deactivate` |
| `/bloggerspace/security` | `app/bloggerspace/security/page.tsx` | 🔑 | `POST /api/users/changepassword` |
| `/bloggerspace/apply-reviewer` | `app/bloggerspace/apply-reviewer/page.tsx` | 🔑 | `POST /api/reviewer/apply` |
| `/bloggerspace/community/new` | `app/bloggerspace/community/new/page.tsx` | 🔑 | `POST /api/community/newpost` |

### 3.4 Reviewer panel (`/reviewer/*`)

| URL | Page file | Auth | Primary backend calls |
|---|---|---|---|
| `/reviewer/dashboard` | `app/reviewer/dashboard/page.tsx` | 📝 | `GET /api/reviewer/pendingreviewblogs`, `/awaitingauthorblogs`, `/userdetails` |
| `/reviewer/blog/[id]` | `app/reviewer/blog/[id]/page.tsx` | 📝 | `GET /api/reviewer/blog/editblog/:id`, `PUT .../save/:id`, `PUT /blog/savedraft/:id`, `POST /feedbacktoauthor`, `POST /discardqueue/:id` |
| `/reviewer` · `/reviewer/login` · `/profile` · `/settings` · `/changepassword` | respective `page.tsx` | 🌐 | **Redirect stubs.** A reviewer is just a regular **user + the review dashboard**, so these now redirect to the standard user pages (`/login`, `/bloggerspace/profile`, `/bloggerspace/settings`, `/bloggerspace/security`). A reviewer's normal login token already carries `role:"reviewer"`, which passes `reviewerMiddleware`. To step down, a reviewer uses **Settings → "Request revoke"** (`POST /api/users/reviewer/revoke-request`, emails the admin). |

### 3.5 Admin panel (`/admin/*`)

| URL | Page file | Auth | Primary backend calls |
|---|---|---|---|
| `/admin/login` | `app/admin/login/page.tsx` | 🌐 | `POST /api/admin/login`, `/login/verify-otp`, `/login/resend-otp` |
| `/admin/dashboard` | `app/admin/dashboard/page.tsx` | 🛡️ | review queues (`/inreviewblogs`, `/pendingblogs`, `/underreviewblogs`, `/awaitingauthorblogs`, `/discardqueueblogs`), `/published` |
| `/admin/manage/blogs` | `app/admin/manage/blogs/page.tsx` | 🛡️ | review queues + `/allreviewers`, `PATCH /assign/blog/:id`, `POST /discard/blog/:id` |
| `/admin/manage/adminblogs` | `app/admin/manage/adminblogs/page.tsx` | 🛡️ | `GET /api/admin/blogs/{drafts,published,discarded}`, discard/edit/delete |
| `/admin/manage/team` | `app/admin/manage/team/page.tsx` | 🛡️ | `GET /api/admin/dashboard/allusers` (paginated), `/verifiedreviewers`, `/pendingrequests`, `/deletedusers`, approve/reject/remove/deactivate/reactivate/delete user |
| `/admin/manage/team/[userId]` | `.../team/[userId]/page.tsx` | 🛡️ | `GET /api/admin/users/:userId/content`, `DELETE /api/admin/users/:userId/blog/:blogId` |
| `/admin/manage/community` | `app/admin/manage/community/page.tsx` | 🛡️ | `GET /api/admin/community`, comments, `DELETE /deletecommunitypost/:id` |
| `/admin/manage/maintenance` · `/admin/maintenance` | `.../page.tsx` | 🛡️ | `GET/PATCH /api/admin/config` (maintenance fields) |
| `/admin/newsletter` | `app/admin/newsletter/page.tsx` | 🛡️ | `GET /api/admin/dashboard/newsletter-recipients`, `POST /newsletter/send`, `GET /newsletter/history` |
| `/admin/analytics` | `app/admin/analytics/page.tsx` | 🛡️ | `GET /api/analytics/{stats,logs,visitors,visitor/:id}`, `DELETE /api/analytics/{logs,logs/:id,visitor/:id}` |
| `/admin/redemptions` | `app/admin/redemptions/page.tsx` | 🛡️ | `GET /api/admin/redemptions`, `PATCH /redemptions/:id/{fulfill,reject}` |
| `/admin/reviews` | `app/admin/reviews/page.tsx` | 🛡️ | `GET /api/reviews/admin`, `PATCH /admin/:id/{approve,reject}`, `DELETE /admin/:id` |
| `/admin/savedblogs` | `app/admin/savedblogs/page.tsx` | 🛡️ | `GET /api/admin/savedblogs`, add/remove |
| `/admin/settings` | `app/admin/settings/page.tsx` | 🛡️ | `GET/PATCH /api/admin/config` |
| `/admin/profile` | `app/admin/profile/page.tsx` | 🛡️ | `GET /api/admin/profile`, `PATCH /profile/update`, `POST /profile/uploadpicture` |
| `/admin/changepassword` | `app/admin/changepassword/page.tsx` | 🛡️ | `POST /api/reviewer/changepassword` (role=Admin) |
| `/admin/adminblogs/write` · `/admin/adminblogs/edit/[id]` | `.../page.tsx` | 🛡️ | `POST /api/admin/blogs/{newblog,saveasdraft}`, `GET/PUT /blogs/editblog/...` |
| `/admin/blogs/edit/[id]` | `app/admin/blogs/edit/[id]/page.tsx` | 🛡️ | `GET /api/admin/blog/editblog/:id`, `PUT /blog/publish/:id`, gems + scoring endpoints |

---

## 4. Frontend internal API routes (Next.js `route.ts`)

These run on the Next.js server (not the Express backend).

| URL | File | Purpose |
|---|---|---|
| `POST /api/chat` | `app/api/chat/route.ts` | Chat/assistant proxy |
| `POST /api/revalidate` | `app/api/revalidate/route.ts` | On-demand ISR; called by backend with `REVALIDATE_SECRET` |
| `/api/savedblogs` | `app/api/savedblogs/route.ts` | Saved-blogs helper |
| `POST /api/upload/image` | `app/api/upload/image/route.ts` | Image upload proxy (editor) |

---

## 5. API client modules (`bloggerspace-next/src/lib/api/`)

| Module | Talks to | Used by |
|---|---|---|
| `client.ts` | — (axios base instance) | all modules |
| `auth.ts`, `auth-storage.ts` | `/api/users` (auth) | login/signup/otp/oauth pages |
| `user.ts` | `/api/users` | profile, saved, myblogs, reading history, follow, gems/redemptions |
| `blogs.ts` | `/api/blogs` | listing, blog view, homepage |
| `blog-write.ts` | `/api/blogs` (write) | newblog/write/edit |
| `interactions.ts` | `/api/blogs` (comments, likes, views) | blog detail page |
| `community.ts` | `/api/community` | community pages |
| `reviews.ts` | `/api/reviews` | reviews page + admin reviews |
| `reviewer.ts` | `/api/reviewer` | reviewer panel |
| `admin.ts` | `/api/admin` | all admin pages |
| `analytics.ts` | `/api/analytics` | analytics page + page-view tracking |

---

## 6. Backend endpoint reference (grouped)

Full path = mount base (§2) + route path. Auth markers per §legend.

### 6.1 `/api/users` — `routes/users.js`

| Method | Path | Handler | Auth |
|---|---|---|---|
| POST | `/api/users/signup` | signup | 🌐 |
| POST | `/api/users/login` | login | 🌐 |
| POST | `/api/users/verify-otp` | verifyOtp | 🌐 |
| POST | `/api/users/resend-otp` | resendOtp | 🌐 |
| POST | `/api/users/login-otp/request` | requestLoginOtp | 🌐 |
| POST | `/api/users/login-otp/verify` | verifyLoginOtp | 🌐 |
| POST | `/api/users/forgot-password/request-otp` | forgotPasswordRequestOtp | 🌐 |
| POST | `/api/users/forgot-password/verify-otp` | forgotPasswordVerifyOtp | 🌐 |
| POST | `/api/users/forgot-password/reset` | forgotPasswordReset | 🌐 |
| POST | `/api/users/reverify-otp/send` | sendReverifyOtp | 🔑 |
| POST | `/api/users/reverify-otp/verify` | verifyReverifyOtp | 🔑 |
| POST | `/api/users/verify-account` · GET same | verifyAccount(get) | 🌐 |
| GET | `/api/users/auth/google` · `/auth/google/callback` | passport google | 🔁 |
| GET | `/api/users/auth/github` · `/auth/github/callback` | passport github | 🔁 |
| POST | `/api/users/logout` | logout | 🌐 |
| DELETE | `/api/users/delete` | deleteAccount | 🔑 |
| PATCH | `/api/users/deactivate` | deactivateAccount | 🔑 |
| POST | `/api/users/forgotpassword` · `/resetpassword` | forget/reset password (legacy) | 🌐 |
| POST | `/api/users/changepassword` | changePassword | 🔑 |
| POST | `/api/users/uploadprofilepicture` | uploadProfilePicture2 | 🔑* |
| GET | `/api/users/userinfo` | loggedInUserInfo | 🔑 |
| GET | `/api/users/profile/:username` | userProfile | 🌐 |
| GET | `/api/users/profile/:username/blogs` | getUserProfileBlogs (paginated) | 🌐 |
| POST | `/api/users/checkusername` | checkUserName | 🌐 |
| PATCH | `/api/users/updateusername` | updateUserPersonalDetails | 🔑 |
| PATCH | `/api/users/newsletter-optin` | setNewsletterOptIn | 🔑 |
| POST | `/api/users/reviewer/revoke-request` | requestReviewerRevoke (reviewer asks admin to revoke their role — emails admin) | 🔑 |
| GET/POST | `/api/users/newsletter/unsubscribe` | newsletterUnsubscribe (token-signed link from email footer / List-Unsubscribe) | 🌐 |
| GET | `/api/users/newsletter/resubscribe` | newsletterResubscribe (token-signed) | 🌐 |
| POST/GET | `/api/users/reading-history` | add/getReadingHistory | 🔑 |
| POST | `/api/users/discard/blog/:id` | discardBlogFromDB | 🔑 |
| PATCH | `/api/users/addtosavedblogs` | addBlogToSavedBlogs | 🔑 |
| DELETE | `/api/users/removefromsavedblogs/:blogSlug` | removeBlogFromSavedBlogs | 🔑 |
| GET | `/api/users/savedblogs` | getSavedBlogsOfUser (paginated) | 🔑 |
| PATCH | `/api/users/follow/:idToFollow` · `/unfollow/:idToUnfollow` | follow/unfollowUser | 🔑 |
| GET | `/api/users/followstatus/:targetId` | getFollowStatus (returns `isFollowing` + live `followersCount`) | 🌐 |
| POST | `/api/users/contactus` | contactUs | 🌐 |
| GET | `/api/users/visitors` · POST `/addvisitor` | get/incrementVisitCount | 🌐 |
| POST | `/api/users/fileupload` · GET `/uploadedfiles/fetch` | file upload | 🔑* |
| POST | `/api/users/redemptions` · GET `/redemptions/me` | create/listOwnRedemptions | 🔑 |
| GET | `/api/users/gems/history` | gems transactions (paginated) | 🔑 |

\* relies on `userId` query param rather than middleware.

### 6.2 `/api/blogs` — `routes/blogs.js`

| Method | Path | Handler | Auth |
|---|---|---|---|
| GET | `/api/blogs/` | blogsHomepage | 🌐 |
| GET | `/api/blogs/allblogs` | fetchAllBlogs | 🌐 |
| GET | `/api/blogs/sitemap` · `/authors/sitemap` | sitemap feeds | 🌐 |
| GET | `/api/blogs/adminpublished` | fetchAdminPublishedBlogs | 🌐 |
| GET | `/api/blogs/categories` · `/tags` | distinct categories/tags | 🌐 |
| GET | `/api/blogs/fetchallblogs` | fetchAllBlogsFromDB | 🌐 |
| GET | `/api/blogs/allblogs/category/:filterCategory` | fetchBlogsByCategory | 🌐 |
| GET | `/api/blogs/topviewedblogs` | fetchTopViewedBlogs | 🌐 |
| GET | `/api/blogs/recommended` | getRecommendedBlogs | 🌐 |
| GET | `/api/blogs/:blogId/related` | fetchRelatedBlogs | 🌐 |
| GET | `/api/blogs/:blogSlug` | viewBlogRoute | 🌐 |
| GET | `/api/blogs/:blogSlug/views` | getBlogViews (live view count, no increment) | 🌐 |
| GET | `/api/blogs/fetchblog/:blogId` | fetchBlogByBlogId | 🌐 |
| POST | `/api/blogs/saveasdraft` | saveAsDraftBlog | 🔑 |
| POST | `/api/blogs/newblog` | createNewBlog | 🔑 |
| POST | `/api/blogs/generateblog` | createNewAIBlog | 🔑 |
| POST | `/api/blogs/isuniquetitle` | isUniqueTitle | 🌐 |
| GET | `/api/blogs/editblog/:id` | editBlog | 🔑 |
| PUT | `/api/blogs/editblog/save/:id` | saveEditedBlog | 🔑 |
| POST | `/api/blogs/:blogSlug/comments` · `/comments/reply` | post comment / reply | 🔑 |
| GET | `/api/blogs/:blogSlug/comments` | viewBlogComments | 🌐 |
| POST | `/api/blogs/:blogSlug/comments/:commentId/like` | toggleCommentLike | 🔑 |
| POST | `/api/blogs/:blogSlug/comments/:commentId/replies/:replyId/like` | toggleReplyLike | 🔑 |
| GET | `/api/blogs/searchblogs/:query` | searchBlogsFromDB | 🌐 |
| GET | `/api/blogs/myblogs/saveddraft` | authorSavedDraftBlogs (paginated) | 🔑 |
| GET | `/api/blogs/myblogs/pendingreview` | authorPendingReviewBlogs | 🔑 |
| GET | `/api/blogs/myblogs/underreview` | authorUnderReviewBlogs | 🔑 |
| GET | `/api/blogs/myblogs/awaitingauthorblogs` | awaitingAuthorBlogs | 🔑 |
| GET | `/api/blogs/myblogs/authorpublishedblogs` | authorPublishedBlogs | 🔑 |
| POST | `/api/blogs/bloglikes/:id` · `/:id/like` | blogLikes / toggleBlogLike | 🔑 |
| GET | `/api/blogs/:id/likecheck` | getBlogLikeStatus | 🌐 |
| POST | `/api/blogs/blogcommentlike/:id` | blogCommentLikes | 🔑 |
| PATCH | `/api/blogs/updateblogviews` | addBlogViewsCounter | 🌐 |
| POST | `/api/blogs/downloadblog` | downloadBlog | 🌐 |

### 6.3 `/api/reviewer/` — `routes/Reviewer/reviewerRoute.js`

| Method | Path | Handler | Auth |
|---|---|---|---|
| POST | `/api/reviewer/apply` | reviewerApply | 🔑 |
| POST | `/api/reviewer/login` | reviewerLogin | 🌐 |
| GET | `/api/reviewer/userdetails` | userDetails | 📝* |
| POST | `/api/reviewer/uploaduserprofilepicture` | uploadUserProfilePicture | 📝* |
| GET | `/api/reviewer/pendingreviewblogs` | pendingReviewBlogs | 📝 |
| GET | `/api/reviewer/awaitingauthorblogs` | awaitingAuthorBlogs | 📝 |
| GET | `/api/reviewer/blog/editblog/:id` | editPendingBlog | 📝 |
| PUT | `/api/reviewer/blog/editblog/save/:id` | saveEditedPendingBlog | 📝 |
| PUT | `/api/reviewer/blog/savedraft/:id` | saveReviewerDraft | 📝 |
| PUT | `/api/reviewer/account/delete` | deleteReviewerAccount | 📝 |
| POST | `/api/reviewer/feedbacktoauthor` | feedbackToAuthor | 📝 |
| PATCH | `/api/reviewer/changeusername` | changeUsername | 📝* |
| POST | `/api/reviewer/discardqueue/:id` | discardQueueBlog | 📝 |
| POST | `/api/reviewer/changepassword` | changeAccountPassword | 📝* |

\* no explicit middleware on route — guarded inside the handler / via query params.

### 6.4 `/api/admin/` — `routes/Admin/adminRoute.js`

| Method | Path | Handler | Auth |
|---|---|---|---|
| POST | `/api/admin/signup` | adminSignup | 🌐 |
| POST | `/api/admin/login` · `/login/verify-otp` · `/login/resend-otp` | admin login flow | 🌐 |
| GET | `/api/admin/adminblogs` | fetchAdminBlogs | 🌐 |
| GET | `/api/admin/inreviewblogs` | inReviewBlogs | 🛡️ |
| GET | `/api/admin/blog/editblog/:id` | editInReviewBlog | 🛡️ |
| PUT | `/api/admin/blog/publish/:id` | saveEditedInReviewBlog | 🛡️ |
| GET | `/api/admin/published` | publishedBlogs (paginated + search) | 🛡️ |
| GET | `/api/admin/allreviewers` | allReviewersFromDB | 🛡️ |
| GET | `/api/admin/pendingblogs` | allPendingBlogsfromDB | 🛡️ |
| PATCH | `/api/admin/assign/blog/:id` | updateReviewerAssignment | 🛡️ |
| GET | `/api/admin/underreviewblogs` | allUnderReviewBlogsfromDB | 🛡️ |
| GET | `/api/admin/discardqueueblogs` | fetchDiscardQueueBlogsFromDB | 🛡️ |
| POST | `/api/admin/discard/blog/:id` | discardBlogFromDB | 🛡️ |
| GET | `/api/admin/awaitingauthorblogs` | fetchAwaitingAuthorFromDB | 🌐* |
| GET | `/api/admin/dashboard/verifiedreviewers` · `/pendingrequests` | reviewer lists | 🛡️ |
| PATCH | `/api/admin/dashboard/{approvereviewer,rejectreviewer,removefromreviewer}/:id` | reviewer mgmt | 🛡️ |
| GET | `/api/admin/dashboard/allusers` | fetchAllUsers (paginated + search) | 🛡️ |
| GET | `/api/admin/dashboard/newsletter-recipients` | getNewsletterRecipients (lightweight, all) | 🛡️ |
| GET | `/api/admin/dashboard/deletedusers` | getDeletedUsers | 🛡️ |
| PUT | `/api/admin/dashboard/deleteuser/:id` | deleteUserAccount (orphans their blogs → "Anonymous" + revalidates) | 🛡️ |
| PATCH | `/api/admin/dashboard/{deactivateuser,reactivateuser}/:id` | de/reactivate user | 🛡️ |
| PATCH | `/api/admin/dashboard/user/:id/account` | updateUserAccountByAdmin (reverify-now / isVerified / status / clear profile pic) | 🛡️ |
| GET/PATCH | `/api/admin/notifications/config` | get/update notification config | 🛡️ |
| POST | `/api/admin/notifications/{test,run}` | test / run digest | 🛡️ |
| GET | `/api/admin/notifications/history` | getNotificationHistory | 🛡️ |
| GET | `/api/admin/community` | getCommunityPosts (paginated + search) | 🛡️ |
| DELETE | `/api/admin/deletecommunitypost/:id` | deleteCommunityPost | 🛡️ |
| GET | `/api/admin/community/:postId/comments` | getPostComments | 🛡️ |
| DELETE | `/api/admin/community/:postId/comment/:commentId` | deleteCommentFromPost | 🛡️ |
| DELETE | `/api/admin/community/:postId/comment/:commentId/reply/:replyId` | deleteReplyFromPost (nested reply) | 🛡️ |
| POST | `/api/admin/blogs/newblog` · `/saveasdraft` | admin-authored blog create | 🛡️ |
| GET | `/api/admin/blogs/{drafts,published,discarded}` | admin own blog lists | 🛡️/🌐 |
| POST | `/api/admin/blogs/adminblogdiscard/:id` | adminWrittenDiscardBlogFromDB | 🛡️ |
| GET/PUT | `/api/admin/blogs/editblog/:id` · `/editblog/save/:id` | admin blog edit | 🛡️ |
| POST | `/api/admin/blogs/discard/:id` | discardAnyBlog | 🛡️ |
| PUT | `/api/admin/blogs/edit/:id` | adminEditAnyBlog | 🛡️ |
| DELETE | `/api/admin/blogs/delete/:id` | deleteBlogPermanently | 🛡️ |
| PATCH | `/api/admin/blogs/:id/score` | setBlogScore | 🛡️ |
| PATCH | `/api/admin/blogs/:blogId/reviewer-score/:reviewerId` | setReviewerScore | 🛡️ |
| POST | `/api/admin/newsletter/send` | sendNewsletter | 🛡️ |
| GET | `/api/admin/newsletter/history` | getNewsletterHistory (paginated) | 🛡️ |
| GET | `/api/admin/updatesitemapxml` | updateSitemapXML | 🛡️ |
| GET | `/api/admin/dashboard/{downloadexcel,downloadpdf}` | report downloads | 🛡️ |
| POST | `/api/admin/dashboard/migrate-reviewers` | migrateReviewersToUsers | 🛡️ |
| GET/PATCH | `/api/admin/profile` · `/profile/update` | admin profile | 🛡️ |
| POST | `/api/admin/profile/uploadpicture` | adminUploadProfilePicture | 🛡️ |
| GET | `/api/admin/savedblogs` · PATCH `/savedblogs/add` · DELETE `/savedblogs/remove/:blogSlug` | admin saved blogs | 🛡️ |
| POST | `/api/admin/gems/award/:blogId` · PATCH `/gems/update/:blogId` | award/update gems | 🛡️ |
| GET | `/api/admin/gems/transactions` | getGemsTransactions (paginated) | 🛡️ |
| POST | `/api/admin/gems/grant/:userId` · `/gems/reverse/:txnId` | grant / reverse gems | 🛡️ |
| GET | `/api/admin/users/:userId/content` | getUserContent | 🛡️ |
| DELETE | `/api/admin/users/:userId/blog/:blogId` | adminForceDeleteBlog | 🛡️ |
| GET/PATCH | `/api/admin/config` | get/update AdminConfig (platform settings) | 🛡️ |
| GET | `/api/admin/redemptions` | listAllRedemptions | 🛡️ |
| PATCH | `/api/admin/redemptions/:id/{fulfill,reject}` | redemption review | 🛡️ |

\* `awaitingauthorblogs` is currently registered without `adminMiddleware`.

### 6.5 `/api/community` — `routes/community.js`

| Method | Path | Handler | Auth |
|---|---|---|---|
| GET | `/api/community/communityposts` | getAllCommunityPosts | 🌐 |
| GET | `/api/community/sitemap` | getCommunityPostsForSitemap | 🌐 |
| POST | `/api/community/newpost` | createCommunityPost | 🔑 |
| GET | `/api/community/post/:communityPostSlug` | getCommunityPost | 🌐 |
| POST | `/api/community/:communityPostId/addreply` | addReplyToCommunityPost | 🔑 |

### 6.6 `/api/reviews` — `routes/reviewsRoute.js`

| Method | Path | Handler | Auth |
|---|---|---|---|
| GET | `/api/reviews/approved` | getApprovedReviews | 🌐 |
| GET | `/api/reviews/me` | getMyReview | 🔑 |
| POST | `/api/reviews/` | createReview | 🔑 |
| GET | `/api/reviews/admin` | listAdminReviews | 🛡️ |
| PATCH | `/api/reviews/admin/:id/{approve,reject}` | approve/rejectReview | 🛡️ |
| DELETE | `/api/reviews/admin/:id` | deleteReview | 🛡️ |

### 6.7 `/api/analytics` — `routes/analyticsRoute.js`

| Method | Path | Handler | Auth |
|---|---|---|---|
| POST | `/api/analytics/track` | trackVisit | 🌐 |
| GET | `/api/analytics/stats` | getAnalytics | 🛡️ |
| GET | `/api/analytics/logs` | getLogs (paginated + filters) | 🛡️ |
| GET | `/api/analytics/visitors` | getVisitors | 🛡️ |
| GET | `/api/analytics/visitor/:visitorId` | getVisitorJourney | 🛡️ |
| DELETE | `/api/analytics/logs` | deleteOldLogs (bulk, older-than-N-days) | 🛡️ |
| DELETE | `/api/analytics/logs/:id` | deleteLog (single entry) | 🛡️ |
| DELETE | `/api/analytics/visitor/:visitorId` | deleteVisitor (all of one visitor) | 🛡️ |

### 6.8 `/api/notifications` — `routes/notifications.js`

| Method | Path | Handler | Auth |
|---|---|---|---|
| POST | `/api/notifications/register` | registerToken | 🔑 |
| POST | `/api/notifications/unregister` | unregisterToken | 🔑 |
| GET | `/api/notifications/status` | tokenStatus | 🔑 |

### 6.9 `/api` (sitemap) — `routes/sitemap.js`

| Method | Path | Handler | Auth |
|---|---|---|---|
| GET | `/api/sitemap.xml` | serve sitemap | 🌐 |
| GET | `/api/updatesitemap` | regenerate sitemap | 🌐 |

### 6.10 `/api/autowrite` — `routes/autoWriteBlogs.js`

| Method | Path | Handler | Auth |
|---|---|---|---|
| GET | `/api/autowrite/nextblog` | generate next AI blog | 🛡️ |
| GET | `/api/autowrite/autopublish` | auto-publish job | 🛡️ |

Admin-only (whole router mounted behind `adminMiddleware`) — triggered from the admin
dashboard's "Write next AI blog". (Previously public job endpoints.)

---

## 7. Scheduled / non-HTTP backend functions

| Export | Type | Schedule | Source |
|---|---|---|---|
| `bloggerspacebackend2` | `onRequest(app)` | — | `server/app.js` (the whole Express app) |
| `dailyTrendingNotification` | `onSchedule` | every day 09:00 IST | `server/app.js` → `services/notifications.runNotificationCycle` |

---

## 8. Vercel usage & caching (cost reference)

The **frontend** runs on Vercel; the **backend** runs on Firebase Functions (separate
billing). The two Vercel meters that matter are **ISR Writes** (each cached page
re-generation) and **Fast Origin Transfer** (bytes shipped origin→CDN on every
non-cache-HIT). Migrating off Vercel: see [`bloggerspace-next/DEPLOYMENT.md`](bloggerspace-next/DEPLOYMENT.md).

### 8.1 Snapshot (last 30 days, as of 2026-06-04, Hobby plan)
| Meter | Usage | Limit | Status |
|---|---|---|---|
| ISR Writes | ~1,039,521 | 200,000 | was **5.2× over** (spike May 30–31) — addressed below |
| Fast Origin Transfer | 13.6 GB | 10 GB | was **1.36× over** — addressed below |
| Edge Requests | 239K | 1M | ok |
| ISR Reads | 360K | 1M | ok |

### 8.2 Caching model (route-segment ISR + on-demand revalidation)
Time-based windows are the cost lever. **They never delay edits** — the backend fires
on-demand `revalidatePath` (via `POST /api/revalidate`, §6.x) on publish/edit/discard/
follow/review, purging the affected page instantly. Windows only govern *untouched* pages.

| Route | Render | Window | Notes |
|---|---|---|---|
| `/blogs/[slug]` | ISR | **7d** | primary SEO surface (~2000 pages); edits purge on-demand |
| `/` (home) | ISR | **7d** | only the blog *count* is server-cached; profile card + recommended are client-rendered |
| `opengraph-image` (per blog) | ISR | **7d** | cached, served from CDN (was dynamic → regenerated per crawl) |
| `/user/[username]` | ISR (fetch) | 24h | first page; follow/edit purge on-demand |
| `sitemap.xml` | ISR (fetch) | 24h | auto-regenerates daily — **this is the live sitemap** Google crawls |
| `/blogs` (listing) | **dynamic** (`force-dynamic`) | — | reads `searchParams` (filters/search) → can't ISR; kept SSR for SEO; paginated (6/page) |

**Where windows live:** fetch-level ones (`PROFILE`, `SITEMAP`) are the single source of
truth in [`src/lib/constants/revalidate.ts`](bloggerspace-next/src/lib/constants/revalidate.ts).
Route-level ones (`BLOG_DETAIL`, `HOME`, `OG_IMAGE`) **must be literals** in their page files
(Next 16 rejects an imported constant for `export const revalidate`) — that file documents
them with a "⚠️ also set in …" pointer so they don't drift.

### 8.3 Optimizations applied (to bring meters in range)
- **A** — Removed `"/"` (home) from every backend `revalidate()` call → home no longer
  regenerates on every content action (was the main ongoing ISR-Write source).
- **B** — Removed per-publish `generateSitemap()` (the live sitemap auto-refreshes daily).
- **C** — Blog detail window 24h → 7d → ~7× fewer untouched-page regenerations.
- **E** — OG images cached 7d (were regenerating per social/crawler fetch → origin transfer).

### 8.4 On-demand revalidation flow
`backend action → server/utils/revalidate.js → POST /api/revalidate (x-revalidate-secret)
 → revalidatePath(...)`. Each caller purges only what changed (blog slug, author profile,
`/adminblogs`, `/reviews`) — **never `/`** anymore.

### 8.5 Analytics cost note
Visitor tracking (`POST /api/analytics/track`) hits the **backend** (Firebase + Mongo),
**not** Vercel — it does not affect ISR Writes or Origin Transfer. It has an admin master
switch: `AdminConfig.analyticsEnabled` (Settings → Analytics tab). `GET /api/analytics/config`
exposes the flag so the frontend skips tracking when off; the backend also guards within ~30s.

---

## 9. Cross-cutting behaviours (must-know)

Behaviours that span many routes. Full detail in **[ARCHITECTURE.md §4](ARCHITECTURE.md)**.

- **IST dates** — most models store IST baked into a UTC instant; frontend `formatDate` reads with
  `timeZone: "UTC"`. Analytics (`Visitor`/`VisitorLog`) are the only true-UTC dates.
- **Compressed content** — `Blog`/`Community` `content` is pako+base64; decompressed on read.
- **Deleted authors** — content stays live, `authorDetails` is nullable. Self-delete = `DELETED` +
  7-day TTL purge; admin delete orphans the blogs (`authorDetails:null`) + revalidates. Reads show
  "Anonymous" (`anonymiseDeletedAuthors`); **all author/reviewer emails route through
  `server/utils/notify.js` `notifyEmail()`**, which skips missing/deleted accounts.
- **Admin authorship** — admins live in the `admins` collection, so `viewBlogComments` resolves
  comment/reply authors against Users **and** Admins (admins → `isAdmin:true` / "Admin").
- **Live counters** — view count (`GET /api/blogs/:slug/views`) and follower count
  (`getFollowStatus.followersCount`) are client-fetched so they stay fresh on ISR pages with **no**
  Vercel ISR-Write/Origin cost.
- **On-demand revalidation** — content actions call `server/utils/revalidate.js` →
  `POST /api/revalidate` (`x-revalidate-secret`) → `revalidatePath`. Never purges `/`.
- **Web push** — FCM messages are **data-only**; the service worker renders exactly one
  notification (a `notification` block would duplicate).
- **Emails** — all wrapped by the branded template in `server/services/mailer.js`; author/reviewer
  recipients gated via `notify.js`. **Unsubscribe (+ `List-Unsubscribe` header) appears on the
  newsletter only** — token-signed links handled by `server/utils/unsubscribe.js` (§6.1).
- **Security** — **CORS is not the gate** (it only stops other browsers; curl/scripts bypass it) —
  the JWT auth middleware is. **Auth/OTP endpoints are rate-limited** (Mongo-backed, `rateLimit.js`:
  login/signup/OTP/password-reset across user/admin/reviewer); **public read endpoints are not**, so
  crawlers/SSR are unaffected. A global NoSQL-injection sanitiser strips `$`/`.` keys. `/api/logs`
  needs `LOGS_SECRET`; auto-write is admin-only. Full model: ARCHITECTURE.md §4.8.
