/**
 * Contest Controller
 * 
 * Full contest management with ICPC-style ranking.
 * Supports real-time leaderboard via WebSocket.
 */

import { Request, Response } from 'express';
import prisma from '../prisma';
import { SubmissionStatus } from '@prisma/client';

/**
 * Create a new contest
 * POST /api/contests
 */
export const createContest = async (req: Request, res: Response) => {
    try {
        const { title, description, start_time, end_time, problemIds } = req.body;
        const userId = (req as any).user.id;

        if (!title || !start_time || !end_time) {
            return res.status(400).json({ error: 'Title, start_time, and end_time are required' });
        }

        const start = new Date(start_time);
        const end = new Date(end_time);

        if (end <= start) {
            return res.status(400).json({ error: 'End time must be after start time' });
        }

        const contest = await prisma.contest.create({
            data: {
                title,
                description,
                start_time: start,
                end_time: end,
                created_by: userId,
                problems: {
                    connect: problemIds?.map((id: string) => ({ id })) || []
                }
            },
            include: {
                problems: {
                    select: {
                        id: true,
                        title: true,
                        difficulty: true,
                    }
                }
            }
        });

        res.status(201).json(contest);
    } catch (error) {
        console.error('Error creating contest:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get all contests
 * GET /api/contests
 */
export const getContests = async (req: Request, res: Response) => {
    try {
        const { status } = req.query;
        const now = new Date();

        let whereClause: any = {};

        if (status === 'active') {
            whereClause = { start_time: { lte: now }, end_time: { gte: now } };
        } else if (status === 'upcoming') {
            whereClause = { start_time: { gt: now } };
        } else if (status === 'past') {
            whereClause = { end_time: { lt: now } };
        }

        const contests = await prisma.contest.findMany({
            where: whereClause,
            include: {
                problems: {
                    select: {
                        id: true,
                        title: true,
                        difficulty: true,
                    }
                },
                admin: {
                    select: {
                        name: true
                    }
                },
                _count: {
                    select: { participations: true, submissions: true }
                }
            },
            orderBy: { start_time: 'desc' }
        });

        // Annotate with status
        const result = contests.map(c => {
            let contestStatus = 'upcoming';
            if (now >= c.start_time && now <= c.end_time) contestStatus = 'active';
            else if (now > c.end_time) contestStatus = 'ended';

            return {
                ...c,
                status: contestStatus,
            };
        });

        res.json(result);
    } catch (error) {
        console.error('Error fetching contests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get single contest details
 * GET /api/contests/:id
 */
export const getContestById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const userId = (req as any).user.id;

        const contest = await prisma.contest.findUnique({
            where: { id },
            include: {
                problems: {
                    select: {
                        id: true,
                        title: true,
                        difficulty: true,
                        tags: true,
                        problem_type: true,
                        allowed_languages: true,
                        time_limit: true,
                        memory_limit: true,
                    }
                },
                admin: {
                    select: { name: true }
                },
                _count: {
                    select: { participations: true }
                }
            }
        });

        if (!contest) {
            return res.status(404).json({ error: 'Contest not found' });
        }

        // Check if user is registered
        const participation = await prisma.participation.findUnique({
            where: {
                user_id_contest_id: {
                    user_id: userId,
                    contest_id: id,
                }
            }
        });

        const now = new Date();
        let contestStatus = 'upcoming';
        if (now >= contest.start_time && now <= contest.end_time) contestStatus = 'active';
        else if (now > contest.end_time) contestStatus = 'ended';

        res.json({
            ...contest,
            status: contestStatus,
            isRegistered: !!participation,
            myScore: participation?.score || 0,
            mySolvedCount: participation?.solved_count || 0,
        });
    } catch (error) {
        console.error('Error fetching contest:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Register for a contest
 * POST /api/contests/:id/register
 */
export const registerForContest = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const userId = (req as any).user.id;

        const contest = await prisma.contest.findUnique({ where: { id } });
        if (!contest) {
            return res.status(404).json({ error: 'Contest not found' });
        }

        const existing = await prisma.participation.findUnique({
            where: {
                user_id_contest_id: { user_id: userId, contest_id: id }
            }
        });

        if (existing) {
            return res.status(400).json({ error: 'Already registered for this contest' });
        }

        const participation = await prisma.participation.create({
            data: {
                user_id: userId,
                contest_id: id,
            }
        });

        res.status(201).json({
            message: 'Successfully registered for contest',
            participation
        });
    } catch (error) {
        console.error('Error registering for contest:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get contest leaderboard
 * GET /api/contests/:id/leaderboard
 */
export const getContestLeaderboard = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        const participations = await prisma.participation.findMany({
            where: { contest_id: id },
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

        // Get per-problem solve status for each participant
        const contest = await prisma.contest.findUnique({
            where: { id },
            include: {
                problems: {
                    select: { id: true, title: true }
                }
            }
        });

        if (!contest) {
            return res.status(404).json({ error: 'Contest not found' });
        }

        const leaderboard = await Promise.all(participations.map(async (p, index) => {
            // Get per-problem status for this participant
            const problemStatuses = await Promise.all(contest.problems.map(async (problem) => {
                const accepted = await prisma.submission.findFirst({
                    where: {
                        user_id: p.user_id,
                        problem_id: problem.id,
                        contest_id: id,
                        status: SubmissionStatus.PASS,
                    },
                    orderBy: { created_at: 'asc' },
                    select: { created_at: true }
                });

                const wrongAttempts = await prisma.submission.count({
                    where: {
                        user_id: p.user_id,
                        problem_id: problem.id,
                        contest_id: id,
                        status: { not: SubmissionStatus.PASS },
                        ...(accepted ? { created_at: { lt: accepted.created_at } } : {}),
                    }
                });

                let solveTime: number | null = null;
                if (accepted) {
                    solveTime = Math.floor(
                        (accepted.created_at.getTime() - contest.start_time.getTime()) / 60000
                    );
                }

                return {
                    problemId: problem.id,
                    problemTitle: problem.title,
                    solved: !!accepted,
                    wrongAttempts,
                    solveTime,
                };
            }));

            return {
                rank: index + 1,
                userId: p.user_id,
                name: p.user.name,
                username: p.user.username,
                rollNumber: p.user.roll_number,
                avatarUrl: p.user.avatar_url,
                solvedCount: p.solved_count,
                penaltyTime: p.penalty_time,
                score: p.score,
                problems: problemStatuses,
            };
        }));

        res.json({
            contestId: id,
            contestTitle: contest.title,
            leaderboard,
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Delete a contest (admin only)
 * DELETE /api/contests/:id
 */
export const deleteContest = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        // Delete participations first
        await prisma.participation.deleteMany({ where: { contest_id: id } });

        await prisma.contest.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting contest:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
