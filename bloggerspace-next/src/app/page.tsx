import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, Sparkles, ShieldCheck, BookOpen, Users, Pencil,
  MessageSquare, Star, Mail, ExternalLink,
  CheckCircle2, Globe, Gem,
  TrendingUp, Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FadeIn } from "@/components/animated/fade-in";
import { Stagger, StaggerItem } from "@/components/animated/stagger";
import { AnimatedGradient } from "@/components/animated/animated-gradient";
import { Spotlight } from "@/components/animated/spotlight";
import { Marquee } from "@/components/animated/marquee";
import { ScrollReveal } from "@/components/animated/scroll-reveal";
import { fetchBlogs } from "@/lib/api/blogs";
import { siteConfig } from "@/lib/constants/site";
import {
  SiNextdotjs, SiReact, SiTypescript, SiTailwindcss,
  SiNodedotjs, SiExpress, SiMongodb, SiVercel,
  SiFirebase, SiJsonwebtokens, SiAxios,
} from "react-icons/si";
import { GitHubIcon, LinkedInIcon, InstagramIcon } from "@/components/icons/brand-icons";
import { ContactForm } from "./_sections/contact-form";
import { GemsProfileCard } from "./_sections/gems-profile-card";
import { ReviewsSection } from "./_sections/reviews-section";


export const metadata: Metadata = {
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
  description: siteConfig.description,
  alternates: { canonical: "/" },
};

/* ─── Data ────────────────────────────────────────────────────────────────── */

const STEPS = [
  {
    number: "01",
    icon: Pencil,
    title: "Write",
    body: "Craft your post in our clean, distraction-free TipTap editor. Markdown, rich text, and code blocks all supported.",
  },
  {
    number: "02",
    icon: ShieldCheck,
    title: "Get reviewed",
    body: "A real human reviewer reads your draft, leaves structured feedback, and approves it for publish — no bots, no AI scoring.",
  },
  {
    number: "03",
    icon: BookOpen,
    title: "Get read",
    body: "Your post goes live with full SEO metadata, structured data, and a reading experience tuned for long-form content.",
  },
];

const ACTIONS = [
  {
    icon: Pencil,
    title: "Write blogs",
    body: "Anyone can sign up and start writing. Pick a topic, write your draft, and submit for review — the editorial process handles the rest.",
    href: "/newblog",
    cta: "Start writing",
    authRequired: true,
  },
  {
    icon: Users,
    title: "Post in community",
    body: "Share questions, ideas, and discussions with the BloggerSpace community. Engage with fellow writers and readers.",
    href: "/community",
    cta: "Browse community",
    authRequired: false,
  },
  {
    icon: ShieldCheck,
    title: "Become a reviewer",
    body: "Apply to join the reviewer team. Read drafts, leave constructive feedback, and help raise the quality bar for every post.",
    href: "/apply-reviewer",
    cta: "Apply now",
    authRequired: false,
  },
];


const TECH_STACK: { label: string; Icon: React.ComponentType<{ size?: number; className?: string }>; iconColor: string }[] = [
  { label: "Next.js",      Icon: SiNextdotjs,     iconColor: "text-foreground" },
  { label: "React 19",     Icon: SiReact,         iconColor: "text-sky-500" },
  { label: "TypeScript",   Icon: SiTypescript,    iconColor: "text-blue-500" },
  { label: "Tailwind CSS", Icon: SiTailwindcss,   iconColor: "text-cyan-400" },
  { label: "Node.js",      Icon: SiNodedotjs,     iconColor: "text-green-500" },
  { label: "Express",      Icon: SiExpress,       iconColor: "text-muted-foreground" },
  { label: "MongoDB",      Icon: SiMongodb,       iconColor: "text-emerald-500" },
  { label: "Vercel",       Icon: SiVercel,        iconColor: "text-foreground" },
  { label: "Firebase",     Icon: SiFirebase,      iconColor: "text-orange-400" },
  { label: "JWT",          Icon: SiJsonwebtokens, iconColor: "text-pink-500" },
  { label: "Axios",        Icon: SiAxios,         iconColor: "text-purple-400" },
];

const PROJECTS = [
  {
    name: "BrainQuiz",
    description: "KBC-style quiz game",
    demo: "https://brainquiz.singhteekam.in/",
    source: "https://github.com/singhteekam/Kaun-Banega-Crorepati",
  },
  {
    name: "MyDiary",
    description: "Personal diary web app",
    demo: "https://mydiary.singhteekam.in/",
    source: "https://github.com/singhteekam/My-Diary",
  },
];


