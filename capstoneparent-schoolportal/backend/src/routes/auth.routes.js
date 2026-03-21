const express = require("express");
const { body, param, query } = require("express-validator");
const authController = require("../controllers/auth.controller");
const validate = require("../middlewares/validation");
const { authenticate } = require("../middlewares/auth");
const multer = require("multer");

const upload = multer({ dest: process.env.UPLOAD_PATH || "uploads/" });
const router = express.Router();

//http://localhost:5000/api/auth/register
router.post(
  "/register",
  upload.array("attachments", 10),
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
    body("fname").notEmpty().trim(),
    body("lname").notEmpty().trim(),
    body("contact_num").notEmpty().isNumeric(),
    body("address").notEmpty(),
    body("roles")
      .optional()
      .isArray({ min: 1 })
      .withMessage("roles must be a non-empty array"),
    body("roles.*")
      .isIn(["Librarian", "Teacher", "Admin", "Principal", "Vice_Principal"])
      .withMessage(
        "Each role must be one of: Librarian, Teacher, Admin, Principal, Vice_Principal",
      ),
    body("student_ids")
      .optional()
      .customSanitizer((value) => {
        if (Array.isArray(value)) return value;
        return [value];
      }),
    body("student_ids").optional().isArray({ min: 1 }),
    body("student_ids.*").optional().isInt(),
  ],
  validate,
  authController.register,
);

//http://localhost:5000/api/auth/verify-registration-otp
router.post(
  "/verify-registration-otp",
  [
    body("email").isEmail().normalizeEmail(),
    body("otpCode").isLength({ min: 6, max: 6 }),
  ],
  validate,
  authController.verifyRegistrationOTP,
);

//http://localhost:5000/api/auth/login
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("A valid email address is required")
      .normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
    body("deviceToken")
      .notEmpty()
      .withMessage("Device token is required")
      .isString()
      .withMessage("Device token must be a string")
      .isLength({ min: 64, max: 64 })
      .withMessage("Invalid device token format"),
  ],
  validate,
  authController.login,
);

//http://localhost:5000/api/auth/send-otp
router.post(
  "/send-otp",
  [
    body("email")
      .isEmail()
      .withMessage("A valid email address is required")
      .normalizeEmail(),
  ],
  validate,
  authController.sendOTP,
);

//http://localhost:5000/api/auth/verify-otp
router.post(
  "/verify-otp",
  [
    body("email")
      .isEmail()
      .withMessage("A valid email address is required")
      .normalizeEmail(),
    body("otpCode")
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP must be exactly 6 digits"),
  ],
  validate,
  authController.verifyOTP,
);

//http://localhost:5000/api/auth/forgot-password
router.post(
  "/forgot-password",
  [
    body("email")
      .isEmail()
      .withMessage("A valid email address is required")
      .normalizeEmail(),
  ],
  validate,
  authController.forgotPassword,
);

//http://localhost:5000/api/auth/reset-password
router.post(
  "/reset-password",
  [
    body("token")
      .notEmpty()
      .withMessage("Reset token is required")
      .isHexadecimal()
      .withMessage("Invalid reset token format")
      .isLength({ min: 64, max: 64 })
      .withMessage("Invalid reset token length"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters"),
  ],
  validate,
  authController.resetPassword,
);

//http://localhost:5000/api/auth/logout
router.post("/logout", authenticate, authController.logout);

module.exports = router;
