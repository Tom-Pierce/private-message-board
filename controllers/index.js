const Message = require("../models/message");
const User = require("../models/user");

const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");

const { body, validationResult } = require("express-validator");

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username: username });
      if (!user) {
        return done(null, false, { message: "Incorrect username or password" });
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return done(null, false, { message: "Incorrect username or password" });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

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
  body("email")
    .trim()
    .isEmail()
    .withMessage("Invalid email provided")
    // Checks email availability
    .custom(async (value) => {
      const user = await User.findOne({ email: value }).exec();
      if (user) {
        throw new Error("Email is already being used, please try another");
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
            email: req.body.email,
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
            email: req.body.email,
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
