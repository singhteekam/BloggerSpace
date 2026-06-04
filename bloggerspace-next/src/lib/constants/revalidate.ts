// ─────────────────────────────────────────────────────────────────────────────
// ISR / REVALIDATION REFERENCE — the one place that documents every cache window.
//
// All values are SECONDS. These windows are the main lever for Vercel cost:
//   • Longer window  → a page re-generates less often → FEWER "ISR Writes" and
//     LESS "Fast Origin Transfer" (each regeneration re-renders on compute and
//     ships the fresh HTML from origin → CDN).
//   • Shorter window → fresher background data, but more writes + origin transfer.
//
// These windows do NOT delay content edits: the backend fires on-demand
// revalidation (revalidatePath via /api/revalidate) on publish / edit / discard /
// follow / review, which purges the affected page IMMEDIATELY. So a long window
// only controls how often an UNTOUCHED page refreshes on its own.
//
// ── TWO KINDS OF WINDOWS ─────────────────────────────────────────────────────
// 1) FETCH-LEVEL (imported below, single source of truth): set on `fetch(..., {
//    next: { revalidate } })`. Change them HERE and they take effect everywhere.
//      → PROFILE  (used in lib/api/user.ts → fetchPublicProfile)
//      → SITEMAP  (used in app/sitemap.ts)
//
// 2) ROUTE-LEVEL (`export const revalidate` in a page): Next 16 requires these to
//    be a LITERAL number — an imported constant is rejected ("Invalid segment
//    configuration export"). They are documented here for reference but MUST be
//    edited as a literal in their own file. Keep the two in sync:
//      → BLOG_DETAIL  → app/blogs/[slug]/page.tsx          `export const revalidate = 604800`
//      → HOME         → app/page.tsx                        `export const revalidate = 604800`
//      → OG_IMAGE     → app/blogs/[slug]/opengraph-image.tsx `export const revalidate = 604800`
// ─────────────────────────────────────────────────────────────────────────────

const DAY = 86400; // 24h, in seconds

export const REVALIDATE = {
  // ── FETCH-LEVEL — imported & live (change here, applies everywhere) ──────────

  /**
   * Public author profile `/user/[username]` first page (fetchPublicProfile).
   * 24h. Follow/unfollow + profile edits purge it on-demand, so this is only a
   * fallback. The author's blog list pages in further client-side.
   */
  PROFILE: DAY,

  /**
   * `sitemap.xml` data fetches (all blog slugs / authors / community). 24h keeps
   * the sitemap current for crawlers without refetching the whole DB per request.
   */
  SITEMAP: DAY,

  // ── ROUTE-LEVEL — reference only (edit the LITERAL in the page file too) ─────

  /**
   * Blog detail `/blogs/[slug]` — the primary SEO surface (~2000 pages). 7 days.
   * Publishes/edits purge the exact page on-demand (instant), so this long window
   * only affects untouched pages → the single biggest ISR-Write + Origin-Transfer
   * saving. SEO unaffected.  ⚠️ Also set in app/blogs/[slug]/page.tsx.
   */
  BLOG_DETAIL: 7 * DAY,

  /**
   * Homepage `/` shell. 7 days. Only the blog COUNT is server-cached here — the
   * per-user "Your Profile" card and Recommended blogs are CLIENT-rendered (always
   * live). We no longer purge `/` on content actions.  ⚠️ Also set in app/page.tsx.
   */
  HOME: 7 * DAY,

  /**
   * OG share images (`opengraph-image`). 7 days — each is generated once then
   * served from the CDN (big Origin-Transfer saver across ~2000 blogs). Edits purge
   * the route (incl. the image) on-demand.  ⚠️ Also set in app/blogs/[slug]/opengraph-image.tsx.
   */
  OG_IMAGE: 7 * DAY,
} as const;
