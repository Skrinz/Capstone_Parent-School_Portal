const studentsService = require("../services/students.service");

const studentsController = {
  /**
   * GET /students/search?lrn=<digits>
   * Public — no auth required. Returns up to 10 enrolled students whose
   * lrn_number starts with the supplied prefix. Only exposes safe fields
   * (student_id, lrn_number, fname, lname, grade_level) for the
   * registration lookup UI.
   */
  async searchByLRN(req, res, next) {
    try {
      const { lrn } = req.query;
      const results = await studentsService.searchByLRN(lrn);
      res.status(200).json({ data: results });
    } catch (error) {
      next(error);
    }
  },

  async getAllStudents(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        grade_level,
        syear_start,
        clist_id,
      } = req.query;
      const result = await studentsService.getAllStudents({
        page,
        limit,
        status,
        grade_level,
        syear_start,
        clist_id,
      });

      res.status(200).json({
        data: result.students,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  async getStudentById(req, res, next) {
    try {
      const { id } = req.params;
      const student = await studentsService.getStudentById(parseInt(id));

      res.status(200).json({
        data: student,
      });
    } catch (error) {
      if (error.message === "Student not found") {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  },

  async createStudent(req, res, next) {
    try {
      const studentData = req.body;
      const student = await studentsService.createStudent(studentData);

      res.status(201).json({
        message: "Student created successfully",
        data: student,
      });
    } catch (error) {
      if (error.message === "Grade level not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "A student with this LRN already exists") {
        return res.status(409).json({ message: error.message });
      }
      next(error);
    }
  },

  async updateStudent(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const student = await studentsService.updateStudent(
        parseInt(id),
        updateData,
      );

      res.status(200).json({
        message: "Student updated successfully",
        data: student,
      });
    } catch (error) {
      if (error.message === "Student not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Grade level not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "A student with this LRN already exists") {
        return res.status(409).json({ message: error.message });
      }
      next(error);
    }
  },

  async deleteStudent(req, res, next) {
    try {
      const { id } = req.params;
      await studentsService.deleteStudent(parseInt(id));

      res.status(200).json({
        message: "Student deleted successfully",
      });
    } catch (error) {
      if (error.message === "Student not found") {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  },

  async getStudentGrades(req, res, next) {
    try {
      const { id } = req.params;
      const grades = await studentsService.getStudentGrades(parseInt(id));

      res.status(200).json({
        data: grades,
      });
    } catch (error) {
      if (error.message === "Student not found") {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  },

  async getStudentAttendance(req, res, next) {
    try {
      const { id } = req.params;
      const attendance = await studentsService.getStudentAttendance(
        parseInt(id),
      );

      res.status(200).json({
        data: attendance,
      });
    } catch (error) {
      if (error.message === "Student not found") {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  },
};

module.exports = studentsController;
