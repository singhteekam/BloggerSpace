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
