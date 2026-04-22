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

  async lookupStudents(req, res, next) {
    try {
      const { q } = req.query;
      const results = await studentsService.lookupStudents(q);
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
        search,
      } = req.query;
      const result = await studentsService.getAllStudents({
        page,
        limit,
        status,
        grade_level,
        syear_start,
        clist_id,
        search,
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

  async importStudents(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileContent = req.file.buffer.toString("utf8");
      const lines = fileContent.split(/\r?\n/).filter((line) => line.trim() !== "");
      const headers = lines[0].split(",").map((header) => header.trim().toLowerCase());

      const fnameIdx = headers.indexOf("first name");
      const lnameIdx = headers.indexOf("last name");
      const sexIdx = headers.indexOf("sex");
      const lrnIdx = headers.indexOf("lrn number");
      const gradeLevelIdx = headers.indexOf("grade level");
      const syearStartIdx = headers.indexOf("school year start");
      const syearEndIdx = headers.indexOf("school year end");

      if (
        fnameIdx === -1 ||
        lnameIdx === -1 ||
        lrnIdx === -1 ||
        gradeLevelIdx === -1 ||
        syearStartIdx === -1 ||
        syearEndIdx === -1
      ) {
        return res.status(400).json({
          message: "Invalid CSV format: Required columns missing",
        });
      }

      const rows = lines.slice(1).map((line) => {
        const cols = line.split(",");
        return {
          fname: cols[fnameIdx]?.trim(),
          lname: cols[lnameIdx]?.trim(),
          sex: cols[sexIdx]?.trim(),
          lrn: cols[lrnIdx]?.trim(),
          grade_level: cols[gradeLevelIdx]?.trim(),
          syear_start: cols[syearStartIdx]?.trim(),
          syear_end: cols[syearEndIdx]?.trim(),
        };
      });

      const students = await studentsService.importStudents(rows);

      res.status(200).json({
        message: "Students imported successfully",
        data: students,
      });
    } catch (error) {
      if (
        error.message === "A student with this LRN already exists" ||
        error.message.startsWith("Invalid grade level for LRN")
      ) {
        return res.status(400).json({ message: error.message });
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

  async exportQuarterlyGrades(req, res, next) {
    try {
      const { id } = req.params;
      const exportedFile = await studentsService.exportQuarterlyGrades(parseInt(id, 10));

      res.setHeader("Content-Type", exportedFile.contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${exportedFile.fileName}"`);
      return res.send(exportedFile.buffer);
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
