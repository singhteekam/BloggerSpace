import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollReveal } from "@/components/animated/scroll-reveal";
import { FadeIn } from "@/components/animated/fade-in";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const metadata: Metadata = pageMetadata({
  title: "Writing Guidelines",
  description:
    "Everything you need to write a great blog post on BloggerSpace — content quality, formatting, tone, and community rules for getting your article reviewed and published.",
  path: "/guidelines",
  keywords: ["writing guidelines", "blog writing tips", "how to write a blog", "content rules", "submission guidelines"],
});

const SECTIONS = [
  {
    title: "Content quality",
    rules: [
      { ok: true, text: "Original writing — your own ideas and words" },
      { ok: true, text: "Minimum 400 words of substantive content" },
      { ok: true, text: "Factual claims backed by evidence or clearly labeled as opinion" },
      { ok: true, text: "Well-structured: intro, body, conclusion" },
      { ok: false, text: "AI-generated text submitted as your own without disclosure" },
      { ok: false, text: "Plagiarism in any form — we check" },
      { ok: false, text: "Thin, filler, or low-effort content" },
    ],
  },
  {
    title: "Tone & voice",
    rules: [
      { ok: true, text: "Conversational and clear — write as you speak, but edit well" },
      { ok: true, text: "Respectful disagreement with ideas, not people" },
      { ok: true, text: "First-person perspective is encouraged" },
      { ok: false, text: "Clickbait titles that mislead the reader" },
      { ok: false, text: "Aggressive, hateful, or discriminatory language" },
      { ok: false, text: "Excessive self-promotion disguised as an article" },
    ],
  },
  {
    title: "Formatting",
    rules: [
      { ok: true, text: "Use headings (H2, H3) to break up long sections" },
      { ok: true, text: "Short paragraphs — 3–5 sentences max" },
      { ok: true, text: "Code blocks for any code snippets" },
      { ok: true, text: "Descriptive alt text on all images" },
      { ok: false, text: "Giant walls of text with no breaks" },
      { ok: false, text: "Excessive bold/italic that loses meaning" },
    ],
  },
  {
    title: "Topics we love",
    rules: [
      { ok: true, text: "Technology, programming, and developer tools" },
      { ok: true, text: "Career growth, productivity, and learning" },
      { ok: true, text: "Side projects, open source, and maker culture" },
      { ok: true, text: "Essays on ideas, society, and the future of tech" },
      { ok: false, text: "Explicit, adult, or NSFW content" },
      { ok: false, text: "Political content designed to inflame, not inform" },
      { ok: false, text: "Crypto promotions, MLM, or financial solicitations" },
    ],
  },
] as const;

export default function GuidelinesPage() {
  return (
    <main>
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-16 text-center sm:py-24">
        <FadeIn>
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-primary">
            Writers
          </p>
        </FadeIn>
        <FadeIn delay={0.1} duration={0.7}>
          <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
            Writing guidelines
          </h1>
        </FadeIn>
        <FadeIn delay={0.2}>
          <p className="mx-auto mt-5 max-w-xl text-balance text-base leading-7 text-muted-foreground sm:text-lg">
            Every post on BloggerSpace is reviewed by a human before it&apos;s published. These
            guidelines tell you what our reviewers are looking for — read them before you write.
          </p>
        </FadeIn>
      </section>

      <Separator />

      {/* Guidelines */}
      <section className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <div className="space-y-14">
          {SECTIONS.map(({ title, rules }, i) => (
            <ScrollReveal key={title} delay={i * 0.05}>
              <h2 className="mb-5 font-serif text-2xl font-semibold tracking-tight">{title}</h2>
              <ul className="space-y-2.5">
                {rules.map(({ ok, text }) => (
                  <li key={text} className="flex items-start gap-3 text-sm leading-6">
                    {ok ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                    ) : (
                      <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                    )}
                    <span className={ok ? "text-foreground" : "text-muted-foreground"}>
                      {text}
                    </span>
                  </li>
                ))}
              </ul>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <Separator />

      {/* Review process note */}
      <section className="mx-auto max-w-3xl px-6 py-14">
        <ScrollReveal>
          <div className="rounded-2xl border border-border bg-muted/30 p-6 sm:p-8">
            <h2 className="font-serif text-xl font-semibold">The review process</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              After submitting your post, a reviewer is assigned within 24–48 hours. They may
              approve it, request changes, or (rarely) decline it with a reason. If changes are
              requested, you&apos;ll receive structured feedback and can resubmit. We aim for two rounds
              of review max before a decision is made.
            </p>
            <Button asChild className="mt-5 group" size="sm">
              <Link href="/signup">
                Start writing
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </ScrollReveal>
      </section>
    </main>
  );
}
