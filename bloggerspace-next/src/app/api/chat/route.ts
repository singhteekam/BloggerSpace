import { streamText, convertToModelMessages, isTextUIPart, type UIMessage } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { CHAT_RATE_LIMIT, CHAT_MAX_HISTORY } from "@/lib/constants/chat";

// In-memory sliding-window rate limiter (resets on server restart / cold start)
const rateLimitMap = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(key) ?? []).filter(
    (t) => now - t < CHAT_RATE_LIMIT.windowMs,
  );
  if (timestamps.length >= CHAT_RATE_LIMIT.maxRequests) return true;
  timestamps.push(now);
  rateLimitMap.set(key, timestamps);
  return false;
}

// Fetch at most 5 relevant blog titles from the backend to inject as context
async function fetchBlogContext(query: string): Promise<string> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) return "";
    const url = `${backendUrl}/api/blogs/fetchallblogs?search=${encodeURIComponent(query)}&limit=5`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return "";
    const data = await res.json();
    const blogs: Array<{ title?: string; author?: string }> =
      data?.blogs ?? data ?? [];
    if (!blogs.length) return "";
    const list = blogs
      .map((b) => `• "${b.title ?? "Untitled"}"${b.author ? ` by ${b.author}` : ""}`)
      .join("\n");
    return `\n\nRelated blogs on BloggerSpace:\n${list}`;
  } catch {
    return "";
  }
}

// Detect whether the user's last message is blog-related so we enrich context
function isBlogQuery(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("blog") ||
    lower.includes("article") ||
    lower.includes("post") ||
    lower.includes("write") ||
    lower.includes("read") ||
    lower.includes("topic")
  );
}

const SYSTEM_PROMPT = `You are Sage, the assistant for BloggerSpace — a blogging platform.

# Facts you know about BloggerSpace
- It is a blogging platform with three user types: regular users (readers), authors (write blogs), and reviewers (review drafts).
- Authors write blog drafts in a rich-text editor and submit for review.
- Reviewers read submitted drafts, provide feedback, and approve or reject them.
- Once approved by a reviewer and an admin, blogs are published publicly.
- Gems are reputation points. Authors earn gems when their blog is approved and published. Reviewers earn gems for completed reviews. Gems are displayed on public profiles.
- Anyone can register as a regular user. Existing regular users can apply to become a reviewer from their profile page.
- Users can save blogs to read later, follow authors, and comment on published blogs.
- The platform sends newsletter emails curated by admins.
- Login supports email/password and OTP (one-time password via email).

# Style rules
- Be concise. Under 150 words by default. Use Markdown: **bold** for key terms, bullet lists for steps, NEVER use literal asterisks around list items.
- For step-by-step answers, use a numbered list.
- If you are about to mention a specific blog title, ONLY mention it if it appears in the "Related blogs on BloggerSpace" section provided to you. NEVER invent blog titles, author names, or feature names that aren't listed in these rules.
- If asked about something not covered in these rules (specific pricing, exact URLs, API details, etc.), say: "I'm not sure about that specifically — you can check the relevant page or contact support."
- Do not pretend to know live data (number of users, trending blogs, etc.) unless it appears in the context above.`;

export async function POST(req: Request) {
  // Rate limit by IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please slow down." }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );
  }

  let messages: UIMessage[];
  try {
    const body = await req.json();
    messages = (body.messages ?? []) as UIMessage[];
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Trim history to stay within token budget
  const trimmed = messages.slice(-CHAT_MAX_HISTORY);

  // Extract the last user text for blog-context enrichment
  const lastUserMessage = [...trimmed]
    .reverse()
    .find((m) => m.role === "user");
  const lastUserText =
    lastUserMessage?.parts
      .filter(isTextUIPart)
      .map((p) => p.text)
      .join(" ") ?? "";

  // Optionally inject live blog context
  const blogContext = isBlogQuery(lastUserText)
    ? await fetchBlogContext(lastUserText)
    : "";

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error("[chat] GOOGLE_GENERATIVE_AI_API_KEY not set");
    return new Response(
      JSON.stringify({ error: "Server missing Gemini API key." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  });

  try {
    // gemini-flash-latest tracks the current stable Flash model with broader free-tier quota.
    // 2.0-flash hits "exceeded quota" faster on free tier.
    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: SYSTEM_PROMPT + blogContext,
      messages: await convertToModelMessages(trimmed),
      onError: ({ error }) => {
        console.error("[chat] streamText error:", error);
      },
    });

    return result.toUIMessageStreamResponse({
      onError: (error) => {
        console.error("[chat] stream response error:", error);
        return error instanceof Error ? error.message : String(error);
      },
    });
  } catch (err) {
    console.error("[chat] route error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Internal error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
