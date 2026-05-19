# BloggerSpace

A full-stack blogging platform where every post is reviewed by a real human before it goes live. Writers submit drafts, reviewers give structured feedback, and admins publish — no bots, no AI scoring.

**Live site:** [bloggerspace.singhteekam.in](https://bloggerspace.singhteekam.in/)  
**Community:** [bloggerspace.singhteekam.in/community](https://bloggerspace.singhteekam.in/community)

> 150+ blogs already ranked on Google Search.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, Radix UI primitives, shadcn/ui |
| Editor | TipTap (ProseMirror) with rich extensions |
| AI | Google Gemini via Vercel AI SDK |
| State / Data | TanStack React Query, React Context |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (access + refresh tokens), Firebase Auth (Google OAuth), Email OTP |
| Email | Nodemailer |
| Storage | GitHub raw CDN for user-uploaded images |
| Deployment | Vercel (frontend), self-hosted VPS (backend) |
| Analytics | Vercel Analytics + Speed Insights |

---

## Features

### For Readers
- Browse all published blogs with category and tag filtering
- Full-text blog reading — rich formatting, code blocks, images, audio embeds, collapsible sections
- Save blogs to a personal reading list
- Real-time blog view count
- Like any blog (verified accounts only)
- Search published blogs
- Infinite-scroll blog grid with pagination
- Comment on published blogs
- View any user's public profile with their gems balance and scores
- Community discussion board with threaded replies

### For Writers
- Rich TipTap editor — headings, code blocks, images, links, tables, audio, collapsible sections, raw HTML, emoji picker
- Alignment and list controls via dropdown menus (single flex-wrap toolbar, no horizontal scrolling)
- AI-assisted content generation — enter a title and get a first draft
- Image upload via GitHub CDN or link by URL
- Find & replace within the editor
- Source (HTML) editing mode
- Preview before submitting
- Submit for human review; receive structured feedback via email
- Track every blog through its full lifecycle:
  `Draft → Pending Review → Under Review → Awaiting Revision → Published`
- Email notifications at each key stage
- Edit and resubmit after reviewer feedback
- **Earn gems** when a blog is approved by admin

### For Reviewers
- Dedicated dashboard with assigned blogs
- Inline content editing (title, category, tags, body)
- Star rating + written remarks before forwarding to admin
- Send revision requests directly back to the author
- Save review drafts; pick up later
- **Earn gems** for each completed review
- Public reviewer score visible on profile

### For Admins
- Publish or discard any user-submitted blog
- Assign blog scores and reviewer scores after each review cycle
- Write and publish admin-authored blogs directly (with draft support)
- Grant gems to users with appreciation notes; reverse grants within the allowed window
- Manage redemption requests — fulfil or reject, with automatic gem refund on rejection
- Approve or remove reviewer accounts
- Manage all registered users (soft-delete)
- Full visibility into every blog at every status stage
- Edit any blog before publishing
- Saved-blogs management dashboard
- Search across the admin dashboard

### Gems & Rewards
- **Authors** earn gems when their blog is published
- **Reviewers** earn gems for completed reviews
- **Admins** can grant bonus gems with a personalised note
- Gems balance and transaction history visible on every public profile
- **Redeem** gems for Amazon Pay or Flipkart gift cards
- One pending redemption request at a time (enforced by both UI and backend)
- Redemption history with PENDING / FULFILLED / REJECTED statuses

### AI Assistant — Sage
- In-page chat widget powered by Google Gemini
- Searches live blog data: by topic, category, tag, trending, or recent
- Renders results as clickable Markdown links with author and excerpt
- Rate-limited (15 requests / minute) to prevent abuse
- Suggested starter questions for new users

### Platform
- Sign up with email/password, Google (Firebase OAuth), or email OTP
- Email verification for new accounts
- Forgot password / reset password flow
- Change password and username from profile settings
- Delete account
- Follow and unfollow users
- Platform reviews — users can write and publish reviews visible on the homepage
- Writing guidelines page
- Privacy policy and Terms & Conditions pages
- Sitemap (`/sitemap.xml`)
- Fully responsive and mobile-friendly
- SEO-optimised (per-page metadata, Open Graph, JSON-LD structured data)
- Community posts — no review required, instantly published

---

## Folder Structure

```
MyBlogWebsite/
│
├── bloggerspace-next/       # ✅ Active frontend — Next.js 16 (App Router)
│   ├── public/              # Static assets (logo, user photos, OG images)
│   └── src/
│       ├── app/             # Pages, layouts, API routes (App Router)
│       │   ├── _sections/   # Homepage sections (hero, stats, gems, reviews, …)
│       │   ├── admin/       # Admin dashboard pages
│       │   ├── reviewer/    # Reviewer dashboard pages
│       │   └── api/         # Next.js route handlers (chat, image upload)
│       ├── components/      # UI — brand, layout, editor, blog, chat, admin, user, ui/
│       ├── contexts/        # Auth context
│       ├── data/            # Static JSON (categories, tags)
│       ├── hooks/           # Custom hooks (useAutoSave, useRequireAuth, …)
│       ├── lib/             # API clients, utilities, constants, JSON-LD, chat tools
│       └── types/           # TypeScript types
│
├── server/                  # Express.js + MongoDB backend (API)
│   ├── controllers/
│   │   ├── Admin/           # Admin + gems + redemption controllers
│   │   ├── Reviewer/
│   │   ├── blogsController.js
│   │   ├── communityController.js
│   │   ├── redemptionController.js
│   │   ├── reviewsController.js
│   │   └── userscontroller.js
│   ├── db/
│   ├── middlewares/         # Auth, role guards, logging
│   ├── models/              # Mongoose schemas (Blog, User, GemsTransaction, RedemptionRequest, Review, …)
│   ├── routes/
│   ├── services/
│   └── utils/               # Gems ledger, GitHub CDN upload, logging
│
├── client/                  # Legacy React frontend (replaced by bloggerspace-next)
│
├── package.json
└── README.md                # ← you are here
```

---

## Getting Started (Local Development)

### Prerequisites
- Node.js ≥ 20
- MongoDB (local or Atlas)

### 1 — Clone

```bash
git clone https://github.com/singhteekam/BloggerSpace.git
cd BloggerSpace
```

### 2 — Start the backend

```bash
cd server
npm install
npm run dev        # starts on http://localhost:5000
```

Create `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/bloggerspace

JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Firebase Admin SDK (Google OAuth)
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
```

### 3 — Start the frontend

```bash
cd bloggerspace-next
npm install
npm run dev        # starts on http://localhost:3000
```

Create `bloggerspace-next/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000

# Google Gemini (AI chatbot — Sage)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
```

---

## Deployment

### Frontend → Vercel
1. Push to GitHub.
2. Import `bloggerspace-next/` as the root directory in [vercel.com/new](https://vercel.com/new).
3. Set `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_FRONTEND_URL`, and `GOOGLE_GENERATIVE_AI_API_KEY` in Vercel environment variables.
4. Deploy — auto-deploys on every push to `main`.

### Backend → VPS / Railway / Render
Deploy the `server/` directory to any Node.js host with the `.env` variables above.

---

## Screenshots

![BloggerSpace Homepage](image.png)

---

## Developer

**Teekam Singh**  
[singhteekam.in](https://www.singhteekam.in/) · [GitHub](https://github.com/singhteekam) · [LinkedIn](https://in.linkedin.com/in/singhteekam)

---

## Contributing

Contributions, issues, and feature requests are welcome. Please try the site and share your feedback — it genuinely helps improve the platform.
