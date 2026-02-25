import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { submitCode, getSubmissions, getSubmissionById, getAnalytics, getSupportedLanguages, getGlobalLeaderboard, runCode } from '../controllers/submission.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

// Rate limiter: maximum 10 submissions/runs per minute per user 
const submissionLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { error: 'Too many submissions. Please wait a minute.' },
    keyGenerator: (req) => {
        return (req as any).user.id;
    }
});

// Language configs
router.get('/languages', getSupportedLanguages);

// Analytics
router.get('/analytics', getAnalytics);

// Submissions
router.post('/run', submissionLimiter, runCode);
router.post('/', submissionLimiter, submitCode);
router.get('/', getSubmissions);
router.get('/:id', getSubmissionById);
router.get('/global/leaderboard', getGlobalLeaderboard);

export default router;
