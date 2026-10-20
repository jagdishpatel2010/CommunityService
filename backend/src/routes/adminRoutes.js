import { Router } from 'express';
import {
  getStats,
  listUsers,
  createStaff,
  setUserActive,
  setUserRole,
  listStaff,
} from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Staff list is needed by both admin (assignment) — restrict to admin here.
router.use(authenticate);

router.get('/stats', authorize('admin'), getStats);
router.get('/users', authorize('admin'), listUsers);
router.get('/staff', authorize('admin'), listStaff);
router.post('/staff', authorize('admin'), createStaff);
router.patch('/users/:id/active', authorize('admin'), setUserActive);
router.patch('/users/:id/role', authorize('admin'), setUserRole);

export default router;
