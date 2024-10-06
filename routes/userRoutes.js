const express = require("express");
const { check } = require("express-validator");
const userController = require("../controllers/userController");
const router = express.Router();
const passport = require("passport");

const auth = require("../middleware/auth");

router.post(
  "/register",
  [
    check("name").notEmpty().withMessage("Name is required"),
    check("email").isEmail().withMessage("Please enter a valid email"),
    check("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  userController.register
);

router.post("/login", userController.login);

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/");
  }
);

router.post("/verify-phone", auth, userController.sendPhoneVerification);
router.post("/confirm-phone", auth, userController.confirmPhoneVerification);

router.post("/forgot-password", userController.forgotPassword);
router.post("/reset-password", userController.resetPassword);

router.post("/logout", auth, userController.logout);

module.exports = router;
