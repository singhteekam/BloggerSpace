import type { ComponentType } from "react";
import {
  ShieldCheck, BookOpen, Users, Pencil,
  MessageSquare, Star, Mail,
  Gem, TrendingUp, Gift,
} from "lucide-react";
import {
  SiNextdotjs, SiReact, SiTypescript, SiTailwindcss,
  SiNodedotjs, SiExpress, SiMongodb, SiVercel,
  SiFirebase, SiJsonwebtokens, SiAxios,
} from "react-icons/si";
import { GitHubIcon, LinkedInIcon, InstagramIcon } from "@/components/icons/brand-icons";

type IconType = ComponentType<{ size?: number; className?: string }>;

// ── Hero ─────────────────────────────────────────────────────────────────────
export const HERO_PILLS: { icon: IconType; iconClassName: string; label: string }[] = [
  { icon: Gem,   iconClassName: "size-3 text-primary",                 label: "Earn gems for writing & reviewing" },
  { icon: Star,  iconClassName: "size-3 text-amber-500 fill-amber-500", label: "Public blog & reviewer scores" },
  { icon: Gift,  iconClassName: "size-3 text-emerald-500",             label: "Redeem for gift cards" },
];

export const HERO_FEATURE_CARDS: { icon: IconType; title: string; body: string }[] = [
  {
    icon: Pencil,
    title: "Write anything",
    body: "Tech, careers, life, ideas — any topic is welcome. A well-written post is the only requirement.",
  },
  {
    icon: ShieldCheck,
    title: "Reviewed by humans",
    body: "Every blog passes a real reviewer before going live — quality over volume.",
  },
  {
    icon: BookOpen,
    title: "Built for reading",
    body: "Long-form first. Type, contrast, and motion tuned for hours of reading.",
  },
];

// ── Stats ────────────────────────────────────────────────────────────────────
export const HOMEPAGE_STATS: { label: string; value: (total: number) => string; icon: IconType }[] = [
  { label: "Published blogs", value: (total) => (total > 0 ? `${total}+` : "500+"), icon: BookOpen },
  { label: "Active writers",  value: () => "20+", icon: Pencil },
  { label: "Reviewers",       value: () => "5+",  icon: ShieldCheck },
  { label: "Community posts", value: () => "10+", icon: MessageSquare },
];

// ── How it works ─────────────────────────────────────────────────────────────
export const HOW_IT_WORKS_STEPS: { number: string; icon: IconType; title: string; body: string }[] = [
  {
    number: "01",
    icon: Pencil,
    title: "Write",
    body: "Craft your post in our clean, distraction-free TipTap editor. Markdown, rich text, and code blocks all supported.",
  },
  {
    number: "02",
    icon: ShieldCheck,
    title: "Get reviewed",
    body: "A real human reviewer reads your draft, leaves structured feedback, and approves it for publish — no bots, no AI scoring.",
  },
  {
    number: "03",
    icon: BookOpen,
    title: "Get read",
    body: "Your post goes live with full SEO metadata, structured data, and a reading experience tuned for long-form content.",
  },
];

// ── What you can do ──────────────────────────────────────────────────────────
export const ACTION_CARDS: { icon: IconType; title: string; body: string; href: string; cta: string; authRequired: boolean }[] = [
  {
    icon: Pencil,
    title: "Write blogs",
    body: "Anyone can sign up and start writing. Pick a topic, write your draft, and submit for review — the editorial process handles the rest.",
    href: "/bloggerspace/newblog",
    cta: "Start writing",
    authRequired: true,
  },
  {
    icon: Users,
    title: "Post in community",
    body: "Share questions, ideas, and discussions with the BloggerSpace community. Engage with fellow writers and readers.",
    href: "/community",
    cta: "Browse community",
    authRequired: false,
  },
  {
    icon: ShieldCheck,
    title: "Become a reviewer",
    body: "Apply to join the reviewer team. Read drafts, leave constructive feedback, and help raise the quality bar for every post.",
    href: "/bloggerspace/apply-reviewer",
    cta: "Apply now",
    authRequired: false,
  },
];

