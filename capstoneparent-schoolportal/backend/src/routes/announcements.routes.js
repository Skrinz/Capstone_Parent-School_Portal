const express = require('express');
const { body, param, query } = require('express-validator');
const announcementsController = require('../controllers/announcements.controller');
const validate = require('../middlewares/validation');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all announcements
router.get('/',
  [
    query('type').optional().isIn(['General', 'Staff_only', 'Memorandum']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validate,
  announcementsController.getAllAnnouncements
);

// Get announcement by ID
router.get('/:id',
  param('id').isInt(),
  validate,
  announcementsController.getAnnouncementById
);

// Create announcement 
router.post('/',
  authorize('Admin', 'Principal', 'Vice_Principal', 'Teacher', 'Librarian'),
  [
    body('announcement_title').notEmpty().trim(),
    body('announcement_desc').notEmpty(),
    body('announcement_type').isIn(['General', 'Staff_only', 'Memorandum']),
    body('file_ids').optional().isArray()
  ],
  validate,
  announcementsController.createAnnouncement
);

// Update announcement
router.put('/:id',
  authorize('Admin', 'Principal', 'Vice_Principal', 'Teacher', 'Librarian'),
  [
    param('id').isInt(),
    body('announcement_title').optional().trim(),
    body('announcement_desc').optional(),
    body('announcement_type').optional().isIn(['General', 'Staff_only', 'Memorandum'])
  ],
  validate,
  announcementsController.updateAnnouncement
);

// Delete announcement
router.delete('/:id',
  authorize('Admin', 'Principal', 'Vice_Principal', 'Teacher', 'Librarian'),
  param('id').isInt(),
  validate,
  announcementsController.deleteAnnouncement
);

module.exports = router;