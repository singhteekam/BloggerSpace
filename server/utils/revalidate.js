const axios = require("axios");
const logger = require("./Logging/logs");

// Fire-and-forget on-demand ISR revalidation. Tells the Next.js frontend to purge
// the relevant cached pages so published/edited/removed content is live for ALL
// users on their next request — without waiting for the 24h background window.
// Best-effort: never blocks or throws into the caller, so a frontend hiccup can
// never break a publish/edit/delete.
//
//   revalidate({ slug, username, paths })
//     slug     → purges /blogs/<slug>
//     username → purges /user/<username>
//     paths    → extra explicit paths (e.g. ["/adminblogs", "/reviews"])
//   The homepage "/" is always purged (it shows counts / latest content).
function revalidate({ slug, username, paths = [] } = {}) {
  const base = process.env.FRONTEND_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!base || !secret) return; // not configured — skip silently

  axios
    .post(
      `${base.replace(/\/$/, "")}/api/revalidate`,
      { slug, username, paths },
      { headers: { "x-revalidate-secret": secret }, timeout: 5000 },
    )
    .then((r) => logger.debug("Revalidated: " + JSON.stringify(r.data?.revalidated ?? [])))
    .catch((err) => logger.error("revalidate failed: " + (err.message || err)));
}

module.exports = { revalidate };
