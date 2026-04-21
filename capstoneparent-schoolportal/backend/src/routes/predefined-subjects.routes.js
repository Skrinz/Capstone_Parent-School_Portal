const express = require("express");
const { body, param } = require("express-validator");
const predefinedSubjectsController = require("../controllers/predefined-subjects.controller");
const validate = require("../middlewares/validation");
const { authenticate, authorize } = require("../middlewares/auth");

const router = express.Router();

router.use(authenticate);
router.use(authorize("Admin", "Principal"));

router.get("/", predefinedSubjectsController.getAllSubjects);

router.get("/archived", predefinedSubjectsController.getArchivedSubjects);

router.post(
  "/subjects",
  body("name").notEmpty().withMessage("Subject name is required"),
  validate,
  predefinedSubjectsController.createSubject,
);

router.delete(
  "/subjects/:subjectId",
  param("subjectId").isInt(),
  validate,
  predefinedSubjectsController.archiveSubject,
);

router.put(
  "/subjects/:subjectId/unarchive",
  param("subjectId").isInt(),
  validate,
  predefinedSubjectsController.unarchiveSubject,
);

router.get(
  "/grade-levels/:gradeLevelId",
  param("gradeLevelId").isInt(),
  validate,
  predefinedSubjectsController.getSubjectsByGradeLevel,
);

router.post(
  "/grade-levels/:gradeLevelId",
  [
    param("gradeLevelId").isInt(),
    body("subject_id").isInt().withMessage("Subject is required"),
  ],
  validate,
  predefinedSubjectsController.assignSubjectToGradeLevel,
);

router.delete(
  "/grade-levels/:gradeLevelId/subjects/:subjectId",
  [
    param("gradeLevelId").isInt(),
    param("subjectId").isInt(),
  ],
  validate,
  predefinedSubjectsController.removeSubjectFromGradeLevel,
);

module.exports = router;
