const Message = require("../models/message");
const User = require("../models/user");

const passport = require("passport");
const bcrypt = require("bcryptjs");

const { body, validationResult } = require("express-validator");

exports.index = async (req, res, next) => {
  try {
    const messages = await Message.find({ isReply: false })
      .populate("user", "username")
      .populate({
        path: "replies",
        populate: { path: "user", select: "username" },
      })
      .sort({ dateSent: -1 })
      .exec();
    console.log(messages[0].replies);
    res.render("index", {
      messages: messages,
    });
  } catch (error) {
    next(error);
  }
};

exports.sign_up_get = (req, res, next) => {
  res.render("sign-up-form");
};

exports.sign_up_post = [
  body("username")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters")
    // Checks username availability
    .custom(async (value) => {
      const user = await User.findOne({ username: value }).exec();
      if (user) {
        throw new Error(
          "Username has already been taken, please try another username"
        );
      }
      return true;
    })
    .escape(),
  body("password")
    .trim()
    // Checks if password fits the minimum requirements
    .custom((value) => {
      const hasUppercase = /[A-Z]/.test(value);
      const hasNumber = /\d/.test(value);

      if (!(hasUppercase && hasNumber && value.length >= 8)) {
        throw new Error(
          "Password must be 8 characters, contain 1 uppercase character, and 1 number"
        );
      }

      return true;
    })
    // Checks if passwords match
    .custom((value, { req, loc, path }) => {
      if (value !== req.body.password_confirmation) {
        throw new Error("Passwords don't match");
      } else {
        return value;
      }
    })
    .escape(),

  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.render("sign-up-form", {
          errors: errors.array(),
          user: {
            username: req.body.username,
            password: req.body.password,
            password_confirmation: req.body.password_confirmation,
          },
        });
      } else {
        bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
          if (err) {
            return err;
          }
          const user = new User({
            username: req.body.username,
            password: hashedPassword,
          });
          const result = await user.save();
          req.login(user, function (err) {
            if (err) {
              return next(err);
            }
            return res.redirect("/");
          });
        });
      }
    } catch (error) {
      return next(error);
    }
  },
];

exports.log_in_get = (req, res, next) => {
  res.render("log-in-form", {
    loginError: req.session.messages,
  });
};

exports.log_in_post = passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/login",
  failureMessage: true,
});

exports.log_out_get = (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
};

exports.new_message_get = (req, res, next) => {
  res.render("new-message", { title: "New message" });
};

exports.new_message_post = [
  body("message").trim().escape(),
  async (req, res, next) => {
    try {
      const message = new Message({
        text: req.body.message,
        user: req.user.id,
      });
      await message.save();
      res.redirect("/");
    } catch (error) {
      return next(error);
    }
  },
];

exports.reply_get = (req, res, next) => {
  res.render("new-message", { title: "New reply" });
};

exports.reply_post = [
  body("message").trim().escape(),
  async (req, res, next) => {
    try {
      const message = new Message({
        text: req.body.message,
        user: req.user.id,
        isReply: true,
      });
      await message.save();
      await Message.updateOne(
        { _id: req.params.id },
        { $push: { replies: message } }
      );

      res.redirect("/");
    } catch (error) {
      return next(error);
    }
  },
];
