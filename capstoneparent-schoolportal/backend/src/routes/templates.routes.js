const express = require('express');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();

// All routes require authentication and appropriate roles
router.use(authenticate);
router.use(authorize('Admin', 'Principal', 'Vice_Principal', 'Teacher'));

// Helper to send file
const serveTemplate = (res, filename, downloadName) => {
  const filePath = path.join(__dirname, '../../templates', filename);
  if (fs.existsSync(filePath)) {
    res.download(filePath, downloadName);
  } else {
    res.status(404).json({ message: "Template file not found" });
  }
};

const sendWorkbookTemplate = (res, rows, downloadName) => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
  res.send(buffer);
};

/**
 * GET /api/templates/student-list?format=csv
 */
router.get('/student-list', (req, res) => {
  const format = String(req.query.format || 'csv').toLowerCase();

  if (format === 'xlsx') {
    return sendWorkbookTemplate(
      res,
      [[
        'First Name',
        'Last Name',
        'Sex',
        'LRN Number',
        'Grade Level',
        'School Year Start',
        'School Year End',
      ]],
      'student-list-template.xlsx'
    );
  }

  serveTemplate(res, 'student-list-template.csv', 'student-list-template.csv');
});

/**
 * GET /api/templates/grades?format=csv
 */
router.get('/grades', (req, res) => {
  serveTemplate(res, 'grades-template.csv', 'grades-template.csv');
});

/**
 * GET /api/templates/attendance?format=csv
 */
router.get('/attendance', (req, res) => {
  serveTemplate(res, 'attendance-template.csv', 'attendance-template.csv');
});

module.exports = router;
