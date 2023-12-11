const Message = require("../models/message");
const User = require("../models/user");

exports.user_get = async (req, res, next) => {
  const user = await User.findOne({ username: req.params.username }).exec();
  const userMessages = await Message.find({ user: user._id })
    .sort({ dateSent: -1 })
    .populate({
      path: "replies",
      populate: { path: "user", select: "username" },
    })
    .exec();

  res.render("user_view", {
    user: user,
    messages: userMessages,
  });
};
