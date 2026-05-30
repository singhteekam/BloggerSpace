export const siteConfig = {
  name: "BloggerSpace",
  fullName: "BloggerSpace by Teekam Singh",
  shortName: "BloggerSpace",
  tagline: "Write. Get reviewed. Get read.",
  description:
    "BloggerSpace by Teekam Singh — a blogging platform that pairs every post with a real reviewer before publish. A quieter corner of the internet for thoughtful writing on technology, careers, and ideas.",
  url: process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://singhteekam.in",
  ogImage: "/brand/og-default.png",
  author: {
    name: "Teekam Singh",
    url: process.env.NEXT_PUBLIC_PORTFOLIO_URL ?? "https://teekam.web.app",
    email: "singhteekam.in@gmail.com",
  },
  keywords: [
    "Teekam Singh",
    "singhteekam",
    "blog",
    "blogging platform",
    "tech blog",
    "writers",
    "community blog",
    "reviewed posts",
    "BloggerSpace",
    "full-stack developer",
  ],
  locale: "en_IN",
} as const;

export type SiteConfig = typeof siteConfig;
