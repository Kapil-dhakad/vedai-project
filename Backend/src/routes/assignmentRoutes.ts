import { Router } from 'express';
import {
  createAssignment,
  getAssignments,
  getAssignment,
  getQuestionPaper,
  regenerateAssignment,
  deleteAssignment,
} from '../controllers/assignmentController';
import { uploadMiddleware } from '../middleware/upload';

const router = Router();

router.post('/', uploadMiddleware, createAssignment);

router.get('/', getAssignments);

router.get('/:id', getAssignment);

router.get('/:id/paper', getQuestionPaper);

router.post('/:id/regenerate', regenerateAssignment);

router.delete('/:id', deleteAssignment);

export default router;
