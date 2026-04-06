const classesService = require("../services/classes.service");

const classesController = {
  async getAllClasses(req, res, next) {
    try {
      const { page = 1, limit = 10, school_year, grade_level } = req.query;
      const result = await classesService.getAllClasses({
        page,
        limit,
        school_year,
        grade_level,
      });

      res.status(200).json({
        data: result.classes,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  async getTeacherClasses(req, res, next) {
    try {
      const teacherId = req.user.user_id;
      const classes = await classesService.getTeacherClasses(teacherId);
      res.status(200).json({ data: classes });
    } catch (error) {
      next(error);
    }
  },

  async getTeacherSubjects(req, res, next) {
    try {
      const teacherId = req.user.user_id;
      const subjects = await classesService.getTeacherSubjects(teacherId);
      res.status(200).json({ data: subjects });
    } catch (error) {
      next(error);
    }
  },

  async getAllSections(req, res, next) {
    try {
      const sections = await classesService.getAllSections();
      res.status(200).json({ data: sections });
    } catch (error) {
      next(error);
    }
  },

  async getAllGradeLevels(req, res, next) {
    try {
      const gradeLevels = await classesService.getAllGradeLevels();
      res.status(200).json({ data: gradeLevels });
    } catch (error) {
      next(error);
    }
  },

  async createSection(req, res, next) {
    try {
      const { section_name } = req.body;
      const section = await classesService.createSection(section_name);
      res.status(201).json({
        message: "Section created successfully",
        data: section,
      });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(409).json({ message: "Section name already exists" });
      }
      next(error);
    }
  },

  async updateSection(req, res, next) {
    try {
      const { id } = req.params;
      const { section_name } = req.body;
      const section = await classesService.updateSection(parseInt(id), section_name);
      res.status(200).json({
        message: "Section updated successfully",
        data: section,
      });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(409).json({ message: "Section name already exists" });
      }
      if (error.message === "Section not found") {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  },

  async deleteSection(req, res, next) {
    try {
      const { id } = req.params;
      await classesService.deleteSection(parseInt(id));
      res.status(200).json({
        message: "Section deleted successfully",
      });
    } catch (error) {
      if (error.message === "Section not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes("is currently assigned to a class")) {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  },

  async getClassById(req, res, next) {
    try {
      const { id } = req.params;
      const classData = await classesService.getClassById(parseInt(id));

      res.status(200).json({
        data: classData,
      });
    } catch (error) {
      if (error.message === "Class not found") {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  },

  async createClass(req, res, next) {
    try {
      const classData = req.body;
      const newClass = await classesService.createClass(classData);

      res.status(201).json({
        message: "Class created successfully",
        data: newClass,
      });
    } catch (error) {
      if (error.message === "Class adviser is required") {
        return res.status(400).json({ message: error.message });
      }
      if (error.message === "Grade level not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Section not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Adviser not found") {
        return res.status(404).json({ message: error.message });
      }
      if (
        error.message ===
        "Adviser is already assigned to a class in this school year"
      ) {
        return res.status(409).json({ message: error.message });
      }
      if (
        error.message ===
        "A class with this grade level and section already exists for this school year"
      ) {
        return res.status(409).json({ message: error.message });
      }
      if (error.code === "P2011") {
        return res.status(400).json({ message: "Class adviser is required" });
      }
      next(error);
    }
  },

  async updateClass(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedClass = await classesService.updateClass(
        parseInt(id),
        updateData,
      );

      res.status(200).json({
        message: "Class updated successfully",
        data: updatedClass,
      });
    } catch (error) {
      if (error.message === "Class not found") {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  },

  async uploadClassSchedule(req, res, next) {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const updatedClass = await classesService.uploadClassSchedule(
        parseInt(id),
        req.file,
      );

      res.status(200).json({
        message: "Class schedule uploaded successfully",
        data: updatedClass,
      });
    } catch (error) {
      if (error.message === "Class not found") {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  },

  async deleteClass(req, res, next) {
    try {
      const { id } = req.params;
      await classesService.deleteClass(parseInt(id));

      res.status(200).json({
        message: "Class deleted successfully",
      });
    } catch (error) {
      if (error.message === "Class not found") {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  },

  async addSubjectToClass(req, res, next) {
    try {
      const { id } = req.params;
      const subjectData = req.body;

      const subject = await classesService.addSubjectToClass(
        parseInt(id),
        subjectData,
      );

      res.status(201).json({
        message: "Subject added to class successfully",
        data: subject,
      });
    } catch (error) {
      if (error.message === "Class not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Teacher not found") {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  },

  async getClassSubjects(req, res, next) {
    try {
      const { id } = req.params;
      const subjects = await classesService.getClassSubjects(parseInt(id));

      res.status(200).json({
        data: subjects,
      });
    } catch (error) {
      if (error.message === "Class not found") {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  },

  async assignTeacherToSubject(req, res, next) {
    try {
      const { subjectId } = req.params;
      const { teacher_id } = req.body;

      const subject = await classesService.assignTeacherToSubject(
        parseInt(subjectId),
        parseInt(teacher_id),
      );

      res.status(200).json({
        message: "Teacher assigned to subject successfully",
        data: subject,
      });
    } catch (error) {
      if (
        error.message === "Subject record not found" ||
        error.message === "Teacher not found"
      ) {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  },

  async addStudentToClass(req, res, next) {
    try {
      const { id } = req.params;
      const student = await classesService.addStudentToClass(
        parseInt(id),
        req.body,
      );

      res.status(201).json({
        message: "Student added to class successfully",
        data: student,
      });
    } catch (error) {
      if (error.message === "Class not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Student not found") {
        return res.status(404).json({ message: error.message });
      }
      if (
        error.message === "First name, last name, and LRN are required" ||
        error.message === "Student grade level does not match this class"
      ) {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  },

  async removeStudentFromClass(req, res, next) {
    try {
      const { id, studentId } = req.params;
      await classesService.removeStudentFromClass(
        parseInt(id),
        parseInt(studentId),
      );

      res.status(200).json({
        message: "Student removed from class successfully",
      });
    } catch (error) {
      if (
        error.message === "Class not found" ||
        error.message === "Student not found"
      ) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Student is not enrolled in this class") {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  },

  async addStudentToSubject(req, res, next) {
    try {
      const { subjectId, studentId } = req.params;
      const enrollment = await classesService.addStudentToSubject(
        parseInt(subjectId),
        parseInt(studentId),
      );

      res.status(201).json({
        message: "Student added to subject successfully",
        data: enrollment,
      });
    } catch (error) {
      if (
        error.message === "Subject record not found" ||
        error.message === "Student not found"
      ) {
        return res.status(404).json({ message: error.message });
      }
      if (
        error.message ===
        "Student must belong to the class before joining this subject"
      ) {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  },

  async removeStudentFromSubject(req, res, next) {
    try {
      const { subjectId, studentId } = req.params;
      await classesService.removeStudentFromSubject(
        parseInt(subjectId),
        parseInt(studentId),
      );

      res.status(200).json({
        message: "Student removed from subject successfully",
      });
    } catch (error) {
      if (
        error.message === "Subject record not found" ||
        error.message === "Student not found"
      ) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Student is not enrolled in this subject") {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  },

  async getAllSubjects(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await classesService.getAllSubjects({
        page,
        limit,
      });

      res.status(200).json({
        data: result.subjects,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateStudentGrades(req, res, next) {
    try {
      const { subjectId, studentId } = req.params;
      const gradesData = req.body;

      const grades = await classesService.updateStudentGrades({
        subject_id: parseInt(subjectId),
        student_id: parseInt(studentId),
        ...gradesData,
      });

      res.status(200).json({
        message: "Grades updated successfully",
        data: grades,
      });
    } catch (error) {
      if (error.message === "Subject record not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "Student not found") {
        return res.status(404).json({ message: error.message });
      }
      next(error);
    }
  },

  async updateAttendance(req, res, next) {
    try {
      const { studentId } = req.params;
      const attendanceData = {
        student_id: parseInt(studentId),
        ...req.body,
      };

      const attendance = await classesService.updateAttendance(attendanceData);

      res.status(200).json({
        message: "Attendance updated successfully",
        data: attendance,
      });
    } catch (error) {
      if (error.message === "Student not found") {
        return res.status(404).json({ message: error.message });
      }
      if (
        error.message ===
        "Days present and days absent cannot exceed total school days"
      ) {
        return res.status(422).json({ message: error.message });
      }
      next(error);
    }
  },

  async importSubjectGrades(req, res, next) {
     try {
       const { id } = req.params; // subjectId
       if (!req.file) {
         return res.status(400).json({ message: "No file uploaded" });
       }
 
       // Manual CSV parsing for simplicity
       const fileContent = req.file.buffer.toString('utf8');
       const lines = fileContent.split(/\r?\n/).filter(line => line.trim() !== '');
       const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
       
       const lrnIdx = headers.indexOf('lrn number');
       const q1Idx = headers.indexOf('q1');
       const q2Idx = headers.indexOf('q2');
       const q3Idx = headers.indexOf('q3');
       const q4Idx = headers.indexOf('q4');
 
       if (lrnIdx === -1) {
         return res.status(400).json({ message: "Invalid CSV: LRN number column missing" });
       }
 
       const rows = lines.slice(1).map(line => {
         const cols = line.split(',');
         return {
           lrn: cols[lrnIdx]?.trim(),
           q1: cols[q1Idx]?.trim(),
           q2: cols[q2Idx]?.trim(),
           q3: cols[q3Idx]?.trim(),
           q4: cols[q4Idx]?.trim(),
         };
       });
 
       const results = await classesService.importGrades(parseInt(id), rows);
       res.status(200).json({ message: "Grades imported successfully", data: results });
     } catch (error) {
       next(error);
     }
   },
 
   async importAttendance(req, res, next) {
     try {
       if (!req.file) {
         return res.status(400).json({ message: "No file uploaded" });
       }
 
       const fileContent = req.file.buffer.toString('utf8');
       const lines = fileContent.split(/\r?\n/).filter(line => line.trim() !== '');
       const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
       
       const lrnIdx = headers.indexOf('lrn number');
       const months = ['jun', 'jul', 'aug', 'sept', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar', 'apr'];
       const monthIndices = {};
       months.forEach(m => {
         monthIndices[m] = headers.indexOf(`no.of days absent (${m})`);
         if (monthIndices[m] === -1) {
           // Try alternate naming
            monthIndices[m] = headers.findIndex(h => h.includes(m) && h.includes('absent'));
         }
       });
 
       if (lrnIdx === -1) {
         return res.status(400).json({ message: "Invalid CSV: LRN number column missing" });
       }
 
       const rows = lines.slice(1).map(line => {
         const cols = line.split(',');
         const absences = {};
         Object.keys(monthIndices).forEach(m => {
           if (monthIndices[m] !== -1) {
              const val = cols[monthIndices[m]]?.trim();
              if (val !== undefined && val !== '') {
                // Map back to capitalized month names for Prisma enum
                const prismaMonth = m.charAt(0) + m.slice(1);
                // Prisma Map: Jun, Jul, Aug, Sept...
                const captialized = prismaMonth === 'Sept' ? 'Sept' : prismaMonth.charAt(0).toUpperCase() + prismaMonth.slice(1);
                absences[captialized] = val;
              }
           }
         });
         return {
           lrn: cols[lrnIdx]?.trim(),
           absences
         };
       });
 
       const results = await classesService.importAttendance(rows);
       res.status(200).json({ message: "Attendance imported successfully", data: results });
     } catch (error) {
       next(error);
     }
   },

  async importStudents(req, res, next) {
    try {
      const { id } = req.params; // classId
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileContent = req.file.buffer.toString('utf8');
      const lines = fileContent.split(/\r?\n/).filter(line => line.trim() !== '');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      const lrnIdx = headers.indexOf('lrn number');
      const fnameIdx = headers.indexOf('first name');
      const lnameIdx = headers.indexOf('last name');
      const sexIdx = headers.indexOf('sex');
      const sYearStartIdx = headers.indexOf('school year start');
      const sYearEndIdx = headers.indexOf('school year end');

      if (lrnIdx === -1 || fnameIdx === -1 || lnameIdx === -1) {
        return res.status(400).json({ message: "Invalid CSV format: Required columns missing" });
      }

      const rows = lines.slice(1).map(line => {
        const cols = line.split(',');
        return {
          lrn: cols[lrnIdx]?.trim(),
          fname: cols[fnameIdx]?.trim(),
          lname: cols[lnameIdx]?.trim(),
          sex: cols[sexIdx]?.trim(),
          syear_start: cols[sYearStartIdx]?.trim(),
          syear_end: cols[sYearEndIdx]?.trim(),
        };
      });

      const results = await classesService.importStudents(parseInt(id), rows);
      res.status(200).json({ message: "Student list imported successfully", data: results });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = classesController;
