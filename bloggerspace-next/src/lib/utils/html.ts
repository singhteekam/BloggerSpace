/** Strip HTML tags and collapse whitespace — safe for server use (no DOM needed). */
export function htmlToText(html: string, maxLength = 160): string {
  // Blog content is stored pako-compressed (base64). Compressed strings contain
  // no HTML tags, so they would produce garbled excerpts — return empty instead.
  if (!html || !html.includes("<")) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

/**
 * Estimate reading time from HTML content at ~238 words/min (average adult
 * reading speed). Returns a label like "4 min read". Returns "" when content
 * has no readable text (e.g. compressed/empty), so callers can hide it.
 */
export function readingTime(html: string): string {
  const minutes = readingMinutes(html);
  return minutes > 0 ? `${minutes} min read` : "";
}

/** Reading time in whole minutes (min 1 when text exists, else 0). */
export function readingMinutes(html: string): number {
  if (!html || !html.includes("<")) return 0;
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return 0;
  const words = text.split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 238));
}

/**
 * Wrap every <table> in published blog/community HTML with a horizontal-scroll
 * container so wide multi-column tables scroll within the content width instead
 * of overflowing the page. Pairs with the `.blog-table-scroll` CSS.
 */
export function wrapTables(html: string): string {
  if (!html || !html.includes("<table")) return html;
  return html
    .replace(/<table(?=[\s>])/gi, '<div class="blog-table-scroll"><table')
    .replace(/<\/table>/gi, "</table></div>");
}

/** Format a byte count to human-readable document size (KB / MB) */
export function formatDocSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Format a date string to "12 Jan 2025"
 *
 * NOTE on timezone: every app model (Blog, User, Comment, Review, Gems, …) stores
 * dates ALREADY in IST — the backend saves `new Date(now + 330*60000)`, i.e. the IST
 * wall-clock time baked into a UTC instant. So the stored value's UTC components ARE
 * the intended IST date. We therefore format with `timeZone: "UTC"` to read those
 * components verbatim; using the runtime's local zone would re-add +5:30 and roll
 * evening-IST timestamps to the next day (the "4 Jun shows as 5 Jun" bug). This also
 * makes server (UTC) and client (IST) render identically.
 * (Analytics VisitorLog timestamps are true UTC and are formatted separately with
 * `timeZone: IST` in the analytics page — do not route those through here.)
 */
export function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return "";
  }
}
