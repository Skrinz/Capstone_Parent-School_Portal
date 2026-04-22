const classesService = require("../services/classes.service");
const path = require("path");
const fs = require("fs");

const sendTemplateFile = (res, filename) => {
  const filePath = path.join(__dirname, "../../templates", filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "Template file not found" });
  }

  return res.download(filePath, filename);
};

const parseCsvLine = (line) => {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

const parseCsvContent = (content) => {
  const rows = [];
  let currentRow = [];
  let currentValue = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentValue += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentValue.trim());
      currentValue = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i += 1;
      }

      currentRow.push(currentValue.trim());
      currentValue = "";

      if (currentRow.some((cell) => cell !== "")) {
        rows.push(currentRow);
      }

      currentRow = [];
      continue;
    }

    currentValue += char;
  }

  if (currentValue.length > 0 || currentRow.length > 0) {
    currentRow.push(currentValue.trim());
    if (currentRow.some((cell) => cell !== "")) {
      rows.push(currentRow);
    }
  }

  return rows;
};

const getFirstNonEmptyCellAfter = (row, startIndex) => {
  for (let i = startIndex + 1; i < row.length; i += 1) {
    if (String(row[i] ?? "").trim()) {
      return String(row[i]).trim();
    }
  }

  return "";
};

const parseDepEdQuarterKey = (value) => {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (normalized.includes("first quarter")) return "q1";
  if (normalized.includes("second quarter")) return "q2";
  if (normalized.includes("third quarter")) return "q3";
  if (normalized.includes("fourth quarter")) return "q4";

  return null;
};

