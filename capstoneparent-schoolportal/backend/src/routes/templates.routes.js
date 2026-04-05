const express = require('express');
const path = require('path');
const fs = require('fs');
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

/**
 * GET /api/templates/student-list?format=csv
 */
router.get('/student-list', (req, res) => {
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
