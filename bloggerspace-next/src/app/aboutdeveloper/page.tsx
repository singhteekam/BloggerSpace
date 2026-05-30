import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Mail, ExternalLink } from "lucide-react";
import { GitHubIcon, LinkedInIcon, XIcon } from "@/components/icons/brand-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollReveal } from "@/components/animated/scroll-reveal";
import { FadeIn } from "@/components/animated/fade-in";
import { siteConfig } from "@/lib/constants/site";

export const metadata: Metadata = {
  title: "About the Developer",
  description: `Meet ${siteConfig.author.name}, the developer behind BloggerSpace.`,
};

const TECH_STACK = [
  "MongoDB", "Express.js", "React", "Node.js",
  "Next.js", "TypeScript", "Tailwind CSS", "REST APIs",
  "JWT Auth", "Firebase", "Vercel", "Git",
] as const;

const SOCIAL_LINKS = [
  {
    icon: GitHubIcon,
    label: "GitHub",
    href: "https://github.com/singhteekam",
    handle: "singhteekam",
  },
  {
    icon: LinkedInIcon,
    label: "LinkedIn",
    href: "https://linkedin.com/in/singhteekam",
    handle: "singhteekam",
  },
  {
    icon: XIcon,
    label: "X (Twitter)",
    href: "https://x.com/singhteekam",
    handle: "@singhteekam",
  },
  {
    icon: Mail,
    label: "Email",
    href: `mailto:${siteConfig.author.email}`,
    handle: siteConfig.author.email,
  },
] as const;

export default function AboutDeveloperPage() {
  return (
    <main>
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-16 text-center sm:py-24">
        <FadeIn>
          <p className="mb-6 font-mono text-xs uppercase tracking-[0.25em] text-primary">
            The developer
          </p>
        </FadeIn>

        <FadeIn delay={0.05}>
          <div className="mx-auto mb-6 size-24 overflow-hidden rounded-full ring-2 ring-primary/20 sm:size-28">
            <Image
              src="/brand/dev.jpeg"
              alt="Teekam Singh"
              width={112}
              height={112}
              className="size-full object-cover"
              priority
            />
          </div>
        </FadeIn>

        <FadeIn delay={0.1} duration={0.7}>
          <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
            {siteConfig.author.name}
          </h1>
        </FadeIn>

        <FadeIn delay={0.18}>
          <p className="mt-2 text-sm font-medium text-primary">
            Full-Stack Developer · MERN Stack
          </p>
        </FadeIn>

        <FadeIn delay={0.25}>
          <p className="mx-auto mt-5 max-w-xl text-balance text-base leading-7 text-muted-foreground sm:text-lg">
            I&apos;m a full-stack developer from India, passionate about building products that are
            fast, accessible, and genuinely useful. BloggerSpace started as a personal project to
            learn the MERN stack — it has since grown into a full platform migration to Next.js.
          </p>
        </FadeIn>

        <FadeIn delay={0.32}>
          <Button asChild className="mt-8" variant="outline">
            <Link href={siteConfig.author.url} target="_blank" rel="noopener noreferrer" aria-label="Teekam Singh's portfolio">
              Personal website
              <ExternalLink className="size-3.5" />
            </Link>
          </Button>
        </FadeIn>
      </section>

      <Separator />

      {/* Tech stack */}
      <section className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
        <ScrollReveal>
          <h2 className="text-center font-serif text-3xl font-semibold tracking-tight">
            Tech stack
          </h2>
          <p className="mx-auto mt-3 max-w-md text-center text-sm text-muted-foreground">
            Technologies used to build and run BloggerSpace.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {TECH_STACK.map((tech) => (
              <Badge key={tech} variant="secondary" className="px-3 py-1 text-sm">
                {tech}
              </Badge>
            ))}
          </div>
        </ScrollReveal>
      </section>

      <Separator />

      {/* Connect */}
      <section className="mx-auto max-w-4xl px-6 py-16 text-center sm:py-20">
        <ScrollReveal>
          <h2 className="font-serif text-3xl font-semibold tracking-tight">Get in touch</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
            Questions, feedback, or collaboration ideas — I&apos;m open to all of it.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {SOCIAL_LINKS.map(({ icon: Icon, label, href, handle }) => (
              <Link
                key={label}
                href={href}
                target={href.startsWith("mailto") ? undefined : "_blank"}
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-left transition-colors hover:bg-muted"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="truncate text-xs text-muted-foreground">{handle}</p>
                </span>
              </Link>
            ))}
          </div>
        </ScrollReveal>
      </section>
    </main>
  );
}
