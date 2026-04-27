const classesService = require("../services/classes.service");
const path = require("path");
const fs = require("fs");
const XLSX = require("xlsx");
const { createSignedUrlForPath } = require("../utils/supabaseStorage");

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

const readCsvRows = (buffer) => {
  const content = buffer.toString("utf8").replace(/^\uFEFF/, "");
  return parseCsvContent(content);
};

const normalizeHeader = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const toCellValue = (value) => String(value ?? "").trim();

const toLrnCellValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value).toString();
  }

  const normalizedValue = String(value).trim();
  if (!normalizedValue) {
    return "";
  }

  if (/[eE][+-]?\d+/.test(normalizedValue)) {
    const numericValue = Number(normalizedValue);
    if (Number.isFinite(numericValue)) {
      return Math.trunc(numericValue).toString();
    }
  }

  return normalizedValue;
};

const isNumericIdentifier = (value) => /^\d+$/.test(String(value ?? "").trim());

const readFirstWorksheetRows = (buffer) => {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("Invalid XLSX file: No worksheet found.");
  }

  return XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
    header: 1,
    defval: "",
    raw: false,
    blankrows: false,
  });
};

const findHeaderIndex = (headers, aliases) =>
  headers.findIndex((header) => aliases.includes(header));

const parseSubjectGradeWorksheetRows = (worksheetRows) => {
  if (!worksheetRows.length) {
    throw new Error("Invalid CSV format: The worksheet is empty.");
  }

  const firstRowHeaders = worksheetRows[0].map(normalizeHeader);
  const lrnIdx = findHeaderIndex(firstRowHeaders, ["lrn number", "lrn"]);

  if (lrnIdx === -1) {
    throw new Error("Invalid CSV format: LRN number column missing.");
  }

  const subjectTitleIdx = findHeaderIndex(firstRowHeaders, [
    "subject title",
    "subject",
    "subject name",
  ]);
  const q1Idx = findHeaderIndex(firstRowHeaders, ["q1", "quarter 1", "1st quarter"]);
  const q2Idx = findHeaderIndex(firstRowHeaders, ["q2", "quarter 2", "2nd quarter"]);
  const q3Idx = findHeaderIndex(firstRowHeaders, ["q3", "quarter 3", "3rd quarter"]);
  const q4Idx = findHeaderIndex(firstRowHeaders, ["q4", "quarter 4", "4th quarter"]);

  if ([q1Idx, q2Idx, q3Idx, q4Idx].some((index) => index !== -1)) {
    return worksheetRows.slice(1).map((cols) => ({
      subject_title: subjectTitleIdx === -1 ? "" : toCellValue(cols[subjectTitleIdx]),
      lrn: toLrnCellValue(cols[lrnIdx]),
      name: "",
      q1: q1Idx === -1 ? "" : toCellValue(cols[q1Idx]),
      q2: q2Idx === -1 ? "" : toCellValue(cols[q2Idx]),
      q3: q3Idx === -1 ? "" : toCellValue(cols[q3Idx]),
      q4: q4Idx === -1 ? "" : toCellValue(cols[q4Idx]),
    }));
  }

  if (worksheetRows.length < 2) {
    return worksheetRows.slice(1).map((cols) => ({
      subject_title: subjectTitleIdx === -1 ? "" : toCellValue(cols[subjectTitleIdx]),
      lrn: toLrnCellValue(cols[lrnIdx]),
      name: "",
      q1: "",
      q2: "",
      q3: "",
      q4: "",
    }));
  }

  const secondRowHeaders = worksheetRows[1].map(normalizeHeader);
  const templateQ1Idx = findHeaderIndex(secondRowHeaders, ["q1", "quarter 1", "1st quarter"]);
  const templateQ2Idx = findHeaderIndex(secondRowHeaders, ["q2", "quarter 2", "2nd quarter"]);
  const templateQ3Idx = findHeaderIndex(secondRowHeaders, ["q3", "quarter 3", "3rd quarter"]);
  const templateQ4Idx = findHeaderIndex(secondRowHeaders, ["q4", "quarter 4", "4th quarter"]);
  const studentNameIdx = findHeaderIndex(firstRowHeaders, [
    "student name",
    "student",
    "learner name",
    "name",
  ]);
  const subjectTitleIsHeaderLabel =
    subjectTitleIdx !== -1 &&
    ["subject title", "subject", "subject name"].includes(
      normalizeHeader(worksheetRows[0][subjectTitleIdx]),
    );
  const subjectTitle =
    !subjectTitleIsHeaderLabel && subjectTitleIdx !== -1
      ? toCellValue(worksheetRows[0][subjectTitleIdx])
      : worksheetRows[0]
          .map(toCellValue)
          .find(
            (cell, index) =>
              index !== lrnIdx &&
              index !== studentNameIdx &&
              cell &&
              !["grades", "subject title", "subject", "subject name"].includes(
                normalizeHeader(cell),
              ),
          ) || "";

  return worksheetRows.slice(2).map((cols) => ({
    subject_title:
      subjectTitleIdx !== -1 && !subjectTitle ? toCellValue(cols[subjectTitleIdx]) : subjectTitle,
    lrn: toLrnCellValue(cols[lrnIdx]),
    name: studentNameIdx === -1 ? "" : toCellValue(cols[studentNameIdx]),
    q1: templateQ1Idx === -1 ? "" : toCellValue(cols[templateQ1Idx]),
    q2: templateQ2Idx === -1 ? "" : toCellValue(cols[templateQ2Idx]),
    q3: templateQ3Idx === -1 ? "" : toCellValue(cols[templateQ3Idx]),
    q4: templateQ4Idx === -1 ? "" : toCellValue(cols[templateQ4Idx]),
  }));
};

