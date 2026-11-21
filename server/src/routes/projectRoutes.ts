import { Router } from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
} from '../controllers/projectController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post('/', authorize('ADMIN', 'MANAGER'), createProject);
router.put('/:id', authorize('ADMIN', 'MANAGER'), updateProject);
router.delete('/:id', authorize('ADMIN'), deleteProject);
router.post('/:id/members', authorize('ADMIN', 'MANAGER'), addProjectMember);
router.delete('/:id/members/:userId', authorize('ADMIN', 'MANAGER'), removeProjectMember);

export default router;
