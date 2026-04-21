const predefinedSubjectsService = require("../services/predefined-subjects.service");

const isMissingGradeLevelSubjectsTable = (error) =>
  error?.code === "P2021" &&
  error?.meta?.table === "public.grade_level_subjects";

const predefinedSubjectsController = {
  async getAllSubjects(_req, res, next) {
    try {
      const subjects = await predefinedSubjectsService.getAllSubjects();
      res.status(200).json({ data: subjects });
    } catch (error) {
      if (isMissingGradeLevelSubjectsTable(error)) {
        return res.status(503).json({
          message:
            "Database migration required: apply migration 20260415120000_add_grade_level_subjects before using predefined subjects.",
        });
      }
      next(error);
    }
  },

  async createSubject(req, res, next) {
    try {
      const subject = await predefinedSubjectsService.createSubject(req.body.name);
      res.status(201).json({
        message: "Subject created successfully",
        data: subject,
      });
    } catch (error) {
      if (error.message === "Subject name is required") {
        return res.status(400).json({ message: error.message });
      }
      if (error.message === "Subject name already exists" || error.code === "P2002") {
        return res.status(409).json({ message: "Subject name already exists" });
      }
      if (isMissingGradeLevelSubjectsTable(error)) {
        return res.status(503).json({
          message:
            "Database migration required: apply migration 20260415120000_add_grade_level_subjects before using predefined subjects.",
        });
      }
      next(error);
    }
  },

  async archiveSubject(req, res, next) {
    try {
      await predefinedSubjectsService.archiveSubject(parseInt(req.params.subjectId, 10));
      res.status(200).json({ message: "Subject archived successfully" });
    } catch (error) {
      if (error.message === "Subject not found") {
        return res.status(404).json({ message: error.message });
      }
      if (isMissingGradeLevelSubjectsTable(error)) {
        return res.status(503).json({
          message:
            "Database migration required: apply migration 20260415120000_add_grade_level_subjects before using predefined subjects.",
        });
      }
      next(error);
    }
  },

  async getArchivedSubjects(req, res, next) {
    console.log("GET /archived route hit");
    try {
      const subjects = await predefinedSubjectsService.getArchivedSubjects();
      res.status(200).json({ data: subjects });
    } catch (error) {
      next(error);
    }
  },

  async unarchiveSubject(req, res, next) {
    try {
      await predefinedSubjectsService.unarchiveSubject(parseInt(req.params.subjectId, 10));
      res.status(200).json({ message: "Subject restored successfully" });
    } catch (error) {
      if (error.message === "Subject not found" || error.message === "Subject is not archived") {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  },

  async getSubjectsByGradeLevel(req, res, next) {
    try {
      const items = await predefinedSubjectsService.getSubjectsByGradeLevel(
        parseInt(req.params.gradeLevelId, 10),
      );
      res.status(200).json({ data: items });
    } catch (error) {
      if (error.message === "Grade level not found") {
        return res.status(404).json({ message: error.message });
      }
      if (isMissingGradeLevelSubjectsTable(error)) {
        return res.status(503).json({
          message:
            "Database migration required: apply migration 20260415120000_add_grade_level_subjects before using predefined subjects.",
        });
      }
      next(error);
    }
  },

  async assignSubjectToGradeLevel(req, res, next) {
    try {
      const item = await predefinedSubjectsService.assignSubjectToGradeLevel(
        parseInt(req.params.gradeLevelId, 10),
        parseInt(req.body.subject_id, 10),
      );
      res.status(201).json({
        message: "Subject assigned to grade level successfully",
        data: item,
      });
    } catch (error) {
      if (
        error.message === "Grade level not found" ||
        error.message === "Subject not found"
      ) {
        return res.status(404).json({ message: error.message });
      }
      if (error.code === "P2002") {
        return res.status(409).json({ message: "Subject is already assigned to this grade level" });
      }
      if (isMissingGradeLevelSubjectsTable(error)) {
        return res.status(503).json({
          message:
            "Database migration required: apply migration 20260415120000_add_grade_level_subjects before using predefined subjects.",
        });
      }
      next(error);
    }
  },

  async removeSubjectFromGradeLevel(req, res, next) {
    try {
      await predefinedSubjectsService.removeSubjectFromGradeLevel(
        parseInt(req.params.gradeLevelId, 10),
        parseInt(req.params.subjectId, 10),
      );
      res.status(200).json({ message: "Subject removed from grade level successfully" });
    } catch (error) {
      if (error.message === "Predefined subject assignment not found") {
        return res.status(404).json({ message: error.message });
      }
      if (isMissingGradeLevelSubjectsTable(error)) {
        return res.status(503).json({
          message:
            "Database migration required: apply migration 20260415120000_add_grade_level_subjects before using predefined subjects.",
        });
      }
      next(error);
    }
  },
};

module.exports = predefinedSubjectsController;
