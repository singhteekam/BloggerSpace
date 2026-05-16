const mongoose = require("mongoose");

const IST_OFFSET = 330;

const newsletterSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  message: { type: String, required: true },
  recipients: [{ email: String, name: String }],
  recipientCount: { type: Number, default: 0 },
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "users", default: null },
  sentAt: {
    type: Date,
    default: () => new Date(new Date().getTime() + IST_OFFSET * 60000),
  },
});

module.exports = mongoose.model("Newsletter", newsletterSchema);
