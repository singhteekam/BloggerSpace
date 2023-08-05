const mongoose = require("mongoose");

const visitSchema = new mongoose.Schema({
  count: { type: Number, default: 0 },
});

const Visitor = mongoose.model("Visitor", visitSchema);

module.exports = Visitor;