// ── Gems section ─────────────────────────────────────────────────────────────
export const WRITER_BULLETS = [
  "Submit a draft for human editorial review",
  "Gems land on your profile when your blog goes live",
  "Admin rates each published blog 0–10 for quality",
  "Scores accumulate into your public Creator Score",
];

export const REVIEWER_BULLETS = [
  "Get assigned blog drafts to review",
  "Leave structured feedback and help authors improve",
  "Earn gems when the blog you reviewed publishes",
  "Admin rates your review quality 0–10 per review",
];

export const SCORE_BREAKDOWN_CARDS: { icon: IconType; iconClassName: string; bg: string; title: string; body: string }[] = [
  {
    icon: Star,
    iconClassName: "size-5 fill-warning text-warning",
    bg: "bg-warning/10",
    title: "Blog quality score",
    body: "Each published blog can receive a 0–10 score from the admin team, reflecting depth, clarity, and originality.",
  },
  {
    icon: TrendingUp,
    iconClassName: "size-5 text-warning",
    bg: "bg-warning/10",
    title: "Creator Score",
    body: "The running total of all your blog scores — every great post adds to it. Shown prominently on your public profile.",
  },
  {
    icon: MessageSquare,
    iconClassName: "size-5 text-info",
    bg: "bg-info/10",
    title: "Reviewer Score",
    body: "Your average review rating across all scored reviews. A high score signals trustworthy, constructive feedback.",
  },
];

// ── Tech stack ───────────────────────────────────────────────────────────────
export const TECH_STACK: { label: string; Icon: IconType; iconColor: string }[] = [
  { label: "Next.js",      Icon: SiNextdotjs,     iconColor: "text-gray-800 dark:text-gray-100" },
  { label: "React 19",     Icon: SiReact,         iconColor: "text-sky-500" },
  { label: "TypeScript",   Icon: SiTypescript,    iconColor: "text-blue-500" },
  { label: "Tailwind CSS", Icon: SiTailwindcss,   iconColor: "text-cyan-500" },
  { label: "Node.js",      Icon: SiNodedotjs,     iconColor: "text-green-600" },
  { label: "Express",      Icon: SiExpress,       iconColor: "text-gray-600 dark:text-gray-300" },
  { label: "MongoDB",      Icon: SiMongodb,       iconColor: "text-emerald-600" },
  { label: "Vercel",       Icon: SiVercel,        iconColor: "text-gray-800 dark:text-gray-100" },
  { label: "Firebase",     Icon: SiFirebase,      iconColor: "text-orange-400" },
  { label: "JWT",          Icon: SiJsonwebtokens, iconColor: "text-pink-500" },
  { label: "Axios",        Icon: SiAxios,         iconColor: "text-purple-400" },
];

// ── Developer ────────────────────────────────────────────────────────────────
export const DEVELOPER_SOCIALS: { href: string; icon: IconType; label: string }[] = [
  { href: "https://in.linkedin.com/in/singhteekam",     icon: LinkedInIcon,  label: "LinkedIn" },
  { href: "https://github.com/singhteekam",             icon: GitHubIcon,    label: "GitHub" },
  { href: "mailto:singhteekam.in@gmail.com",            icon: Mail,          label: "Email" },
  { href: "https://www.instagram.com/singh__teekam/",   icon: InstagramIcon, label: "Instagram" },
];

export const DEVELOPER_PROJECTS: {
  name: string;
  description: string;
  demo: string;
  source?: string;
}[] = [
  {
    name: "GameStation",
    description: "Online games hub",
    demo: "https://games.singhteekam.in/",
  },
  {
    name: "BrainQuiz",
    description: "KBC-style quiz game",
    demo: "https://brainquiz.singhteekam.in/",
    source: "https://github.com/singhteekam/Kaun-Banega-Crorepati",
  },
  {
    name: "MyDiary",
    description: "Personal diary web app",
    demo: "https://mydiary.singhteekam.in/",
    source: "https://github.com/singhteekam/My-Diary",
  },
];

// ── Contact ──────────────────────────────────────────────────────────────────
export const CONTACT_LOOKING_FOR = [
  "Bug reports",
  "Feature suggestions",
  "Writing collaborations",
  "Reviewer applications",
];

