const mongoose = require("mongoose");

const IST_OFFSET = 330;
const istNow = () => new Date(new Date().getTime() + IST_OFFSET * 60000);

// One document per browser/device FCM token, tied to a logged-in user.
// Tokens are upserted on registration and removed when the user disables
// notifications or when FCM reports the token as no longer valid.
const fcmTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  enabled: { type: Boolean, default: true },
  userAgent: { type: String, default: "" },
  createdAt: { type: Date, default: istNow },
  lastUsedAt: { type: Date, default: istNow },
});

// Fast lookup of all sendable tokens (the scheduled job's main query) and of a
// single user's tokens (for the test send + per-user toggle).
fcmTokenSchema.index({ enabled: 1 });
fcmTokenSchema.index({ userId: 1 });

module.exports = mongoose.model("FcmToken", fcmTokenSchema);
