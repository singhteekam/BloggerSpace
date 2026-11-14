# BloggerSpace — Architecture & Code Guide

The complete reference for how this project is built: structure, data models, the major
flows, and the conventions that aren't obvious from the code. Pair this with:

- **[ROUTES.md](ROUTES.md)** — every frontend page ↔ backend endpoint mapping + caching/cost notes.
- **[AGENTS.md](AGENTS.md)** — a short, scannable onboarding map (for humans or AI agents).
- **[bloggerspace-next/DEPLOYMENT.md](bloggerspace-next/DEPLOYMENT.md)** — hosting / migration off Vercel.

> **Keep this current.** When you add a model, a major flow, or change a convention, update the
> relevant section here and the route tables in ROUTES.md. These files are meant to be edited.

---

## 1. What this is

BloggerSpace is a **human-reviewed blogging platform**: authors write posts, reviewers vet them,
admins publish them, and readers comment/like/follow. It has a gems reward economy, a community
Q&A area, push notifications, analytics, and an AI auto-writer.

**Stack (MERN + Next.js):**

| Layer | Tech | Lives in | Runs on |
|---|---|---|---|
| Frontend | **Next.js 16** (App Router) · React 19 · TypeScript · Tailwind v4 · Radix UI · React Query · TipTap | `bloggerspace-next/` | **Vercel** |
| Backend | **Express 4** on **Firebase Functions** (gen 2 / Cloud Run) | `server/` | **Firebase** |
| Database | **MongoDB** via Mongoose 7 | models in `server/models/` | MongoDB Atlas |
| Legacy | The original **CRA React** app (being retired) | `client/` | — (reference only) |

The frontend never talks to MongoDB. It calls the Express API through typed axios modules
(`bloggerspace-next/src/lib/api/*`). Base URL = `NEXT_PUBLIC_BACKEND_URL`.

---

## 2. Repository layout (top level)

```
MyBlogWebsite/
├─ server/                # Express + Firebase Functions backend (the API)
├─ bloggerspace-next/     # Next.js 16 frontend (the live site)
├─ client/                # LEGACY CRA React app — being replaced; do not extend
├─ ROUTES.md              # Page ↔ endpoint map + caching/cost reference
├─ ARCHITECTURE.md        # ← this file
├─ AGENTS.md              # AI/human onboarding summary
├─ STRUCTURE.md           # Legacy route table (superseded by ROUTES.md)
└─ README.md              # Quick start + doc index
```

> The active product is **`server/` + `bloggerspace-next/`**. `client/` is the old frontend kept
> for reference during the migration — don't add features there.

---

## 3. Backend (`server/`)

### 3.1 Entry point & request lifecycle (`server/app.js`)
- Builds the Express `app`, configures CORS / body parsers (10 MB limit) / cookies / session
  (`connect-mongo`) / passport (OAuth).
- Mounts every router under its base path (see [ROUTES.md §2](ROUTES.md)).
- **Two exports** (this is a Firebase Functions app, not a long-running server):
  - `bloggerspacebackend2 = onRequest({ memory: "512MiB" }, app)` — the whole API.
  - `dailyTrendingNotification = onSchedule(...)` — daily 09:00 IST trending-digest push.
- **DB connect is gated**: `connectDB()` only runs in the Cloud runtime (`K_SERVICE`/emulator) or
  when the file is run directly (`require.main === module`). This keeps deploy-time "backend
  spec" analysis fast (a past source of `Timeout after 10000` deploy failures).
- Local dev: `npm start` runs `app.listen` on `PORT` (default 8191); on Firebase, `onRequest`
  serves it — there is no `app.listen` at import time.

