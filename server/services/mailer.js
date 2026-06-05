// mailer.js — Email service for BloggerSpace
// All outgoing emails pass through emailTemplate() which wraps arbitrary HTML
// content in the branded shell. Content strings may use the CSS classes defined
// in the <style> block below (.content, .otp-code, .btn, .info-box, etc.).

const nodemailer = require("nodemailer");

// ── Brand / URL constants ──────────────────────────────────────────────────
const SITE_URL = process.env.FRONTEND_URL || "https://www.singhteekam.in";

// Logo is served from the backend's /assets/ static route (app.js).
// Add BACKEND_URL to your .env.local (e.g. https://api.yourdomain.com).
// Falls back to the frontend CDN copy if BACKEND_URL is not set.
const LOGO_URL = process.env.BACKEND_URL
  ? `${process.env.BACKEND_URL}/assets/logo128x128.png`
  : `${SITE_URL}/brand/logo128x128.png`;

// ── HTML email template ────────────────────────────────────────────────────
// opts (all optional):
//   preheader      — hidden inbox-preview text (the snippet Gmail shows in the list)
//   unsubscribeUrl — when set, a footer "Unsubscribe" link is shown (newsletter only)
const emailTemplate = (content, opts = {}) => {
  const year = new Date().getFullYear();
  const preheader = opts.preheader || "";
  const unsubscribeUrl = opts.unsubscribeUrl || "";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>BloggerSpace</title>
  <style>
    /* ── Reset ─────────────────────────────────────────────────────── */
    * { box-sizing: border-box; }
    body {
      margin: 0; padding: 0;
      background-color: #f0f4f4;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
                   'Helvetica Neue', Arial, sans-serif;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    img { border: 0; display: block; }
    a { color: #167d7f; }

    /* ── Content area ──────────────────────────────────────────────── */
    /* Wrap your email body in <div class="content">...</div>          */
    .content { color: #1f2937; font-size: 15px; line-height: 1.75; }
    .content h2 {
      margin: 0 0 16px;
      font-size: 20px; font-weight: 700; line-height: 1.3;
      color: #1f2937;
      font-family: Georgia, 'Times New Roman', serif;
    }
    .content h3 {
      margin: 20px 0 10px;
      font-size: 16px; font-weight: 600;
      color: #374151;
    }
    .content p { margin: 0 0 14px; color: #374151; }
    .content p:last-child { margin-bottom: 0; }
    .content ul,
    .content ol  { margin: 0 0 14px; padding-left: 24px; color: #374151; }
    .content li  { margin-bottom: 6px; line-height: 1.65; }
    .content strong,
    .content b   { color: #111827; }
    .content a   { color: #167d7f; }

    /* ── OTP / verification code ───────────────────────────────────── */
    /* Usage: <div class="otp-code">123456</div>                       */
    .otp-code {
      display: block;
      margin: 24px auto;
      padding: 18px 32px;
      background-color: #f0fafa;
      border: 2px dashed #167d7f;
      border-radius: 12px;
      font-size: 40px; font-weight: 800;
      letter-spacing: 12px;
      color: #167d7f;
      text-align: center;
      font-family: 'Courier New', 'Lucida Console', monospace;
      max-width: 300px;
    }

    /* ── CTA buttons ───────────────────────────────────────────────── */
    /* Usage: <a class="btn" href="...">Label</a>                      */
    .btn,
    .button {
      display: inline-block;
      padding: 12px 28px;
      background-color: #167d7f;
      color: #ffffff !important;
      font-size: 14px; font-weight: 600;
      text-decoration: none !important;
      border-radius: 8px;
      letter-spacing: 0.2px;
      margin-top: 8px;
    }
    .btn-outline {
      display: inline-block;
      padding: 11px 28px;
      background-color: transparent;
      color: #167d7f !important;
      font-size: 14px; font-weight: 600;
      text-decoration: none !important;
      border-radius: 8px;
      border: 1.5px solid #167d7f;
      margin-top: 8px;
    }

    /* ── Info / alert callouts ─────────────────────────────────────── */
    /* Usage: <div class="info-box">...</div>                          */
    .info-box {
      background-color: #f0fafa;
      border-left: 4px solid #167d7f;
      border-radius: 0 8px 8px 0;
      padding: 14px 16px;
      margin: 16px 0;
      font-size: 14px; line-height: 1.65;
      color: #374151;
    }
    .warn-box {
      background-color: #fffbeb;
      border-left: 4px solid #f59e0b;
      border-radius: 0 8px 8px 0;
      padding: 14px 16px;
      margin: 16px 0;
      font-size: 14px; line-height: 1.65;
      color: #374151;
    }

    /* ── Misc helpers ──────────────────────────────────────────────── */
    .teal-green { color: #167d7f; font-weight: 600; }
    .text-muted { color: #6b7280; font-size: 13px; }
    .divider    { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }

    /* ── Mobile overrides ──────────────────────────────────────────── */
    @media (max-width: 620px) {
      .email-wrapper    { padding: 20px 10px !important; }
      .email-card       { border-radius: 10px !important; }
      .email-header     { padding: 24px 20px 20px !important; }
      .email-body-cell  { padding: 28px 20px 24px !important; }
      .email-footer-cell{ padding: 20px 20px 26px !important; }
      .otp-code { font-size: 32px !important; letter-spacing: 8px !important; padding: 14px 20px !important; }
    }
  </style>
</head>
<body>

  <!-- ── Preheader (hidden inbox-preview text) ────────────────────────── -->
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;
              height:0; width:0; mso-hide:all;">${preheader}</div>

  <!-- ── Outer wrapper ────────────────────────────────────────────────── -->
  <table cellpadding="0" cellspacing="0" border="0" width="100%"
    class="email-wrapper"
    style="background-color:#f0f4f4; padding:40px 16px;">
    <tr>
      <td align="center" valign="top">

        <!-- ── Email card ──────────────────────────────────────────── -->
        <table cellpadding="0" cellspacing="0" border="0" width="600"
          class="email-card"
          style="max-width:600px; width:100%; background-color:#ffffff;
                 border-radius:14px; overflow:hidden; border:1px solid #e0e7e7;
                 box-shadow:0 6px 24px rgba(15,23,42,0.06);">

          <!-- ── Top accent strip ──────────────────────────────────── -->
          <tr>
            <td style="background-color:#167d7f; height:5px; line-height:5px; font-size:0;">&nbsp;</td>
          </tr>

          <!-- ── Header ────────────────────────────────────────────── -->
          <tr>
            <td class="email-header"
              style="background-color:#818cf8; padding:32px 40px 26px; text-align:center;">

              <!-- Logo mark -->
              <img src="${LOGO_URL}"
                alt="BloggerSpace Logo"
                width="60" height="60"
                style="display:inline-block; border-radius:12px;
                       background-color:rgba(255,255,255,0.18); padding:6px;
                       margin-bottom:14px;">

              <!-- Site name -->
              <h1 style="margin:0 0 6px; color:#ffffff; font-size:22px; font-weight:700;
                         letter-spacing:-0.3px; line-height:1.2;
                         font-family:Georgia,'Times New Roman',serif;">
                BloggerSpace
              </h1>

              <!-- Tagline -->
              <p style="margin:0; color:rgba(255,255,255,0.68); font-size:12.5px; letter-spacing:0.4px;">
                Every story, reviewed by a human.
              </p>
            </td>
          </tr>

          <!-- ── Body ──────────────────────────────────────────────── -->
          <tr>
            <td class="email-body-cell"
              style="padding:40px 40px 32px; background-color:#ffffff;">
              <div class="content">
                ${content}
              </div>
            </td>
          </tr>

          <!-- ── Separator ─────────────────────────────────────────── -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none; border-top:1px solid #e5e7eb; margin:0;">
            </td>
          </tr>

          <!-- ── Footer ────────────────────────────────────────────── -->
          <tr>
            <td class="email-footer-cell"
              style="background-color:#f9fafa; padding:24px 40px 30px; text-align:center;">

              <!-- Social icons -->
              <table cellpadding="0" cellspacing="0" border="0" align="center"
                style="margin:0 auto 18px;">
                <tr>
                  <!-- GitHub -->
                  <td style="padding:0 8px;">
                    <a href="https://github.com/singhteekam" target="_blank"
                       title="GitHub" style="text-decoration:none;">
                      <img src="https://cdn-icons-png.flaticon.com/512/25/25231.png"
                        alt="GitHub" width="22" height="22"
                        style="display:block; opacity:0.45;">
                    </a>
                  </td>
                  <!-- LinkedIn -->
                  <td style="padding:0 8px;">
                    <a href="https://in.linkedin.com/in/singhteekam" target="_blank"
                       title="LinkedIn" style="text-decoration:none;">
                      <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png"
                        alt="LinkedIn" width="22" height="22"
                        style="display:block; opacity:0.45;">
                    </a>
                  </td>
                  <!-- BloggerSpace site -->
                  <td style="padding:0 8px;">
                    <a href="${SITE_URL}" target="_blank"
                       title="BloggerSpace" style="text-decoration:none;">
                      <img src="${LOGO_URL}"
                        alt="BloggerSpace" width="22" height="22"
                        style="display:block; border-radius:4px; opacity:0.55;">
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 6px; font-size:12px; color:#6b7280; line-height:1.6;">
                You received this email because your address is registered with
                <a href="${SITE_URL}"
                  style="color:#167d7f; text-decoration:none;">BloggerSpace</a>.
              </p>
              ${
                unsubscribeUrl
                  ? `<p style="margin:0 0 6px; font-size:12px; color:#6b7280; line-height:1.6;">
                Don't want the newsletter?
                <a href="${unsubscribeUrl}" style="color:#167d7f; text-decoration:underline;">Unsubscribe here</a>.
              </p>`
                  : ""
              }
              <p style="margin:0; font-size:11px; color:#9ca3af;">
                &copy; ${year} BloggerSpace &nbsp;&middot;&nbsp; Built by
                <a href="https://singhteekam.in"
                  style="color:#9ca3af; text-decoration:none;">Teekam Singh</a>
              </p>

            </td>
          </tr>

        </table>
        <!-- /Email card -->

        <!-- Below-card domain link -->
        <p style="margin:18px 0 0; font-size:11px; color:#9ca3af; text-align:center;">
          <a href="${SITE_URL}" style="color:#9ca3af; text-decoration:none;">
            www.singhteekam.in
          </a>
        </p>

      </td>
    </tr>
  </table>

</body>
</html>`;
};

// ── Nodemailer transport ───────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// ── sendEmail helper ───────────────────────────────────────────────────────
// @param {string}   receiver    — To address
// @param {string}   subject     — Email subject line
// @param {string}   html        — Inner HTML content (will be wrapped in emailTemplate)
// @param {Array}    attachments — Optional nodemailer attachment objects
// @param {Object}   opts        — Optional: { preheader, unsubscribeUrl, headers }
//                                 (unsubscribeUrl → footer link; headers → e.g. List-Unsubscribe)
const sendEmail = (receiver, subject, html, attachments = [], opts = {}) => {
  const mailOptions = {
    from: `BloggerSpace <${process.env.EMAIL}>`,
    to: receiver,
    subject: subject,
    html: emailTemplate(html, opts),
    attachments,
    ...(opts.headers ? { headers: opts.headers } : {}),
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        reject(error);
      } else {
        console.log("Email sent:", info.response);
        resolve(info.response);
      }
    });
  });
};

module.exports = sendEmail;
