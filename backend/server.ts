/**
 * GPCET Competitive Coding Platform - Server Entry Point
 * 
 * Features:
 * - Express REST API with security middleware
 * - WebSocket server for real-time leaderboard
 * - Bull queue for async submission processing
 * - Docker-based multi-language code execution
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import http from 'http';

import authRoutes from './routes/auth.routes';
import problemRoutes from './routes/problem.routes';
import submissionRoutes from './routes/submission.routes';
import adminRoutes from './routes/admin.routes';
import logRoutes from './routes/log.routes';
import contestRoutes from './routes/contest.routes';
import violationRoutes from './routes/violation.routes';
import certificateRoutes from './routes/certificate.routes';

import { initWebSocket } from './services/websocket';
import { pullDockerImages } from './dockerRunner/execute';

// Import submission queue to start processing
import './services/submissionQueue';

console.log('[Startup] Loading environment variables...');
dotenv.config();
console.log('[Startup] Environment loaded.');

const app = express();
const server = http.createServer(app);

// ── Security Middleware ──
app.use(helmet());
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (
            origin.includes('vercel.app') ||
            origin.includes('localhost') ||
            origin.includes('127.0.0.1') ||
            origin === process.env.FRONTEND_URL ||
            origin === process.env.FRONTEND_URL?.replace(/\/$/, '')
        ) {
            callback(null, true);
        } else {
            console.warn('[CORS] Blocked origin:', origin);
            callback(null, false);
        }
    },
    credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // Increased for SQL schemas
app.use(express.urlencoded({ extended: true }));

// ── Rate Limiting ──
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// Stricter rate limit for submissions
const submissionLimiter = rateLimit({
    windowMs: 60 * 1000,    // 1 minute
    max: 10,                 // 10 submissions per minute
    message: { error: 'Too many submissions. Please wait before submitting again.' },
});
app.use('/api/submissions', submissionLimiter);

// Rate limit for violation logging (allow rapid fire but prevent abuse)
const violationLimiter = rateLimit({
    windowMs: 60 * 1000,    // 1 minute
    max: 30,                 // 30 violations per minute max
    message: { error: 'Too many violation reports.' },
});
app.use('/api/violations', violationLimiter);

// ── Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/violations', violationRoutes);
app.use('/api/certificates', certificateRoutes);

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
initWebSocket(server);

// ── Start Server ──
const PORT = process.env.PORT || 5000;

console.log(`[Startup] Attempting to listen on port ${PORT}...`);
server.listen(Number(PORT), '0.0.0.0', async () => {
    console.log(`\n🚀 GPCET Coding Platform Backend v2.0.0`);
    console.log(`   Server running on 0.0.0.0:${PORT}`);
    console.log(`   WebSocket enabled on /ws`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);

    // Pull Docker images in background
    if (process.env.PULL_DOCKER_IMAGES !== 'false') {
        console.log('[Startup] Pulling Docker images in background...');
        pullDockerImages().catch(err =>
            console.error('[Startup] Docker image pull failed:', err)
        );
    }
});

export default server;
