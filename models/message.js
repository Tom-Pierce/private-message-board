const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  text: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: "user", required: true },
  dateSent: { type: Date, required: true, default: Date.now() },
  likes: { type: Number, required: true, default: 0 },
});

module.exports = mongoose.model("message", MessageSchema);
