const express = require('express');
const { body, param, query } = require('express-validator');
const libraryController = require('../controllers/library.controller');
const validate = require('../middlewares/validation');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all learning materials
router.get('/materials',
  [
    query('item_type').optional().isIn(['Learning_Resource', 'Book']),
    query('category_id').optional().isInt(),
    query('grade_level').optional().isInt(),
    query('subject_id').optional().isInt(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 1000 })
  ],
  validate,
  libraryController.getAllMaterials
);

// Get material by ID
router.get('/materials/:id',
  param('id').isInt(),
  validate,
  libraryController.getMaterialById
);

// Create material (Librarian only)
router.post('/materials',
  authorize('Librarian', 'Admin'),
  [
    body('item_name').notEmpty().trim(),
    body('author').optional(),
    body('item_type').isIn(['Learning_Resource', 'Book']),
    body('category_id').isInt(),
    body('gl_id').isInt(),
    body('subject_id').optional({ nullable: true }).isInt()
  ],
  validate,
  libraryController.createMaterial
);

// Update material
router.put('/materials/:id',
  authorize('Librarian', 'Admin'),
  [
    param('id').isInt(),
    body('item_name').optional().trim(),
    body('author').optional(),
    body('item_type').optional().isIn(['Learning_Resource', 'Book']),
    body('category_id').optional().isInt(),
    body('gl_id').optional().isInt(),
    body('subject_id').optional({ nullable: true }).isInt()
  ],
  validate,
  libraryController.updateMaterial
);

// Delete material
router.delete('/materials/:id',
  authorize('Librarian', 'Admin'),
  param('id').isInt(),
  validate,
  libraryController.deleteMaterial
);

// Add copy to material
router.post('/materials/:id/copies',
  authorize('Librarian', 'Admin'),
  [
    param('id').isInt(),
    body('copy_code').isInt(),
    body('condition').optional()
  ],
  validate,
  libraryController.addCopy
);

// Update copy status
router.patch('/copies/:copyId/status',
  authorize('Librarian', 'Admin'),
  [
    param('copyId').isInt(),
    body('status').isIn(['AVAILABLE', 'BORROWED', 'LOST', 'GIVEN']),
    body('condition').optional()
  ],
  validate,
  libraryController.updateCopyStatus
);

// Borrow material
router.post('/borrow',
  [
    body('copy_id').isInt(),
    body('student_id').optional().isInt(),
    body('user_id').optional().isInt(),
    body('due_at').optional().isISO8601()
  ],
  validate,
  libraryController.borrowMaterial
);

// Return material
router.patch('/borrow/:borrowId/return',
  authorize('Librarian', 'Admin'),
  [
    param('borrowId').isInt(),
    body('penalty_cost').optional().isDecimal(),
    body('remarks').optional()
  ],
  validate,
  libraryController.returnMaterial
);

// Get borrow history
router.get('/borrow/history',
  [
    query('student_id').optional().isInt(),
    query('user_id').optional().isInt(),
    query('status').optional().isIn(['borrowed', 'returned', 'overdue']),
    query('copy_status').optional().isIn(['AVAILABLE', 'BORROWED', 'LOST', 'GIVEN']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 1000 })
  ],
  validate,
  libraryController.getBorrowHistory
);

// Get categories
router.get('/categories',
  libraryController.getAllCategories
);

// Get active subjects for book management
router.get('/subjects',
  libraryController.getAllSubjects
);

router.get('/borrowers/lookup',
  authorize('Librarian', 'Admin'),
  [
    query('q')
      .notEmpty()
      .withMessage('Search query is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Search query must be between 1 and 100 characters'),
  ],
  validate,
  libraryController.lookupBorrowers
);

// Create category (Librarian, Admin only)
router.post('/categories',
  authorize('Librarian', 'Admin'),
  [
    body('category_name').notEmpty().trim()
  ],
  validate,
  libraryController.createCategory
);

router.put('/categories/:categoryId',
  authorize('Librarian', 'Admin'),
  [
    param('categoryId').isInt(),
    body('category_name').notEmpty().trim(),
  ],
  validate,
  libraryController.updateCategory
);

module.exports = router;
