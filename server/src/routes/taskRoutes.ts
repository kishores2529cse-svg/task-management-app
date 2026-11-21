import { Router } from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  batchUpdateTasks,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
  addAttachment,
  deleteAttachment,
} from '../controllers/taskController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post('/', authorize('ADMIN', 'MANAGER', 'MEMBER'), createTask);
router.put('/:id', updateTask);
router.patch('/:id/status', updateTaskStatus);
router.delete('/:id', deleteTask);
router.post('/batch', batchUpdateTasks);

// Subtasks
router.post('/:taskId/subtasks', addSubtask);
router.patch('/subtasks/:subtaskId/toggle', toggleSubtask);
router.delete('/subtasks/:subtaskId', deleteSubtask);

// Attachments
router.post('/:taskId/attachments', addAttachment);
router.delete('/attachments/:attachmentId', deleteAttachment);

export default router;
