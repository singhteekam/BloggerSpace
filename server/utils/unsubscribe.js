// Newsletter unsubscribe / resubscribe links.
//
// We sign the recipient's email with an HMAC so the public unsubscribe endpoint can
// trust the request without a login (a random visitor can't unsubscribe someone else —
// they'd need the secret to forge the token). The email is the identifier because the
// newsletter is addressed by email and we don't always have the userId at send time.

const crypto = require("crypto");

const secret = () =>
  process.env.UNSUBSCRIBE_SECRET ||
  process.env.CURRENT_JWT_SECRET ||
  process.env.JWT_SECRET ||
  "bloggerspace-unsubscribe";

const SITE_URL = () => process.env.FRONTEND_URL || "https://www.singhteekam.in";
// The unsubscribe endpoints live on the BACKEND, so the links must point there.
const apiBase = () => (process.env.BACKEND_URL || "").replace(/\/$/, "");

const norm = (email) => String(email || "").trim().toLowerCase();

function token(email) {
  return crypto.createHmac("sha256", secret()).update(norm(email)).digest("hex");
}

function verify(email, t) {
  if (!email || !t) return false;
  const expected = Buffer.from(token(email));
  const got = Buffer.from(String(t));
  return expected.length === got.length && crypto.timingSafeEqual(expected, got);
}

function unsubscribeUrl(email) {
  return `${apiBase()}/api/users/newsletter/unsubscribe?e=${encodeURIComponent(email)}&t=${token(email)}`;
}

function resubscribeUrl(email) {
  return `${apiBase()}/api/users/newsletter/resubscribe?e=${encodeURIComponent(email)}&t=${token(email)}`;
}

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]),
  );

// A small branded confirmation page shown after clicking the link in the email.
function confirmationPage({ ok = true, title, body, actionLabel, actionUrl }) {
  const accent = ok ? "#167d7f" : "#dc2626";
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(title)} — BloggerSpace</title></head>
<body style="margin:0;background:#f0f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="max-width:480px;margin:48px auto;background:#fff;border:1px solid #e0e7e7;border-radius:14px;overflow:hidden;">
    <div style="background:#818cf8;height:6px;"></div>
    <div style="padding:36px 32px;text-align:center;">
      <div style="font-family:Georgia,serif;font-size:20px;font-weight:700;color:${accent};margin-bottom:12px;">${escapeHtml(title)}</div>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 22px;">${body}</p>
      ${actionUrl ? `<a href="${actionUrl}" style="display:inline-block;padding:11px 26px;background:#167d7f;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">${escapeHtml(actionLabel)}</a>` : ""}
    </div>
    <div style="padding:16px;text-align:center;border-top:1px solid #eef2f2;">
      <a href="${SITE_URL()}" style="color:#9ca3af;font-size:12px;text-decoration:none;">BloggerSpace</a>
    </div>
  </div>
</body></html>`;
}

module.exports = { token, verify, unsubscribeUrl, resubscribeUrl, confirmationPage, escapeHtml, SITE_URL };
