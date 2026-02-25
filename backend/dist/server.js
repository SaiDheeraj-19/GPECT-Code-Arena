"use strict";
/**
 * GPCET Competitive Coding Platform - Server Entry Point
 *
 * Features:
 * - Express REST API with security middleware
 * - WebSocket server for real-time leaderboard
 * - Bull queue for async submission processing
 * - Docker-based multi-language code execution
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = __importDefault(require("http"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const problem_routes_1 = __importDefault(require("./routes/problem.routes"));
const submission_routes_1 = __importDefault(require("./routes/submission.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const log_routes_1 = __importDefault(require("./routes/log.routes"));
const contest_routes_1 = __importDefault(require("./routes/contest.routes"));
const violation_routes_1 = __importDefault(require("./routes/violation.routes"));
const certificate_routes_1 = __importDefault(require("./routes/certificate.routes"));
const websocket_1 = require("./services/websocket");
const execute_1 = require("./dockerRunner/execute");
// Import submission queue to start processing
require("./services/submissionQueue");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// ── Security Middleware ──
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' })); // Increased for SQL schemas
app.use(express_1.default.urlencoded({ extended: true }));
// ── Rate Limiting ──
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', apiLimiter);
// Stricter rate limit for submissions
const submissionLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 submissions per minute
    message: { error: 'Too many submissions. Please wait before submitting again.' },
});
app.use('/api/submissions', submissionLimiter);
// Rate limit for violation logging (allow rapid fire but prevent abuse)
const violationLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 violations per minute max
    message: { error: 'Too many violation reports.' },
});
app.use('/api/violations', violationLimiter);
// ── Routes ──
app.use('/api/auth', auth_routes_1.default);
app.use('/api/problems', problem_routes_1.default);
app.use('/api/submissions', submission_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/logs', log_routes_1.default);
app.use('/api/contests', contest_routes_1.default);
app.use('/api/violations', violation_routes_1.default);
app.use('/api/certificates', certificate_routes_1.default);
// ── Health Check ──
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: '2.0.0',
    });
});
// ── Initialize WebSocket ──
(0, websocket_1.initWebSocket)(server);
// ── Start Server ──
const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
    console.log(`\n🚀 GPCET Coding Platform Backend v2.0.0`);
    console.log(`   Server running on port ${PORT}`);
    console.log(`   WebSocket enabled on /ws`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
    // Pull Docker images in background
    if (process.env.PULL_DOCKER_IMAGES !== 'false') {
        console.log('[Startup] Pulling Docker images in background...');
        (0, execute_1.pullDockerImages)().catch(err => console.error('[Startup] Docker image pull failed:', err));
    }
});
exports.default = server;
