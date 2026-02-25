import { Router } from 'express';
import {
    createContest,
    getContests,
    getContestById,
    registerForContest,
    getContestLeaderboard,
    deleteContest
} from '../controllers/contest.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';

const router = Router();

router.use(authenticateToken);

// Public (authenticated)
router.get('/', getContests);
router.get('/:id', getContestById);
router.get('/:id/leaderboard', getContestLeaderboard);
router.post('/:id/register', registerForContest);

// Admin only
router.post('/', requireAdmin, createContest);
router.delete('/:id', requireAdmin, deleteContest);

export default router;
