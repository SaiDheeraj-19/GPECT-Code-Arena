import { Router } from 'express';
import { logSuspiciousActivity } from '../controllers/log.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireStudent } from '../middleware/role.middleware';

const router = Router();

router.use(authenticateToken);
router.use(requireStudent);

router.post('/', logSuspiciousActivity);

export default router;
