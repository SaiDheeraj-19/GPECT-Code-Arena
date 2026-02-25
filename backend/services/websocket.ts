/**
 * WebSocket Service for Real-Time Leaderboard & Anti-Cheat Alerts
 * 
 * Provides real-time updates during contests via WebSocket connections.
 * Clients connect to ws://server:PORT/ws and subscribe to:
 *   1. Contest leaderboards (students & admins)
 *   2. Submission status updates (students)
 *   3. Violation alerts (admins only)
 * 
 * Protocol:
 * - Client sends: { type: 'subscribe', contestId: '...' }
 * - Client sends: { type: 'subscribe_admin', contestId: '...' }
 * - Server sends: { type: 'leaderboard', contestId: '...', data: [...] }
 * - Server sends: { type: 'submission_update', submissionId: '...', status: '...' }
 * - Server sends: { type: 'violation_alert', ... }     (to admin subscribers only)
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'http';
import prisma from '../prisma';

let wss: WebSocketServer | null = null;

// Track subscriptions: contestId -> Set of WebSocket clients
const contestSubscriptions = new Map<string, Set<WebSocket>>();

// Track per-user submission subscriptions: submissionId -> WebSocket
const submissionSubscriptions = new Map<string, Set<WebSocket>>();

// Track admin subscriptions for violation alerts: contestId -> Set of admin WebSocket clients
const adminAlertSubscriptions = new Map<string, Set<WebSocket>>();

// Global admin alert subscribers (receive alerts for ALL contests)
const globalAdminSubscribers = new Set<WebSocket>();

/**
 * Initialize WebSocket server
 */
export const initWebSocket = (server: HttpServer): void => {
    wss = new WebSocketServer({ server, path: '/ws' });

    console.log('[WebSocket] Server initialized on /ws');

    wss.on('connection', (ws: WebSocket) => {
        console.log('[WebSocket] Client connected');

        ws.on('message', async (message: string) => {
            try {
                const data = JSON.parse(message.toString());

                switch (data.type) {
                    case 'subscribe': {
                        const { contestId } = data;
                        if (!contestId) break;

                        if (!contestSubscriptions.has(contestId)) {
                            contestSubscriptions.set(contestId, new Set());
                        }
                        contestSubscriptions.get(contestId)!.add(ws);

                        // Send initial leaderboard
                        const leaderboard = await getContestLeaderboard(contestId);
                        ws.send(JSON.stringify({
                            type: 'leaderboard',
                            contestId,
                            data: leaderboard
                        }));
                        break;
                    }

                    case 'unsubscribe': {
                        const { contestId } = data;
                        if (contestId && contestSubscriptions.has(contestId)) {
                            contestSubscriptions.get(contestId)!.delete(ws);
                        }
                        break;
                    }

                    case 'watch_submission': {
                        const { submissionId } = data;
                        if (!submissionId) break;

                        if (!submissionSubscriptions.has(submissionId)) {
                            submissionSubscriptions.set(submissionId, new Set());
                        }
                        submissionSubscriptions.get(submissionId)!.add(ws);
                        break;
                    }

                    /**
                     * Admin subscribes to violation alerts for a specific contest
                     * { type: 'subscribe_admin', contestId: '...' }
                     */
                    case 'subscribe_admin': {
                        const { contestId } = data;
                        if (!contestId) break;

                        if (!adminAlertSubscriptions.has(contestId)) {
                            adminAlertSubscriptions.set(contestId, new Set());
                        }
                        adminAlertSubscriptions.get(contestId)!.add(ws);

                        // Also subscribe to leaderboard
                        if (!contestSubscriptions.has(contestId)) {
                            contestSubscriptions.set(contestId, new Set());
                        }
                        contestSubscriptions.get(contestId)!.add(ws);

                        // Send initial violation summary
                        const summary = await getViolationSummary(contestId);
                        ws.send(JSON.stringify({
                            type: 'violation_summary',
                            contestId,
                            data: summary
                        }));

                        console.log(`[WebSocket] Admin subscribed to violations for contest ${contestId}`);
                        break;
                    }

                    /**
                     * Admin subscribes to ALL contest violation alerts globally
                     * { type: 'subscribe_admin_global' }
                     */
                    case 'subscribe_admin_global': {
                        globalAdminSubscribers.add(ws);
                        console.log('[WebSocket] Admin subscribed to global violation alerts');
                        break;
                    }

                    default:
                        break;
                }
            } catch (error) {
                console.error('[WebSocket] Error processing message:', error);
            }
        });

        ws.on('close', () => {
            // Remove from all subscriptions
            for (const [, clients] of contestSubscriptions) {
                clients.delete(ws);
            }
            for (const [, clients] of submissionSubscriptions) {
                clients.delete(ws);
            }
            for (const [, clients] of adminAlertSubscriptions) {
                clients.delete(ws);
            }
            globalAdminSubscribers.delete(ws);
        });

        ws.on('error', (error) => {
            console.error('[WebSocket] Client error:', error);
        });

        // Send heartbeat every 30s
        const heartbeat = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'ping' }));
            } else {
                clearInterval(heartbeat);
            }
        }, 30000);
    });
};

