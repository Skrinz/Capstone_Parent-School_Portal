const express = require("express");
const { body, param } = require("express-validator");
const usersController = require("../controllers/users.controller");
const validate = require("../middlewares/validation");
const { authenticate, authorize } = require("../middlewares/auth");

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all users (Admin, Principal only)
router.get("/", authorize("Admin", "Principal"), usersController.getAllUsers);

// Get user by ID
router.get("/:id", param("id").isInt(), validate, usersController.getUserById);

// Update user profile fields (fname, lname, contact_num, address)
router.put(
  "/:id",
  [
    param("id").isInt(),
    body("fname").optional().trim(),
    body("lname").optional().trim(),
    body("contact_num").optional(),
    body("address").optional(),
  ],
  validate,
  usersController.updateUser,
);

// Update account_status and/or roles in one request (Admin, Principal only)
// Body: { "account_status": "Active", "roles": ["Teacher", "Parent"] }
// Both fields are optional — supply one or both.
router.patch(
  "/:id/account",
  authorize("Admin", "Principal"),
  [
    param("id").isInt(),
    body("account_status")
      .optional()
      .isIn(["Active", "Inactive"])
      .withMessage("account_status must be Active or Inactive"),
    body("roles")
      .optional()
      .isArray({ min: 1 })
      .withMessage("roles must be a non-empty array"),
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

module.exports = router;
