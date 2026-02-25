import { Router } from 'express';
import { submitCode, getSubmissions, getSubmissionById, getAnalytics, getSupportedLanguages, getGlobalLeaderboard } from '../controllers/submission.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

// Language configs
router.get('/languages', getSupportedLanguages);

// Analytics
router.get('/analytics', getAnalytics);

// Submissions
router.post('/', submitCode);
router.get('/', getSubmissions);
router.get('/:id', getSubmissionById);
router.get('/global/leaderboard', getGlobalLeaderboard);

export default router;
