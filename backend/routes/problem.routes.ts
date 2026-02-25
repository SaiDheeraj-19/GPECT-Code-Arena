import { Router } from 'express';
import {
    getProblems,
    getProblem,
    getSolutions,
    addSolution,
    toggleLike,
    toggleDislike,
    getPointActivities
} from '../controllers/problem.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken); // Both student and admin can access

router.get('/', getProblems);
router.get('/activities/points', getPointActivities);
router.get('/:id', getProblem);

// Solutions
router.get('/:id/solutions', getSolutions);
router.post('/:id/solutions', addSolution);

// Social
router.post('/:id/like', toggleLike);
router.post('/:id/dislike', toggleDislike);

export default router;
