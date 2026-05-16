"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Pencil, LogOut, User } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { primaryNav, userMenuNav, reviewerMenuNav, adminMenuNav } from "@/lib/constants/nav";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils/cn";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    toast.success("Signed out successfully.");
    router.push("/");
  };

  const initials = user?.fullName
    ? user.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const normalizedRole = user?.role?.toLowerCase();
  // Reviewers retain full user writing privileges — only admin is excluded from /newblog
  const isRegularUser = !user || normalizedRole !== "admin";

  const menuNav =
    normalizedRole === "reviewer"
      ? reviewerMenuNav
      : normalizedRole === "admin"
        ? adminMenuNav
        : userMenuNav;

  const roleLabel =
    normalizedRole === "reviewer" ? "Reviewer" : normalizedRole === "admin" ? "Admin" : null;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-[background-color,border-color,box-shadow] duration-300",
        scrolled
          ? "border-b border-border bg-background/85 shadow-sm backdrop-blur-md"
          : "border-b border-transparent bg-background/0",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" aria-label="Go to BloggerSpace home">
          <Logo size={36} />
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {primaryNav
            .filter((item) => !item.authRequired || isRegularUser)
            .map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.title}
              </Link>
            );
          })}
        </nav>

        {/* Right: theme + auth */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Desktop auth — hidden during hydration to prevent flash */}
          {!isLoading && (
            <div className="hidden items-center gap-2 md:flex">
              {user ? (
                <>
                  {/* Write button only for regular users */}
                  {isRegularUser && (
                    <Button asChild size="sm" variant="ghost">
                      <Link href="/newblog">
                        <Pencil className="size-3.5" />
                        Write
                      </Link>
                    </Button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-2 ring-primary/20 transition-opacity hover:opacity-80"
                        aria-label="User menu"
                      >
                        {initials}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <div className="px-2 py-1.5">
                        <p className="truncate text-sm font-medium">{user.fullName}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        {roleLabel && (
                          <p className="mt-0.5 text-xs font-medium text-primary">{roleLabel}</p>
                        )}
                      </div>
                      <DropdownMenuSeparator />
                      {menuNav.map((item) => (
                        <DropdownMenuItem key={item.href} asChild>
                          <Link href={item.href} className="flex items-center gap-2">
                            {item.icon && <item.icon className="size-3.5" />}
                            {item.title}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="text-destructive focus:text-destructive"
                      >
                        <LogOut className="size-3.5" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/login">Sign in</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/signup">
                      <Pencil className="size-3.5" />
                      Start writing
                    </Link>
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="flex w-72 flex-col">
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>

              <div className="mb-2 mt-1">
                <Logo size={24} />
              </div>

              <Separator />

              {/* User info strip */}
              {user && (
                <div className="mt-3 flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{user.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    {roleLabel && (
                      <p className="text-xs font-medium text-primary">{roleLabel}</p>
                    )}
                  </div>
                </div>
              )}

              <nav className="mt-3 flex flex-col gap-1" aria-label="Mobile navigation">
                {/* Primary nav — hide Write for non-users */}
                {primaryNav
                  .filter((item) => isRegularUser || item.href !== "/newblog")
                  .map((item) => {
                    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        {item.icon && <item.icon className="size-4 shrink-0" />}
                        {item.title}
                      </Link>
                    );
                  })}

                {user && (
                  <>
                    <Separator className="my-1" />
                    {menuNav.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        {item.icon && <item.icon className="size-4 shrink-0" />}
                        {item.title}
                      </Link>
                    ))}
                  </>
                )}
              </nav>

              <div className="mt-auto flex flex-col gap-2 pt-4">
                <Separator className="mb-2" />
                {user ? (
                  <Button variant="outline" className="w-full" onClick={handleLogout}>
                    <LogOut className="size-4" />
                    Sign out
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/login">
                        <User className="size-4" />
                        Sign in
                      </Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link href="/signup">
                        <Pencil className="size-3.5" />
                        Start writing
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
