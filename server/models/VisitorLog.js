const mongoose = require("mongoose");

const visitorLogSchema = new mongoose.Schema({
  page: { type: String, required: true },
  visitorId: { type: String, default: "" }, // anonymous browser UUID for deduplication
  device: { type: String, default: "desktop" }, // desktop | mobile | tablet
  referrer: { type: String, default: "" },
  dayKey: { type: String, required: true },   // YYYY-MM-DD
  weekKey: { type: String, required: true },  // YYYY-WW
  monthKey: { type: String, required: true }, // YYYY-MM
  timestamp: { type: Date, default: Date.now },
}, { timestamps: false });

// Auto-delete after 90 days
visitorLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });
visitorLogSchema.index({ dayKey: 1 });
visitorLogSchema.index({ visitorId: 1, dayKey: 1 });
visitorLogSchema.index({ page: 1 });

module.exports = mongoose.model("VisitorLog", visitorLogSchema);