### 3.2 Folder structure
```
server/
├─ app.js                 # entry, router mounts, Firebase exports
├─ db/db.js               # mongoose.connect (gated)
├─ routes/                # thin routers: path → middleware → controller
│  ├─ users.js, blogs.js, community.js, reviewsRoute.js, analyticsRoute.js,
│  │  notifications.js, sitemap.js, autoWriteBlogs.js
│  ├─ Admin/adminRoute.js
│  └─ Reviewer/reviewerRoute.js
├─ controllers/           # business logic (one file per domain)
│  ├─ userscontroller.js, blogsController.js, communityController.js,
│  │  reviewsController.js, analyticsController.js, notificationController.js,
│  │  redemptionController.js
│  ├─ Admin/adminController.js, Admin/adminConfigController.js
│  └─ Reviewer/reviewerController.js
├─ models/                # Mongoose schemas (see §3.5)
├─ middlewares/           # authenticate.js, adminMiddleware.js, reviewerMiddleware.js, rateLimit.js
├─ services/              # mailer.js (nodemailer), notifications.js (FCM), passportAuth.js
├─ utils/                 # cross-cutting helpers (see §3.6)
├─ config/                # gsheets service account (auto-write)
└─ assets/                # logo served at /assets
```

### 3.3 Auth model (3 actor types, JWT-based)
The middleware in `server/middlewares/` decodes a `Bearer` token and sets `req.query.userId`
(the actor id) + `req.userRole`. There is **no longer** a `?userId=` query bypass.

