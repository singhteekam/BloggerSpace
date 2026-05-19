import { ScrollReveal } from "@/components/animated/scroll-reveal";
import { HOMEPAGE_STATS } from "@/lib/constants/home";

export function StatsSection({ totalBlogs }: { totalBlogs: number }) {
  return (
    <section className="border-y border-border bg-muted/30 py-10">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {HOMEPAGE_STATS.map(({ label, value, icon: Icon }) => (
            <ScrollReveal key={label} className="text-center">
              <div className="mx-auto mb-2 inline-flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="size-5 text-primary" />
              </div>
              <p className="font-serif text-3xl font-semibold text-foreground">
                {value(totalBlogs)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{label}</p>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
