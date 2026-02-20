import { Router } from 'express';
import { createProblem, editProblem, deleteProblem, addTestCase, getAllSubmissions, getLogs } from '../controllers/admin.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';

const router = Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.post('/problems', createProblem);
router.put('/problems/:id', editProblem);
router.delete('/problems/:id', deleteProblem);
router.post('/problems/:problemId/testcases', addTestCase);
router.get('/submissions', getAllSubmissions);
router.get('/logs', getLogs);

export default router;
