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

export const metadata: Metadata = {
  title: `${siteConfig.fullName} — ${siteConfig.tagline}`,
  description: siteConfig.description,
  alternates: { canonical: "/" },
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
