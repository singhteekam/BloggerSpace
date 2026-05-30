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
  Gift,
  MessageSquare,
  BarChart2,
  Wrench,
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
  { title: "Write", href: "/bloggerspace/newblog", icon: Pencil, description: "Start a new blog", authRequired: true },
];

/** Regular user dropdown items */
export const userMenuNav: NavItem[] = [
  { title: "My Profile", href: "/bloggerspace/profile", icon: UserIcon },
  { title: "My Blogs", href: "/bloggerspace/myblogs", icon: BookOpen },
  { title: "Saved Blogs", href: "/bloggerspace/saved", icon: Bookmark },
  { title: "Settings", href: "/bloggerspace/settings", icon: Settings },
  { title: "Change Password", href: "/bloggerspace/security", icon: Lock },
];

/** Reviewer dropdown items */
export const reviewerMenuNav: NavItem[] = [
  { title: "Dashboard", href: "/reviewer/dashboard", icon: LayoutDashboard },
  { title: "My Profile", href: "/bloggerspace/profile", icon: UserIcon },
  { title: "My Blogs", href: "/bloggerspace/myblogs", icon: BookOpen },
  { title: "Settings", href: "/reviewer/settings", icon: Settings },
  { title: "Change Password", href: "/reviewer/changepassword", icon: Lock },
];

/** Admin dropdown items */
export const adminMenuNav: NavItem[] = [
  { title: "Admin Panel", href: "/admin/dashboard", icon: ShieldCheck },
  { title: "Analytics",   href: "/admin/analytics",  icon: BarChart2 },
  { title: "Redemptions", href: "/admin/redemptions", icon: Gift },
  { title: "Reviews", href: "/admin/reviews", icon: MessageSquare },
  { title: "Newsletter", href: "/admin/newsletter", icon: Mail },
  { title: "Saved Blogs", href: "/admin/savedblogs", icon: Bookmark },
  { title: "My Profile", href: "/admin/profile", icon: UserIcon },
  { title: "Maintenance", href: "/admin/maintenance", icon: Wrench },
  { title: "Settings", href: "/admin/settings", icon: Settings },
  { title: "Change Password", href: "/admin/changepassword", icon: Lock },
];

export const footerNav = {
  product: [
    { title: "Browse blogs", href: "/blogs" },
    { title: "Admin Picks", href: "/adminblogs" },
    { title: "Community", href: "/community" },
    { title: "Reviews", href: "/reviews" },
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
