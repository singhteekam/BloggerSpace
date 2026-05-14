export const siteConfig = {
  name: "BloggerSpace",
  shortName: "BloggerSpace",
  tagline: "Write. Get reviewed. Get read.",
  description:
    "BloggerSpace pairs every post with a real reviewer before publish — a quieter corner of the internet for thoughtful writing on technology, careers, and ideas.",
  url: process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://bloggerspace.singhteekam.in",
  ogImage: "/brand/og-default.png",
  author: {
    name: "Teekam Singh",
    url: "https://singhteekam.in",
    email: "singhteekam.in@gmail.com",
  },
  keywords: [
    "blog",
    "blogging platform",
    "tech blog",
    "writers",
    "community blog",
    "reviewed posts",
    "BloggerSpace",
  ],
  locale: "en_IN",
} as const;

export type SiteConfig = typeof siteConfig;
