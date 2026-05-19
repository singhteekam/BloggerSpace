import { Badge } from "@/components/ui/badge";
import { ScrollReveal } from "@/components/animated/scroll-reveal";
import { HOW_IT_WORKS_STEPS } from "@/lib/constants/home";

export function HowItWorksSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <ScrollReveal className="mb-12 text-center">
        <Badge variant="secondary" className="mb-4">How it works</Badge>
        <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          From draft to published — in three steps
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-balance text-muted-foreground">
          BloggerSpace turns the messy process of &quot;post and hope&quot; into a structured, quality-first pipeline.
        </p>
      </ScrollReveal>

      <div className="relative grid grid-cols-1 gap-8 sm:grid-cols-3">
        {/* Connecting line (desktop) */}
        <div
          className="absolute top-10 left-0 right-0 hidden h-px sm:block"
          style={{
            background:
              "linear-gradient(to right, transparent 5%, var(--border) 20%, var(--border) 80%, transparent 95%)",
          }}
          aria-hidden="true"
        />

        {HOW_IT_WORKS_STEPS.map(({ number, icon: Icon, title, body }, i) => (
          <ScrollReveal key={number} delay={i * 0.12} className="relative">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-5 inline-flex size-20 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
                <Icon className="size-8 text-primary" />
                <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {i + 1}
                </span>
              </div>
              <h3 className="mb-2 font-serif text-xl font-semibold">{title}</h3>
              <p className="text-sm leading-7 text-muted-foreground">{body}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
