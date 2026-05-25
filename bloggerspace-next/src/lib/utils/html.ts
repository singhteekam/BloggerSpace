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
