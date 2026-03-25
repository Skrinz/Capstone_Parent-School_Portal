const express = require("express");
const { body, param } = require("express-validator");
const usersController = require("../controllers/users.controller");
const validate = require("../middlewares/validation");
const { authenticate, authorize } = require("../middlewares/auth");

const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all users (Admin, Principal only)
router.get("/", authorize("Admin", "Principal"), usersController.getAllUsers);

// Get user by ID
router.get("/:id", param("id").isInt(), validate, usersController.getUserById);

// Update user profile fields (fname, lname, contact_num, address, email, date_of_birth)
router.put(
  "/:id",
  [
    param("id").isInt(),
    body("fname").optional().trim(),
    body("lname").optional().trim(),
    body("contact_num").optional(),
    body("address").optional(),
    body("email").optional().isEmail().withMessage("Invalid email format"),
    body("date_of_birth").optional().isISO8601().withMessage("Invalid date format"),
  ],
  validate,
  usersController.updateUser,
);

// Upload user profile picture
router.post(
  "/:id/photo",
  upload.single("photo"),
  [param("id").isInt()],
  validate,
  usersController.uploadPhoto,
);

// Update account_status and/or roles in one request (Admin, Principal only)
// Body: { "account_status": "Active", "roles": ["Teacher", "Parent"] }
// Both fields are optional — supply one or both.
router.patch(
  "/:id/account",
  authorize("Admin"),
  [
    param("id").isInt(),
    body("account_status")
      .optional()
      .isIn(["Active", "Inactive"])
      .withMessage("Account status must be Active or Inactive"),
    body("roles")
      .optional()
      .isArray({ min: 1 })
      .withMessage("Roles must be a non-empty array"),
    body("roles.*")
      .optional()
      .isIn([
        "Parent",
        "Librarian",
        "Teacher",
        "Admin",
        "Principal",
        "Vice_Principal",
      ])
      .withMessage(
        "Each role must be one of: Parent, Librarian, Teacher, Admin, Principal, Vice_Principal",
      ),
  ],
  validate,
  usersController.updateAccountSettings,
);

// Assign a single role (Admin, Principal only)
router.post(
  "/:id/roles",
  authorize("Admin", "Principal"),
  [
    param("id").isInt(),
    body("role").isIn([
      "Parent",
      "Librarian",
      "Teacher",
      "Admin",
      "Principal",
      "Vice_Principal",
    ]),
  ],
  validate,
  usersController.assignRole,
);

// Remove a single role (Admin, Principal only)
router.delete(
  "/:id/roles/:roleId",
  authorize("Admin", "Principal"),
  [param("id").isInt(), param("roleId").isInt()],
  validate,
  usersController.removeRole,
);

// Change own password (authenticated user)
router.patch(
  "/:id/password",
  [
    param("id").isInt(),
    body("currentPassword")
      .notEmpty()
      .withMessage("currentPassword is required"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("newPassword must be at least 8 characters"),
  ],
  validate,
  usersController.changePassword,
);

module.exports = router;

