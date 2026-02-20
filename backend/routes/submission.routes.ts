import { Router } from 'express';
import { submitCode, getSubmissions } from '../controllers/submission.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);
router.post('/', submitCode);
router.get('/', getSubmissions);

export default router;
