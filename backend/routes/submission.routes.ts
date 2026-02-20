import { Router } from 'express';
import { submitCode } from '../controllers/submission.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);
router.post('/', submitCode);

export default router;
