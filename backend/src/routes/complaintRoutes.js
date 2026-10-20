import { Router } from 'express';
import {
  createComplaint,
  listComplaints,
  getComplaint,
  assignComplaint,
  updatePriority,
  updateStatus,
  submitFeedback,
  getOptions,
} from '../controllers/complaintController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// All complaint routes require authentication.
router.use(authenticate);

// Enum options for forms and filters.
router.get('/meta/options', getOptions);

// Create (with optional evidence image) and list (role-scoped).
router.post('/', upload.single('image'), createComplaint);
router.get('/', listComplaints);
router.get('/:id', getComplaint);

// Admin-only: assignment and priority.
router.put('/:id/assign', authorize('admin'), assignComplaint);
router.put('/:id/priority', authorize('admin'), updatePriority);

// Staff/admin: status updates with optional completion image.
router.put(
  '/:id/status',
  authorize('staff', 'admin'),
  upload.single('completionImage'),
  updateStatus
);

// Owner feedback after resolution.
router.post('/:id/feedback', submitFeedback);

export default router;
