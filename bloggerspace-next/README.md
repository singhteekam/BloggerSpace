# BloggerSpace

A full-stack blogging platform where every post is reviewed by a real human before it goes live. Built with Next.js 16 (frontend) and Node.js + MongoDB (backend).

**Live site:** [bloggerspace.singhteekam.in](https://bloggerspace.singhteekam.in)

---

## Features

### For Readers
- Browse published blogs with category and tag filtering
- Full-text blog reading with rich formatting, code blocks, and images
- Save blogs to a personal reading list
- Community discussion board with threaded replies

### For Writers (any signed-up user)
- Rich TipTap editor with markdown, images, code blocks, and headings
- AI-assisted content generation (title → first draft)
- Auto-save drafts every 30 seconds
- Submit for human review; get structured feedback via email
- Track every blog through its review lifecycle (Draft → Pending → Under Review → Awaiting Revision → Published)

### For Reviewers
- Dedicated dashboard showing assigned blogs
- Inline content editing, category/tag correction
- Star rating + written remarks before forwarding to admin
- Send revision requests back to authors

### For Admins
- Publish or discard any blog; write admin-authored blogs directly
- Approve/remove reviewer accounts
- Manage all registered users (soft-delete)
- Full visibility into every blog at every status stage

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, Radix UI primitives |
| Editor | TipTap (ProseMirror) |
| State | React Query (TanStack), React Context |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (access + refresh tokens), Firebase Auth |
| Email | Nodemailer |
| Storage | GitHub raw CDN for user-uploaded images |
| Deployment | Vercel (frontend), self-hosted VPS (backend) |
| Analytics | Vercel Analytics + Speed Insights |

---

## Project Structure

```
MyBlogWebsite/
├── bloggerspace-next/   # Next.js 15 frontend (this directory)
│   ├── src/
│   │   ├── app/         # App Router pages and API routes
│   │   ├── components/  # UI components (brand, layout, editor, blog, etc.)
│   │   ├── contexts/    # Auth context
│   │   ├── hooks/       # Custom hooks (useAutoSave, useRequireAuth, etc.)
│   │   ├── lib/         # API clients, utilities, constants
│   │   └── types/       # TypeScript types
│   └── public/          # Static assets (logo, user photos, OG images)
│
└── server/              # Express.js + MongoDB backend
    ├── controllers/     # Route handlers (blogs, users, admin, reviewer, community)
    ├── middlewares/     # Auth, role guards, logging
    ├── models/          # Mongoose schemas
    └── routes/          # Express routers
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- MongoDB (local or Atlas)
- A running instance of the backend (`server/`)

### 1. Clone the repository

```bash
git clone https://github.com/singhteekam/BloggerSpace.git
cd BloggerSpace/bloggerspace-next
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the `bloggerspace-next/` directory:

```env
# Backend API base URL
NEXT_PUBLIC_API_URL=http://localhost:5000

# Frontend canonical URL (used for metadata and OG tags)
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> The backend must also be running. See `server/README.md` or the instructions below.

### 5. Start the backend (from project root)

```bash
cd server
npm install
npm run dev   # or: node app.js
```

---

## Backend Environment Variables

Create a `.env` file in the `server/` directory:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/bloggerspace

JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Nodemailer (for review notifications and password reset)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Firebase Admin SDK (optional — for OAuth)
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
```

---

## Deployment

### Frontend — Vercel

1. Push this repository to GitHub.
2. Import the project in [Vercel](https://vercel.com/new).
3. Set **Root Directory** to `bloggerspace-next`.
4. Add the environment variables (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_FRONTEND_URL`).
5. Deploy — Vercel handles builds automatically on every push to `main`.

### Backend — VPS / Railway / Render

Deploy the `server/` directory to any Node.js host. Set the environment variables listed above and ensure MongoDB is accessible.

---

## Key Pages & Routes

| Route | Description |
|---|---|
| `/` | Landing page with hero, stats, testimonials |
| `/blogs` | All published blogs with category/tag filter |
| `/blogs/[slug]` | Single blog post |
| `/community` | Community discussion board |
| `/community/new` | Create a new discussion post |
| `/newblog` | Blog editor (create / edit) |
| `/myblogs` | Writer's own blogs by status |
| `/savedblogs` | Reader's saved blogs |
| `/reviewer` | Reviewer dashboard |
| `/reviewer/blog/[id]` | Review and edit a specific blog |
| `/admin/dashboard` | Admin overview |
| `/admin/manage/blogs` | Admin blog management |
| `/admin/manage/team` | Reviewer and user management |
| `/admin/adminblogs/write` | Admin writes a blog directly |

---

## Developer

**Teekam Singh** — [singhteekam.in](https://www.singhteekam.in) · [GitHub](https://github.com/singhteekam) · [LinkedIn](https://in.linkedin.com/in/singhteekam)

---

## License

MIT — feel free to fork, learn from, or build on this project. A star on GitHub is appreciated!
