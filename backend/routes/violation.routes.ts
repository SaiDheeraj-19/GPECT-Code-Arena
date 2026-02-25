/**
 * Violation Routes
 * 
 * POST   /api/violations                                → Log a violation (student during contest)
 * GET    /api/violations/flagged                         → Get all flagged participants (admin)
 * GET    /api/violations/contest/:contestId              → Get all violations for a contest (admin)
 * GET    /api/violations/user/:userId/contest/:contestId → Get user violations in contest (admin)
 * POST   /api/violations/disqualify                      → Manually disqualify user (admin)
 * POST   /api/violations/unflag                          → Unflag a user (admin)
 */

import { Router } from 'express';
import {
    logViolation,
    getContestViolations,
    getFlaggedParticipants,
    getUserContestViolations,
    disqualifyUser,
    unflagUser
} from '../controllers/violation.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';

const router = Router();

router.use(authenticateToken);

// Student endpoint — log violation during contest
router.post('/', logViolation);

// Admin endpoints
router.get('/flagged', requireAdmin, getFlaggedParticipants);
router.get('/contest/:contestId', requireAdmin, getContestViolations);
router.get('/user/:userId/contest/:contestId', requireAdmin, getUserContestViolations);
router.post('/disqualify', requireAdmin, disqualifyUser);
router.post('/unflag', requireAdmin, unflagUser);

export default router;
