import { siteConfig } from "@/lib/constants/site";

export const seoDefaults = {
  twitter: {
    card: "summary_large_image",
    creator: "@bloggerspace",
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
} as const;
