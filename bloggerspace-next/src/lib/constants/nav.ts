import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Compass,
  Pencil,
  Users,
  Bookmark,
  User as UserIcon,
  Settings,
  Lock,
  LayoutDashboard,
  ShieldCheck,
  Mail,
  Shield,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon?: LucideIcon;
  description?: string;
  authRequired?: boolean;
};

export const primaryNav: NavItem[] = [
  { title: "Browse", href: "/blogs", icon: Compass, description: "Discover blogs from the community" },
  { title: "Admin Picks", href: "/adminblogs", icon: Shield, description: "Handpicked by the admin team" },
  { title: "Community", href: "/community", icon: Users, description: "Discussions & posts" },
  { title: "Write", href: "/newblog", icon: Pencil, description: "Start a new blog", authRequired: true },
];

/** Regular user dropdown items */
export const userMenuNav: NavItem[] = [
  { title: "My Profile", href: "/myprofile", icon: UserIcon },
  { title: "My Blogs", href: "/myblogs", icon: BookOpen },
  { title: "Saved Blogs", href: "/savedblogs", icon: Bookmark },
  { title: "Settings", href: "/settings", icon: Settings },
  { title: "Change Password", href: "/changepassword", icon: Lock },
];

/** Reviewer dropdown items */
export const reviewerMenuNav: NavItem[] = [
  { title: "Dashboard", href: "/reviewer/dashboard", icon: LayoutDashboard },
  { title: "My Profile", href: "/reviewer/profile", icon: UserIcon },
  { title: "Settings", href: "/reviewer/settings", icon: Settings },
  { title: "Change Password", href: "/reviewer/changepassword", icon: Lock },
];

/** Admin dropdown items */
export const adminMenuNav: NavItem[] = [
  { title: "Admin Panel", href: "/admin/dashboard", icon: ShieldCheck },
  { title: "Newsletter", href: "/admin/newsletter", icon: Mail },
  { title: "My Profile", href: "/admin/profile", icon: UserIcon },
  { title: "Settings", href: "/admin/settings", icon: Settings },
  { title: "Change Password", href: "/admin/changepassword", icon: Lock },
];

export const footerNav = {
  product: [
    { title: "Browse blogs", href: "/blogs" },
    { title: "Admin Picks", href: "/adminblogs" },
    { title: "Community", href: "/community" },
    // { title: "Sitemap", href: "/sitemap.xml" },
  ],
  company: [
    { title: "About", href: "/about" },
    { title: "About the developer", href: "/aboutdeveloper" },
    { title: "Writing guidelines", href: "/guidelines" },
  ],
  legal: [
    { title: "Privacy Policy", href: "/privacypolicy" },
    { title: "Terms & Conditions", href: "/termsandconditions" },
  ],
} as const;
