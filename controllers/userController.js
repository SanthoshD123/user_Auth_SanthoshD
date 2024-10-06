const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    user = new User({
      name,
      email,
      password,
    });

    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(201).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.googleAuthCallback = (req, res) => {
  const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  res.json({ token });
};

exports.sendPhoneVerification = async (req, res) => {
  try {
    const otp = "123456"; // Fixed OTP for testing
    req.user.phoneOtp = otp;
    req.user.phoneOtpExpires = Date.now() + 600000;
    await req.user.save();

    console.log(`OTP for ${req.user.email}: ${otp}`);
    res.json({ message: "OTP sent successfully. Use '123456' for testing." });
  } catch (error) {
    console.error("Error in sendPhoneVerification:", error);
    res.status(500).json({ message: "Error generating OTP" });
  }
};

exports.confirmPhoneVerification = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!req.user.phoneOtp || Date.now() > req.user.phoneOtpExpires) {
      return res.status(400).json({ message: "OTP expired or not found" });
    }

    if (req.user.phoneOtp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    req.user.isPhoneVerified = true;
    req.user.phoneOtp = undefined;
    req.user.phoneOtpExpires = undefined;
    await req.user.save();

    res.json({ message: "Phone number verified successfully" });
  } catch (error) {
    console.error("Error in confirmPhoneVerification:", error);
    res.status(500).json({ message: "Phone verification failed" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    console.log(`Reset token for ${email}: ${resetToken}`);
    res.json({
      message:
        "Password reset token generated. Check server console for token.",
      resetToken: resetToken,
    });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    res.status(500).json({ message: "Error generating reset token" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.status(500).json({ message: "Password reset failed" });
  }
};

exports.logout = (req, res) => {
  // In a real application,might want to invalidate the token on the server-side
  // For simplicity, I just send a success response
  res.json({ message: "Logged out successfully" });
};