| Actor | Middleware | Token source | Collection | Notes |
|---|---|---|---|---|
| **User** | `authenticate.js` | `CURRENT_JWT_SECRET` (unified), legacy `JWT_SECRET` fallback | `users` | Also enforces the **account gate**: rejects `DELETED`/`INACTIVE` accounts and triggers **periodic re-verification** (`reverificationPeriodDays`, email-auth users only). |
| **Admin** | `adminMiddleware.js` | `CURRENT_JWT_SECRET` (role `Admin`) | `admins` (separate!) | Admins are **not** in the `users` collection — important for comment authorship (see §4.4). |
| **Reviewer** | `reviewerMiddleware.js` | the **same** user JWT (login issues `role: user.role`, so a reviewer's token has `role:"reviewer"`) | `users` (role `reviewer`) | **A reviewer = a regular user + the review dashboard.** They log in via the normal `/login`; their token passes both `authenticate` and `reviewerMiddleware`. The only reviewer-specific page is `/reviewer/dashboard` (+ the review editor `/reviewer/blog/[id]`); `/reviewer/{login,profile,settings,changepassword}` are redirect stubs → the user pages. To step down they use **Settings → Request revoke** (emails the admin, who removes the role from Team management). |

`authenticate.js` is the single place that knows "this Bearer token belongs to an Admin" — it sets
`req.userRole = "Admin"`, which is how `isAdminComment` / `isAdminReply` get stamped.

### 3.4 Controllers (where the logic is)
Routers are thin; all behaviour lives in controllers. Largest/most important:

- **`blogsController.js`** — blog CRUD, listing/search/recommended, the **author MyBlogs** lists,
  comments + replies + likes, view counter (`addBlogViewsCounter`) and live read (`getBlogViews`).
  `viewBlogComments` resolves comment/reply authors against **both** Users and Admins (§4.4).
- **`Admin/adminController.js`** — the biggest file: review queues, assign/publish/discard,
  admin-authored blogs, **gems** (award/update/grant/reverse), **scoring** (`setBlogScore`,
  `setReviewerScore`), team management (list/approve/reactivate/**delete**), community moderation,
  newsletter, reports (exceljs/pdfkit, lazy-loaded), user-profile content.
- **`Admin/adminConfigController.js`** — read/update `AdminConfig` (platform settings).
- **`userscontroller.js`** — signup/login/OTP/OAuth/password, profile, saved blogs, follow,
  reading history, **self-delete** (`status:"DELETED"` + 7-day TTL), gems history, redemptions.
- **`Reviewer/reviewerController.js`** — reviewer apply/login, review queues, edit/feedback/discard.
- **`communityController.js`**, **`reviewsController.js`**, **`analyticsController.js`**,
  **`redemptionController.js`**, **`notificationController.js`** — their respective domains.

### 3.5 Data model (`server/models/`)
Mongoose 7. **Content (blogs, community) outlives the author account** — author refs are nullable
and every read/notify path must treat them as optional (§4.3).

| Model | Purpose | Key fields / notes |
|---|---|---|
| **User** | readers, authors, reviewers | `email`, `authType` (Email/Google/Github), `isVerified`, `status` (`ACTIVE`/`INACTIVE`/`DELETED`), `role` (`user`/`reviewer`), `reviewerStatus`, `savedBlogs`, `followers`/`following`, `gems`, `creatorScore`, `reviewerScore{Avg,Count,Best}`, `bio`/`socialLinks`, `newsletterOptIn`, `readingHistory`, OTP + `lastVerifiedAt`/`reverify*`, `profilePicture`, `deletedAt` (**TTL index: purges 7 days after set**). Dates stored **IST** (§4.1). |
| **Blog** | the posts | `slug` (unique key), `blogId` (numeric), `title`, `category`, `tags[]`, `content` (**pako+base64 compressed**, §4.2), `authorDetails` (ref `users`, **optional**), `status` (DRAFT → PENDING_REVIEW → UNDER_REVIEW ↔ AWAITING_AUTHOR → PUBLISHED/ADMIN_PUBLISHED, or DISCARD_QUEUE/ADMIN_DISCARDED), `blogViews`, `blogLikes[]`, `comments[]` (Comment schema), `reviewedBy[]`, `feedbackToAuthor[]`, `gems{authorGems,reviewerAwards[],awarded,...}`, `blogScore`, `digestNotifiedAt`. Indexed on `(status,lastUpdatedAt)`, `(authorDetails,status,...)`. |
| **Comment** (`Comment.js`) | blog comments (embedded in Blog) | `commentSchema`: `content`, `user` (ref), `isAdminComment`, `commentLikes[]`, `commentReplies[]`. `replyCommentSchema`: `replyCommentContent`, `replyCommentUser` (ref), **`isAdminReply`**, `commentLikes[]`. |
| **Community** | community Q&A posts | compressed content; `communityPostComments[]` → each has `replyCommunityPostComments[]` → each has `nestedReplyCommunityPostComments[]` (2 reply levels). |
| **Admin** | admin accounts (separate auth) | OTP login; **not** in `users`. |
| **Reviewer** | legacy reviewer accounts | migrated into `users` (role `reviewer`); kept for back-compat. |
| **AdminConfig** | single platform-settings doc | gems caps, blog/reviewer score caps, maintenance mode, **notifications** (`notificationsEnabled`, `notificationFrequencyDays`, `trendingBlogCount` 1–10, `trendingWindowDays`), **`analyticsEnabled`**, `reverificationPeriodDays`, gem-grant reversal window. |
| **GemsTransaction** | the gems **ledger** | `type` (AWARD/DEDUCT/ADMIN_GRANT/ADMIN_GRANT_REVERSE/REDEMPTION/REDEMPTION_REFUND), `role`, `amount`, `blogId`, `awardedBy`. Source of truth for gem history. |
| **RedemptionRequest** | gems → gift-card payout | `status` (PENDING/FULFILLED/REJECTED), `method`, `valueInPaise`, refund txn link. |
| **Review** | site testimonials | approved/pending; shown on `/reviews`. |
| **ReviewScore** | per-blog reviewer quality scores | drives `User.reviewerScore*`. |
| **Newsletter** / **NotificationLog** | sent newsletters / push digests audit | — |
| **FcmToken** | web-push subscriptions | one per browser/device, `unique` token, upserted; pruned when FCM reports invalid. |
| **Visitor** / **VisitorLog** | analytics | **timestamps are true UTC** (`Date.now`) — the *only* models not on IST. |

### 3.6 Utilities (`server/utils/`) — the cross-cutting glue
- **`notify.js`** → `notifyEmail(userDoc)` — returns an address or `null` when the recipient is
  missing/`DELETED`/scrubbed. **Every author/reviewer notification email is gated through this** so
  we never email a closed account and never crash on a null author.
- **`revalidate.js`** → `revalidate({ slug, username, paths })` — POSTs to the Next.js
  `/api/revalidate` route (with `REVALIDATE_SECRET`) to purge ISR pages on demand.
- **`gemsLedger.js`** → atomic `awardGems`/`deductGems` (writes `GemsTransaction` + updates balance).
- **`checkBlogDuplicate.js`** — title/slug uniqueness guard (slug is the authoritative key).
- **`unsubscribe.js`** — HMAC-signed newsletter unsubscribe/resubscribe links (no login needed)
  + the confirmation page. Wired into the newsletter footer & `List-Unsubscribe` header. **Only
  marketing (newsletter) emails carry unsubscribe — transactional emails never do.**
- **`generateSitemap.js`**, **`uploadImageToGitHub.js`/`uploadToGitHub.js`** (image hosting),
  `forgotPassword.js`/`resetPassword.js`/`changeAccountPassword.js`, `validateUsername.js`,
  `migrateReviewers.js`, `discardBlog.js`, `Logging/logs.js` (winston).

### 3.7 Services (`server/services/`)
- **`mailer.js`** — nodemailer transport + the branded responsive **email template**
  (`sendEmail(to, subject, html, attachments?, opts?)`). `opts` = `{ preheader, unsubscribeUrl,
  headers }`; the footer unsubscribe link renders only when `unsubscribeUrl` is passed (newsletter).
- **`notifications.js`** — FCM trending-digest engine. `runNotificationCycle()` (frequency-gated)
  picks unsent trending blogs, sends a **data-only** multicast (so the SW renders exactly one
  notification — see §4.6), prunes dead tokens, logs to `NotificationLog`.
- **`passportAuth.js`** — Google/GitHub OAuth strategies.

---

## 4. Cross-cutting conventions & gotchas
These are the non-obvious rules that will bite you if you don't know them.

### 4.1 Dates are stored in **IST**, not UTC
Almost every model stores `new Date(Date.now() + 330*60000)` — i.e. **IST wall-clock baked into a
UTC instant**. So a stored value's *UTC components* already are the intended IST time.
- **Frontend** must format with `timeZone: "UTC"` to avoid double-shifting — see
  `bloggerspace-next/src/lib/utils/html.ts` `formatDate()`.
- **Exception:** `Visitor`/`VisitorLog` (analytics) use **true UTC**; the analytics page formats
  those with `timeZone: "Asia/Kolkata"`. Don't route analytics dates through `formatDate`.

### 4.2 Blog/community content is **compressed**
`content` is `pako.deflate` → base64. Backend decompresses on read; the API returns plain HTML to
the frontend, which renders it via `dangerouslySetInnerHTML` (class `blog-prose`). `htmlToText()`
only works on already-decompressed HTML (it returns `""` if it sees no `<`).

### 4.3 Deleted authors — content stays, the pointer is made safe
A blog/comment can outlive its author. Two deletion paths:
- **Self-delete** (`/bloggerspace/settings`): `status:"DELETED"` + `deletedAt` → a **TTL index purges
  the user doc 7 days later**. Blog pages are revalidated immediately so the name shows "Anonymous".
- **Admin delete** (Team management): hard-delete, then **orphans the blogs**
  (`authorDetails: null`) + reassigns under-review blogs + **revalidates** their pages.

Safety nets so nothing breaks when an author is gone:
- **Reads:** `anonymiseDeletedAuthors()` (listings) and an inline check (single blog) null a
  `DELETED` author → UI renders "Anonymous" (non-clickable). A purged author is already `null`.
- **Writes/notifies:** `notifyEmail()` (§3.6) skips missing/deleted recipients; the gem/score
  functions guard `if (blog.authorDetails)`. `Blog.authorDetails` is **not** `required`, so `null`
  is valid. *Chosen direction:* keep a scrubbed "tombstone" rather than dangling refs.

### 4.4 Admins aren't Users → comment/reply authorship
Admins live in the `admins` collection, so an admin's comment/reply id never populates from
`users`. `viewBlogComments` therefore resolves every author against **Users first, then Admins**
(leftover ids), labelling admin authorship `isAdmin: true` → rendered as **"Admin"**. This works
**with or without** the `isAdminComment`/`isAdminReply` flags, so old admin replies show too. The
frontend re-fetches comments after posting (so a fresh admin reply appears immediately).

### 4.5 ISR caching + on-demand revalidation (cost control)
Blog/home/OG pages are ISR-cached (7 days); `/blogs` listing is `force-dynamic` (reads
searchParams). Edits never wait for the cache — backend actions call `revalidate()` to purge the
exact pages that changed. **Live counters** (views, followers) are client-fetched from the backend
(`/api/blogs/:slug/views`, `getFollowStatus.followersCount`) so they're always fresh **without**
adding Vercel ISR-Write / Origin-Transfer cost. Full detail + the central window config
(`src/lib/constants/revalidate.ts`) is in **[ROUTES.md §8](ROUTES.md)**.

### 4.6 Web push is **data-only**
FCM messages carry no `notification` block — only `data`. The service worker
(`bloggerspace-next/public/firebase-messaging-sw.js`) renders exactly one notification from `data`
and owns the click target. (A `notification` block would be auto-shown **and** trigger the SW =
duplicate notifications.) The digest count is `AdminConfig.trendingBlogCount` (1–10).

### 4.7 Social/OG cache
After editing a blog, your server serves fresh OG tags immediately (on-demand revalidate), but
**Facebook/WhatsApp cache OG data for days**. To refresh: re-scrape via the Facebook Sharing
Debugger, or POST `graph.facebook.com/?id=<url>&scrape=true` on publish/edit (see chat notes).

### 4.8 Security model
**CORS is NOT a security boundary.** The allow-list in `app.js` only stops a *browser* on another
site from reading our responses; it does **not** stop anyone calling the API. curl/Postman/scripts
send no `Origin` (and are allowed, for SSR), so they bypass CORS entirely. **The real gate is the
JWT auth middleware** (`authenticate`/`adminMiddleware`/`reviewerMiddleware`) on each route, plus:

- **Rate limiting** — `server/middlewares/rateLimit.js`: a **Mongo-backed** limiter (consistent
  across Firebase's many instances, unlike in-memory). Applied **only to auth/OTP endpoints**
  (user + admin + reviewer login, signup, OTP send/verify, password reset). `otpLimiter` = 6 / 15 min
  per IP (email senders), `authLimiter` = 30 / 15 min. **Fails open** if Mongo errors (never locks
  out real users). **Public content/read endpoints are NOT limited** — bots, crawlers & SSR read
  freely. Requires `app.set("trust proxy", true)` so the real client IP is seen.
- **NoSQL-injection sanitiser** — strips `$`/`.` keys from request bodies & queries (blocks operator
  injection like `{"email":{"$ne":null}}`). Dependency-free, runs before all routes.
- **No mass assignment** — controllers destructure named fields; no `req.body` is spread into a
  `findByIdAndUpdate`/`new Model()` (so a client can't set `role`/`gems`/`status`/`isVerified`).
- **Secret-gated internal endpoints** — `/api/logs` requires `LOGS_SECRET` (fails closed). The
  AI **auto-write** job (`/api/autowrite/*`) is **admin-only** (`adminMiddleware`) — triggered solely
  from the admin dashboard's "Write next AI blog".
- **Hardened session cookie** — `Secure` (cloud), `httpOnly`, `sameSite: lax`.
- **Central error handler** — CORS rejections → clean `403`; stack traces never leak to clients.
- **Deliberately NOT used:** captcha / Firebase App Check — they'd block crawlers + SSR (server-side
  fetches can't mint App Check tokens), and this is a public blog where bots/crawlers are welcome.
- Other defenses: Helmet (security headers), 10 MB body limits, HTTPS (Firebase), gated DB connect.

---

## 5. Frontend (`bloggerspace-next/`)

### 5.1 This is **Next.js 16** — read before coding
Breaking changes from older Next. Notably:
- **`src/proxy.ts`** is the renamed `middleware.ts` (maintenance gate, route guards).
- **Route-segment config must be a literal** — `export const revalidate = 604800` (you cannot use
  an imported constant). Fetch-level `next: { revalidate }` *can* use a constant.
- See `bloggerspace-next/AGENTS.md` and the in-repo docs note before changing caching/config.

### 5.2 App Router structure (`src/app/`)
The folder path *is* the URL; `[param]` = dynamic segment; `page.tsx` = a page; `route.ts` = a
Next server endpoint; `layout.tsx`/`loading.tsx`/`opengraph-image.tsx`/`sitemap.ts`/`robots.ts` are
framework files. Area breakdown (full URL↔endpoint map in [ROUTES.md §3](ROUTES.md)):

| Area | Folder | Audience |
|---|---|---|
| Public / marketing | `app/` (`page.tsx`, `blogs`, `community`, `reviews`, `user/[username]`, `about*`, policies) | 🌐 everyone |
| Auth | `app/{login,signup,verify-otp,forgotpassword,resetpassword,reverify,auth-success}` | 🌐 |
| Logged-in user | `app/bloggerspace/{myblogs,newblog,saved,profile,settings,security,apply-reviewer,community/new}` | 🔑 user |
| Reviewer panel | `app/reviewer/{dashboard,blog/[id],profile,settings,...}` | 📝 reviewer |
| Admin panel | `app/admin/{dashboard,manage/*,analytics,newsletter,redemptions,reviews,gems,settings,adminblogs/*,blogs/edit/[id],...}` | 🛡️ admin |
| Next server endpoints | `app/api/{chat,revalidate,savedblogs,upload/image}/route.ts` | — |

### 5.3 The API client layer (`src/lib/api/`) — the only bridge to the backend
Pages/components **never** call the backend directly. They use typed axios modules; `client.ts`
holds the axios instance (base = `NEXT_PUBLIC_BACKEND_URL`, attaches the auth token, handles 401).

| Module | Domain |
|---|---|
| `client.ts` | axios base instance (auth header, 401 redirect) |
| `auth.ts` + `auth-storage.ts` | login/signup/OTP/OAuth + token storage |
| `user.ts` | profile, saved, myblogs, reading history, follow (+ `getFollowStatus` → `followersCount`), gems/redemptions |
| `blogs.ts` | listing, blog view, homepage (SSR fetches) |
| `blog-write.ts` | new/edit blog, slug-uniqueness, AI generate |
| `interactions.ts` | comments, replies, likes (blog detail page) |
| `community.ts`, `reviews.ts`, `reviewer.ts`, `admin.ts`, `analytics.ts` | their domains |
| `interaction-cache.ts` | localStorage seed for like/follow state (instant UI) |

When you add a backend endpoint: add a method here **and** update ROUTES.md.

### 5.4 Components (`src/components/`)
- `ui/` — Radix + Tailwind primitives (shadcn-style): button, dialog, input, tabs, popover, etc.
- `blog/` — `blog-card`, `comments-section`, `blog-actions` (like/save), `live-view-count`,
  `category-combobox` + `tags-input` (**shared** searchable inputs with keyboard nav, used by every
  editor), `title-availability`, `blog-sidebar`, `reviewer-notes`.
- `user/` — `follow-button`, `live-follower-count`, `user-avatar`, reading-history, redemption,
  push-notification-toggle.
- `admin/` — gems/score/reviewer-score dialogs, notification settings, review-history timeline.
- `editor/` — `tiptap-editor` + custom `extensions/` (raw-html, audio, details).
- `layout/` (navbar/footer/mobile-nav/reading-progress/theme-toggle), `providers/` (React Query +
  theme), `analytics/`, `notifications/`, `chat/` (AI widget), `animated/`, `brand/`, `icons/`.

### 5.5 Hooks, contexts, lib
- `contexts/auth-context.tsx` — current user/session; `hooks/use-require-{auth,admin,reviewer}.ts`
  gate protected pages; `use-autosave`, `use-debounce`, `use-admin-config`.
- `lib/constants/` — `site`, `seo`, `nav`, `routes`, `theme`, `home`, **`revalidate`** (cache windows).
- `lib/utils/` — `html` (`formatDate` w/ UTC, `htmlToText`, `wrapTables`, `readingTime`), `cn`,
  `json-ld`, `blogCategories` (reads `data/*.json`), `profile-pic`.
- `lib/seo/page-metadata.ts`, `lib/firebase/messaging.ts` (web push client), `lib/chat/tools.ts`.
- `types/blog.ts` — shared blog/comment/reply TS types. `data/blogCategory.json` + `blogTags.json`
  are the single source for categories/tags.

### 5.6 Editor & content
TipTap-based rich editor (`editor/tiptap-editor.tsx`) with tables, code blocks (lowlight), images,
YouTube/audio embeds, and a raw-HTML block. Output HTML is what gets compressed and stored. Rendered
back through the `.blog-prose` styles in `src/app/globals.css` (which also handle long-URL wrapping,
table scroll, code blocks).

---

## 6. Key end-to-end flows

**Blog lifecycle:** author writes (`/bloggerspace/newblog`) → `DRAFT`/`PENDING_REVIEW` → admin
assigns a reviewer → `UNDER_REVIEW` → reviewer approves or sends feedback (`AWAITING_AUTHOR`) →
admin publishes (`saveEditedInReviewBlog`) → `PUBLISHED`. Admin can award gems + score. Each step
revalidates the affected pages and emails the author **via `notifyEmail()`**.

**Auth:** email+password or Google/GitHub OAuth → JWT (`CURRENT_JWT_SECRET`). `authenticate.js`
gates every protected call (rejects DELETED/INACTIVE, enforces periodic re-verification).

**Gems:** admin awards/grants gems → `gemsLedger` writes a `GemsTransaction` + updates
`User.gems`. Users redeem gems → `RedemptionRequest` → admin fulfils/rejects (refunds via ledger).

**Comments:** posted via `interactions.ts` → embedded in `Blog.comments`. Read via
`viewBlogComments` which resolves authors against Users **and** Admins (§4.4). Admin can moderate
(delete comment/reply) inline.

**Push digest:** `dailyTrendingNotification` (09:00 IST) → `runNotificationCycle()` → data-only FCM
multicast → SW renders one notification linking to the blog/listing.

---

## 7. Environment & deployment

**Backend env (`server/.env`):** `MONGODB_URI`, `CURRENT_JWT_SECRET` (+ legacy `JWT_SECRET`),
`EMAIL`/mailer creds, OAuth client ids/secrets, `FRONTEND_URL`, `REVIEWER_PANEL_URL`,
`REVALIDATE_SECRET`, GitHub image-upload token, Google GenAI key, GSheets service account.
**Deploy:** `cd server && npm run deploy` (Firebase Functions: `bloggerspacebackend2` +
`dailyTrendingNotification`).

**Frontend env (`bloggerspace-next/.env`):** `NEXT_PUBLIC_BACKEND_URL`, `REVALIDATE_SECRET`,
`NEXT_PUBLIC_FIREBASE_*` + `NEXT_PUBLIC_FIREBASE_VAPID_KEY` (web push), AI/chat keys.
**Deploy:** push to Vercel (or self-host per `DEPLOYMENT.md`). `npm run dev` for local.

**Verification before committing:** backend `node -c <file>`; frontend `npx tsc --noEmit` and
`npx next build` (the build is the authority — it validates route-segment config).

---

## 8. "Where do I look for…?" quick index

| I want to… | Go to |
|---|---|
| Add/learn a route | [ROUTES.md](ROUTES.md) → add to a `routes/*.js` + the matching `src/lib/api/*` |
| Change blog logic | `server/controllers/blogsController.js` |
| Change admin/gems/score/team | `server/controllers/Admin/adminController.js` |
| Change a data shape | `server/models/*.js` (+ `src/types/blog.ts` if blog-related) |
| Touch caching / ISR | `src/lib/constants/revalidate.ts` + ROUTES.md §8 |
| Send/guard an email | `server/services/mailer.js` + `server/utils/notify.js` |
| Push notifications | `server/services/notifications.js` + `public/firebase-messaging-sw.js` |
| Editor behaviour | `src/components/editor/` |
| Category/tag options | `src/data/blogCategory.json` / `blogTags.json` |
| Auth gating | `server/middlewares/*` + `src/hooks/use-require-*` + `src/contexts/auth-context.tsx` |
| Deleted-user behaviour | §4.3 + `anonymiseDeletedAuthors` + `notify.js` + delete handlers |
