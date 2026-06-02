import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, PenLine, UserCheck, BookMarked, Sparkles, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollReveal } from "@/components/animated/scroll-reveal";
import { FadeIn } from "@/components/animated/fade-in";
import { Logo } from "@/components/brand/logo";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description:
    "Learn about BloggerSpace by Teekam Singh — why it was built, how the review-before-publish model works, and what makes it different from every other blogging platform.",
  path: "/about",
  keywords: ["about bloggerspace", "about teekam singh", "what is bloggerspace", "how bloggerspace works"],
});

const STEPS = [
  {
    number: "01",
    icon: PenLine,
    title: "Write",
    body: "Craft your post in our clean, distraction-free editor. Markdown, rich text, and code blocks all supported.",
  },
  {
    number: "02",
    icon: UserCheck,
    title: "Get reviewed",
    body: "A real human reviewer reads your draft, leaves structured feedback, and approves it for publish — no bots.",
  },
  {
    number: "03",
    icon: BookMarked,
    title: "Get read",
    body: "Approved posts appear in the feed, discoverable by topic and tag. Quality rises, noise drops.",
  },
] as const;

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Quality over volume",
    body: "Every post is reviewed before it goes live. We'd rather have ten great articles than a thousand average ones.",
  },
  {
    icon: UserCheck,
    title: "Human curation",
    body: "Our reviewers are writers themselves. They give feedback that makes your work better, not just a thumbs-up.",
  },
  {
    icon: Users,
    title: "Community first",
    body: "Readers, writers, and reviewers share the same space. Everyone can discuss, save, and recommend.",
  },
  {
    icon: Sparkles,
    title: "Built for reading",
    body: "Typography, contrast, and layout are tuned for long reads — not engagement metrics.",
  },
] as const;

export default function AboutPage() {
  return (
    <main>
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-16 text-center sm:py-24">
        <FadeIn>
          <div className="mb-6 flex justify-center">
            <Logo variant="mark" size={72} />
          </div>
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-primary">
            About BloggerSpace
          </p>
        </FadeIn>
        <FadeIn delay={0.1} duration={0.7}>
          <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            A quieter corner of
            <br />
            <span className="text-primary">the internet.</span>
          </h1>
        </FadeIn>
        <FadeIn delay={0.2}>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-base leading-7 text-muted-foreground sm:text-lg">
            BloggerSpace is a writing platform where every post is reviewed by a real human before
            it&apos;s published. We exist because the internet needs more signal and less noise.
          </p>
        </FadeIn>
      </section>

      <Separator />

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <ScrollReveal>
          <h2 className="text-center font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-6 text-muted-foreground">
            Three steps from draft to published post.
          </p>
        </ScrollReveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {STEPS.map(({ number, icon: Icon, title, body }, i) => (
            <ScrollReveal key={title} delay={i * 0.1}>
              <Card className="relative h-full overflow-hidden p-6">
                <span className="absolute right-4 top-4 font-mono text-5xl font-bold leading-none text-border select-none">
                  {number}
                </span>
                <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <Separator />

      {/* Values */}
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <ScrollReveal>
          <h2 className="text-center font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            What we stand for
          </h2>
        </ScrollReveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map(({ icon: Icon, title, body }, i) => (
            <ScrollReveal key={title} delay={i * 0.08}>
              <Card className="h-full p-5">
                <div className="mb-3 inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{body}</p>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <Separator />

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 py-16 text-center sm:py-20">
        <ScrollReveal>
          <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready to write?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted-foreground">
            Create a free account, write your first post, and let our reviewers help you get it
            right.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="group">
              <Link href="/signup">
                Start writing
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/blogs">Browse posts</Link>
            </Button>
          </div>
        </ScrollReveal>
      </section>
    </main>
  );
}
