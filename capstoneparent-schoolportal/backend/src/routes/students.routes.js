const express = require("express");
const { body, param, query } = require("express-validator");
const multer = require("multer");
const studentsController = require("../controllers/students.controller");
const validate = require("../middlewares/validation");
const { authenticate, authorize } = require("../middlewares/auth");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ─── Public route — no authentication required ───────────────────────────────
// Used during parent registration to look up a student by LRN before the
// parent account exists. Returns only safe, non-sensitive fields.
router.get(
  "/search",
  [
    query("lrn")
      .notEmpty()
      .withMessage("LRN is required")
      .isNumeric()
      .withMessage("LRN must be numeric")
      .isLength({ min: 1, max: 20 })
      .withMessage("LRN must be between 1 and 20 digits"),
  ],
  validate,
  studentsController.searchByLRN,
);

// ─── All routes below require authentication ─────────────────────────────────
router.use(authenticate);

router.get(
  "/lookup",
  authorize("Teacher", "Admin", "Principal"),
  [
    query("q")
      .notEmpty()
      .withMessage("Search query is required")
      .isLength({ min: 1, max: 100 })
      .withMessage("Search query must be between 1 and 100 characters"),
  ],
  validate,
  studentsController.lookupStudents,
);

// Get all students
router.get(
  "/",
  authorize("Teacher", "Admin", "Principal"),
  [
    query("status")
      .optional()
      .isIn(["ENROLLED", "GRADUATED", "TRANSFERRED", "DROPPED", "SUSPENDED"]),
    query("grade_level").optional().isInt(),
    query("syear_start").optional().isInt(),
    query("clist_id").optional().isInt(),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 1000 }),
    query("search").optional().isString(),
  ],
  validate,
  studentsController.getAllStudents,
);

router.get(
  "/import-template",
  authorize("Admin", "Principal", "Teacher"),
  studentsController.getImportTemplate,
);

// Get student by ID
router.get(
  "/:id",
  param("id").isInt(),
  validate,
  studentsController.getStudentById,
);

// Create student
router.post(
  "/",
  authorize("Admin", "Principal", "Teacher"),
  [
    body("fname").notEmpty().trim(),
    body("lname").notEmpty().trim(),
    body("sex").isIn(["Male", "Female", "M", "F"]),
    body("lrn_number")
      .notEmpty()
      .withMessage("LRN is required")
      .isNumeric()
      .withMessage("LRN must be numeric")
      .isLength({ min: 12, max: 12 })
      .withMessage("LRN must be exactly 12 digits"),
    body("gl_id").isInt(),
    body("syear_start").isInt({ min: 2000, max: 2100 }),
    body("syear_end").isInt({ min: 2000, max: 2100 }),
    body("status")
      .optional()
      .isIn(["ENROLLED", "GRADUATED", "TRANSFERRED", "DROPPED", "SUSPENDED"]),
  ],
  validate,
  studentsController.createStudent,
);

// Import students via CSV
router.post(
  "/import",
  authorize("Admin", "Principal", "Teacher"),
  upload.single("file"),
  validate,
  studentsController.importStudents,
);

// Update student
router.put(
  "/:id",
  authorize("Admin", "Principal", "Teacher"),
  [
    param("id").isInt(),
    body("fname").optional().trim(),
    body("lname").optional().trim(),
    body("sex").optional().isIn(["Male", "Female", "M", "F"]),
    body("lrn_number")
      .optional()
      .isNumeric()
      .withMessage("LRN must be numeric")
      .isLength({ min: 12, max: 12 })
      .withMessage("LRN must be exactly 12 digits"),
    body("gl_id").optional().isInt(),
    body("syear_start").optional().isInt({ min: 2000, max: 2100 }),
    body("syear_end").optional().isInt({ min: 2000, max: 2100 }),
    body("status")
      .optional()
      .isIn(["ENROLLED", "GRADUATED", "TRANSFERRED", "DROPPED", "SUSPENDED"]),
  ],
  validate,
  studentsController.updateStudent,
);

// Delete student
router.delete(
  "/:id",
  authorize("Admin", "Principal"),
  param("id").isInt(),
  validate,
  studentsController.deleteStudent,
);

// Get student grades
router.get(
  "/:id/grades",
  param("id").isInt(),
  validate,
  studentsController.getStudentGrades,
);

router.get(
  "/:id/export-grades",
  authorize("Teacher", "Admin", "Principal"),
  param("id").isInt(),
  validate,
  studentsController.exportQuarterlyGrades,
);

// Get student attendance
router.get(
  "/:id/attendance",
  param("id").isInt(),
  validate,
  studentsController.getStudentAttendance,
);

module.exports = router;
