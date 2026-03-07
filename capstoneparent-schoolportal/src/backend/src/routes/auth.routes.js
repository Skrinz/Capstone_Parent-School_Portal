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
    body("student_ids").optional().isArray({ min: 1 }),
    body("student_ids.*").optional().isInt(),
  ],
  validate,
  authController.register,
);

// Step 2: Verify OTP → create account as Inactive
router.post(
  "/verify-registration-otp",
  [
    body("email").isEmail().normalizeEmail(),
    body("otpCode").isLength({ min: 6, max: 6 }),
  ],
  validate,
  authController.verifyRegistrationOTP,
);

// ─── Login ──────────────────────────────────────────────────────────────────

router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty(),
    body("deviceToken").optional().isString().isLength({ min: 10 }),
  ],
  validate,
  authController.login,
);

// ─── OTP (general-purpose / post-login MFA) ─────────────────────────────────

router.post(
  "/send-otp",
  [body("email").isEmail().normalizeEmail()],
  validate,
  authController.sendOTP,
);
router.post(
  "/verify-otp",
  [
    body("email").isEmail().normalizeEmail(),
    body("otpCode").isLength({ min: 6, max: 6 }),
  ],
  validate,
  authController.verifyOTP,
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
