const studentsService = require("../services/students.service");
const XLSX = require("xlsx");
const { createSignedUrlForPath } = require("../utils/supabaseStorage");

const normalizeHeader = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const toCellValue = (value) => String(value ?? "").trim();

const createStudentTemplateDataUrl = () => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([
    [
      "First Name",
      "Last Name",
      "Sex",
      "LRN Number",
      "Grade Level",
      "School Year Start",
      "School Year End",
    ],
  ]);

  XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${buffer.toString("base64")}`;
};

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

      const fileName = String(req.file.originalname || "").toLowerCase();
      if (!fileName.endsWith(".csv")) {
        return res.status(400).json({
          message: "Invalid file type. Only .csv files are allowed.",
        });
      }

      let worksheetRows = [];
      try {
        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          return res
            .status(400)
            .json({ message: "Invalid CSV file: No worksheet found." });
        }
        worksheetRows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
          header: 1,
          defval: "",
          raw: false,
          blankrows: false,
        });
      } catch {
        return res.status(400).json({
          message: "Invalid CSV file. Please upload a valid .csv student list.",
        });
      }

      if (!worksheetRows.length) {
        return res.status(400).json({
          message: "Invalid CSV format: The file is empty.",
        });
      }

      const headers = worksheetRows[0].map(normalizeHeader);

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

      const rows = worksheetRows.slice(1).map((cols) => {
        return {
          fname: toCellValue(cols[fnameIdx]),
          lname: toCellValue(cols[lnameIdx]),
          sex: toCellValue(cols[sexIdx]),
          lrn: toCellValue(cols[lrnIdx]),
          grade_level: toCellValue(cols[gradeLevelIdx]),
          syear_start: toCellValue(cols[syearStartIdx]),
          syear_end: toCellValue(cols[syearEndIdx]),
        };
      });

      const result = await studentsService.importStudents(rows);

      res.status(200).json({
        message: "Students imported successfully",
        data: result.students,
        summary: result.summary,
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

  async getImportTemplate(req, res, next) {
    try {
      const bucket =
        process.env.SUPABASE_BUCKET_TEMPLATES ||
        process.env.SUPABASE_BUCKET_TEACHER ||
        "teacher-files";
      const filePath = process.env.SUPABASE_STUDENT_IMPORT_TEMPLATE_PATH;
      const fallbackFileName = "StudentList_Template.xlsx";

      if (!filePath) {
        return res.status(200).json({
          data: {
            downloadUrl: createStudentTemplateDataUrl(),
            fileName: fallbackFileName,
          },
        });
      }

      const downloadUrl = await createSignedUrlForPath(bucket, filePath, 60 * 10);
      const fileName = filePath.split("/").pop() || fallbackFileName;

      res.status(200).json({
        data: {
          downloadUrl,
          fileName,
        },
      });
    } catch (error) {
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
      const exportedFile = await studentsService.exportQuarterlyGrades(
        parseInt(id, 10),
      );

      res.setHeader("Content-Type", exportedFile.contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${exportedFile.fileName}"`,
      );
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
