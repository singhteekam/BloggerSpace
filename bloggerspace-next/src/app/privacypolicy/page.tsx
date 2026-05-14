import type { Metadata } from "next";
import { Separator } from "@/components/ui/separator";
import { FadeIn } from "@/components/animated/fade-in";
import { siteConfig } from "@/lib/constants/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${siteConfig.name} collects, uses, and protects your personal data.`,
};

const LAST_UPDATED = "1 May 2025";

const SECTIONS = [
  {
    title: "1. Information we collect",
    body: `When you create an account, we collect your name, email address, and a password (stored as a salted hash — we never see your plain-text password). When you write a post, we store the content, metadata (title, tags, category), and timestamps. We do not collect payment information; BloggerSpace is free to use. We also collect standard server logs (IP address, browser type, pages visited) for security and performance purposes. These logs are retained for 30 days.`,
  },
  {
    title: "2. How we use your information",
    body: `Your email address is used to: send account notifications (review status updates, comment replies), deliver the newsletter if you opt in, and allow you to reset your password. We do not sell, rent, or share your personal information with third parties for marketing purposes. Server logs are used solely for security monitoring and infrastructure diagnosis.`,
  },
  {
    title: "3. Cookies",
    body: `We use a single session cookie to keep you logged in across page loads. We also use Vercel Analytics (privacy-friendly, no fingerprinting) and Vercel Speed Insights to understand site performance. These tools do not use advertising cookies and do not track you across other websites. You can disable cookies in your browser settings; the site will still function but you will not stay logged in.`,
  },
  {
    title: "4. Third-party services",
    body: `BloggerSpace is hosted on Vercel. Blog images may be served through Cloudinary. We use Google Fonts to serve the Crimson Pro and Geist typefaces. Each of these providers has its own privacy policy. We do not embed third-party advertising, social tracking pixels, or any cross-site analytics scripts.`,
  },
  {
    title: "5. Data retention",
    body: `Your account data is retained as long as your account is active. If you delete your account, your personal information (name, email, profile) is removed within 7 days. Published blog posts are anonymised rather than deleted so that the content record remains intact for readers who have linked to it. You can request full deletion by contacting us.`,
  },
  {
    title: "6. Your rights",
    body: `You may request a copy of the data we hold on you, ask us to correct inaccurate data, or request deletion of your account and personal data at any time. To exercise these rights, email us at ${siteConfig.author.email} with the subject line "Data request". We will respond within 14 days.`,
  },
  {
    title: "7. Children's privacy",
    body: `BloggerSpace is not directed at children under 13. We do not knowingly collect personal information from anyone under 13. If you believe a child has provided us with personal information, please contact us and we will delete it promptly.`,
  },
  {
    title: "8. Changes to this policy",
    body: `We may update this Privacy Policy from time to time. When we do, we will revise the "Last updated" date at the top of this page and notify registered users by email if the changes are material.`,
  },
  {
    title: "9. Contact",
    body: `Questions about this policy? Email us at ${siteConfig.author.email}.`,
  },
] as const;

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <FadeIn>
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-primary">Legal</p>
        <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
      </FadeIn>

      <FadeIn delay={0.1}>
        <p className="mt-6 text-base leading-7 text-muted-foreground">
          Your privacy matters to us. This policy explains what data {siteConfig.name} collects,
          why we collect it, and what we do with it. We&apos;ve written it in plain language — no
          legalese.
        </p>
      </FadeIn>

      <Separator className="my-10" />

      <div className="space-y-10">
        {SECTIONS.map(({ title, body }) => (
          <section key={title}>
            <h2 className="font-serif text-xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
