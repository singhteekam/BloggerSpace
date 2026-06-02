import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Crimson_Pro } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ReadingProgress } from "@/components/layout/reading-progress";
import { ChatWidget } from "@/components/chat/chat-widget";
import { TrackPageView } from "@/components/analytics/track-pageview";
import { PushListener } from "@/components/notifications/push-listener";
import { siteConfig } from "@/lib/constants/site";
import { websiteJsonLd, organizationJsonLd, personJsonLd } from "@/lib/utils/json-ld";
import { BASE_KEYWORDS } from "@/lib/seo/page-metadata";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Editorial serif — used for blog body, hero headlines, brand wordmark.
const crimsonPro = Crimson_Pro({
  variable: "--font-crimson-pro",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  other: {
    "google-adsense-account": "ca-pub-2867880443810811",
  },
  keywords: [...siteConfig.keywords, ...BASE_KEYWORDS],
  authors: [{ name: siteConfig.author.name, url: siteConfig.author.url }],
  creator: siteConfig.author.name,
  applicationName: siteConfig.name,
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/brand/logo128x128.png", type: "image/png", sizes: "128x128" }],
    shortcut: "/brand/logo128x128.png",
    apple: { url: "/brand/logo128x128.png", sizes: "128x128" },
  },
  // Note: og:image / twitter:image are supplied by the generated 1200×630 card
  // in app/opengraph-image.tsx (and per-blog cards), so no static image here.
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    // No `url` here on purpose — each page sets its own og:url/canonical via
    // pageMetadata(), so a shared sub-page never inherits and impersonates "/".
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    siteName: siteConfig.fullName,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    creator: "@" + siteConfig.author.name.replace(/\s+/g, ""),
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
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${crimsonPro.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()) }}
        />
        <Providers>
          <TrackPageView />
          <PushListener />
          <ReadingProgress />
          <Navbar />
          {children}
          <Footer />
          <ChatWidget />
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
