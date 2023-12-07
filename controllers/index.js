const Message = require("../models/message");
const User = require("../models/user");

const passport = require("passport");
const bcrypt = require("bcryptjs");

const { body, validationResult } = require("express-validator");

exports.index = async (req, res, next) => {
  try {
    const messages = await Message.find()
      .sort({ date: -1 })
      .populate("author")
      .exec();

    if (messages.length === 0) {
      const error = new Error("No messages found");
      error.status = 404;
      return next(error);
    } else {
      res.render("messages", {
        messages: messages,
      });
    }
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
          res.redirect("/");
        });
      }
    } catch (error) {
      return next(error);
    }
  },
];

exports.log_in_get = (req, res, next) => {
  res.render("log-in-form");
};

exports.log_in_post = passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/",
});
