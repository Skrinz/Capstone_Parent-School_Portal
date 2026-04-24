const express = require('express');
const { body, param, query } = require('express-validator');
const classesController = require('../controllers/classes.controller');
const validate = require('../middlewares/validation');
const { authenticate, authorize } = require('../middlewares/auth');
const multer = require('multer');

const router = express.Router();

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// All routes require authentication
router.use(authenticate);

// Get all class lists
router.get('/',
  authorize('Teacher', 'Admin', 'Principal'),
  [
    query('school_year').optional().isInt(),
    query('grade_level').optional().isInt(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validate,
  classesController.getAllClasses
);

// Get teacher's classes (same user_id as adviser / subject teacher; empty list if none)
router.get('/teacher/list',
  authorize('Teacher', 'Admin', 'Principal'),
  classesController.getTeacherClasses
);

// Get teacher's subjects
router.get('/subjects/teacher',
  authorize('Teacher', 'Admin', 'Principal'),
  classesController.getTeacherSubjects
);

// Get all subjects
router.get('/subjects/all',
  authorize('Teacher', 'Admin', 'Principal'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validate,
  classesController.getAllSubjects
);

// Get all sections
router.get('/sections/all',
  authorize('Teacher', 'Admin', 'Principal'),
  classesController.getAllSections
);

// Download grade sheet template
router.get('/grade-sheet-template',
  authorize('Teacher', 'Admin', 'Principal'),
  classesController.downloadGradeSheetTemplate
);

// Download subject teacher grade sheet template
router.get('/subject-grade-sheet-template',
  authorize('Teacher', 'Admin', 'Principal'),
  classesController.downloadSubjectGradeSheetTemplate
);

// Download attendance template
router.get('/attendance-template',
  authorize('Teacher', 'Admin', 'Principal'),
  classesController.downloadAttendanceTemplate
);

// Get all grade levels
router.get('/grade-levels/all',
  authorize('Teacher', 'Admin', 'Principal'),
  classesController.getAllGradeLevels
);

// Create section
router.post('/sections',
  authorize('Admin', 'Principal'),
  [
    body('section_name').notEmpty().withMessage('Section name is required')
  ],
  validate,
  classesController.createSection
);

// Update section
router.put('/sections/:id',
  authorize('Admin', 'Principal'),
  [
    param('id').isInt(),
    body('section_name').notEmpty().withMessage('Section name is required')
  ],
  validate,
  classesController.updateSection
);

// Delete section
router.delete('/sections/:id',
  authorize('Admin', 'Principal'),
  param('id').isInt(),
  validate,
  classesController.deleteSection
);

// Get class by ID
router.get('/:id',
  authorize('Teacher', 'Admin', 'Principal'),
  param('id').isInt(),
  validate,
  classesController.getClassById
);

// Create class (Admin only)
router.post('/',
  authorize('Admin', 'Principal'),
  [
    body('gl_id').isInt(),
    body('section_id').isInt(),
    body('class_adviser').isInt().withMessage('Class adviser is required'),
    body('syear_start').isInt({ min: 2000, max: 2100 }),
    body('syear_end').isInt({ min: 2000, max: 2100 }),
    body('class_sched').optional()
  ],
  validate,
  classesController.createClass
);

// Update class
router.put('/:id',
  authorize('Admin', 'Principal'),
  [
    param('id').isInt(),
    body('gl_id').optional().isInt(),
    body('section_id').optional().isInt(),
    body('class_adviser').optional().isInt(),
    body('class_sched').optional()
  ],
  validate,
  classesController.updateClass
);

// Upload class schedule image
router.post(
  '/:id/upload-schedule',
  authorize('Teacher', 'Admin', 'Principal'),
  param('id').isInt(),
  upload.single('file'),
  validate,
  classesController.uploadClassSchedule
);

// Delete class
router.delete('/:id',
  authorize('Admin', 'Principal'),
  param('id').isInt(),
  validate,
  classesController.deleteClass
);

// Add subject to class
router.post('/:id/subjects',
  authorize('Admin', 'Principal', 'Teacher'),
  [
    param('id').isInt(),
    body('subject_name').notEmpty(),
    body('time_start').optional().matches(timePattern),
    body('time_end').optional().matches(timePattern),
    body('subject_teacher').optional().isInt()
  ],
  validate,
  classesController.addSubjectToClass
);

// Get class subjects
router.get('/:id/subjects',
  authorize('Teacher', 'Admin', 'Principal'),
  param('id').isInt(),
  validate,
  classesController.getClassSubjects
);

// Assign teacher to subject
router.put('/subjects/:subjectId/assign-teacher',
  authorize('Admin', 'Principal'),
  [
    param('subjectId').isInt(),
    body('teacher_id').isInt().withMessage('Teacher is required'),
  ],
  validate,
  classesController.assignTeacherToSubject
);

// Add student to class
router.post('/:id/students',
  authorize('Teacher', 'Admin', 'Principal'),
  [
    param('id').isInt(),
    body('student_id').optional().isInt(),
    body('fname').optional().trim(),
    body('lname').optional().trim(),
    body('sex').optional().isIn(['Male', 'Female', 'M', 'F']),
    body('lrn_number').optional().isString().trim(),
    body('syear_start').optional().isInt({ min: 2000, max: 2100 }),
    body('syear_end').optional().isInt({ min: 2000, max: 2100 })
  ],
  validate,
  classesController.addStudentToClass
);

// Remove student from class
router.delete('/:id/students/:studentId',
  authorize('Teacher', 'Admin', 'Principal'),
  [
    param('id').isInt(),
    param('studentId').isInt()
  ],
  validate,
  classesController.removeStudentFromClass
);

// Add student to subject
router.post('/subjects/:subjectId/students/:studentId',
  authorize('Teacher', 'Admin', 'Principal'),
  [
    param('subjectId').isInt(),
    param('studentId').isInt()
  ],
  validate,
  classesController.addStudentToSubject
);

// Remove student from subject
router.delete('/subjects/:subjectId/students/:studentId',
  authorize('Teacher', 'Admin', 'Principal'),
  [
    param('subjectId').isInt(),
    param('studentId').isInt()
  ],
  validate,
  classesController.removeStudentFromSubject
);

// Update student grades
router.put('/subjects/:subjectId/students/:studentId/grades',
  authorize('Teacher', 'Admin', 'Principal'),
  [
    param('subjectId').isInt(),
    param('studentId').isInt(),
    body('q1_grade').optional().isInt({ min: 0, max: 100 }),
    body('q2_grade').optional().isInt({ min: 0, max: 100 }),
    body('q3_grade').optional().isInt({ min: 0, max: 100 }),
    body('q4_grade').optional().isInt({ min: 0, max: 100 })
  ],
  validate,
  classesController.updateStudentGrades
);

// Update attendance
router.post('/students/:studentId/attendance',
  authorize('Teacher', 'Admin', 'Principal'),
  [
    param('studentId').isInt(),
    body('school_days').isInt({ min: 0 }),
    body('days_present').isInt({ min: 0 }),
    body('days_absent').isInt({ min: 0 }),
    body('month').isIn(['Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'])
  ],
  validate,
  classesController.updateAttendance
);

router.get('/:id/export-grades-all-quarters',
  authorize('Teacher', 'Admin', 'Principal'),
  param('id').isInt(),
  validate,
  classesController.exportAllQuartersGrades
);

// Import class grades
router.post('/:id/import-grades',
  authorize('Teacher', 'Admin', 'Principal'),
  param('id').isInt(),
  upload.single('file'),
  validate,
  classesController.importClassGrades
);

// Import subject grades via XLSX
router.post('/subjects/:id/import-grades',
  authorize('Teacher', 'Admin', 'Principal'),
  param('id').isInt(),
  upload.single('file'),
  validate,
  classesController.importSubjectGrades
);

// Import class attendance via CSV
router.post('/:id/import-attendance',
  authorize('Teacher', 'Admin', 'Principal'),
  param('id').isInt(),
  upload.single('file'),
  validate,
  classesController.importAttendance
);

// Backward-compatible import class attendance via CSV
router.post('/import-attendance',
  authorize('Teacher', 'Admin', 'Principal'),
  upload.single('file'),
  validate,
  classesController.importAttendance
);

// Import student list for a class via XLSX
router.post('/:id/import-students',
  authorize('Teacher', 'Admin', 'Principal'),
  param('id').isInt(),
  upload.single('file'),
  validate,
  classesController.importStudents
);

module.exports = router;
