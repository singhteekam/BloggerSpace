export const CHAT_BOT_NAME = "Sage";

export const CHAT_BOT_TAGLINE = "Your BloggerSpace assistant";

export const CHAT_BOT_WELCOME =
  `Hi! I'm ${CHAT_BOT_NAME}, your BloggerSpace assistant. Ask me to find blogs, recommend topics, or explain how the platform works — I'll pull live data and share clickable links.`;

export const CHAT_SUGGESTED_QUESTIONS = [
  "Find blogs about React",
  "Show me trending blogs",
  "What categories are available?",
  "How do I publish a blog?",
  "How do I earn gems?",
] as const;

export const CHAT_RATE_LIMIT = {
  maxRequests: 15,
  windowMs: 60_000,
} as const;

export const CHAT_MAX_HISTORY = 20;
