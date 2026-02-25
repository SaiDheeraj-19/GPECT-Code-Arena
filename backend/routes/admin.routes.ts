import { Router } from 'express';
import {
    createProblem,
    editProblem,
    deleteProblem,
    addTestCase,
    updateTestCase,
    deleteTestCase,
    getAllSubmissions,
    getLogs,
    getDashboardStats,
    getStudentAnalytics,
    getAllStudents
} from '../controllers/admin.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/role.middleware';

const router = Router();

router.use(authenticateToken);
router.use(requireAdmin);

// Problems
router.post('/problems', createProblem);
router.put('/problems/:id', editProblem);
router.delete('/problems/:id', deleteProblem);

// Test Cases
router.post('/problems/:problemId/testcases', addTestCase);
router.put('/testcases/:id', updateTestCase);
router.delete('/testcases/:id', deleteTestCase);

// Submissions & Logs
router.get('/submissions', getAllSubmissions);
router.get('/logs', getLogs);

// Dashboard
router.get('/stats', getDashboardStats);

// Student Analytics & Directory
router.get('/students/directory', getAllStudents);
router.get('/students/:userId/analytics', getStudentAnalytics);

export default router;
