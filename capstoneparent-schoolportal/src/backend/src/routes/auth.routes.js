const express = require("express");
const { body, param } = require("express-validator");
const authController = require("../controllers/auth.controller");
const validate = require("../middlewares/validation");
const { authenticate } = require("../middlewares/auth");
const multer = require("multer");

const upload = multer({ dest: process.env.UPLOAD_PATH || "uploads/" });
const router = express.Router();

// ─── Registration (2-step: initiate → verify) ──────────────────────────────

// Step 1: Validate data, store pending, send OTP — no DB write yet
router.post(
  "/register",
  upload.array("attachments", 10),
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
    body("fname").notEmpty().trim(),
    body("lname").notEmpty().trim(),
    body("contact_num").notEmpty(),
    body("address").notEmpty(),
    body("role")
      .optional()
      .isIn([
        "Parent",
        "Librarian",
        "Teacher",
        "Admin",
        "Principal",
        "Vice_Principal",
      ]),
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

// Step 2: Verify OTP → create account as Inactive
// Response includes the first deviceToken — client must store it
router.post(
  "/verify-registration-otp",
  [
    body("email").isEmail().normalizeEmail(),
    body("otpCode").isLength({ min: 6, max: 6 }),
  ],
  validate,
  authController.verifyRegistrationOTP,
);

// Alias for clients using verify-otp-code naming
router.post(
  "/verify-otp-code",
  [
    body("email").isEmail().normalizeEmail(),
    body("otpCode").isLength({ min: 6, max: 6 }),
  ],
  validate,
  authController.verifyRegistrationOTP,
);

// ─── Login ──────────────────────────────────────────────────────────────────
// Requires email + password + deviceToken.
// Returns a JWT immediately when all three are valid.
//
// No deviceToken yet? Complete the OTP flow first:
//   POST /send-otp → POST /verify-otp → store the returned deviceToken
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

// ─── OTP — New Device / First Login ─────────────────────────────────────────
// Step 1: Request OTP (email must belong to an existing account)
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

// Step 2: Verify OTP → get JWT + fresh deviceToken
// Store the returned deviceToken — it is required for POST /login
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

// ─── Password Reset (public — no auth required) ──────────────────────────────

// Request a reset link
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

// Submit new password using the token from the reset link
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

// ─── Authenticated routes ────────────────────────────────────────────────────

router.post("/logout", authenticate, authController.logout);
router.get("/me", authenticate, authController.getCurrentUser);
router.get("/trusted-devices", authenticate, authController.getTrustedDevices);
router.delete(
  "/trusted-devices/:id",
  authenticate,
  param("id").isInt(),
  validate,
  authController.removeTrustedDevice,
);

module.exports = router;
