import Link from "next/link";
import { Sparkles, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FadeIn } from "@/components/animated/fade-in";
import { Stagger, StaggerItem } from "@/components/animated/stagger";
import { AnimatedGradient } from "@/components/animated/animated-gradient";
import { Spotlight } from "@/components/animated/spotlight";
import { siteConfig } from "@/lib/constants/site";
import { HERO_PILLS, HERO_FEATURE_CARDS } from "@/lib/constants/home";
import { AuthCtaButton } from "./auth-cta-button";

export function HeroSection({ totalBlogs }: { totalBlogs: number }) {
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
            <AuthCtaButton
              label="Start writing"
              size="lg"
              className="group"
              arrowClassName="size-4 transition-transform group-hover:translate-x-0.5"
            />
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
            {HERO_PILLS.map(({ icon: Icon, iconClassName, label }) => (
              <span key={label} className="flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 backdrop-blur">
                <Icon className={iconClassName} />
                {label}
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
          {HERO_FEATURE_CARDS.map(({ icon: Icon, title, body }) => (
            <StaggerItem key={title}>
              <Spotlight className="rounded-2xl">
                <Card className="h-full bg-card/60 p-5 text-left backdrop-blur transition-colors hover:bg-card">
                  <div className="mb-3 inline-flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" />
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
