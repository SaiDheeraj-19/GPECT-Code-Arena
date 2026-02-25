import { Router } from 'express';
import { login, register, resetPassword, updateProfile, getMe } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', authenticateToken, getMe);
router.post('/reset-password', authenticateToken, resetPassword);
router.put('/profile', authenticateToken, updateProfile);

export default router;
