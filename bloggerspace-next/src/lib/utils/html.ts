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

/** Format a byte count to human-readable document size (KB / MB) */
export function formatDocSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Format a date string to "12 Jan 2025" */
export function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}
