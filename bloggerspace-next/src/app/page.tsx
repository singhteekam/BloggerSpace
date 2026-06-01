import type { Metadata } from "next";
import { fetchBlogs } from "@/lib/api/blogs";
import { siteConfig } from "@/lib/constants/site";
import { PersonalIntroSection } from "./_sections/personal-intro-section";
import { HeroSection } from "./_sections/hero-section";
import { StatsSection } from "./_sections/stats-section";
import { HowItWorksSection } from "./_sections/how-it-works-section";
import { WhatYouCanDoSection } from "./_sections/what-you-can-do-section";
import { GemsSection } from "./_sections/gems-section";
import { ReviewsSection } from "./_sections/reviews-section";
import { fetchApprovedReviews } from "@/lib/api/reviews";
import { TechStackSection } from "./_sections/tech-stack-section";
import { DeveloperSection } from "./_sections/developer-section";
import { ContactSection } from "./_sections/contact-section";
import { RecommendedSection } from "./_sections/recommended-section";

const shareTitle = `${siteConfig.fullName} — ${siteConfig.tagline}`;
const shareDescription =
  "A blogging platform where every post is reviewed by a real person before it goes live. Thoughtful writing on technology, careers, and ideas.";

export const metadata: Metadata = {
  title: shareTitle,
  description: shareDescription,
  alternates: { canonical: "/" },
  // Explicit social tags so shared links (WhatsApp/X/LinkedIn) always show the
  // site name + a short description + the generated card — not just a bare link.
  openGraph: {
    title: shareTitle,
    description: shareDescription,
    type: "website",
    url: siteConfig.url,
    siteName: siteConfig.fullName,
  },
  twitter: {
    card: "summary_large_image",
    title: shareTitle,
    description: shareDescription,
  },
};

export default async function Home() {
  let totalBlogs = 0;
  try {
    const { total } = await fetchBlogs(1);
    totalBlogs = total;
  } catch {
    totalBlogs = 0;
  }

  const { reviews, total: reviewsTotal } = await fetchApprovedReviews(1, 9);

  return (
    <main className="relative isolate overflow-hidden bg-background">
      <HeroSection totalBlogs={totalBlogs} />
      <PersonalIntroSection />
      <StatsSection totalBlogs={totalBlogs} />
      <RecommendedSection />
      <HowItWorksSection />
      <WhatYouCanDoSection />
      <GemsSection />
      <ReviewsSection reviews={reviews} total={reviewsTotal} />
      <TechStackSection />
      <DeveloperSection />
      <ContactSection />
    </main>
  );
}
