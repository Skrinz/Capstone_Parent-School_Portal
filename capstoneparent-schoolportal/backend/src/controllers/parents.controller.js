const parentsService = require("../services/parents.service");
const usersService = require("../services/users.service");

const parentsController = {
  async submitRegistration(req, res, next) {
    try {
      const { student_ids } = req.body;
      const parent_id = req.user.user_id;

      const userRoles = (req.user.roles || []).map((r) => r.role);
      const files = req.files || [];

      if (userRoles.includes("Parent") && files.length === 0) {
        return res.status(400).json({
          error: "At least one file must be uploaded with the registration",
        });
      }

      let file_ids = undefined;
      if (files.length > 0) {
        const createdFiles = await usersService.createFiles(files, parent_id, {
          storageTarget: "parent_docs",
        });
        file_ids = createdFiles.map((f) => f.file_id);
      }

      const registration = await parentsService.submitRegistration({
        parent_id,
        student_ids,
        file_ids,
      });

      res.status(201).json({
        message: "Registration submitted successfully",
        data: registration,
      });
    } catch (error) {
      if (error.message === "Parent not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "One or more students not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "One or more files not found") {
        return res.status(404).json({ message: error.message });
      }
      if (
        error.message === "One or more students already have an active or pending registration under your account"
      ) {
        return res.status(409).json({ message: error.message });
      }
      next(error);
    }
  },

  async resubmitRegistration(req, res, next) {
    try {
      const { id } = req.params;
      const parent_id = req.user.user_id;
      const files = req.files || [];

      let file_ids = undefined;
      if (files.length > 0) {
        const createdFiles = await usersService.createFiles(files, parent_id, {
          storageTarget: "parent_docs",
        });
        file_ids = createdFiles.map((f) => f.file_id);
      }

      const registration = await parentsService.resubmitRegistration({
        pr_id: parseInt(id),
        parent_id,
        file_ids,
      });

      res.status(200).json({
        message: "Registration resubmitted successfully",
        data: registration,
      });
    } catch (error) {
      if (error.message === "Registration not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Access denied: You do not own this registration") {
        return res.status(403).json({ message: error.message });
      }
      if (error.message === "Only denied registrations can be resubmitted") {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  },

  async getAllRegistrations(req, res, next) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const result = await parentsService.getAllRegistrations({
        page,
        limit,
        status,
      });

      res.status(200).json({
        data: result.registrations,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  async getRegistrationById(req, res, next) {
    try {
      const { id } = req.params;
      const registration = await parentsService.getRegistrationById(
        parseInt(id),
      );

      res.status(200).json({
        data: registration,
      });
    } catch (error) {
      if (error.message === "Registration not found") {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  },

  async verifyRegistration(req, res, next) {
    try {
      const { id } = req.params;
      const { status, remarks } = req.body;
      const verified_by = req.user.user_id;

      const registration = await parentsService.verifyRegistration({
        pr_id: parseInt(id),
        status,
        remarks,
        verified_by,
      });

      res.status(200).json({
        message: "Registration verified successfully",
        data: registration,
      });
    } catch (error) {
      if (error.message === "Registration not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Registration has already been processed") {
        return res.status(409).json({ message: error.message });
      }
      if (error.message === "Verifier not found") {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  },

  async getMyRegistrations(req, res, next) {
    try {
      const parent_id = req.user.user_id;
      const registrations = await parentsService.getMyRegistrations(parent_id);

      res.status(200).json({
        data: registrations,
      });
    } catch (error) {
      next(error);
    }
  },

  async getMyChildren(req, res, next) {
    try {
      const parent_id = req.user.user_id;
      const children = await parentsService.getMyChildren(parent_id);

      res.status(200).json({
        data: children,
      });
    } catch (error) {
      if (error.message === "Parent not found") {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  },

  async getChildGrades(req, res, next) {
    try {
      const { studentId } = req.params;
      const parent_id = req.user.user_id;

      const grades = await parentsService.getChildGrades({
        parent_id,
        student_id: parseInt(studentId),
      });

      res.status(200).json({
        data: grades,
      });
    } catch (error) {
      if (error.message === "Access denied to this student record") {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  },

  async getChildAttendance(req, res, next) {
    try {
      const { studentId } = req.params;
      const parent_id = req.user.user_id;

      const attendance = await parentsService.getChildAttendance({
        parent_id,
        student_id: parseInt(studentId),
      });

      res.status(200).json({
        data: attendance,
      });
    } catch (error) {
      if (error.message === "Access denied to this student record") {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  },

  async getChildSchedule(req, res, next) {
    try {
      const { studentId } = req.params;
      const parent_id = req.user.user_id;

      const schedule = await parentsService.getChildSchedule({
        parent_id,
        student_id: parseInt(studentId),
      });

      res.status(200).json({
        data: schedule,
      });
    } catch (error) {
      if (error.message === "Access denied to this student record") {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  },

  async getChildLibraryRecords(req, res, next) {
    try {
      const { studentId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const parent_id = req.user.user_id;

      const result = await parentsService.getChildLibraryRecords({
        parent_id,
        student_id: parseInt(studentId),
        page,
        limit,
      });

      res.status(200).json({
        data: result.records,
        pagination: result.pagination,
      });
    } catch (error) {
      if (error.message === "Access denied to this student record") {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  },
};

module.exports = parentsController;
