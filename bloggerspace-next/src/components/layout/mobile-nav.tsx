"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Pencil, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/blogs", icon: Compass, label: "Browse" },
  { href: "/newblog", icon: Pencil, label: "Write" },
  { href: "/myprofile", icon: User, label: "Profile" },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/90 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-stretch">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active =
            pathname === href ||
            (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon
                className={cn(
                  "size-5 transition-transform duration-150",
                  active && "scale-110",
                )}
              />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