/* ─── Page ────────────────────────────────────────────────────────────────── */

export default async function Home() {
  let totalBlogs = 0;
  try {
    const { total } = await fetchBlogs(1);
    totalBlogs = total;
  } catch {
    totalBlogs = 0;
  }

  return (
    <main className="relative isolate overflow-hidden bg-background">
      <HeroSection totalBlogs={totalBlogs} />
      <StatsSection totalBlogs={totalBlogs} />
      <HowItWorksSection />
      <WhatYouCanDoSection />
      <GemsSection />
      <ReviewsSection />
      <TechStackSection />
      <DeveloperSection />
      <ContactSection />
    </main>
  );
}

/* ─── 1. Hero ─────────────────────────────────────────────────────────────── */

function HeroSection({ totalBlogs }: { totalBlogs: number }) {
  return (
    <section className="relative">
      <AnimatedGradient className="-z-10" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-50" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-linear-to-b from-background/0 via-background/0 to-background"
        aria-hidden="true"
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-6 pb-20 pt-12 text-center sm:pt-20">
        <FadeIn delay={0.05}>
          <Badge
            variant="outline"
            className="gap-1.5 bg-card/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur"
          >
            <Sparkles className="size-3.5 text-accent" aria-hidden="true" />
            Write · Review · Earn gems &amp; rewards
          </Badge>
        </FadeIn>

        <FadeIn delay={0.15} duration={0.7}>
          <h1 className="max-w-3xl font-serif text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl">
            Write. Get reviewed.
            <br />
            <span className="text-primary">Get read.</span>
          </h1>
        </FadeIn>

        <FadeIn delay={0.3}>
          <p className="max-w-xl text-balance text-base leading-7 text-muted-foreground sm:text-lg">
            {siteConfig.name} pairs every post with a real reviewer before publish — a quieter
            corner of the internet for thoughtful writing on technology, careers, and ideas.
          </p>
        </FadeIn>

        <FadeIn delay={0.45}>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="group">
              <Link href="/signup">
                Start writing
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/blogs">
                <BookOpen className="size-4" />
                Browse blogs
              </Link>
            </Button>
          </div>
        </FadeIn>

        <FadeIn delay={0.55}>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
            {[
              { icon: <Gem className="size-3 text-primary" />, label: "Earn gems for writing & reviewing" },
              { icon: <Star className="size-3 text-amber-500 fill-amber-500" />, label: "Public blog & reviewer scores" },
              { icon: <Gift className="size-3 text-emerald-500" />, label: "Redeem for gift cards" },
            ].map(({ icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 backdrop-blur">
                {icon}{label}
              </span>
            ))}
          </div>
        </FadeIn>

        {totalBlogs > 0 && (
          <FadeIn delay={0.7}>
            <p className="text-xs text-muted-foreground">
              Join{" "}
              <span className="font-semibold text-foreground">
                {totalBlogs.toLocaleString()}
              </span>{" "}
              published articles and growing
            </p>
          </FadeIn>
        )}

        <Stagger
          delay={0.8}
          stagger={0.1}
          className="mt-4 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3"
        >
          {[
            {
              icon: <Pencil className="size-4" />,
              title: "Write anything",
              body: "Tech, careers, life, ideas — any topic is welcome. A well-written post is the only requirement.",
            },
            {
              icon: <ShieldCheck className="size-4" />,
              title: "Reviewed by humans",
              body: "Every blog passes a real reviewer before going live — quality over volume.",
            },
            {
              icon: <BookOpen className="size-4" />,
              title: "Built for reading",
              body: "Long-form first. Type, contrast, and motion tuned for hours of reading.",
            },
          ].map(({ icon, title, body }) => (
            <StaggerItem key={title}>
              <Spotlight className="rounded-2xl">
                <Card className="h-full bg-card/60 p-5 text-left backdrop-blur transition-colors hover:bg-card">
                  <div className="mb-3 inline-flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {icon}
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{body}</p>
                </Card>
              </Spotlight>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ─── 2. Stats ────────────────────────────────────────────────────────────── */

const STATS = [
  { label: "Published blogs", value: (total: number) => total > 0 ? `${total}+` : "500+", icon: BookOpen },
  { label: "Active writers", value: () => "20+", icon: Pencil },
  { label: "Reviewers", value: () => "5+", icon: ShieldCheck },
  { label: "Community posts", value: () => "10+", icon: MessageSquare },
];

function StatsSection({ totalBlogs }: { totalBlogs: number }) {
  return (
    <section className="border-y border-border bg-muted/30 py-10">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {STATS.map(({ label, value, icon: Icon }) => (
            <ScrollReveal key={label} className="text-center">
              <div className="mx-auto mb-2 inline-flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="size-5 text-primary" />
              </div>
              <p className="font-serif text-3xl font-semibold text-foreground">
                {value(totalBlogs)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{label}</p>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── 3. How It Works ─────────────────────────────────────────────────────── */

function HowItWorksSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <ScrollReveal className="mb-12 text-center">
        <Badge variant="secondary" className="mb-4">How it works</Badge>
        <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          From draft to published — in three steps
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-balance text-muted-foreground">
          BloggerSpace turns the messy process of "post and hope" into a structured, quality-first pipeline.
        </p>
      </ScrollReveal>

      <div className="relative grid grid-cols-1 gap-8 sm:grid-cols-3">
        {/* Connecting line (desktop) */}
        <div
          className="absolute top-10 left-0 right-0 hidden h-px sm:block"
          style={{
            background:
              "linear-gradient(to right, transparent 5%, var(--border) 20%, var(--border) 80%, transparent 95%)",
          }}
          aria-hidden="true"
        />

        {STEPS.map(({ number, icon: Icon, title, body }, i) => (
          <ScrollReveal key={number} delay={i * 0.12} className="relative">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-5 inline-flex size-20 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
                <Icon className="size-8 text-primary" />
                <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {i + 1}
                </span>
              </div>
              <h3 className="mb-2 font-serif text-xl font-semibold">{title}</h3>
              <p className="text-sm leading-7 text-muted-foreground">{body}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

/* ─── 4. What You Can Do ──────────────────────────────────────────────────── */

function WhatYouCanDoSection() {
  return (
    <section className="bg-muted/30 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal className="mb-12 text-center">
          <Badge variant="secondary" className="mb-4">What you can do</Badge>
          <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            One platform, many ways to contribute
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {ACTIONS.map(({ icon: Icon, title, body, href, cta }, i) => (
            <ScrollReveal key={title} delay={i * 0.1}>
              <Spotlight className="h-full rounded-2xl">
                <Card className="flex h-full flex-col p-6 transition-colors hover:bg-card/80">
                  <div className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="size-6 text-primary" />
                  </div>
                  <h3 className="mb-2 font-serif text-xl font-semibold">{title}</h3>
                  <p className="flex-1 text-sm leading-7 text-muted-foreground">{body}</p>
                  <div className="mt-6">
                    <Button asChild variant="outline" size="sm" className="group">
                      <Link href={href}>
                        {cta}
                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              </Spotlight>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── 5. Gems ─────────────────────────────────────────────────────────────── */

function GemsSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">

        {/* Header */}
        <ScrollReveal className="mb-12 text-center">
          <Badge variant="secondary" className="mb-4 gap-1.5">
            <Gem className="size-3.5 text-primary" />
            Gems &amp; Rewards
          </Badge>
          <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            Contribute. Score. Redeem.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-balance text-muted-foreground">
            Every quality contribution is rewarded — gems for your work, public scores for your reputation, and real-world rewards when you're ready to cash out.
          </p>
        </ScrollReveal>

        {/* ── Row 1: Writer path | Reviewer path | Profile mockup ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">

          {/* Writer path */}
          <ScrollReveal delay={0} className="h-full">
            <Spotlight className="h-full rounded-2xl">
              <Card className="flex h-full flex-col p-6 transition-colors hover:bg-card/80">
                <div className="mb-4 flex items-center gap-3">
                  <div className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10">
                    <Pencil className="size-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-semibold">As a Writer</h3>
                    <p className="text-xs text-muted-foreground">Write · Publish · Earn</p>
                  </div>
                </div>

                <ul className="mb-5 flex-1 space-y-2.5 text-sm text-muted-foreground">
                  {[
                    "Submit a draft for human editorial review",
                    "Gems land on your profile when your blog goes live",
                    "Admin rates each published blog 0–10 for quality",
                    "Scores accumulate into your public Creator Score",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>

                {/* Creator score callout */}
                <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="size-3.5 text-warning" />
                    <span className="text-xs font-semibold text-warning">Creator Score</span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                    The sum of all your blog quality scores — shown publicly on your profile.
                  </p>
                </div>
              </Card>
            </Spotlight>
          </ScrollReveal>

          {/* Reviewer path */}
          <ScrollReveal delay={0.1} className="h-full">
            <Spotlight className="h-full rounded-2xl">
              <Card className="flex h-full flex-col p-6 transition-colors hover:bg-card/80">
                <div className="mb-4 flex items-center gap-3">
                  <div className="inline-flex size-10 items-center justify-center rounded-xl bg-sky-500/10">
                    <ShieldCheck className="size-5 text-sky-500" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-semibold">As a Reviewer</h3>
                    <p className="text-xs text-muted-foreground">Review · Score · Build rep</p>
                  </div>
                </div>

                <ul className="mb-5 flex-1 space-y-2.5 text-sm text-muted-foreground">
                  {[
                    "Get assigned blog drafts to review",
                    "Leave structured feedback and help authors improve",
                    "Earn gems when the blog you reviewed publishes",
                    "Admin rates your review quality 0–10 per review",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-sky-500" />
                      {item}
                    </li>
                  ))}
                </ul>

                {/* Reviewer score callout */}
                <div className="rounded-lg border border-info/30 bg-info/10 px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="size-3.5 text-info" />
                    <span className="text-xs font-semibold text-info">Reviewer Score</span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                    Your average review quality (e.g. ★ 8.4 from 5 reviews) — shown publicly on your profile.
                  </p>
                </div>
              </Card>
            </Spotlight>
          </ScrollReveal>

          {/* Profile card — real data when logged in, earnings showcase otherwise */}
          <ScrollReveal delay={0.2} className="h-full">
            <Spotlight className="h-full rounded-2xl">
              <GemsProfileCard />
            </Spotlight>
          </ScrollReveal>
        </div>

        {/* ── Row 2: Score breakdown strip ── */}
        <ScrollReveal>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                icon: <Star className="size-5 fill-warning text-warning" />,
                bg: "bg-warning/10",
                title: "Blog quality score",
                body: "Each published blog can receive a 0–10 score from the admin team, reflecting depth, clarity, and originality.",
              },
              {
                icon: <TrendingUp className="size-5 text-warning" />,
                bg: "bg-warning/10",
                title: "Creator Score",
                body: "The running total of all your blog scores — every great post adds to it. Shown prominently on your public profile.",
              },
              {
                icon: <MessageSquare className="size-5 text-info" />,
                bg: "bg-info/10",
                title: "Reviewer Score",
                body: "Your average review rating across all scored reviews. A high score signals trustworthy, constructive feedback.",
              },
            ].map(({ icon, bg, title, body }) => (
              <div key={title} className="flex gap-4 rounded-xl border border-border bg-card p-4">
                <div className={`mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg ${bg}`}>
                  {icon}
                </div>
                <div>
                  <p className="mb-1 text-sm font-semibold">{title}</p>
                  <p className="text-xs leading-5 text-muted-foreground">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* ── Row 3: Redemption banner ── */}
        <ScrollReveal>
          <div className="mb-10 flex flex-col items-center gap-5 rounded-2xl border border-success/30 bg-success/10 p-6 sm:flex-row">
            <div className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-success/15">
              <Gift className="size-7 text-success" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-serif text-lg font-semibold text-foreground">
                Redeem gems for real rewards
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Accumulated enough gems? Exchange them for <strong>Amazon Pay</strong> or <strong>Flipkart gift cards</strong> directly from your profile — no third-party apps, no waiting.
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="shrink-0 gap-1.5 border-success/50">
              <Link href="/signup">
                Start earning
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </ScrollReveal>

        {/* CTAs */}
        <ScrollReveal className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="group">
            <Link href="/signup">
              Start writing
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/apply-reviewer">
              <ShieldCheck className="size-4" />
              Apply as reviewer
            </Link>
          </Button>
        </ScrollReveal>

      </div>
    </section>
  );
}


/* ─── 6. Tech Stack ───────────────────────────────────────────────────────── */

function TechStackSection() {
  return (
    <section className="bg-muted/30 py-16 overflow-hidden">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal className="mb-10 text-center">
          <Badge variant="secondary" className="mb-4">Tech stack</Badge>
          <h2 className="font-serif text-2xl font-semibold tracking-tight">
            Built with modern tools
          </h2>
        </ScrollReveal>
      </div>
      <Marquee reverse duration={35} className="py-2">
        {TECH_STACK.map(({ label, Icon, iconColor }) => (
          <div
            key={label}
            className="mx-3 flex h-28 w-24 shrink-0 flex-col items-center justify-between rounded-xl border border-border bg-card px-3 py-4 shadow-sm"
          >
            <Icon size={36} className={iconColor} />
            <span className="text-center text-xs font-medium text-foreground">{label}</span>
          </div>
        ))}
      </Marquee>
    </section>
  );
}

/* ─── 7. Developer ────────────────────────────────────────────────────────── */

const SOCIALS = [
  { href: "https://in.linkedin.com/in/singhteekam", icon: LinkedInIcon, label: "LinkedIn" },
  { href: "https://github.com/singhteekam", icon: GitHubIcon, label: "GitHub" },
  { href: "mailto:singhteekam.in@gmail.com", icon: Mail, label: "Email" },
  { href: "https://www.instagram.com/singh__teekam/", icon: InstagramIcon, label: "Instagram" },
];

function DeveloperSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-6">
        <ScrollReveal className="mb-12 text-center">
          <Badge variant="secondary" className="mb-4">About the developer</Badge>
          <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            Meet the person behind BloggerSpace
          </h2>
        </ScrollReveal>

        <ScrollReveal>
          <Card className="overflow-hidden">
            <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
              {/* Left — bio */}
              <div className="p-8">
                <div className="mb-5 flex items-center gap-4">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-full ring-2 ring-primary/20">
                    <Image
                      src="/brand/dev.jpeg"
                      alt="Teekam Singh"
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-semibold">Teekam Singh</h3>
                    <p className="text-sm text-muted-foreground">Full-stack developer</p>
                  </div>
                </div>

                <p className="text-sm leading-7 text-muted-foreground">
                  Hi, I'm Teekam Singh — building and maintaining BloggerSpace, adding new
                  features, fixing bugs, and keeping the server running 24×7. It would be a
                  great help if you explore the site and share your feedback.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline" className="gap-1.5">
                    <Link href="https://www.singhteekam.in/" target="_blank" rel="noopener noreferrer">
                      <Globe className="size-3.5" />
                      Portfolio
                    </Link>
                  </Button>
                  {SOCIALS.map(({ href, icon: Icon, label }) => (
                    <Button key={label} asChild size="sm" variant="ghost" className="size-9 p-0">
                      <Link href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                        <Icon className="size-4" />
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Right — other projects */}
              <div className="p-8">
                <h4 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  Other projects
                </h4>
                <div className="space-y-4">
                  {PROJECTS.map(({ name, description, demo, source }) => (
                    <div key={name} className="rounded-xl border border-border bg-muted/20 p-4">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <span className="font-semibold text-foreground">{name}</span>
                        <span className="text-xs text-muted-foreground">{description}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button asChild size="sm" variant="outline" className="h-7 gap-1 text-xs">
                          <Link href={demo} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="size-3" />
                            Live demo
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="ghost" className="h-7 gap-1 text-xs">
                          <Link href={source} target="_blank" rel="noopener noreferrer">
                            <GitHubIcon size={12} className="size-3" />
                            Source
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-5" />

                <p className="text-xs leading-6 text-muted-foreground">
                  Have an idea or want to collaborate?{" "}
                  <Link href="#contact" className="text-primary hover:underline">
                    Get in touch
                  </Link>
                </p>
              </div>
            </div>
          </Card>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ─── 8. Contact ──────────────────────────────────────────────────────────── */

function ContactSection() {
  return (
    <section id="contact" className="bg-muted/30 py-20">
      <div className="mx-auto max-w-5xl px-6">
        <ScrollReveal className="mb-12 text-center">
          <Badge variant="secondary" className="mb-4">Contact us</Badge>
          <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            Get in touch
          </h2>
          <p className="mx-auto mt-4 max-w-md text-balance text-muted-foreground">
            Found a bug? Have a suggestion? Want to collaborate? We'd love to hear from you.
          </p>
        </ScrollReveal>

        <ScrollReveal>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Form */}
            <Card className="p-6">
              <h3 className="mb-5 font-semibold text-foreground">Send a message</h3>
              <ContactForm />
            </Card>

            {/* Contact info */}
            <div className="space-y-4">
              <Card className="p-6">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  Direct contact
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Mail className="size-4 text-primary" />
                    </div>
                    <Link
                      href="mailto:singhteekam.in@gmail.com"
                      className="text-foreground hover:text-primary transition-colors"
                    >
                      singhteekam.in@gmail.com
                    </Link>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <GitHubIcon size={16} className="size-4 text-primary" />
                    </div>
                    <Link
                      href="https://github.com/singhteekam"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:text-primary transition-colors"
                    >
                      github.com/singhteekam
                    </Link>
                  </li>
                </ul>
              </Card>

              <Card className="p-6">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  What we're looking for
                </h3>
                <ul className="space-y-2">
                  {[
                    "Bug reports",
                    "Feature suggestions",
                    "Writing collaborations",
                    "Reviewer applications",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="size-3.5 shrink-0 text-success" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

