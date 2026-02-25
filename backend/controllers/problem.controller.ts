/**
 * Problem Controller
 * 
 * Enhanced problem listing with filters for difficulty, tags, and problem type.
 */

import { Request, Response } from 'express';
import prisma from '../prisma';

/**
 * Get all problems with filters
 * GET /api/problems
 */
export const getProblems = async (req: Request, res: Response) => {
    try {
        const { difficulty, tags, problem_type, search } = req.query;
        const userId = (req as any).user?.id;

        let whereClause: any = {};

        if (difficulty) {
            whereClause.difficulty = difficulty;
        }

        if (tags) {
            const tagsArray = (tags as string).split(',');
            whereClause.tags = { hasSome: tagsArray };
        }

        if (problem_type) {
            whereClause.problem_type = problem_type;
        }

        if (search) {
            whereClause.title = { contains: search as string, mode: 'insensitive' };
        }

        const problems = await prisma.problem.findMany({
            where: whereClause,
            select: {
                id: true,
                title: true,
                difficulty: true,
                tags: true,
                problem_type: true,
                allowed_languages: true,
                time_limit: true,
                memory_limit: true,
                // @ts-ignore
                likes_count: true,
                // @ts-ignore
                dislikes_count: true,
                // @ts-ignore
                shares_count: true,
                created_at: true,
                _count: {
                    select: { submissions: true }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        // Get user points if logged in
        let userPoints = 0;
        if (userId) {
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { points: true } });
            userPoints = (user as any)?.points || 0;
        }

        // Get acceptance rate and user status for each problem
        const result = await Promise.all(problems.map(async (p) => {
            const totalSubs = (p as any)._count?.submissions || 0;
            const passedSubs = await prisma.submission.count({
                where: { problem_id: p.id, status: 'PASS' }
            });

            let status = null;
            if (userId) {
                const solved = await prisma.submission.findFirst({
                    where: { problem_id: p.id, user_id: userId, status: 'PASS' }
                });
                status = solved ? 'SOLVED' : null;
                if (!status) {
                    const attempted = await prisma.submission.findFirst({
                        where: { problem_id: p.id, user_id: userId }
                    });
                    if (attempted) status = 'ATTEMPTED';
                }
            }

            // Lock logic for interview problems
            // @ts-ignore
            const isLocked = p.problem_type === 'INTERVIEW' && userPoints < 10000;

            return {
                ...p,
                totalSubmissions: totalSubs,
                acceptanceRate: totalSubs > 0 ? Math.round((passedSubs / totalSubs) * 100) : 0,
                status,
                isLocked
            };
        }));

        res.json(result);
    } catch (error) {
        console.error('Error fetching problems:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get single problem details
 * GET /api/problems/:id
 */
export const getProblem = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const userId = (req as any).user?.id;

        const isAdmin = (req as any).user?.role === 'ADMIN';

        const problem = await prisma.problem.findUnique({
            where: { id },
            include: {
                testCases: {
                    where: isAdmin ? {} : { is_hidden: false },
                    select: {
                        id: true,
                        input: true,
                        expected_output: true,
                        is_hidden: true,
                    }
                }
            }
        });

        if (!problem) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        // Get user's submission status for this problem
        let userStatus = null;
        if (userId) {
            const userSubmission = await prisma.submission.findFirst({
                where: {
                    user_id: userId,
                    problem_id: id,
                    status: 'PASS'
                }
            });
            userStatus = userSubmission ? 'SOLVED' : null;

            if (!userStatus) {
                const anySubmission = await prisma.submission.findFirst({
                    where: {
                        user_id: userId,
                        problem_id: id,
                    }
                });
                if (anySubmission) userStatus = 'ATTEMPTED';
            }
        }

        // Get problem stats
        const totalSubs = await prisma.submission.count({ where: { problem_id: id } });
        const passedSubs = await prisma.submission.count({ where: { problem_id: id, status: 'PASS' } });

        // Get user points
        let userPoints = 0;
        if (userId) {
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { points: true } });
            userPoints = (user as any)?.points || 0;
        }

        if (problem.problem_type === 'INTERVIEW' && userPoints < 10000 && !isAdmin) {
            return res.status(403).json({ error: 'This problem is locked. You need 10,000 points to access Interview Questions.' });
        }

        res.json({
            ...problem,
            userStatus,
            stats: {
                totalSubmissions: totalSubs,
                acceptedSubmissions: passedSubs,
                acceptanceRate: totalSubs > 0 ? Math.round((passedSubs / totalSubs) * 100) : 0,
            }
        });
    } catch (error) {
        console.error('Error fetching problem:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Add a new solution to a problem
 */
export const addSolution = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const userId = (req as any).user?.id;
        const { title, explanation, code, language } = req.body;

        // @ts-ignore
        const solution = await prisma.solution.create({
            data: {
                problem_id: id,
                user_id: userId,
                title,
                explanation,
                code,
                language
            }
        });

        res.status(201).json(solution);
    } catch (error) {
        console.error('Error adding solution:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get all solutions for a problem
 */
export const getSolutions = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        // @ts-ignore
        const solutions = await prisma.solution.findMany({
            where: { problem_id: id },
            include: {
                user: { select: { name: true, avatar_url: true } }
            },
            orderBy: { upvotes: 'desc' }
        });
        res.json(solutions);
    } catch (error) {
        console.error('Error fetching solutions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Toggle like for a problem
 */
export const toggleLike = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        // @ts-ignore
        await prisma.problem.update({
            where: { id },
            data: { likes_count: { increment: 1 } }
        });
        res.json({ message: 'Liked' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Toggle dislike for a problem
 */
export const toggleDislike = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        // @ts-ignore
        await prisma.problem.update({
            where: { id },
            data: { dislikes_count: { increment: 1 } }
        });
        res.json({ message: 'Disliked' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getPointActivities = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        // @ts-ignore
        const activities = await prisma.pointActivity.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
            take: 50
        });
        res.json(activities);
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
