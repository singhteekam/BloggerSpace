import { Badge } from "@/components/ui/badge";
import { Marquee } from "@/components/animated/marquee";
import { ScrollReveal } from "@/components/animated/scroll-reveal";
import { TECH_STACK } from "@/lib/constants/home";

export function TechStackSection() {
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
