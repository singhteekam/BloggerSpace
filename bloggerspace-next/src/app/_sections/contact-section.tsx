import Link from "next/link";
import { Mail, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollReveal } from "@/components/animated/scroll-reveal";
import { GitHubIcon } from "@/components/icons/brand-icons";
import { CONTACT_LOOKING_FOR } from "@/lib/constants/home";
import { ContactForm } from "./contact-form";

export function ContactSection() {
  return (
    <section id="contact" className="bg-muted/30 py-20">
      <div className="mx-auto max-w-5xl px-6">
        <ScrollReveal className="mb-12 text-center">
          <Badge variant="secondary" className="mb-4">Contact us</Badge>
          <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            Get in touch
          </h2>
          <p className="mx-auto mt-4 max-w-md text-balance text-muted-foreground">
            Found a bug? Have a suggestion? Want to collaborate? We&apos;d love to hear from you.
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
                  What we&apos;re looking for
                </h3>
                <ul className="space-y-2">
                  {CONTACT_LOOKING_FOR.map((item) => (
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
