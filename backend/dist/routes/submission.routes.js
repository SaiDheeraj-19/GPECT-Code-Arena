"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const submission_controller_1 = require("../controllers/submission.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken);
// Rate limiter: maximum 10 submissions/runs per minute per user 
const submissionLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 10,
    message: { error: 'Too many submissions. Please wait a minute.' },
    keyGenerator: (req) => {
        return req.user.id;
    }
});
// Language configs
router.get('/languages', submission_controller_1.getSupportedLanguages);
// Analytics
router.get('/analytics', submission_controller_1.getAnalytics);
// Submissions
router.post('/run', submissionLimiter, submission_controller_1.runCode);
router.post('/', submissionLimiter, submission_controller_1.submitCode);
router.get('/', submission_controller_1.getSubmissions);
router.get('/:id', submission_controller_1.getSubmissionById);
router.get('/global/leaderboard', submission_controller_1.getGlobalLeaderboard);
exports.default = router;
