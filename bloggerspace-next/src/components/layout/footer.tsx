import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Separator } from "@/components/ui/separator";
import { footerNav } from "@/lib/constants/nav";
import { siteConfig } from "@/lib/constants/site";
import { VisitorBadge } from "./visitor-badge";

const NAV_COLUMNS = [
  { label: "Product", links: footerNav.product },
  { label: "Company", links: footerNav.company },
  { label: "Legal", links: footerNav.legal },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/20">
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Top grid */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Logo size={36} />
            <p className="mt-3 max-w-[220px] text-sm leading-6 text-muted-foreground">
              A quieter corner of the internet for thoughtful, reviewed writing.
            </p>
          </div>

          {/* Nav columns */}
          {NAV_COLUMNS.map(({ label, links }) => (
            <div key={label}>
              <p className="text-xs font-semibold uppercase tracking-widest text-foreground">
                {label}
              </p>
              <ul className="mt-4 space-y-3">
                {links.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} {siteConfig.fullName}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <VisitorBadge />
            {/* <p>Built with Next.js &middot; Deployed on Vercel</p> */}
          </div>
        </div>
      </div>
    </footer>
  );
}
