const User = require("../models/Users");
const ErrorResponse = require("../utils/errorResponse");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const auth = {
  register: async (req, res, next) => {
    try {
      const { name, email } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        const registertoken = registerToken(name, email);
        const activationUrl = `http://localhost:3000/activate-account/${registertoken}`;
        const message = `
        <h1>Acitave Account</h1>
        <p>Please click this link to acitvate your account</p>
        <a href=${activationUrl}>Click Here</a>
      `;
        try {
          await sendEmail({
            to: email,
            subject: "Account Activation",
            text: message,
          });
          res
            .status(200)
            .json({ success: true, data: "Acitvation email sent" });
        } catch (err) {
          console.log(err);
          return next(new ErrorResponse("Email could not be sent", 500));
        }
      } else {
        return next(
          new ErrorResponse("This email address is already registered", 409)
        );
      }
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return next(
          new ErrorResponse("Please provide an email and password", 401)
        );
      }
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        return next(new ErrorResponse("Invalid Credentials", 401));
      }
      const isMatch = await user.matchPasswords(password);
      if (!isMatch) {
        return next(new ErrorResponse("Invalid Credentials", 401));
      }
      sendToken(user, 200, res);
    } catch (err) {
      next(err);
    }
  },

  forgotPassword: async (req, res, next) => {
    const { email } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return next(new ErrorResponse("Email could not be sent", 404));
      }
      const resetToken = user.getResetPasswordToken();
      await user.save();
      const resetUrl = `http://localhost:3000/password-reset/${resetToken}`;
      const message = `
        <h1>Reset Password</h1>
        <p>Please go to this link to reset your password</p>
        <a href=${resetUrl}>${resetUrl}</a>
      `;
      try {
        await sendEmail({
          to: user.email,
          subject: "Reset Password",
          text: message,
        });
        res.status(200).json({ success: true, data: "Email Sent" });
      } catch (err) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        console.log(err);
        return next(new ErrorResponse("Email could not be sent", 500));
      }
    } catch (err) {
      next(err);
    }
  },

  resetPassword: async (req, res, next) => {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.resetToken)
      .digest("hex");
    try {
      const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
      });
      if (!user) {
        return next(new ErrorResponse("Invalid reset link", 400));
      }
      user.password = req.body.password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      res.status(201).json({
        success: true,
        data: "Password reset success",
      });
    } catch (err) {
      next(err);
    }
  },

  activateAccount: async (req, res, next) => {
    try {
      const { name, email } = jwt.verify(
        req.params.registertoken,
        process.env.JWT_SECRET
      );
      const { password } = req.body;
      const user = await User.create({ name, email, password });
      sendToken(user, 201, res);
    } catch (err) {
      next(err);
    }
  },
};

const sendToken = (user, statusCode, res) => {
  const token = user.getSignedToken();
  res.status(statusCode).json({
    success: true,
    token,
  });
};

const registerToken = (name, email) => {
  return jwt.sign({ name, email }, process.env.JWT_SECRET, {
    expiresIn: "5m",
  });
};
module.exports = auth;
