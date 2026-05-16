"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Pencil, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/contexts/auth-context";

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role?.toLowerCase();
  // Reviewers retain full user writing privileges — only admin is excluded from /newblog
  const isRegularUser = !user || role !== "admin";

  // Write item is only shown to regular users — admins/reviewers use their own panels
  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/blogs", icon: Compass, label: "Browse" },
    ...(isRegularUser ? [{ href: "/newblog", icon: Pencil, label: "Write" }] : []),
    { href: role === "admin" ? "/admin/dashboard" : role === "reviewer" ? "/reviewer/dashboard" : "/myprofile", icon: User, label: role === "admin" ? "Admin" : role === "reviewer" ? "Panel" : "Profile" },
  ] as const;

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/90 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-stretch">
        {navItems.map(({ href, icon: Icon, label }) => {
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