const createSubjectTeacherTemplateDataUrl = () => {
  const csvContent = [
    ["LRN Number", "Student Name", "Subject Name", "", "", ""],
    ["", "", "Q1", "Q2", "Q3", "Q4"],
  ]
    .map((row) => row.join(","))
    .join("\r\n");

  return `data:text/csv;charset=utf-8;base64,${Buffer.from(csvContent, "utf8").toString("base64")}`;
};

const createClassAdviserTemplateDataUrl = () => {
  const workbook = XLSX.utils.book_new();

  const gradesSheet = XLSX.utils.aoa_to_sheet([
    [
      "LRN Number",
      "Subject 1",
      "Subject 2",
      "Subject 3",
      "Subject 4",
      "Subject 5",
      "Subject 6",
      "Subject 7",
      "Subject 8",
      "Q1",
      "Q2",
      "Q3",
      "Q4",
    ],
  ]);
  const attendanceSheet = XLSX.utils.aoa_to_sheet([
    [
      "LRN Number",
      "Jun",
      "Jul",
      "Aug",
      "Sept",
      "Oct",
      "Nov",
      "Dec",
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "TOTAL",
    ],
  ]);

  XLSX.utils.book_append_sheet(workbook, gradesSheet, "Grades");
  XLSX.utils.book_append_sheet(workbook, attendanceSheet, "Attendance");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${buffer.toString("base64")}`;
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

const findWorksheetByName = (workbook, expectedName) => {
  const sheetName = workbook.SheetNames.find(
    (name) => normalizeHeader(name) === normalizeHeader(expectedName),
  );

  if (!sheetName) {
    throw new Error(`Invalid XLSX format: ${expectedName} worksheet not found.`);
  }

  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    defval: "",
    raw: false,
    blankrows: false,
  });
};

const readWorkbookSheets = (buffer) => {
  const workbook = XLSX.read(buffer, { type: "buffer" });

  if (!workbook.SheetNames.length) {
    throw new Error("Invalid XLSX file: No worksheet found.");
  }

  return {
    gradesRows: findWorksheetByName(workbook, "Grades"),
    attendanceRows: findWorksheetByName(workbook, "Attendance"),
  };
};

const normalizeQuarterHeader = (value) => {
  const normalized = normalizeHeader(value);
  if (!normalized) return "";

  if (/^q[1-4]$/.test(normalized)) {
    return normalized;
  }

  const quarterMatch = normalized.match(/([1-4])(st|nd|rd|th)? quarter/);
  if (quarterMatch) {
    return `q${quarterMatch[1]}`;
  }

  return normalized;
};

const MONTH_HEADER_TO_ENUM = {
  jun: "Jun",
  july: "Jul",
  jul: "Jul",
  aug: "Aug",
  sept: "Sept",
  sep: "Sept",
  september: "Sept",
  oct: "Oct",
  october: "Oct",
  nov: "Nov",
  november: "Nov",
  dec: "Dec",
  december: "Dec",
  jan: "Jan",
  january: "Jan",
  feb: "Feb",
  february: "Feb",
  mar: "Mar",
  march: "Mar",
  apr: "Apr",
  april: "Apr",
};

const extractWorksheetHeaderRow = (worksheetRows, requiredHeaderAlias) => {
  const headerRowIndex = worksheetRows.findIndex((row) =>
    row.some((cell) => normalizeHeader(cell) === requiredHeaderAlias),
  );

  if (headerRowIndex === -1) {
    throw new Error(`Invalid XLSX format: ${requiredHeaderAlias} column missing.`);
  }

  return {
    headerRowIndex,
    headers: worksheetRows[headerRowIndex].map((cell) => String(cell ?? "").trim()),
  };
};

const parseClassAdviserGradeWorksheetRows = (worksheetRows) => {
  if (!worksheetRows.length) {
    throw new Error("Invalid CSV format: The grade sheet is empty.");
  }

  const { headerRowIndex, headers } = extractWorksheetHeaderRow(
    worksheetRows,
    "lrn number",
  );
  const secondaryHeaders = worksheetRows[headerRowIndex + 1] ?? [];
  const normalizedHeaders = headers.map(normalizeHeader);
  const lrnIdx = normalizedHeaders.indexOf("lrn number");
  const studentNameIdx = normalizedHeaders.indexOf("student name");

  if (lrnIdx === -1) {
    throw new Error("Invalid CSV format: LRN number column missing in the grade sheet.");
  }

  const subjectColumns = [];

  let currentSubjectTitle = "";

  headers.forEach((header, index) => {
    if (index === lrnIdx || index === studentNameIdx) {
      return;
    }

    const rawSubjectTitle = String(header ?? "").trim();
    const subjectTitle = rawSubjectTitle || currentSubjectTitle;
    const normalizedSubjectTitle = normalizeHeader(subjectTitle);
    const quarterKey = normalizeQuarterHeader(secondaryHeaders[index] || headers[index]);

    if (rawSubjectTitle) {
      currentSubjectTitle = rawSubjectTitle;
    }

    if (!subjectTitle || ["grades", "grade"].includes(normalizedSubjectTitle)) {
      return;
    }

    if (!["q1", "q2", "q3", "q4"].includes(quarterKey)) {
      return;
    }

    if (/^\(replace this text with subject name/i.test(subjectTitle)) {
      return;
    }

    let subjectEntry = subjectColumns.find(
      (entry) => entry.subjectTitle === subjectTitle,
    );

    if (!subjectEntry) {
      subjectEntry = {
        subjectTitle,
        quarters: {},
      };
      subjectColumns.push(subjectEntry);
    }

    subjectEntry.quarters[quarterKey] = index;
  });

  if (subjectColumns.length === 0) {
    throw new Error("Invalid CSV format: No subject columns found in the grade sheet.");
  }

  const rows = [];

  worksheetRows.slice(headerRowIndex + 2).forEach((cols) => {
    const lrn = toLrnCellValue(cols[lrnIdx]);
    const name = studentNameIdx === -1 ? "" : toCellValue(cols[studentNameIdx]);
    if (!lrn && !name) return;

    subjectColumns.forEach(({ subjectTitle, quarters }) => {
      rows.push({
        subject_title: subjectTitle,
        lrn,
        name,
        q1: quarters.q1 === undefined ? "" : toCellValue(cols[quarters.q1]),
        q2: quarters.q2 === undefined ? "" : toCellValue(cols[quarters.q2]),
        q3: quarters.q3 === undefined ? "" : toCellValue(cols[quarters.q3]),
        q4: quarters.q4 === undefined ? "" : toCellValue(cols[quarters.q4]),
      });
    });
  });

  return rows;
};

const parseClassAdviserAttendanceWorksheetRows = (worksheetRows) => {
  if (!worksheetRows.length) {
    throw new Error("Invalid CSV format: The attendance sheet is empty.");
  }

  const { headerRowIndex, headers } = extractWorksheetHeaderRow(
    worksheetRows,
    "lrn number",
  );
  const secondaryHeaders = worksheetRows[headerRowIndex + 1] ?? [];
  const normalizedHeaders = headers.map(normalizeHeader);
  const lrnIdx = normalizedHeaders.indexOf("lrn number");

  if (lrnIdx === -1) {
    throw new Error("Invalid CSV format: LRN number column missing in the attendance sheet.");
  }

  const monthIndexes = headers.reduce((indexes, _header, index) => {
    const monthKey =
      MONTH_HEADER_TO_ENUM[normalizeHeader(secondaryHeaders[index])] ??
      MONTH_HEADER_TO_ENUM[normalizeHeader(headers[index])];
    if (monthKey) {
      indexes[monthKey] = index;
    }
    return indexes;
  }, {});

  if (Object.keys(monthIndexes).length === 0) {
    throw new Error("Invalid CSV format: No monthly attendance columns found.");
  }

  return worksheetRows.slice(headerRowIndex + 1).reduce((rows, cols) => {
    const lrn = toLrnCellValue(cols[lrnIdx]);
    if (!lrn || !isNumericIdentifier(lrn)) return rows;

    const absences = Object.entries(monthIndexes).reduce((result, [month, index]) => {
      const value = toCellValue(cols[index]);
      if (value !== "") {
        result[month] = value;
      }
      return result;
    }, {});

    rows.push({ lrn, absences });
    return rows;
  }, []);
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

       const fileName = String(req.file.originalname || "").toLowerCase();
       if (!fileName.endsWith(".csv")) {
         return res.status(400).json({
           message: "Invalid file type. Only .csv files are allowed.",
         });
       }

       let rows = [];
       try {
         rows = parseSubjectGradeWorksheetRows(readCsvRows(req.file.buffer));
       } catch (error) {
         return res.status(400).json({
           message:
             error.message ||
             "Invalid CSV file. Please upload a valid .csv subject grade sheet.",
         });
       }

       const results = await classesService.importGrades(parseInt(id), rows);
       res.status(200).json({
         message: "Grades imported successfully",
         data: results.records,
         summary: results.summary,
       });
     } catch (error) {
       if (
         error.message === "Subject title does not match the selected subject" ||
         error.message === "No students are enrolled in this subject" ||
         error.message === "No matching students found for the uploaded LRN numbers" ||
         error.message === "None of the uploaded students are enrolled in this subject"
       ) {
         return res.status(400).json({ message: error.message });
       }
       next(error);
     }
   },

  async importClassGrades(req, res, next) {
    try {
      const { id } = req.params;
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileName = String(req.file.originalname || "").toLowerCase();
      if (!fileName.endsWith(".csv")) {
        return res.status(400).json({
          message: "Invalid file type. Only .csv files are allowed.",
        });
      }

      let rows = [];
      try {
        rows = parseClassAdviserGradeWorksheetRows(readCsvRows(req.file.buffer));
      } catch (error) {
        return res.status(400).json({
          message:
            error.message ||
            "Invalid CSV file. Please upload a valid .csv class grade sheet.",
        });
      }

      const results = await classesService.importClassGrades(parseInt(id), rows);
      res.status(200).json({
        message: "Class grades imported successfully",
        data: results.records,
        summary: results.summary,
      });
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
      const bucket =
        process.env.SUPABASE_BUCKET_TEMPLATES ||
        process.env.SUPABASE_BUCKET_TEACHER ||
        "teacher-files";
      const filePath =
        process.env.SUPABASE_CLASS_ADVISER_TEMPLATE_PATH ||
        "class-adviser/ClassAdviser_Grades-Attendance_Template.xlsx";
      const fallbackFileName = "ClassAdviser_Grades-Attendance_Template.xlsx";

      try {
        const downloadUrl = await createSignedUrlForPath(bucket, filePath, 60 * 10);
        const fileName = filePath.split("/").pop() || fallbackFileName;

        return res.status(200).json({
          data: {
            downloadUrl,
            fileName,
          },
        });
      } catch (_) {
        return res.status(200).json({
          data: {
            downloadUrl: createClassAdviserTemplateDataUrl(),
            fileName: fallbackFileName,
          },
        });
      }
    } catch (error) {
      next(error);
    }
  },

  async downloadSubjectGradeSheetTemplate(_req, res, next) {
    try {
      const bucket =
        process.env.SUPABASE_BUCKET_TEMPLATES ||
        process.env.SUPABASE_BUCKET_TEACHER ||
        "teacher-files";
      const configuredTemplatePath = process.env.SUPABASE_SUBJECT_TEACHER_TEMPLATE_PATH;
      const filePath =
        configuredTemplatePath && configuredTemplatePath.toLowerCase().endsWith(".csv")
          ? configuredTemplatePath
          : "subject-teacher/SubjectTeacher_Grades-Attendance_Template.csv";
      const fallbackFileName = "SubjectTeacher_Grades-Attendance_Template.csv";

      try {
        const downloadUrl = await createSignedUrlForPath(bucket, filePath, 60 * 10);
        const fileName = filePath.split("/").pop() || fallbackFileName;

        return res.status(200).json({
          data: {
            downloadUrl,
            fileName,
          },
        });
      } catch (_) {
        return res.status(200).json({
          data: {
            downloadUrl: createSubjectTeacherTemplateDataUrl(),
            fileName: fallbackFileName,
          },
        });
      }
    } catch (error) {
      next(error);
    }
  },

  async downloadAttendanceTemplate(_req, res, next) {
    try {
      const bucket =
        process.env.SUPABASE_BUCKET_TEMPLATES ||
        process.env.SUPABASE_BUCKET_TEACHER ||
        "teacher-files";
      const filePath =
        process.env.SUPABASE_CLASS_ADVISER_TEMPLATE_PATH ||
        "class-adviser/ClassAdviser_Grades-Attendance_Template.xlsx";
      const fallbackFileName = "ClassAdviser_Grades-Attendance_Template.xlsx";

      try {
        const downloadUrl = await createSignedUrlForPath(bucket, filePath, 60 * 10);
        const fileName = filePath.split("/").pop() || fallbackFileName;

        return res.status(200).json({
          data: {
            downloadUrl,
            fileName,
          },
        });
      } catch (_) {
        return res.status(200).json({
          data: {
            downloadUrl: createClassAdviserTemplateDataUrl(),
            fileName: fallbackFileName,
          },
        });
      }
    } catch (error) {
      next(error);
    }
  },

   async importAttendance(req, res, next) {
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

       let rows = [];
       try {
         rows = parseClassAdviserAttendanceWorksheetRows(readCsvRows(req.file.buffer));
       } catch (error) {
         return res.status(400).json({
           message:
             error.message ||
             "Invalid CSV file. Please upload a valid .csv class attendance sheet.",
         });
       }
 
       const classId = req.params.id ? parseInt(req.params.id, 10) : undefined;
       const results = await classesService.importAttendance(rows, classId);
       res.status(200).json({
         message: "Attendance imported successfully",
         data: results.records,
         summary: results.summary,
       });
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

      const fileName = String(req.file.originalname || "").toLowerCase();
      if (!fileName.endsWith(".csv")) {
        return res.status(400).json({
          message: "Invalid file type. Only .csv files are allowed.",
        });
      }

      let worksheetRows = [];
      try {
        worksheetRows = readCsvRows(req.file.buffer);
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

      const lrnIdx = headers.indexOf('lrn number');
      const fnameIdx = headers.indexOf('first name');
      const lnameIdx = headers.indexOf('last name');
      const sexIdx = headers.indexOf('sex');
      const sYearStartIdx = headers.indexOf('school year start');
      const sYearEndIdx = headers.indexOf('school year end');

      if (lrnIdx === -1 || fnameIdx === -1 || lnameIdx === -1) {
        return res.status(400).json({ message: "Invalid CSV format: Required columns missing" });
      }

      const rows = worksheetRows.slice(1).map((cols) => {
        return {
          lrn: toLrnCellValue(cols[lrnIdx]),
          fname: toCellValue(cols[fnameIdx]),
          lname: toCellValue(cols[lnameIdx]),
          sex: toCellValue(cols[sexIdx]),
          syear_start: toCellValue(cols[sYearStartIdx]),
          syear_end: toCellValue(cols[sYearEndIdx]),
        };
      });

      const results = await classesService.importStudents(parseInt(id), rows);
      res.status(200).json({
        message: "Student list imported successfully",
        data: results.students,
        summary: results.summary,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = classesController;
