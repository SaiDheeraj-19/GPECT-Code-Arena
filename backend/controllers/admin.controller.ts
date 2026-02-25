/**
 * Admin Controller
 * 
 * Enhanced admin panel with:
 * - Multi-language problem configuration
 * - SQL schema upload for SQL problems
 * - Hidden test case management
 * - Language-specific time limits
 * - Comprehensive dashboard stats
 */

import { Request, Response } from 'express';
import prisma from '../prisma';
import { getSupportedLanguages } from '../dockerRunner/languageConfig';

/**
 * Create a problem with multi-language and SQL support
 * POST /api/admin/problems
 */
export const createProblem = async (req: Request, res: Response) => {
    try {
        const {
            title,
            description,
            difficulty,
            tags,
            testCases,
            problem_type,
            time_limit,
            memory_limit,
            allowed_languages,
            sql_schema,
            sql_seed_data,
            default_solution,
            official_solutions,
            is_interview,
        } = req.body;

        const userId = (req as any).user.id;

        if (!title || !description || !difficulty) {
            return res.status(400).json({ error: 'Title, description, and difficulty are required' });
        }

        // Validate allowed languages
        const validLanguages = getSupportedLanguages();
        if (allowed_languages && allowed_languages.length > 0) {
            for (const lang of allowed_languages) {
                if (!validLanguages.includes(lang)) {
                    return res.status(400).json({ error: `Invalid language: ${lang}`, validLanguages });
                }
            }
        }

        // SQL problems need schema
        if (problem_type === 'SQL' && !sql_schema) {
            return res.status(400).json({ error: 'SQL problems require a schema definition' });
        }

        const problem = await prisma.problem.create({
            data: {
                title,
                description,
                difficulty,
                tags: tags || [],
                problem_type: problem_type || 'CODING',
                time_limit: time_limit || 2000,
                memory_limit: memory_limit || 256,
                allowed_languages: problem_type === 'SQL' ? ['sql'] : (allowed_languages || validLanguages),
                sql_schema: sql_schema || null,
                sql_seed_data: sql_seed_data || null,
                // @ts-ignore
                default_solution: default_solution || null,
                official_solutions: official_solutions || null,
                is_interview: is_interview || false,
                created_by: userId,
                testCases: {
                    create: testCases?.map((tc: any) => ({
                        input: tc.input,
                        expected_output: tc.expected_output || '',
                        expected_result_json: tc.expected_result_json || null,
                        is_hidden: tc.is_hidden || false,
                    })) || []
                }
            },
            include: {
                testCases: true
            }
        });

        res.status(201).json(problem);
    } catch (error) {
        console.error('Error creating problem:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Edit a problem
 * PUT /api/admin/problems/:id
 */
export const editProblem = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const {
            title,
            description,
            difficulty,
            tags,
            problem_type,
            testCases, // Added this
            time_limit,
            memory_limit,
            allowed_languages,
            sql_schema,
            sql_seed_data,
            default_solution,
            official_solutions,
            is_interview,
        } = req.body;

        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (difficulty !== undefined) updateData.difficulty = difficulty;
        if (tags !== undefined) updateData.tags = tags;
        if (problem_type !== undefined) updateData.problem_type = problem_type;
        if (time_limit !== undefined) updateData.time_limit = time_limit;
        if (memory_limit !== undefined) updateData.memory_limit = memory_limit;
        if (allowed_languages !== undefined) updateData.allowed_languages = allowed_languages;
        if (sql_schema !== undefined) updateData.sql_schema = sql_schema;
        if (sql_seed_data !== undefined) updateData.sql_seed_data = sql_seed_data;
        // @ts-ignore
        if (default_solution !== undefined) updateData.default_solution = default_solution;
        if (official_solutions !== undefined) updateData.official_solutions = official_solutions;
        if (is_interview !== undefined) updateData.is_interview = is_interview;

        // Use a transaction to update problem and recreate test cases if provided
        const problem = await prisma.$transaction(async (tx) => {
            if (testCases) {
                // Delete existing test cases
                await tx.testCase.deleteMany({
                    where: { problem_id: id }
                });

                // Add new test cases
                updateData.testCases = {
                    create: testCases.map((tc: any) => ({
                        input: tc.input,
                        expected_output: tc.expected_output,
                        is_hidden: tc.is_hidden || false,
                    }))
                };
            }

            return await tx.problem.update({
                where: { id },
                data: updateData,
                include: { testCases: true }
            });
        });

        res.json(problem);
    } catch (error) {
        console.error('Error editing problem:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Delete a problem
 * DELETE /api/admin/problems/:id
 */
export const deleteProblem = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await prisma.problem.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting problem:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Add test case to a problem
 * POST /api/admin/problems/:problemId/testcases
 */
export const addTestCase = async (req: Request, res: Response) => {
    try {
        const problemId = req.params.problemId as string;
        const { input, expected_output, expected_result_json, is_hidden } = req.body;

        const testCase = await prisma.testCase.create({
            data: {
                problem_id: problemId,
                input,
                expected_output: expected_output || '',
                expected_result_json: expected_result_json || null,
                is_hidden: is_hidden || false,
            }
        });

        res.status(201).json(testCase);
    } catch (error) {
        console.error('Error adding testcase:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Update a test case
 * PUT /api/admin/testcases/:id
 */
export const updateTestCase = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { input, expected_output, expected_result_json, is_hidden } = req.body;

        const updated = await prisma.testCase.update({
            where: { id },
            data: {
                ...(input !== undefined && { input }),
                ...(expected_output !== undefined && { expected_output }),
                ...(expected_result_json !== undefined && { expected_result_json }),
                ...(is_hidden !== undefined && { is_hidden }),
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error updating testcase:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Delete a test case
 * DELETE /api/admin/testcases/:id
 */
export const deleteTestCase = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await prisma.testCase.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting testcase:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get all submissions (admin view)
 * GET /api/admin/submissions
 */
export const getAllSubmissions = async (req: Request, res: Response) => {
    try {
        const { userId, problemId, language, status, limit = 100 } = req.query;

        let whereClause: any = {};
        if (userId) whereClause.user_id = userId;
        if (problemId) whereClause.problem_id = problemId;
        if (language) whereClause.language = language;
        if (status) whereClause.status = status;

        const submissions = await prisma.submission.findMany({
            where: whereClause,
            include: {
                user: { select: { name: true, email: true, roll_number: true } },
                problem: { select: { title: true, difficulty: true } }
            },
            orderBy: { created_at: 'desc' },
            take: Math.min(Number(limit), 500),
        });
        res.json(submissions);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get suspicious activity logs
 * GET /api/admin/logs
 */
export const getLogs = async (req: Request, res: Response) => {
    try {
        const logs = await prisma.suspiciousLog.findMany({
            include: {
                user: { select: { name: true, email: true, roll_number: true } }
            },
            orderBy: { timestamp: 'desc' }
        });
        res.json(logs);
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get comprehensive dashboard statistics
 * GET /api/admin/stats
 */
export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
        const totalProblems = await prisma.problem.count();
        const totalSubmissions = await prisma.submission.count();
        const problemsSolved = await prisma.submission.count({ where: { status: 'PASS' } });
        const suspiciousEvents = await prisma.suspiciousLog.count();
        const activeContests = await prisma.contest.count({
            where: {
                start_time: { lte: new Date() },
                end_time: { gte: new Date() },
            }
        });

        // Language distribution
        const languageDistribution = await prisma.submission.groupBy({
            by: ['language'],
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } }
        });

        // Difficulty distribution of problems
        const difficultyDistribution = await prisma.problem.groupBy({
            by: ['difficulty'],
            _count: { id: true },
        });

        // Problem type distribution
        const typeDistribution = await prisma.problem.groupBy({
            by: ['problem_type'],
            _count: { id: true },
        });

        // Submissions per day (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentSubmissions = await prisma.submission.findMany({
            where: { created_at: { gte: thirtyDaysAgo } },
            select: { created_at: true, status: true },
        });

        const submissionsByDay: Record<string, { total: number; passed: number }> = {};
        for (const sub of recentSubmissions) {
            const date = sub.created_at.toISOString().split('T')[0];
            if (!submissionsByDay[date]) submissionsByDay[date] = { total: 0, passed: 0 };
            submissionsByDay[date].total++;
            if (sub.status === 'PASS') submissionsByDay[date].passed++;
        }

        const recentLogs = await prisma.suspiciousLog.findMany({
            include: { user: { select: { name: true, roll_number: true } } },
            orderBy: { timestamp: 'desc' },
            take: 10
        });

        // Top performers
        const topPerformers = await prisma.submission.groupBy({
            by: ['user_id'],
            where: { status: 'PASS' },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 10,
        });

        const topPerformerDetails = await Promise.all(
            topPerformers.map(async (tp) => {
                const user = await prisma.user.findUnique({
                    where: { id: tp.user_id },
                    select: { name: true, roll_number: true, username: true, avatar_url: true }
                });
                const uniqueSolved = await prisma.submission.findMany({
                    where: { user_id: tp.user_id, status: 'PASS' },
                    distinct: ['problem_id'],
                    select: { problem_id: true },
                });
                return {
                    userId: tp.user_id,
                    name: user?.name,
                    rollNumber: user?.roll_number,
                    username: user?.username,
                    avatarUrl: user?.avatar_url,
                    totalAccepted: tp._count.id,
                    uniqueSolved: uniqueSolved.length,
                };
            })
        );

        res.json({
            totalStudents,
            totalProblems,
            totalSubmissions,
            problemsSolved,
            suspiciousEvents,
            activeContests,
            languageDistribution: languageDistribution.map(ld => ({
                language: ld.language,
                count: ld._count.id,
            })),
            difficultyDistribution: difficultyDistribution.map(dd => ({
                difficulty: dd.difficulty,
                count: dd._count.id,
            })),
            typeDistribution: typeDistribution.map(td => ({
                type: td.problem_type,
                count: td._count.id,
            })),
            submissionsByDay,
            recentLogs,
            topPerformers: topPerformerDetails,
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get student analytics (admin view)
 * GET /api/admin/students/:userId/analytics
 */
export const getStudentAnalytics = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId as string;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, roll_number: true, username: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Language usage
        const languageStats = await prisma.submission.groupBy({
            by: ['language', 'status'],
            where: { user_id: userId },
            _count: { id: true },
        });

        // Unique solved
        const solvedProblems = await prisma.submission.findMany({
            where: { user_id: userId, status: 'PASS' },
            distinct: ['problem_id'],
            select: { problem_id: true },
        });

        // Contest history
        const contestHistory = await prisma.participation.findMany({
            where: { user_id: userId },
            include: {
                contest: { select: { title: true, start_time: true, end_time: true } }
            },
            orderBy: { created_at: 'desc' },
        });

        // Recent submissions
        const recentSubs = await prisma.submission.findMany({
            where: { user_id: userId },
            include: {
                problem: { select: { title: true, difficulty: true } }
            },
            orderBy: { created_at: 'desc' },
            take: 20,
        });

        res.json({
            user,
            totalSolved: solvedProblems.length,
            totalSubmissions: recentSubs.length,
            languageStats,
            contestHistory,
            recentSubmissions: recentSubs,
        });
    } catch (error) {
        console.error('Error fetching student analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get all students for directory (admin view)
 * GET /api/admin/students/directory
 */
export const getAllStudents = async (req: Request, res: Response) => {
    try {
        const students = await prisma.user.findMany({
            where: { role: 'STUDENT' },
            select: {
                id: true,
                name: true,
                email: true,
                roll_number: true,
                year: true,
                semester: true,
                branch: true,
                section: true,
                is_profile_complete: true,
                points: true,
                streak: true,
                last_login: true,
                created_at: true,
            },
            orderBy: { created_at: 'desc' }
        });

        res.json(students);
    } catch (error) {
        console.error('Error fetching students directory:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
