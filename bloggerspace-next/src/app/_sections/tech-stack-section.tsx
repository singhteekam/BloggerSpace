import { Badge } from "@/components/ui/badge";
import { ScrollReveal } from "@/components/animated/scroll-reveal";
import { TECH_STACK } from "@/lib/constants/home";

export function TechStackSection() {
  return (
    <section className="bg-muted/30 py-16">
      <div className="mx-auto max-w-5xl px-6">
        <ScrollReveal className="mb-10 text-center">
          <Badge variant="secondary" className="mb-4">Tech stack</Badge>
          <h2 className="font-serif text-2xl font-semibold tracking-tight">
            Built with modern tools
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.15} amount={0.2}>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-6">
            {TECH_STACK.map(({ label, Icon, iconColor }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2 opacity-60 transition-opacity duration-200 hover:opacity-100"
              >
                <Icon size={28} className={iconColor} />
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
