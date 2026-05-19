import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Spotlight } from "@/components/animated/spotlight";
import { ScrollReveal } from "@/components/animated/scroll-reveal";
import { ACTION_CARDS } from "@/lib/constants/home";

export function WhatYouCanDoSection() {
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
          {ACTION_CARDS.map(({ icon: Icon, title, body, href, cta }, i) => (
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
