const mongoose = require("mongoose");

const visitorLogSchema = new mongoose.Schema({
  page: { type: String, required: true },
  visitorId: { type: String, default: "" }, // anonymous browser UUID (localStorage) for dedup
  device: { type: String, default: "desktop" }, // desktop | mobile | tablet
  browser: { type: String, default: "" },   // Chrome | Firefox | Safari | Edge | Opera | …
  os: { type: String, default: "" },         // Windows | macOS | Android | iOS | Linux | …
  country: { type: String, default: "" },    // ISO-2 country code from proxy header (best-effort)
  ipHash: { type: String, default: "" },     // salted HMAC of IP — no raw IP stored (privacy-safe)
  referrer: { type: String, default: "" },
  dayKey: { type: String, required: true },   // YYYY-MM-DD (IST)
  weekKey: { type: String, required: true },  // YYYY-Www (IST)
  monthKey: { type: String, required: true }, // YYYY-MM (IST)
  timestamp: { type: Date, default: Date.now },
}, { timestamps: false });

// Auto-delete after 90 days
visitorLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });
visitorLogSchema.index({ dayKey: 1 });
visitorLogSchema.index({ visitorId: 1, timestamp: -1 });
visitorLogSchema.index({ page: 1 });
visitorLogSchema.index({ country: 1 });

module.exports = mongoose.model("VisitorLog", visitorLogSchema);
