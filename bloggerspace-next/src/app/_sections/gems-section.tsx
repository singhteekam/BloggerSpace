import Link from "next/link";
import {
  ArrowRight, ShieldCheck, Pencil, MessageSquare,
  CheckCircle2, Gem, TrendingUp, Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Spotlight } from "@/components/animated/spotlight";
import { ScrollReveal } from "@/components/animated/scroll-reveal";
import {
  WRITER_BULLETS, REVIEWER_BULLETS, SCORE_BREAKDOWN_CARDS,
} from "@/lib/constants/home";
import { GemsProfileCard } from "./gems-profile-card";

export function GemsSection() {
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
            Every quality contribution is rewarded — gems for your work, public scores for your reputation, and real-world rewards when you&apos;re ready to cash out.
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
                  {WRITER_BULLETS.map((item) => (
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
                  {REVIEWER_BULLETS.map((item) => (
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
            {SCORE_BREAKDOWN_CARDS.map(({ icon: Icon, iconClassName, bg, title, body }) => (
              <div key={title} className="flex gap-4 rounded-xl border border-border bg-card p-4">
                <div className={`mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg ${bg}`}>
                  <Icon className={iconClassName} />
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
