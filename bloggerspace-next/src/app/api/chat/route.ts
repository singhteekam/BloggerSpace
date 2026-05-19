import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { CHAT_RATE_LIMIT, CHAT_MAX_HISTORY } from "@/lib/constants/chat";
import { chatTools } from "@/lib/chat/tools";

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

const SYSTEM_PROMPT = `You are Sage, the assistant for BloggerSpace — a blogging platform.

# What you can do
You have tools to look up live data. ALWAYS use a tool when the user asks about blogs, topics, categories, or tags — never fabricate titles, authors, or URLs. Pick the right tool:
- searchBlogs — user names a topic or keyword they want to read about
- getRecentBlogs — user asks for latest/newest blogs without naming a topic
- getTopBlogs — user asks for trending/popular/most-read blogs
- getBlogsByCategory — user names a category
- getBlogsByTag — user names a tag
- listCategories — user asks what topics/categories exist
- listTags — user asks what tags exist

After a tool returns, summarise the result clearly and always present each blog as a Markdown link in this exact form: \`[Blog title](url)\` — author and a short excerpt below it.

# Facts about BloggerSpace
- A blogging platform with three user types: regular users (readers), authors (write blogs), and reviewers (review drafts).
- Authors write drafts in a rich-text editor and submit for review. Reviewers leave feedback and approve/reject. Approved drafts are reviewed by an admin, then published.
- Gems are reputation points. Authors earn gems when their blog is approved. Reviewers earn gems for completed reviews. Gems show on public profiles and can be redeemed for Amazon Pay / Flipkart gift cards.
- Anyone can register. Existing users can apply to become a reviewer from their profile.
- Users can save blogs, follow authors, comment on published blogs.
- Login supports email/password and email OTP.

# Navigation routes (use these as clickable Markdown links when relevant)
- Sign up: [/signup](/signup)
- Log in: [/login](/login)
- Browse all blogs: [/blogs](/blogs)
- Write a new blog (login required): [/newblog](/newblog)
- My blogs: [/myblogs](/myblogs)
- My profile: [/myprofile](/myprofile)
- Saved blogs: [/savedblogs](/savedblogs)
- Apply to be a reviewer: [/apply-reviewer](/apply-reviewer)
- Community: [/community](/community)
- Settings: [/settings](/settings)
- About the developer: [/aboutdeveloper](/aboutdeveloper)

# Style rules
- Be concise. Under 150 words by default.
- Use Markdown: **bold** for key terms, numbered lists for steps, bullet lists for blogs.
- For blogs from a tool result, render each as: \`- [Title](/blogs/slug) — *Author Name*\` followed by a one-line excerpt if useful.
- For navigation, write things like "You can [start writing](/newblog) here."
- If a tool returns 0 results, say so honestly and offer to search with different keywords or list categories.
- If asked about something not covered (specific pricing, exact URLs not listed above, raw API details), say: "I'm not sure about that specifically — you can check the relevant page or contact support."
- Do not invent live data (user counts, exact totals, etc.) — only use what tools return.`;

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

  const trimmed = messages.slice(-CHAT_MAX_HISTORY);

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
    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(trimmed),
      tools: chatTools,
      // Allow up to 4 tool-call rounds before forcing a final answer
      stopWhen: stepCountIs(4),
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
