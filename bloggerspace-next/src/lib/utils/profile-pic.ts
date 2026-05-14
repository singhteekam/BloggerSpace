/**
 * Normalise a profile picture value from MongoDB.
 * The backend stores raw base64 without a data-URI prefix, so
 * <img src={raw}> silently fails. This function adds the correct prefix.
 */
export function toProfilePicSrc(raw: string | undefined | null): string | undefined {
  if (!raw) return undefined;
  if (raw.startsWith("data:") || raw.startsWith("http")) return raw;

  // Detect MIME type from base64 magic bytes
  let mime = "image/jpeg";
  if (raw.startsWith("iVBOR")) mime = "image/png";
  else if (raw.startsWith("R0lGOD")) mime = "image/gif";
  else if (raw.startsWith("UklGR")) mime = "image/webp";

  return `data:${mime};base64,${raw}`;
}