/**
 * Broadcast leaderboard update to all subscribers of a contest
 */
export const broadcastLeaderboardUpdate = async (contestId: string): Promise<void> => {
    const subscribers = contestSubscriptions.get(contestId);
    if (!subscribers || subscribers.size === 0) return;

    try {
        const leaderboard = await getContestLeaderboard(contestId);
        const message = JSON.stringify({
            type: 'leaderboard',
            contestId,
            data: leaderboard,
            timestamp: new Date().toISOString()
        });

        for (const ws of subscribers) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            } else {
                subscribers.delete(ws);
            }
        }
    } catch (error) {
        console.error('[WebSocket] Error broadcasting leaderboard:', error);
    }
};

/**
 * Broadcast submission status update
 */
export const broadcastSubmissionUpdate = (submissionId: string, status: string, verdict?: string): void => {
    const subscribers = submissionSubscriptions.get(submissionId);
    if (!subscribers || subscribers.size === 0) return;

    const message = JSON.stringify({
        type: 'submission_update',
        submissionId,
        status,
        verdict,
        timestamp: new Date().toISOString()
    });

    for (const ws of subscribers) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(message);
        } else {
            subscribers.delete(ws);
        }
    }

    // Cleanup after final status
    if (status !== 'PENDING') {
        submissionSubscriptions.delete(submissionId);
    }
};

/**
 * ═══════════════════════════════════════════════════════════════
 * ANTI-CHEAT: Broadcast violation alert to admin subscribers
 * ═══════════════════════════════════════════════════════════════
 * 
 * Called by violation.controller.ts when a student triggers ≥3 violations.
 * Sends real-time alert to:
 *   1. Admins monitoring the specific contest
 *   2. Global admin subscribers (admin dashboard)
 */
export const broadcastViolationAlert = (alertData: ViolationAlertPayload): void => {
    const message = JSON.stringify(alertData);

    // ── Send to contest-specific admin subscribers ──
    const contestAdmins = adminAlertSubscriptions.get(alertData.contestId);
    if (contestAdmins) {
        for (const ws of contestAdmins) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            } else {
                contestAdmins.delete(ws);
            }
        }
    }

    // ── Send to global admin subscribers ──
    for (const ws of globalAdminSubscribers) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(message);
        } else {
            globalAdminSubscribers.delete(ws);
        }
    }

    console.log(`[WebSocket] Violation alert broadcast for user ${alertData.userName} (${alertData.violationType}) - ${alertData.violationCount} total`);
};

/**
 * Get contest leaderboard data
 * Sorted by: solved_count DESC, penalty_time ASC
 * Includes violation info for admin views
 */
async function getContestLeaderboard(contestId: string): Promise<any[]> {
    const participations = await prisma.participation.findMany({
        where: { contest_id: contestId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                    roll_number: true,
                    avatar_url: true,
                }
            }
        },
        orderBy: [
            { solved_count: 'desc' },
            { penalty_time: 'asc' },
        ]
    });

    return participations.map((p, index) => ({
        rank: index + 1,
        userId: p.user_id,
        name: p.user.name,
        username: p.user.username,
        rollNumber: p.user.roll_number,
        avatarUrl: p.user.avatar_url,
        solvedCount: p.solved_count,
        penaltyTime: p.penalty_time,
        score: p.score,
        // Anti-cheat metadata
        violationCount: p.violation_count,
        isFlagged: p.is_flagged,
        isDisqualified: p.disqualified,
    }));
}

/**
 * Get violation summary for a contest (sent when admin first subscribes)
 */
async function getViolationSummary(contestId: string): Promise<any> {
    const flaggedParticipants = await prisma.participation.findMany({
        where: {
            contest_id: contestId,
            is_flagged: true,
        },
        include: {
            user: {
                select: { id: true, name: true, roll_number: true }
            }
        },
        orderBy: { violation_count: 'desc' }
    });

    const recentViolations = await prisma.violation.findMany({
        where: { contest_id: contestId },
        include: {
            user: {
                select: { name: true, roll_number: true }
            }
        },
        orderBy: { timestamp: 'desc' },
        take: 20,
    });

    return {
        flaggedCount: flaggedParticipants.length,
        disqualifiedCount: flaggedParticipants.filter(p => p.disqualified).length,
        flaggedParticipants: flaggedParticipants.map(p => ({
            userId: p.user_id,
            name: p.user.name,
            rollNumber: p.user.roll_number,
            violationCount: p.violation_count,
            isFlagged: p.is_flagged,
            isDisqualified: p.disqualified,
        })),
        recentViolations: recentViolations.map(v => ({
            userId: v.user_id,
            userName: v.user.name,
            rollNumber: v.user.roll_number,
            violationType: v.violation_type,
            metadata: v.metadata,
            timestamp: v.timestamp,
        })),
    };
}

// ── Type for violation alert payload ──
interface ViolationAlertPayload {
    type: 'violation_alert';
    contestId: string;
    contestTitle: string;
    userId: string;
    userName: string;
    userRollNumber: string;
    violationType: string;
    violationCount: number;
    isFlagged: boolean;
    isDisqualified: boolean;
    metadata: string | null;
    timestamp: string;
}
