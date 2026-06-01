const mongoose = require("mongoose");

const IST_OFFSET = 330;
const istNow = () => new Date(new Date().getTime() + IST_OFFSET * 60000);

// One document per notification actually sent — the admin audit/history trail of
// when a digest went out and exactly what content was delivered.
const notificationLogSchema = new mongoose.Schema({
  title: { type: String, default: "" },
  body: { type: String, default: "" },
  link: { type: String, default: "" },
  // Snapshot of the blogs included (kept even if a blog is later deleted/renamed).
  blogs: [
    {
      blogId: { type: mongoose.Schema.Types.ObjectId, ref: "Blog" },
      title: { type: String, default: "" },
      slug: { type: String, default: "" },
    },
  ],
  recipients: { type: Number, default: 0 }, // tokens targeted
  success: { type: Number, default: 0 },
  failure: { type: Number, default: 0 },
  pruned: { type: Number, default: 0 }, // invalid tokens removed
  trigger: { type: String, enum: ["scheduled", "manual", "test"], default: "scheduled" },
  sentAt: { type: Date, default: istNow },
});

// Newest-first history listing.
notificationLogSchema.index({ sentAt: -1 });

module.exports = mongoose.model("NotificationLog", notificationLogSchema);
