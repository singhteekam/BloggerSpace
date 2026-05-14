"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, Users, MessageSquare, Settings, ShieldCheck, PenLine,
} from "lucide-react";

const nav = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/admin/manage/blogs", icon: FileText, label: "Blog Management" },
  { href: "/admin/manage/adminblogs", icon: PenLine, label: "Admin Blogs" },
  { href: "/admin/manage/team", icon: Users, label: "Team" },
  { href: "/admin/manage/community", icon: MessageSquare, label: "Community" },
  { href: "/admin/manage/maintenance", icon: Settings, label: "Maintenance" },
];

export default function AdminManageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 border-r border-border bg-card md:flex md:flex-col">
        <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
          <ShieldCheck className="size-4 text-primary" />
          <span className="font-semibold text-sm tracking-tight">Admin Panel</span>
        </div>
        <nav className="flex flex-col gap-0.5 p-2 flex-1">
          {nav.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/admin/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile top nav */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card md:hidden">
        <div className="flex items-center justify-around px-2 py-1">
          {nav.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== "/admin/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-[10px] transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="size-4" />
                {label.split(" ")[0]}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-auto pb-16 md:pb-0">
        {children}
      </div>
    </div>
  );
}
