// Notification-recipient guard.
//
// Decide whether a user should receive a notification email. Returns their address,
// or `null` when the account should NOT be notified:
//   - the record is missing (hard-deleted / TTL-purged → populate returned null),
//   - the user self-deleted (status "DELETED"), or
//   - the email was scrubbed (tombstone flow leaves an empty email).
//
// Callers do `const to = notifyEmail(user); if (to) sendEmail(to, ...)`. This means we
// never email someone who closed their account, and never crash on a null author /
// reviewer reference when admin/reviewer/system acts on their content.
//
// Note: pass a populated user document (e.g. blog.authorDetails after populate), not a
// bare ObjectId — we need the `status`/`email` fields to decide.
function notifyEmail(userDoc) {
  if (!userDoc || userDoc.status === "DELETED") return null;
  return userDoc.email || null;
}

module.exports = { notifyEmail };
