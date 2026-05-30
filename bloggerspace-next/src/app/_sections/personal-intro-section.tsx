import Link from "next/link";
import { ExternalLink, Mail, Code2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/animated/scroll-reveal";
import { siteConfig } from "@/lib/constants/site";
import { GitHubIcon, LinkedInIcon } from "@/components/icons/brand-icons";

const QUICK_LINKS = [
  { href: "https://github.com/singhteekam",         icon: GitHubIcon,  label: "GitHub" },
  { href: "https://in.linkedin.com/in/singhteekam", icon: LinkedInIcon, label: "LinkedIn" },
  { href: `mailto:${siteConfig.author.email}`,      icon: Mail,        label: "Email" },
] as const;

const WHAT_I_DO = [
  {
    icon: Code2,
    title: "Full-stack development",
    body: "End-to-end web apps — from database design to polished UIs.",
  },
  {
    icon: Rocket,
    title: "Ship & iterate",
    body: "Fast feature delivery with clean, maintainable code.",
  },
] as const;

function TSAvatar() {
  return (
    <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary via-primary/80 to-primary/50 font-serif text-2xl font-semibold text-primary-foreground ring-2 ring-primary/20 select-none sm:size-20">
      TS
    </div>
  );
}

export function PersonalIntroSection() {
  return (
    <section className="py-10">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal>
          <div className="grid grid-cols-1 divide-y divide-border rounded-2xl border border-border bg-card md:grid-cols-2 md:divide-x md:divide-y-0">

            {/* Left — identity */}
            <div className="flex flex-col items-center gap-5 p-6 text-center sm:flex-row sm:items-start sm:text-left sm:p-8">
              <TSAvatar />
              <div className="min-w-0">
                <p className="mb-0.5 text-xs font-medium uppercase tracking-widest text-primary">
                  Built by
                </p>
                <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
                  Teekam Singh
                </h2>
                <p className="text-sm text-muted-foreground">
                  Full-stack Developer · MERN Stack
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
                  <Button asChild size="sm" variant="outline" className="gap-1.5 h-7 text-xs">
                    <Link href={siteConfig.author.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-3" />
                      Portfolio
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
                    <Link href="/aboutdeveloper">About me</Link>
                  </Button>
                  <div className="flex items-center">
                    {QUICK_LINKS.map(({ href, icon: Icon, label }) => (
                      <Button key={label} asChild size="sm" variant="ghost" className="size-7 p-0">
                        <Link
                          href={href}
                          target={href.startsWith("mailto") ? undefined : "_blank"}
                          rel="noopener noreferrer"
                          aria-label={label}
                        >
                          <Icon className="size-3.5" />
                        </Link>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right — what I do */}
            <div className="flex flex-col justify-center gap-4 p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                What I do
              </p>
              <div className="space-y-3">
                {WHAT_I_DO.map(({ icon: Icon, title, body }) => (
                  <div key={title} className="flex items-start gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-3.5" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{title}</p>
                      <p className="text-xs leading-5 text-muted-foreground">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
