import Link from "next/link";
import Image from "next/image";
import { ExternalLink, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/animated/scroll-reveal";
import { siteConfig } from "@/lib/constants/site";
import { GitHubIcon, LinkedInIcon } from "@/components/icons/brand-icons";

const QUICK_LINKS = [
  { href: "https://github.com/singhteekam",         icon: GitHubIcon,  label: "GitHub" },
  { href: "https://in.linkedin.com/in/singhteekam", icon: LinkedInIcon, label: "LinkedIn" },
  { href: `mailto:${siteConfig.author.email}`,      icon: Mail,        label: "Email" },
] as const;

export function PersonalIntroSection() {
  return (
    <section className="py-10">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal>
          <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-start sm:gap-8 sm:p-8">

            {/* Avatar */}
            <div className="relative size-20 shrink-0 overflow-hidden rounded-full ring-2 ring-primary/20 sm:size-24">
              <Image
                src="/brand/dev.jpeg"
                alt="Teekam Singh"
                fill
                className="object-cover"
                sizes="96px"
                priority
              />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="mb-1 text-xs font-medium uppercase tracking-widest text-primary">
                Built by
              </p>
              <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
                Teekam Singh
              </h2>
              <p className="mt-0.5 text-sm font-medium text-muted-foreground">
                Full-stack Developer · MERN Stack
              </p>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground sm:mx-0">
                I build and maintain BloggerSpace — shipping new features, squashing bugs, and
                keeping the platform running 24×7. Explore my other work on the portfolio.
              </p>

              {/* Actions */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <Button asChild size="sm" variant="outline" className="gap-1.5">
                  <Link href={siteConfig.author.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-3.5" />
                    Portfolio
                  </Link>
                </Button>
                <Button asChild size="sm" variant="ghost">
                  <Link href="/aboutdeveloper">About me</Link>
                </Button>
                <div className="flex items-center gap-0.5">
                  {QUICK_LINKS.map(({ href, icon: Icon, label }) => (
                    <Button key={label} asChild size="sm" variant="ghost" className="size-8 p-0">
                      <Link
                        href={href}
                        target={href.startsWith("mailto") ? undefined : "_blank"}
                        rel="noopener noreferrer"
                        aria-label={label}
                      >
                        <Icon className="size-4" />
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
