const express = require("express");
const { body, param, query } = require("express-validator");
const authController = require("../controllers/auth.controller");
const validate = require("../middlewares/validation");
const { authenticate, authorize } = require("../middlewares/auth");
const multer = require("multer");

const upload = multer({ dest: process.env.UPLOAD_PATH || "uploads/" });
const router = express.Router();

//http://localhost:5000/api/auth/register/parent
router.post(
  "/register/parent",
  upload.array("attachments", 10),
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
    body("fname").notEmpty().trim(),
    body("lname").notEmpty().trim(),
    body("contact_num").notEmpty().isNumeric(),
    body("address").notEmpty(),
    body("date_of_birth")
      .notEmpty()
      .withMessage("Date of birth is required")
      .isISO8601()
      .withMessage("Date of birth must be a valid date (YYYY-MM-DD)")
      .custom((value) => {
        const dob = new Date(value);
        const today = new Date();
        if (dob >= today) throw new Error("Date of birth must be in the past");
        return true;
      }),
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
  authController.registerParent,
);

//http://localhost:5000/api/auth/register/employee
router.post(
  "/register/employee",
  authenticate,
  authorize("Admin", "Principal", "Vice_Principal"),
  upload.array("attachments", 10), // Even if they don't upload attachments, multer handles it
  [
    body("email")
      .isEmail()
      .withMessage("A valid email address is required")
      .normalizeEmail()
      .custom((value) => {
        if (!value.endsWith("@deped.gov.ph")) {
          throw new Error("Email must be a @deped.gov.ph address");
        }
        return true;
      }),
    body("password").isLength({ min: 8 }),
    body("fname").notEmpty().trim(),
    body("lname").notEmpty().trim(),
    body("contact_num").notEmpty().isNumeric(),
    body("address").notEmpty(),
    body("date_of_birth")
      .notEmpty()
      .withMessage("Date of birth is required")
      .isISO8601()
      .withMessage("Date of birth must be a valid date (YYYY-MM-DD)")
      .custom((value) => {
        const dob = new Date(value);
        const today = new Date();
        if (dob >= today) throw new Error("Date of birth must be in the past");
        return true;
      }),
    body("roles")
      .customSanitizer((value) => {
        if (Array.isArray(value)) return value;
        if (value) return [value];
        return [];
      })
      .isArray({ min: 1 })
      .withMessage("Employee must have at least one role"),
    body("roles.*")
      .isIn(["Librarian", "Teacher", "Admin", "Principal", "Vice_Principal"])
      .withMessage(
        "Each role must be one of: Librarian, Teacher, Admin, Principal, Vice_Principal",
      ),
  ],
  validate,
  authController.registerEmployee,
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

//http://localhost:5000/api/auth/resend-registration-otp
router.post(
  "/resend-registration-otp",
  [
    body("email")
      .isEmail()
      .withMessage("A valid email address is required")
      .normalizeEmail(),
  ],
  validate,
  authController.resendRegistrationOTP,
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
      .optional()
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

//http://localhost:5000/api/auth/reset-password-info?token=...
router.get(
  "/reset-password-info",
  [
    query("token")
      .notEmpty()
      .withMessage("Token is required")
      .isHexadecimal()
      .withMessage("Invalid token format")
      .isLength({ min: 64, max: 64 })
      .withMessage("Invalid token length"),
  ],
  validate,
  authController.getResetPasswordInfo,
);

module.exports = router;
