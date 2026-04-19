const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs   = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, '../../templates');
const PH = 612; // landscape Letter page height in points (y=0 at bottom in pdf-lib)

// ── Template map: grade level → template filename ─────────────────────────
const TEMPLATE_FILE = {
  'Kindergarten': 'Kindergarten_ReportCard(Size-Letter).pdf',
  'Grade 1':      'Grade1-2_ReportCard(Size-Letter).pdf',
  'Grade 2':      'Grade1-2_ReportCard(Size-Letter).pdf',
  'Grade 3':      'Grade3_ReportCard(Size-Letter).pdf',
  'Grade 4':      'Grade4-6_ReportCard(Size-Letter).pdf',
  'Grade 5':      'Grade4-6_ReportCard(Size-Letter).pdf',
  'Grade 6':      'Grade4-6_ReportCard(Size-Letter).pdf',
};

// ── Per-template page-2 grade table layout ────────────────────────────────
// All y-values are in pdf-lib coordinates (y=0 at bottom of page).
//
// How to calibrate if grades drift out of alignment with template boxes:
//   1. Open the blank template PDF in a viewer that shows cursor coordinates.
//   2. Hover over the vertical CENTER of the first subject data row → note y from bottom.
//      That is firstRowY.
//   3. Measure the vertical distance between the center of row 1 and row 2 → rowH.
//   4. Hover over the center of the General Average value cell → genAvgY.
//   5. Measure the usable inner width of the subject-name column → subjectColW.
//
// Grade 1-2: confirmed by original implementation.
// Grade 3:   confirmed by pdfplumber measurement of generated PDF output.
// Grade 4-6: assumed identical to Grade 3 — measure and update if rows drift.

const GRADE_TABLE_LAYOUT = {
  'Grade1-2_ReportCard(Size-Letter).pdf': {
    firstRowY:   PH - 111,  // y-center of first subject row → 503pt
    rowH:        25,         // row height in points (spacing between row centers)
    genAvgY:     PH - 420,  // y-center of General Average value row → 184pt
    subjectColW: 151,        // usable width (pt) for subject name text
  },
  'Grade3_ReportCard(Size-Letter).pdf': {
    firstRowY:   PH - 111,  // measured box center 502.5pt; −2pt baseline correction → 501pt
    rowH:        25,
    genAvgY:     PH - 420,
    subjectColW: 151,
  },
  'Grade4-6_ReportCard(Size-Letter).pdf': {
    firstRowY:   PH - 111,  // ⚠ assumed — calibrate against template if rows drift
    rowH:        25,         // ⚠ assumed — calibrate against template if rows drift
    genAvgY:     PH - 420,  // ⚠ assumed — calibrate against template if rows drift
    subjectColW: 151,        // ⚠ assumed — calibrate against template if rows drift
  },
};

// ── Attendance: month column x-centers (confirmed by measurement) ─────────
const ATT_COL_CENTERS = {
  Jun: 68, Jul: 94, Aug: 116, Sept: 145, Oct: 171,
  Nov: 196, Dec: 220, Jan: 245, Feb: 270, Mar: 296,
};
const ATT_TOTAL_X = 322;

// Attendance row y-centers (pdf-lib coords).
// Row boundaries from template structure: school_days=100–137, days_present=137–169, days_absent=169–205.
const ATT_ROW_Y = {
  school_days:  PH - 118,  // center of 100–137 band → 494pt
  days_present: PH - 153,  // center of 137–169 band → 459pt
  days_absent:  PH - 187,  // center of 169–205 band → 425pt
};

// ── Grade table column x-centers / left edges ────────────────────────────
const GRADE_COL_X = {
  subject: 38,   // left-aligned column start
  q1:      191,  // column center (confirmed exact by measurement)
  q2:      215,
  q3:      238,
  q4:      261,
  final:   298,
  remarks: 349,  // column center (updated for true centering)
};

// ── Subject name font sizing ──────────────────────────────────────────────
const SUBJECT_FONT_PREFERRED = 7.5;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function makeDraw(page, helvetica, helveticaBold) {
  return (text, x, y, size, bold = false) => {
    if (text === null || text === undefined || text === '') return;
    page.drawText(String(text), {
      x, y, size,
      font:  bold ? helveticaBold : helvetica,
      color: rgb(0, 0, 0),
    });
  };
}

function centeredX(text, centerX, font, size) {
  return centerX - font.widthOfTextAtSize(text, size) / 2;
}

function buildAttendanceMap(attendanceRecords = []) {
  const map = {};
  attendanceRecords.forEach(r => { if (r?.month) map[r.month] = r; });
  return map;
}

/**
 * Wraps text into multiple lines based on maximum column width.
 * Returns an array of strings.
 */
