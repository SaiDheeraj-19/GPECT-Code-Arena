/**
 * Violation Controller
 * 
 * Handles anti-cheat violation logging and enforcement.
 * 
 * Flow:
 * 1. Frontend detects violation (paste, tab switch, devtools, etc.)
 * 2. POST /api/violations → logs to DB, increments counter
 * 3. If violation_count >= 3 → flag user, send WebSocket alert to admins
 * 4. If violation_count >= 7 → auto-disqualify (optional)
 * 5. Admin can view all violations in real-time on dashboard
 */

import { Request, Response } from 'express';
import prisma from '../prisma';
import { broadcastViolationAlert } from '../services/websocket';

const FLAG_THRESHOLD = 3;         // Flag user as suspicious at 3 violations
const DISQUALIFY_THRESHOLD = 7;   // Auto-disqualify at 7 violations

/**
 * Log a violation
 * POST /api/violations
 * Body: { contestId, violationType, metadata? }
 */
export const logViolation = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { contestId, violationType, metadata } = req.body;

        if (!contestId || !violationType) {
            return res.status(400).json({ error: 'contestId and violationType are required' });
        }

        // Validate the violation type
        const validTypes = [
            'PASTE_ATTEMPT', 'TAB_SWITCH', 'DEVTOOLS_OPEN', 'FULLSCREEN_EXIT',
            'RIGHT_CLICK', 'DRAG_DROP', 'CLIPBOARD', 'COPY_ATTEMPT',
            'CUT_ATTEMPT', 'PAGE_RELOAD'
        ];

        if (!validTypes.includes(violationType)) {
            return res.status(400).json({ error: 'Invalid violation type' });
        }

        // Check contest exists and is active
        const contest = await prisma.contest.findUnique({ where: { id: contestId } });
        if (!contest) {
            return res.status(404).json({ error: 'Contest not found' });
        }

        const now = new Date();
        if (now < contest.start_time || now > contest.end_time) {
            return res.status(400).json({ error: 'Contest is not currently active' });
        }

        // Check user is participating
        const participation = await prisma.participation.findUnique({
            where: {
                user_id_contest_id: { user_id: userId, contest_id: contestId }
            }
        });

        if (!participation) {
            return res.status(403).json({ error: 'User is not a participant in this contest' });
        }

        // Already disqualified? Still log but don't update further
        if (participation.disqualified) {
            // Still log the violation for record keeping
            await prisma.violation.create({
                data: {
                    user_id: userId,
                    contest_id: contestId,
                    violation_type: violationType,
                    metadata: metadata || null,
                    ip_address: req.ip || req.socket.remoteAddress || null,
                    user_agent: req.headers['user-agent'] || null,
                }
            });
            return res.status(200).json({
                message: 'Violation logged (user already disqualified)',
                violationCount: participation.violation_count,
                isFlagged: true,
                isDisqualified: true,
            });
        }

        // ── 1. Create violation record ──
        const violation = await prisma.violation.create({
            data: {
                user_id: userId,
                contest_id: contestId,
                violation_type: violationType,
                metadata: metadata || null,
                ip_address: req.ip || req.socket.remoteAddress || null,
                user_agent: req.headers['user-agent'] || null,
            }
        });

        // ── 2. Increment violation count ──
        const newCount = participation.violation_count + 1;
        const shouldFlag = newCount >= FLAG_THRESHOLD;
        const shouldDisqualify = newCount >= DISQUALIFY_THRESHOLD;

        await prisma.participation.update({
            where: { id: participation.id },
            data: {
                violation_count: newCount,
                is_flagged: shouldFlag || participation.is_flagged,
                disqualified: shouldDisqualify,
            }
        });

        // ── 3. Also log to SuspiciousLog for legacy ──
        await prisma.suspiciousLog.create({
            data: {
                user_id: userId,
                reason: `[Contest: ${contest.title}] ${violationType}${metadata ? ': ' + metadata : ''} (Violation #${newCount})`,
            }
        });

        // ── 4. Fetch user info for alert ──
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, roll_number: true, email: true }
        });

        // ── 5. Send real-time WebSocket alert to admin ──
        if (shouldFlag || shouldDisqualify) {
            broadcastViolationAlert({
                type: 'violation_alert',
                contestId,
                contestTitle: contest.title,
                userId,
                userName: user?.name || 'Unknown',
                userRollNumber: user?.roll_number || '',
                violationType,
                violationCount: newCount,
                isFlagged: shouldFlag,
                isDisqualified: shouldDisqualify,
                metadata: metadata || null,
                timestamp: new Date().toISOString(),
            });
        }

        // ── 6. Respond ──
        res.status(201).json({
            id: violation.id,
            violationCount: newCount,
            isFlagged: shouldFlag || participation.is_flagged,
            isDisqualified: shouldDisqualify,
            warning: shouldDisqualify
                ? 'You have been disqualified due to excessive violations.'
                : shouldFlag
                    ? `Warning: You have been flagged for suspicious activity (${newCount} violations).`
                    : newCount >= 2
                        ? `Warning: ${newCount} violation(s) recorded. ${FLAG_THRESHOLD - newCount} more will flag your participation.`
                        : 'Violation recorded.',
        });

    } catch (error) {
        console.error('Error logging violation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get violations for a specific contest (admin only)
 * GET /api/violations/contest/:contestId
 */
export const getContestViolations = async (req: Request, res: Response) => {
    try {
        const contestId = req.params.contestId as string;

        const violations = await prisma.violation.findMany({
            where: { contest_id: contestId },
            include: {
                user: {
                    select: { id: true, name: true, roll_number: true, email: true }
                }
            },
            orderBy: { timestamp: 'desc' },
        });

        // Group by user with summary
        const userSummary: Record<string, {
            userId: string;
            userName: string;
            rollNumber: string;
            violationCount: number;
            isFlagged: boolean;
            isDisqualified: boolean;
            violations: typeof violations;
        }> = {};

        for (const v of violations) {
            if (!userSummary[v.user_id]) {
                const participation = await prisma.participation.findUnique({
                    where: {
                        user_id_contest_id: { user_id: v.user_id, contest_id: contestId }
                    }
                });
                userSummary[v.user_id] = {
                    userId: v.user_id,
                    userName: v.user.name,
                    rollNumber: v.user.roll_number || '',
                    violationCount: participation?.violation_count || 0,
                    isFlagged: participation?.is_flagged || false,
                    isDisqualified: participation?.disqualified || false,
                    violations: [],
                };
            }
            userSummary[v.user_id].violations.push(v);
        }

        // Sort by violation count descending
        const sorted = Object.values(userSummary).sort((a, b) => b.violationCount - a.violationCount);

        res.json({
            contestId,
            totalViolations: violations.length,
            flaggedUsers: sorted.filter(u => u.isFlagged).length,
            disqualifiedUsers: sorted.filter(u => u.isDisqualified).length,
            users: sorted,
        });

    } catch (error) {
        console.error('Error fetching contest violations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get flagged participants across all active contests (admin)
 * GET /api/violations/flagged
 */
export const getFlaggedParticipants = async (req: Request, res: Response) => {
    try {
        const flagged = await prisma.participation.findMany({
            where: {
                is_flagged: true,
            },
            include: {
                user: {
                    select: { id: true, name: true, roll_number: true, email: true }
                },
                contest: {
                    select: { id: true, title: true, start_time: true, end_time: true }
                }
            },
            orderBy: { violation_count: 'desc' },
        });

        res.json(flagged);
    } catch (error) {
        console.error('Error fetching flagged participants:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get violations for a specific user in a specific contest (admin)
 * GET /api/violations/user/:userId/contest/:contestId
 */
export const getUserContestViolations = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId as string;
        const contestId = req.params.contestId as string;

        const violations = await prisma.violation.findMany({
            where: {
                user_id: userId,
                contest_id: contestId,
            },
            orderBy: { timestamp: 'asc' },
        });

        const participation = await prisma.participation.findUnique({
            where: {
                user_id_contest_id: { user_id: userId, contest_id: contestId }
            }
        });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, roll_number: true, email: true }
        });

        res.json({
            user,
            violationCount: participation?.violation_count || 0,
            isFlagged: participation?.is_flagged || false,
            isDisqualified: participation?.disqualified || false,
            violations,
        });

    } catch (error) {
        console.error('Error fetching user violations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Admin: manually disqualify a user from a contest
 * POST /api/violations/disqualify
 */
export const disqualifyUser = async (req: Request, res: Response) => {
    try {
        const { userId, contestId, reason } = req.body;

        if (!userId || !contestId) {
            return res.status(400).json({ error: 'userId and contestId are required' });
        }

        await prisma.participation.update({
            where: {
                user_id_contest_id: { user_id: userId, contest_id: contestId }
            },
            data: {
                disqualified: true,
                is_flagged: true,
            }
        });

        // Log the admin action
        await prisma.suspiciousLog.create({
            data: {
                user_id: userId,
                reason: `[ADMIN ACTION] Manually disqualified from contest. Reason: ${reason || 'No reason provided'}`,
            }
        });

        res.json({ message: 'User disqualified successfully' });

    } catch (error) {
        console.error('Error disqualifying user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Admin: unflag a user (clear flag, keep records)
 * POST /api/violations/unflag
 */
export const unflagUser = async (req: Request, res: Response) => {
    try {
        const { userId, contestId } = req.body;

        await prisma.participation.update({
            where: {
                user_id_contest_id: { user_id: userId, contest_id: contestId }
            },
            data: {
                is_flagged: false,
                disqualified: false,
            }
        });

        res.json({ message: 'User unflagged successfully' });

    } catch (error) {
        console.error('Error unflagging user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
