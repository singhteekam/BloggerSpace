# BloggerSpace — Agent / Onboarding Summary

Read this first. It's the 2-minute map so you (human or AI) can work without crawling the whole
repo. Deeper detail: **[ARCHITECTURE.md](ARCHITECTURE.md)** · routes: **[ROUTES.md](ROUTES.md)**.

## What it is
A human-reviewed blogging platform (MERN + Next.js). Authors write → reviewers vet → admins
publish. Plus gems rewards, community Q&A, push notifications, analytics, AI auto-writer.

## Two apps that matter (ignore `client/` — it's the retired CRA frontend)
- **`server/`** — Express API on **Firebase Functions** + **MongoDB/Mongoose**.
- **`bloggerspace-next/`** — **Next.js 16** (App Router) frontend on **Vercel**.
- The frontend never hits Mongo; it calls Express via typed axios modules in
  `bloggerspace-next/src/lib/api/*` (base URL `NEXT_PUBLIC_BACKEND_URL`).

## Find things fast
| Thing | Path |
|---|---|
| Router → handler map | `server/routes/*.js` (mounts in `server/app.js`); full map in ROUTES.md |
| Blog logic | `server/controllers/blogsController.js` |
| Admin / gems / scoring / team | `server/controllers/Admin/adminController.js` (largest file) |
| User auth/profile/delete | `server/controllers/userscontroller.js` |
| Data shapes | `server/models/*.js` (+ frontend `src/types/blog.ts`) |
| Frontend pages | `bloggerspace-next/src/app/**/page.tsx` (folder path = URL) |
| Frontend ↔ backend bridge | `bloggerspace-next/src/lib/api/*.ts` |
| UI components | `bloggerspace-next/src/components/{ui,blog,user,admin,editor,layout}` |
| Caching windows | `bloggerspace-next/src/lib/constants/revalidate.ts` + ROUTES.md §8 |
| Emails / template / unsubscribe | `server/services/mailer.js` (branded template) + `server/utils/notify.js` (recipient guard) + `server/utils/unsubscribe.js` (newsletter only) |
| Security (CORS, rate limit, sanitiser, gates) | `server/app.js` + `server/middlewares/rateLimit.js` (+ ARCHITECTURE.md §4.8) |

## Conventions that WILL bite you (read before editing)
1. **Dates are stored in IST**, not UTC (`now + 330min` baked into a UTC instant). Frontend formats
   with `timeZone: "UTC"` (`src/lib/utils/html.ts` `formatDate`). **Exception:** analytics
   (`Visitor`/`VisitorLog`) are true UTC.
2. **Blog/community `content` is pako+base64 compressed.** Decompressed on read.
3. **Admins are NOT in the `users` collection** (`admins` collection). So admin comment/reply ids
   don't populate from Users — `viewBlogComments` resolves authors against Users **then** Admins and
   labels admins `isAdmin:true`.
4. **Deleted authors:** content stays live; `Blog.authorDetails` is nullable. Self-delete →
   `status:"DELETED"` + 7-day TTL purge; admin delete → orphan blogs (`authorDetails:null`). Reads
   show "Anonymous" (`anonymiseDeletedAuthors`); **all author/reviewer emails go through
   `server/utils/notify.js` `notifyEmail()`** which skips missing/deleted accounts.
5. **Next.js 16 specifics:** `src/proxy.ts` IS the renamed `middleware.ts`; route-segment
   `export const revalidate` must be a **literal** (not an imported const).
6. **ISR + on-demand revalidate:** edits never wait for cache — backend calls
   `server/utils/revalidate.js` → Next `/api/revalidate`. Live counts (views/followers) are
   client-fetched from the backend so they're fresh with **zero** Vercel ISR cost.
7. **Web push is data-only** (SW renders one notification; a `notification` block would duplicate).
8. **CORS is NOT security.** It only stops other *websites*; curl/scripts bypass it. Auth middleware
   is the real gate. Auth/OTP endpoints are **rate-limited** (Mongo-backed, `rateLimit.js`); public
   read endpoints are **not** (crawlers/SSR welcome). A `$`/`.`-key NoSQL sanitiser runs globally.
   No captcha/App Check (would block crawlers). See ARCHITECTURE.md §4.8.

## Auth (3 actors, JWT)
`authenticate.js` (users, sets `req.userRole`/`req.query.userId`, gates DELETED/INACTIVE +
re-verify) · `adminMiddleware.js` (admins) · `reviewerMiddleware.js` (reviewers, role on `users`).
**A reviewer = a regular user + `/reviewer/dashboard`** — they log in via normal `/login` (token
carries `role:"reviewer"`, works for both middlewares); `/reviewer/{login,profile,settings,
changepassword}` are redirect stubs to the user pages. Step-down = Settings → "Request revoke".

## Verify before done
- Backend: `node -c <changed file>`.
- Frontend: `npx tsc --noEmit`, then `npx next build` (the build validates route config).
- Don't break working flows; author-email and deleted-user paths are easy to break — keep
  `notifyEmail()` / null-author guards intact.

## When you add an endpoint
Add the route (`server/routes/*`) → handler (`server/controllers/*`) → a method in the matching
`src/lib/api/*.ts` → **update ROUTES.md**. If you add a model/flow/convention, update
ARCHITECTURE.md too.
