export const CHAT_BOT_NAME = "Sage";

export const CHAT_BOT_TAGLINE = "Your BloggerSpace assistant";

export const CHAT_BOT_WELCOME =
  `Hi! I'm ${CHAT_BOT_NAME}, your BloggerSpace assistant. Ask me anything about the platform, blogs, gems, or how to get started.`;

export const CHAT_SUGGESTED_QUESTIONS = [
  "What is BloggerSpace?",
  "How do I publish a blog?",
  "How do I earn gems?",
  "How do I become a reviewer?",
] as const;

export const CHAT_RATE_LIMIT = {
  maxRequests: 15,
  windowMs: 60_000,
} as const;

export const CHAT_MAX_HISTORY = 20;
