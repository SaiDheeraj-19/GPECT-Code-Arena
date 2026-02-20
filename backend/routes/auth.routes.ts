import { Router } from 'express';
import { login, register, resetPassword } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/reset-password', authenticateToken, resetPassword);

export default router;
