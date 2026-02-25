"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken);
router.use(role_middleware_1.requireAdmin);
// Problems
router.post('/problems', admin_controller_1.createProblem);
router.put('/problems/:id', admin_controller_1.editProblem);
router.delete('/problems/:id', admin_controller_1.deleteProblem);
// Test Cases
router.post('/problems/:problemId/testcases', admin_controller_1.addTestCase);
router.put('/testcases/:id', admin_controller_1.updateTestCase);
router.delete('/testcases/:id', admin_controller_1.deleteTestCase);
// Submissions & Logs
router.get('/submissions', admin_controller_1.getAllSubmissions);
router.get('/logs', admin_controller_1.getLogs);
// Dashboard
router.get('/stats', admin_controller_1.getDashboardStats);
// Student Analytics & Directory
router.get('/students/directory', admin_controller_1.getAllStudents);
router.get('/students/:userId/analytics', admin_controller_1.getStudentAnalytics);
exports.default = router;
