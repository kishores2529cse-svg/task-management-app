import { Router } from 'express';
import {
  getUsers,
  getUserById,
  updateUserRole,
  toggleUserStatus,
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', getUsers);
router.get('/:id', getUserById);
router.patch('/:id/role', authorize('ADMIN'), updateUserRole);
router.patch('/:id/status', authorize('ADMIN'), toggleUserStatus);

export default router;
