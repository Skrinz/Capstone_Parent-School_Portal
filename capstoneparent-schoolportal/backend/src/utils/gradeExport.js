const ATTENDANCE_MONTHS = ["Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

const normalizeGradeValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : value;
};

const sanitizeFileName = (value) =>
  String(value ?? "file")
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, "_");

const padCell = (value, width, align = "left") => {
  const text = String(value ?? "");
  if (text.length >= width) {
    return text.slice(0, width);
  }

  return align === "right" ? text.padStart(width, " ") : text.padEnd(width, " ");
};

const buildAttendanceMap = (attendanceRecords = []) => {
  const map = new Map();

  attendanceRecords.forEach((record) => {
    if (record?.month) {
      map.set(record.month, record);
    }
  });

  return map;
};

const escapePdfText = (value) =>
  String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r/g, "")
    .replace(/\n/g, " ");

const createPdfBuffer = (lines) => {
  const pageWidth = 612;
  const pageHeight = 792;
  const marginLeft = 40;
  const marginTop = 48;
  const lineHeight = 14;
  const maxLinesPerPage = Math.floor((pageHeight - marginTop * 2) / lineHeight);

  const pagedLines = [];
  for (let i = 0; i < lines.length; i += maxLinesPerPage) {
    pagedLines.push(lines.slice(i, i + maxLinesPerPage));
  }

  const objects = [];
  const addObject = (content) => {
    objects.push(content);
    return objects.length;
  };

  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>");
  const pageRefs = [];

  pagedLines.forEach((pageLines) => {
    const contentStream = [
      "BT",
      "/F1 10 Tf",
      ...pageLines.map((line, index) => {
        const y = pageHeight - marginTop - index * lineHeight;
        return `1 0 0 1 ${marginLeft} ${y} Tm (${escapePdfText(line)}) Tj`;
      }),
      "ET",
    ].join("\n");

    const contentBuffer = Buffer.from(contentStream, "utf8");
    const contentId = addObject(`<< /Length ${contentBuffer.length} >>\nstream\n${contentStream}\nendstream`);
    const pageId = addObject(
      `<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    );

    pageRefs.push(pageId);
  });

  const pagesId = addObject(
    `<< /Type /Pages /Kids [${pageRefs.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageRefs.length} >>`,
  );

  pageRefs.forEach((pageId) => {
    objects[pageId - 1] = objects[pageId - 1].replace("/Parent 0 0 R", `/Parent ${pagesId} 0 R`);
  });

  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((objectContent, index) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${objectContent}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
};

const buildStudentGradePdf = ({ student, classInfo }) => {
  const attendanceMap = buildAttendanceMap(student.attendance_records);
  const subjectRows = [...(student.subject_records ?? [])].sort((left, right) =>
    String(left.subject_record?.subject_name ?? left.subject_name ?? "").localeCompare(
      String(right.subject_record?.subject_name ?? right.subject_name ?? ""),
    ),
  );

  const totalSchoolDays = ATTENDANCE_MONTHS.reduce(
    (sum, month) => sum + Number(attendanceMap.get(month)?.school_days ?? 0),
    0,
  );
  const totalPresent = ATTENDANCE_MONTHS.reduce(
    (sum, month) => sum + Number(attendanceMap.get(month)?.days_present ?? 0),
    0,
  );
  const totalAbsent = ATTENDANCE_MONTHS.reduce(
    (sum, month) => sum + Number(attendanceMap.get(month)?.days_absent ?? 0),
    0,
  );

  const numericAverages = subjectRows
    .map((record) => Number(record.avg_grade))
    .filter((value) => Number.isFinite(value));
  const finalAverage =
    numericAverages.length > 0
      ? Math.round((numericAverages.reduce((sum, value) => sum + value, 0) / numericAverages.length) * 100) / 100
      : "N/A";
  const remarks =
    numericAverages.length > 0
      ? numericAverages.every((value) => value >= 75)
        ? "PASSED"
        : "FAILED"
      : "N/A";

  const gradeLevel = classInfo?.grade_level ?? student.grade_level?.grade_level ?? "";
  const sectionName = classInfo?.section_name ?? student.section_name ?? "";
  const schoolYear =
    classInfo?.syear_start && classInfo?.syear_end
      ? `${classInfo.syear_start} - ${classInfo.syear_end}`
      : student.syear_start && student.syear_end
        ? `${student.syear_start} - ${student.syear_end}`
        : "";

  const subjectHeader = [
    padCell("Learning Area", 22),
    padCell("Q1", 5, "right"),
    padCell("Q2", 5, "right"),
    padCell("Q3", 5, "right"),
    padCell("Q4", 5, "right"),
    padCell("Final", 7, "right"),
    padCell("Remarks", 10),
  ].join(" ");

  const attendanceHeader = ["Month", "Days", "Present", "Absent"]
    .map((label, index) => padCell(label, [7, 7, 9, 8][index], index === 0 ? "left" : "right"))
    .join(" ");

  const lines = [
    "QUARTERLY GRADES",
    "",
    `Student Name : ${student.fname} ${student.lname}`,
    `LRN Number   : ${student.lrn_number}`,
    `Grade        : ${gradeLevel}`,
    `Section      : ${sectionName}`,
    `School Year  : ${schoolYear}`,
    "",
    "GRADE SUMMARY",
    subjectHeader,
    "-".repeat(subjectHeader.length),
    ...subjectRows.map((record) =>
      [
        padCell(record.subject_record?.subject_name ?? record.subject_name ?? "", 22),
        padCell(normalizeGradeValue(record.q1_grade), 5, "right"),
        padCell(normalizeGradeValue(record.q2_grade), 5, "right"),
        padCell(normalizeGradeValue(record.q3_grade), 5, "right"),
        padCell(normalizeGradeValue(record.q4_grade), 5, "right"),
        padCell(normalizeGradeValue(record.avg_grade), 7, "right"),
        padCell(record.remarks ?? "", 10),
      ].join(" "),
    ),
    "-".repeat(subjectHeader.length),
    `General Average: ${finalAverage}`,
    `Remarks        : ${remarks}`,
    "",
    "ATTENDANCE SUMMARY",
    attendanceHeader,
    "-".repeat(attendanceHeader.length),
    ...ATTENDANCE_MONTHS.map((month) =>
      [
        padCell(month, 7),
        padCell(attendanceMap.get(month)?.school_days ?? "", 7, "right"),
        padCell(attendanceMap.get(month)?.days_present ?? "", 9, "right"),
        padCell(attendanceMap.get(month)?.days_absent ?? "", 8, "right"),
      ].join(" "),
    ),
    "-".repeat(attendanceHeader.length),
    [
      padCell("Total", 7),
      padCell(totalSchoolDays, 7, "right"),
      padCell(totalPresent, 9, "right"),
      padCell(totalAbsent, 8, "right"),
    ].join(" "),
  ];

  return createPdfBuffer(lines);
};

const crcTable = new Uint32Array(256).map((_, index) => {
  let crc = index;
  for (let i = 0; i < 8; i += 1) {
    crc = (crc & 1) ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1);
  }
  return crc >>> 0;
});

const crc32 = (buffer) => {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
};

const createZipBuffer = (entries) => {
  const localFileParts = [];
  const centralDirectoryParts = [];
  let offset = 0;

  entries.forEach((entry) => {
    const nameBuffer = Buffer.from(entry.name, "utf8");
    const dataBuffer = Buffer.isBuffer(entry.content)
      ? entry.content
      : Buffer.from(entry.content, "utf8");
    const checksum = crc32(dataBuffer);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(dataBuffer.length, 18);
    localHeader.writeUInt32LE(dataBuffer.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localFileParts.push(localHeader, nameBuffer, dataBuffer);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(dataBuffer.length, 20);
    centralHeader.writeUInt32LE(dataBuffer.length, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralDirectoryParts.push(centralHeader, nameBuffer);
    offset += localHeader.length + nameBuffer.length + dataBuffer.length;
  });

  const centralDirectory = Buffer.concat(centralDirectoryParts);
  const endOfCentralDirectory = Buffer.alloc(22);
  endOfCentralDirectory.writeUInt32LE(0x06054b50, 0);
  endOfCentralDirectory.writeUInt16LE(0, 4);
  endOfCentralDirectory.writeUInt16LE(0, 6);
  endOfCentralDirectory.writeUInt16LE(entries.length, 8);
  endOfCentralDirectory.writeUInt16LE(entries.length, 10);
  endOfCentralDirectory.writeUInt32LE(centralDirectory.length, 12);
  endOfCentralDirectory.writeUInt32LE(offset, 16);
  endOfCentralDirectory.writeUInt16LE(0, 20);

  return Buffer.concat([...localFileParts, centralDirectory, endOfCentralDirectory]);
};

module.exports = {
  ATTENDANCE_MONTHS,
  buildStudentGradePdf,
  createZipBuffer,
  sanitizeFileName,
};
