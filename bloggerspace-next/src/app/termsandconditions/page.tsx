import type { Metadata } from "next";
import { Separator } from "@/components/ui/separator";
import { FadeIn } from "@/components/animated/fade-in";
import { siteConfig } from "@/lib/constants/site";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: `The terms of service that govern your use of ${siteConfig.name}.`,
};

const LAST_UPDATED = "2 June 2026";

const SECTIONS = [
  {
    title: "1. Acceptance of terms",
    body: `By creating an account or using ${siteConfig.name} (the "Service"), you agree to be bound by these Terms & Conditions. If you do not agree, you may not use the Service. We may update these terms at any time; continued use of the Service after changes constitutes acceptance.`,
  },
  {
    title: "2. Eligibility",
    body: `You must be at least 13 years old to use the Service. By using it, you confirm that you meet this requirement. If you are under 18, you represent that your parent or guardian has reviewed and agreed to these terms.`,
  },
  {
    title: "3. User accounts",
    body: `You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must provide accurate information when registering. You may not share your account or create multiple accounts for the purpose of circumventing platform rules. We reserve the right to suspend or terminate accounts that violate these terms.`,
  },
  {
    title: "4. Content ownership",
    body: `You retain ownership of all original content you publish on ${siteConfig.name}. By publishing, you grant us a non-exclusive, worldwide, royalty-free licence to display, distribute, and promote your content on the platform. You represent that your content does not infringe any third-party intellectual property rights. We may remove content that violates our guidelines without prior notice.`,
  },
  {
    title: "5. Prohibited conduct",
    body: `You agree not to: (a) post content that is defamatory, obscene, harassing, or hateful; (b) impersonate another person or entity; (c) attempt to gain unauthorised access to the Service or its systems; (d) use automated tools to scrape, crawl, or harvest data without permission; (e) post spam, pyramid schemes, or unsolicited commercial promotions; (f) violate any applicable law or regulation.`,
  },
  {
    title: "6. Review process",
    body: `Submitted posts are subject to human review before publication. We reserve the right to approve, request changes to, or decline any submitted post at our discretion. A declined post does not mean you cannot resubmit an improved version. Reviewers are volunteers and community members bound by their own code of conduct.`,
  },
  {
    title: "7. Intellectual property",
    body: `The ${siteConfig.name} name, logo, design, and platform code are the intellectual property of the platform developer. Nothing in these terms grants you a right to use our trademarks, trade names, or branding without prior written consent.`,
  },
  {
    title: "8. Disclaimers",
    body: `The Service is provided "as is" without warranty of any kind. We do not guarantee uninterrupted access, error-free operation, or that published content is accurate. Opinions expressed in user-published posts are those of the authors and do not represent the views of ${siteConfig.name}. Optional email and browser push notifications are provided on a best-effort basis; we do not guarantee their timely delivery, and you can disable them at any time from your settings.`,
  },
  {
    title: "9. Limitation of liability",
    body: `To the fullest extent permitted by law, ${siteConfig.name} shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service, including loss of data, revenue, or reputation. Our total liability for any claim is limited to INR 0 (the Service is free).`,
  },
  {
    title: "10. Termination",
    body: `You may delete your account at any time. We may suspend or terminate your access if we believe you have violated these terms, with or without notice. Upon termination, your right to use the Service ceases. Provisions that by their nature should survive termination (including content licence, disclaimers, and limitation of liability) will do so.`,
  },
  {
    title: "11. Governing law",
    body: `These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of India.`,
  },
  {
    title: "12. Contact",
    body: `Questions about these terms? Email us at ${siteConfig.author.email}.`,
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

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <FadeIn>
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-primary">Legal</p>
        <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
          Terms &amp; Conditions
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
      </FadeIn>

      <FadeIn delay={0.1}>
        <p className="mt-6 text-base leading-7 text-muted-foreground">
          These terms govern your use of {siteConfig.name}. Please read them carefully. The short
          version: be respectful, write original content, and don&apos;t do anything illegal. The
          long version follows.
        </p>
      </FadeIn>

      <Separator className="my-10" />

      <div className="space-y-10">
        {SECTIONS.map(({ title, body }) => (
          <section key={title}>
            <h2 className="font-serif text-xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{linkEmails(body)}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
