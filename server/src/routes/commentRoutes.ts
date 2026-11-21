import { Router } from 'express';
import { createComment, deleteComment } from '../controllers/commentController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/', createComment);
router.delete('/:id', deleteComment);

export default router;