const parseDepEdGradeSheetRows = (parsedRows) => {
  const quarterRowIndex = parsedRows.findIndex((row) => parseDepEdQuarterKey(row[0]));
  if (quarterRowIndex === -1) {
    return null;
  }

  const quarterKey = parseDepEdQuarterKey(parsedRows[quarterRowIndex][0]);
  const quarterRow = parsedRows[quarterRowIndex];
  const subjectLabelIndex = quarterRow.findIndex((cell) => /^subject:?$/i.test(String(cell ?? "").trim()));
  const subjectTitle = subjectLabelIndex === -1 ? "" : getFirstNonEmptyCellAfter(quarterRow, subjectLabelIndex);

  const learnersHeaderIndex = parsedRows.findIndex((row) =>
    row.some((cell) => /learners'? names/i.test(String(cell ?? "").trim())),
  );
  if (learnersHeaderIndex === -1 || !subjectTitle || !quarterKey) {
    return null;
  }

  const numericHeaderIndex = parsedRows.findIndex(
    (row, index) =>
      index > learnersHeaderIndex &&
      row.filter((cell) => String(cell ?? "").trim()).includes("Grade"),
  );
  if (numericHeaderIndex === -1) {
    return null;
  }

  const numericHeaderRow = parsedRows[numericHeaderIndex];
  const gradeColumnIndexes = numericHeaderRow.reduce((indexes, cell, index) => {
    if (String(cell ?? "").trim().toLowerCase() === "grade") {
      indexes.push(index);
    }
    return indexes;
  }, []);
  const quarterlyGradeIndex = gradeColumnIndexes.at(-1);

  if (quarterlyGradeIndex === undefined) {
    return null;
  }

  const rows = [];

  for (let i = numericHeaderIndex + 1; i < parsedRows.length; i += 1) {
    const row = parsedRows[i];
    const rowNumberCell = String(row[0] ?? "").trim();
    const nameCell = String(row[1] ?? "").trim();

    if (!/^\d+$/.test(rowNumberCell) || !nameCell || /^(male|female)$/i.test(nameCell)) {
      continue;
    }

    const quarterGrade = String(row[quarterlyGradeIndex] ?? "").trim();
    if (!quarterGrade) {
      continue;
    }

    rows.push({
      subject_title: subjectTitle,
      name: nameCell,
      [quarterKey]: quarterGrade,
    });
  }

  return rows.length > 0 ? rows : null;
};

const extractAttendanceDateLabel = (value) => {
  const text = String(value ?? "").trim();
  if (!text) return null;

  const match = text.match(/(?:date\s*:?\s*)?(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{1,2}-\d{1,2})/i);
  return match ? match[1] : null;
};

const inferGridAttendanceStatus = (cells) => {
  const normalizedCells = cells
    .map((cell) => String(cell ?? "").trim())
    .filter(Boolean);

  if (normalizedCells.length === 0) {
    return null;
  }

  const absentTokens = new Set(['a', 'absent', '0', 'no', 'x']);
  const presentTokens = new Set(['p', 'present', '1', 'yes', 'check', 'checked']);

  const flattenedTokens = normalizedCells
    .flatMap((cell) => cell.toLowerCase().split(/[^a-z0-9]+/))
    .filter(Boolean);

  if (flattenedTokens.some((token) => absentTokens.has(token))) {
    return 'Absent';
  }

  if (
    flattenedTokens.some((token) => presentTokens.has(token)) ||
    normalizedCells.some((cell) => cell.length > 0)
  ) {
    return 'Present';
  }

  return null;
};

const parseDateGridAttendanceRows = (parsedLines) => {
  const previewRows = parsedLines.slice(0, Math.min(parsedLines.length, 4));
  const explicitDateColumns = [];
  let nameColumnIndex = -1;

  previewRows.forEach((row, rowIndex) => {
    row.forEach((cell, columnIndex) => {
      if (nameColumnIndex === -1 && /^name:?$/i.test(String(cell ?? "").trim())) {
        nameColumnIndex = columnIndex;
      }

      const dateLabel = extractAttendanceDateLabel(cell);
      if (dateLabel) {
        explicitDateColumns.push({ columnIndex, rowIndex, dateLabel });
      }
    });
  });

  if (nameColumnIndex === -1 || explicitDateColumns.length === 0) {
    return null;
  }

  const maxColumnCount = parsedLines.reduce((max, row) => Math.max(max, row.length), 0);
  const sortedDateColumns = explicitDateColumns.sort((left, right) => left.columnIndex - right.columnIndex);
  const dateGroups = sortedDateColumns.map((entry, index) => {
    const nextStart = sortedDateColumns[index + 1]?.columnIndex ?? maxColumnCount;
    const columns = [];

    for (let columnIndex = entry.columnIndex; columnIndex < nextStart; columnIndex += 1) {
      columns.push(columnIndex);
    }

    return {
      date: entry.dateLabel,
      columns,
    };
  });

  const headerRowCutoff = Math.max(
    nameColumnIndex >= 0 ? 0 : -1,
    ...explicitDateColumns.map((entry) => entry.rowIndex),
  );
  const rows = [];

  for (let rowIndex = headerRowCutoff + 1; rowIndex < parsedLines.length; rowIndex += 1) {
    const row = parsedLines[rowIndex];
    const rawName = String(row[nameColumnIndex] ?? "").trim();

    if (!rawName || /^name:?$/i.test(rawName) || /^(male|female):?$/i.test(rawName)) {
      continue;
    }

    dateGroups.forEach((group) => {
      const status = inferGridAttendanceStatus(group.columns.map((columnIndex) => row[columnIndex]));
      if (!status) return;

      rows.push({
        name: rawName,
        date: group.date,
        status,
      });
    });
  }

  return rows.length > 0 ? rows : null;
};

const classesController = {
  async getAllClasses(req, res, next) {
    try {
      const { page = 1, limit = 10, school_year, grade_level } = req.query;
      const result = await classesService.getAllClasses({
        page,
        limit,
        school_year,
        grade_level,
        user: req.user,
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
      const classData = { ...req.body, created_by: req.user.user_id };
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

  async exportAllQuartersGrades(req, res, next) {
    try {
      const { id } = req.params;
      const exportedFile = await classesService.exportAllQuartersGrades(parseInt(id, 10));

      res.setHeader("Content-Type", exportedFile.contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${exportedFile.fileName}"`);
      return res.send(exportedFile.buffer);
    } catch (error) {
      if (error.message === "Class not found") {
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
 
       const fileContent = req.file.buffer.toString('utf8');
       const parsedRows = parseCsvContent(fileContent);
       const headers = parsedRows[0].map(h => h.trim().toLowerCase());
       
       const subjectTitleIdx = headers.indexOf('subject title');
       const lrnIdx = headers.indexOf('lrn number');
       const q1Idx = headers.indexOf('q1');
       const q2Idx = headers.indexOf('q2');
       const q3Idx = headers.indexOf('q3');
       const q4Idx = headers.indexOf('q4');
 
       if (lrnIdx === -1) {
         return res.status(400).json({ message: "Invalid CSV: LRN number column missing" });
       }
 
       const rows = parsedRows.slice(1).map(cols => {
         return {
           subject_title: cols[subjectTitleIdx]?.trim(),
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

  async importClassGrades(req, res, next) {
    try {
      const { id } = req.params;
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileContent = req.file.buffer.toString("utf8");
      const parsedRows = parseCsvContent(fileContent);
      const depEdRows = parseDepEdGradeSheetRows(parsedRows);
      let rows = [];

      if (depEdRows) {
        rows = depEdRows;
      } else {
        const headers = parsedRows[0].map((h) => h.trim().toLowerCase());

        const subjectTitleIdx = headers.indexOf("subject title");
        const lrnIdx = headers.indexOf("lrn number");
        const q1Idx = headers.indexOf("q1");
        const q2Idx = headers.indexOf("q2");
        const q3Idx = headers.indexOf("q3");
        const q4Idx = headers.indexOf("q4");

        if (subjectTitleIdx === -1 || lrnIdx === -1) {
          return res.status(400).json({
            message: "Invalid CSV: use either the DepEd class record template or Subject Title and LRN number columns",
          });
        }

        rows = parsedRows.slice(1).map((cols) => ({
          subject_title: cols[subjectTitleIdx]?.trim(),
          lrn: cols[lrnIdx]?.trim(),
          q1: cols[q1Idx]?.trim(),
          q2: cols[q2Idx]?.trim(),
          q3: cols[q3Idx]?.trim(),
          q4: cols[q4Idx]?.trim(),
        }));
      }

      const results = await classesService.importClassGrades(parseInt(id), rows);
      res
        .status(200)
        .json({ message: "Class grades imported successfully", data: results });
    } catch (error) {
      if (
        error.message === "Class not found" ||
        error.message === "No subjects found for this class" ||
        error.message === "Subject title is required for class grade imports" ||
        error.message.startsWith("Subject title not found in this class:") ||
        error.message.startsWith("Grade student name is ambiguous:") ||
        error.message.startsWith("Grade student name not found in class:")
      ) {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  },

  async downloadGradeSheetTemplate(_req, res, next) {
    try {
      return sendTemplateFile(res, "Grade Template.csv");
    } catch (error) {
      next(error);
    }
  },

  async downloadAttendanceTemplate(_req, res, next) {
    try {
      return sendTemplateFile(res, "attendance-template.csv");
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
       const parsedLines = parseCsvContent(fileContent);
       const dateGridRows = parseDateGridAttendanceRows(parsedLines);
       let rows = [];

       if (dateGridRows) {
         rows = dateGridRows;
       } else {
         const headers = parsedLines[0].map(h => h.trim().toLowerCase());
         const lrnIdx = headers.indexOf('lrn number');

         if (lrnIdx === -1) {
           return res.status(400).json({ message: "Invalid CSV: LRN number column missing" });
         }

         const dateIdx = headers.findIndex((header) =>
           ['date', 'attendance date'].includes(header),
         );
         const statusIdx = headers.findIndex((header) =>
           ['status', 'attendance status', 'remark', 'remarks'].includes(header),
         );

         if (dateIdx !== -1) {
           rows = parsedLines.slice(1).map(cols => ({
             lrn: cols[lrnIdx]?.trim(),
             date: cols[dateIdx]?.trim(),
             status: cols[statusIdx]?.trim() ?? '',
           }));
         } else {
           const months = ['jun', 'jul', 'aug', 'sept', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'];
           const monthIndices = {};

           months.forEach(m => {
             monthIndices[m] = headers.indexOf(`no.of days absent (${m})`);
             if (monthIndices[m] === -1) {
               monthIndices[m] = headers.findIndex(h => h.includes(m) && h.includes('absent'));
             }
           });

           const hasMonthlyColumns = Object.values(monthIndices).some((index) => index !== -1);
           if (!hasMonthlyColumns) {
             return res.status(400).json({
               message: "Invalid CSV: use a date-grid sheet, LRN Number with Date and Status, or the legacy monthly absence columns",
             });
           }

           rows = parsedLines.slice(1).map(cols => {
             const absences = {};

             Object.keys(monthIndices).forEach(m => {
               if (monthIndices[m] !== -1) {
                 const val = cols[monthIndices[m]]?.trim();
                 if (val !== undefined && val !== '') {
                   const prismaMonth = m === 'sept'
                     ? 'Sept'
                     : m.charAt(0).toUpperCase() + m.slice(1);
                   absences[prismaMonth] = val;
                 }
               }
             });

             return {
               lrn: cols[lrnIdx]?.trim(),
               absences
             };
           });
         }
       }
 
       const classId = req.params.id ? parseInt(req.params.id, 10) : undefined;
       const results = await classesService.importAttendance(rows, classId);
       res.status(200).json({ message: "Attendance imported successfully", data: results });
     } catch (error) {
       if (
         error.message.startsWith("Invalid attendance date") ||
         error.message.startsWith("Attendance date is outside supported school months") ||
         error.message.startsWith("Invalid attendance status") ||
         error.message.startsWith("Class ID is required for attendance sheets that identify students by name") ||
         error.message.startsWith("Attendance student name is ambiguous")
       ) {
         return res.status(400).json({ message: error.message });
       }
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
