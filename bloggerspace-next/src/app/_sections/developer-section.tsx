import Link from "next/link";
import Image from "next/image";
import { Globe, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollReveal } from "@/components/animated/scroll-reveal";
import { GitHubIcon } from "@/components/icons/brand-icons";
import { siteConfig } from "@/lib/constants/site";
import { DEVELOPER_SOCIALS, DEVELOPER_PROJECTS } from "@/lib/constants/home";

export function DeveloperSection() {
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
                  Hi, I&apos;m Teekam Singh — building and maintaining BloggerSpace, adding new
                  features, fixing bugs, and keeping the server running 24×7. It would be a
                  great help if you explore the site and share your feedback.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline" className="gap-1.5">
                    <Link href={siteConfig.author.url} target="_blank" rel="noopener noreferrer">
                      <Globe className="size-3.5" />
                      Portfolio
                    </Link>
                  </Button>
                  {DEVELOPER_SOCIALS.map(({ href, icon: Icon, label }) => (
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
                  {DEVELOPER_PROJECTS.map(({ name, description, demo, source }) => (
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
