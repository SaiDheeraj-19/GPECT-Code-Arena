import { Router } from 'express';
import { getProblems, getProblem } from '../controllers/problem.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken); // Both student and admin can access
router.get('/', getProblems);
router.get('/:id', getProblem);

export default router;
