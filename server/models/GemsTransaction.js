const mongoose = require("mongoose");

const IST_OFFSET = 330;

const gemsTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  blogId: { type: mongoose.Schema.Types.ObjectId, ref: "Blog", required: true },
  blogTitle: { type: String, default: "" },
  blogSlug: { type: String, default: "" },
  type: { type: String, enum: ["AWARD", "DEDUCT"], required: true },
  role: { type: String, enum: ["AUTHOR", "REVIEWER"], required: true },
  amount: { type: Number, required: true },
  awardedBy: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
  createdAt: {
    type: Date,
    default: () => new Date(new Date().getTime() + IST_OFFSET * 60000),
  },
});

module.exports = mongoose.model("GemsTransaction", gemsTransactionSchema);
