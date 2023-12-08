const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, required: false, default: false },
  dateJoined: { type: Date, required: true, default: Date.now() },
});

UserSchema.index({ username: 1 });

UserSchema.virtual("url").get(function () {
  return `/user/${this.username}`;
});

module.exports = mongoose.model("user", UserSchema);
