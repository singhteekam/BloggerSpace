import type { Metadata } from "next";
import { Separator } from "@/components/ui/separator";
import { FadeIn } from "@/components/animated/fade-in";
import { siteConfig } from "@/lib/constants/site";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description: `How ${siteConfig.name} by Teekam Singh collects, uses, and protects your personal data — analytics, reading history, push notifications, and your rights.`,
  path: "/privacypolicy",
  keywords: ["privacy policy", "data protection", "user privacy"],
});

const LAST_UPDATED = "2 June 2026";

const SECTIONS = [
  {
    title: "1. Information we collect",
    body: `When you create an account, we collect your name, email address, and a password (stored as a salted hash — we never see your plain-text password). When you write a post, we store the content, metadata (title, tags, category), and timestamps. We do not collect payment information; BloggerSpace is free to use.\n\nYou may optionally add profile information — a short bio and links to your LinkedIn, GitHub, or personal website. This information is entirely voluntary, is shown on your public profile, and can be edited or removed by you at any time from your profile settings.\n\nIf you are signed in, we keep a private reading history of the blog posts you open (title, category, and the time you read it), limited to your 50 most recent reads. This is visible only to you on your profile and is used to power personalised recommendations. It is never shown to other users. Reading history is only recorded while you are logged in.\n\nWe also collect anonymous usage analytics for every page visit: the page URL, referrer, device type (desktop / mobile / tablet), browser name, operating system, and approximate country (derived from a request header — not precise location). A randomly generated visitor ID is stored in your browser's local storage to count visits without identifying you personally. We additionally store a one-way cryptographic hash of your IP address (not the IP itself) for deduplication only — your raw IP address is never persisted. All analytics data is automatically deleted after 90 days.`,
  },
  {
    title: "2. How we use your information",
    body: `Your email address is used to: send account notifications (review status updates, comment replies) and allow you to reset your password. We use your reading history only to suggest other posts you may like, and never share it with anyone.\n\nThe newsletter is strictly opt-in: it is switched off by default, and we will only email you newsletter content if you actively turn it on under Settings → Notifications. You can opt out again at any time from the same place, and we send newsletters only to users who are currently opted in.\n\nBrowser push notifications are also strictly opt-in. If you enable them under Settings → Notifications, your browser generates an anonymous device messaging token (via Google Firebase Cloud Messaging) which we store to deliver occasional "trending blog" notifications. The token identifies a browser/device, not you personally, contains no message content, and is used only to send these notifications. You can turn push notifications off at any time, which removes the stored token; tokens that become invalid are also deleted automatically. We do not sell, rent, or share your personal information with third parties for marketing purposes. Server logs are used solely for security monitoring and infrastructure diagnosis.`,
  },
  {
    title: "3. Cookies",
    body: `We use a single session cookie to keep you logged in across page loads. You can disable cookies in your browser settings; the site will still function but you will not stay logged in.\n\nFor analytics, we store a randomly generated visitor ID in your browser's local storage (not a cookie). This ID is anonymous — it contains no personal information and is used only to avoid counting the same visit twice. It is not shared with any third party. You can clear it at any time by clearing your browser's local storage for this site.`,
  },
  {
    title: "4. Third-party services",
    body: `BloggerSpace is hosted on Vercel. Blog images may be served through Cloudinary. We use Google Fonts to serve the Crimson Pro and Geist typefaces. If you opt in to push notifications, Google Firebase Cloud Messaging is used to deliver them. Each of these providers has its own privacy policy. We do not embed third-party advertising, social tracking pixels, or any cross-site analytics scripts.`,
  },
  {
    title: "5. Data retention",
    body: `Your account data is retained as long as your account is active. If you delete your account, your personal information (name, email, profile) is removed within 7 days. Published blog posts are anonymised rather than deleted so that the content record remains intact for readers who have linked to it. You can request full deletion by contacting us.\n\nAnonymous visitor analytics logs are automatically deleted after 90 days with no action required on your part.`,
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

function linkEmails(text: string) {
  const parts = text.split(/([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/g);
  return parts.map((part, i) =>
    /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(part)
      ? <a key={i} href={`mailto:${part}`} className="text-primary underline underline-offset-2 hover:opacity-80">{part}</a>
      : part
  );
}

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
          Your privacy matters to us. This policy explains what data {siteConfig.name} {" "} collects,
          why we collect it, and what we do with it. We&apos;ve written it in plain language — no
          legalese.
        </p>
      </FadeIn>

      <Separator className="my-10" />

      <div className="space-y-10">
        {SECTIONS.map(({ title, body }) => (
          <section key={title}>
            <h2 className="font-serif text-xl font-semibold tracking-tight">{title}</h2>
            <div className="mt-3 space-y-3">
              {body.split("\n\n").map((para, i) => (
                <p key={i} className="text-sm leading-7 text-muted-foreground">{linkEmails(para)}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