function wrapText(text, font, size, maxWidth) {
  if (!text) return [];
  const words = String(text).split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = font.widthOfTextAtSize(currentLine + ' ' + word, size);
    if (width <= maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

// ─────────────────────────────────────────────────────────────────────────────
// Grades 1–6
// ─────────────────────────────────────────────────────────────────────────────
async function generateElementaryReportCard({ student, classInfo }) {
  const gradeLevel    = classInfo?.grade_level  ?? student.grade_level?.grade_level ?? '';
  const sectionName   = classInfo?.section_name ?? student.section_name ?? '';
  const schoolYear    = classInfo?.syear_start && classInfo?.syear_end
    ? `${classInfo.syear_start} - ${classInfo.syear_end}` : '';
  const adviserName   = classInfo?.adviser_name   ?? '';
  const principalName = classInfo?.principal_name ?? '';

  const sexDisplay   = (student.sex === 'M' || student.sex === 'Male') ? 'MALE' : 'FEMALE';
  const gradeDisplay = String(gradeLevel).replace(/\D/g, '');

  // Resolve template and its layout config
  const templateFile = TEMPLATE_FILE[gradeLevel];
  if (!templateFile) throw new Error(`No report card template found for grade level: "${gradeLevel}"`);

  const layout = GRADE_TABLE_LAYOUT[templateFile];

  // Build sorted subjects — skip rows where avg_grade is null or 0
  const subjects = (student.subject_records ?? [])
    .map(r => ({
      name:    (r.subject_record?.subject_name ?? r.subject_name ?? '').toUpperCase(),
      q1:      r.q1_grade  != null ? r.q1_grade  : '',
      q2:      r.q2_grade  != null ? r.q2_grade  : '',
      q3:      r.q3_grade  != null ? r.q3_grade  : '',
      q4:      r.q4_grade  != null ? r.q4_grade  : '',
      avg:     r.avg_grade != null ? r.avg_grade  : '',
      remarks: r.remarks === 'PASSED' ? 'PASSED'
             : r.remarks === 'FAILED' ? 'FAILED' : '',
    }))
    .filter(r => r.name)
    .sort((a, b) => a.name.localeCompare(b.name));

  // General average — only from subjects with a real (non-zero) avg grade
  const gradedAvgs = subjects
    .map(s => Number(s.avg))
    .filter(g => Number.isFinite(g) && g > 0);

  const genAvg = student.finalAvgGrade != null && student.finalAvgGrade > 0
    ? student.finalAvgGrade
    : gradedAvgs.length > 0
      ? Math.round(gradedAvgs.reduce((a, b) => a + b, 0) / gradedAvgs.length * 100) / 100
      : '';
  const genRemarks = gradedAvgs.length > 0
    ? (gradedAvgs.every(g => g >= 75) ? 'PASSED' : 'FAILED')
    : '';

  // Attendance
  const attMap = buildAttendanceMap(student.attendance_records);

  const templateBytes = fs.readFileSync(path.join(TEMPLATES_DIR, templateFile));
  const pdfDoc = await PDFDocument.load(templateBytes);
  const helvetica     = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const [page1, page2] = pdfDoc.getPages();

  const d1 = makeDraw(page1, helvetica, helveticaBold);
  const d2 = makeDraw(page2, helvetica, helveticaBold);

  // ── PAGE 1 ────────────────────────────────────────────────────────────────

  // School Year
  d1(schoolYear, 590, PH - 192, 9);

  // Name
  d1(`${student.lname.toUpperCase()}, ${student.fname.toUpperCase()}`, 490, PH - 219, 10, true);

  // Sex
  d1(sexDisplay, 650, PH - 235, 9);

  // Grade / Section / LRN
  d1(gradeDisplay,               490,  PH - 248, 8);
  d1(sectionName.toUpperCase(),  567,  PH - 248, 8);
  d1(String(student.lrn_number), 683,  PH - 248, 8);

  // Principal
  if (principalName) {
    const pnW = helveticaBold.widthOfTextAtSize(principalName.toUpperCase(), 8);
    d1(principalName.toUpperCase(), 480 + (110 - pnW) / 2, PH - 382, 8, true);
    // Certificate of Transfer section
    d1(principalName.toUpperCase(), 469 + (110 - pnW) / 2, PH - 504, 8, true);
  }

  // Adviser
  if (adviserName) {
    const tnW = helveticaBold.widthOfTextAtSize(adviserName.toUpperCase(), 8);
    d1(adviserName.toUpperCase(), 622 + (130 - tnW) / 2, PH - 370, 8, true);
    // Certificate of Transfer section
    d1(adviserName.toUpperCase(), 628 + (130 - tnW) / 2, PH - 501, 8, true);
  }

  // Attendance values
  const attRowKeys = [
    { key: 'school_days',  y: ATT_ROW_Y.school_days  },
    { key: 'days_present', y: ATT_ROW_Y.days_present },
    { key: 'days_absent',  y: ATT_ROW_Y.days_absent  },
  ];
  Object.entries(ATT_COL_CENTERS).forEach(([month, cx]) => {
    const rec = attMap[month];
    if (!rec) return;
    attRowKeys.forEach(({ key, y }) => {
      const val = rec[key];
      if (val != null && val !== '') {
        const str = String(val);
        d1(str, centeredX(str, cx, helvetica, 8), y, 8);
      }
    });
  });

  // Attendance totals
  const totals = {
    school_days:  Object.keys(ATT_COL_CENTERS).reduce((s, m) => s + Number(attMap[m]?.school_days  ?? 0), 0),
    days_present: Object.keys(ATT_COL_CENTERS).reduce((s, m) => s + Number(attMap[m]?.days_present ?? 0), 0),
    days_absent:  Object.keys(ATT_COL_CENTERS).reduce((s, m) => s + Number(attMap[m]?.days_absent  ?? 0), 0),
  };
  attRowKeys.forEach(({ key, y }) => {
    const str = String(totals[key]);
    d1(str, centeredX(str, ATT_TOTAL_X, helvetica, 8), y, 8);
  });

  // ── PAGE 2 ────────────────────────────────────────────────────────────────

  subjects.forEach((subj, i) => {
    const rowY = layout.firstRowY - i * layout.rowH;

    // Word Wrap subject name logic
    const lines = wrapText(subj.name, helvetica, SUBJECT_FONT_PREFERRED, layout.subjectColW);
    const lineHeight = 8; // Optimal spacing between wrapped lines
    
    // Calculates a starting Y position to vertically center the multi-line block around the initial rowY
    const startY = rowY + ((lines.length - 1) * lineHeight) / 2;

    lines.forEach((line, lineIdx) => {
      const lineY = startY - (lineIdx * lineHeight);
      d2(line, GRADE_COL_X.subject, lineY, SUBJECT_FONT_PREFERRED);
    });

    // Grade values — always 8pt, horizontally centered within each column
    if (subj.q1  !== '') d2(String(subj.q1),  centeredX(String(subj.q1),  GRADE_COL_X.q1,   helvetica, 8), rowY, 8);
    if (subj.q2  !== '') d2(String(subj.q2),  centeredX(String(subj.q2),  GRADE_COL_X.q2,   helvetica, 8), rowY, 8);
    if (subj.q3  !== '') d2(String(subj.q3),  centeredX(String(subj.q3),  GRADE_COL_X.q3,   helvetica, 8), rowY, 8);
    if (subj.q4  !== '') d2(String(subj.q4),  centeredX(String(subj.q4),  GRADE_COL_X.q4,   helvetica, 8), rowY, 8);
    if (subj.avg !== '') d2(String(subj.avg), centeredX(String(subj.avg), GRADE_COL_X.final, helvetica, 8), rowY, 8);
    if (subj.remarks)    d2(subj.remarks,     centeredX(subj.remarks,     GRADE_COL_X.remarks, helvetica, 8), rowY, 8);
  });

  // General Average row
  if (genAvg !== '') d2(String(genAvg), centeredX(String(genAvg), GRADE_COL_X.final, helvetica, 8), layout.genAvgY, 8);
  if (genRemarks)    d2(genRemarks,     centeredX(genRemarks,     GRADE_COL_X.remarks, helvetica, 8), layout.genAvgY, 8);

  return await pdfDoc.save();
}

// ─────────────────────────────────────────────────────────────────────────────
// Kindergarten
// ─────────────────────────────────────────────────────────────────────────────
async function generateKindergartenReportCard({ student, classInfo }) {
  const sectionName   = classInfo?.section_name   ?? student.section_name ?? '';
  const schoolYear    = classInfo?.syear_start && classInfo?.syear_end
    ? `${classInfo.syear_start} - ${classInfo.syear_end}` : '';
  const principalName = classInfo?.principal_name ?? '';
  const adviserName   = classInfo?.adviser_name   ?? '';

  const templateBytes = fs.readFileSync(
    path.join(TEMPLATES_DIR, TEMPLATE_FILE['Kindergarten'])
  );
  const pdfDoc = await PDFDocument.load(templateBytes);
  const helvetica     = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const [page1] = pdfDoc.getPages();

  const d1 = makeDraw(page1, helvetica, helveticaBold);

  d1(schoolYear, 556, PH - 161, 9, true);
  d1(`${student.lname.toUpperCase()}, ${student.fname.toUpperCase()}`, 449, PH - 231, 9, true);
  d1(sectionName.toUpperCase(), 455, PH - 244, 9, true);
  d1(String(student.lrn_number), 440, PH - 258, 9, true);

  if (principalName) d1(principalName.toUpperCase(), 418, PH - 509, 9, true);
  if (adviserName)   d1(adviserName.toUpperCase(),   638, PH - 509, 9, true);

  return await pdfDoc.save();
}

module.exports = { generateElementaryReportCard, generateKindergartenReportCard };