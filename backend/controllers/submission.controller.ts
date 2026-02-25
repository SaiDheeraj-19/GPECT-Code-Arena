/**
 * Submission Controller
 * 
 * Handles code submissions with async queue processing.
 * Supports both coding and SQL problem types with multi-language support.
 */

import { Request, Response } from 'express';
import prisma from '../prisma';
import { submissionQueue, SubmissionJob, processSubmission } from '../services/submissionQueue';
import { isLanguageSupported, getLanguageConfig, LANGUAGE_CONFIGS } from '../dockerRunner/languageConfig';
import { SubmissionStatus } from '@prisma/client';

/**
 * Submit code for evaluation
 * POST /api/submissions
 */
export const submitCode = async (req: Request, res: Response) => {
    try {
        const { problemId, code, language, contestId } = req.body;
        const userId = (req as any).user.id;

        if (!problemId || !code || !language) {
            return res.status(400).json({ error: 'Missing required fields: problemId, code, language' });
        }

        // Validate language
        if (!isLanguageSupported(language)) {
            return res.status(400).json({
                error: `Unsupported language: ${language}`,
                supported: Object.keys(LANGUAGE_CONFIGS)
            });
        }

        // Fetch problem
        const problem = await prisma.problem.findUnique({
            where: { id: problemId },
            select: {
                id: true,
                title: true,
                problem_type: true,
                allowed_languages: true,
                time_limit: true,
                memory_limit: true,
            }
        });

        if (!problem) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        // Check allowed languages
        if (problem.allowed_languages.length > 0 && !problem.allowed_languages.includes(language)) {
            return res.status(400).json({
                error: `Language '${language}' is not allowed for this problem`,
                allowed: problem.allowed_languages
            });
        }

        // SQL problems only accept 'sql' language
        if (problem.problem_type === 'SQL' && language !== 'sql') {
            return res.status(400).json({ error: 'SQL problems only accept SQL submissions' });
        }

        // Validate contest if provided
        if (contestId) {
            const contest = await prisma.contest.findUnique({ where: { id: contestId } });
            if (!contest) {
                return res.status(404).json({ error: 'Contest not found' });
            }

            const now = new Date();
            if (now < contest.start_time) {
                return res.status(400).json({ error: 'Contest has not started yet' });
            }
            if (now > contest.end_time) {
                return res.status(400).json({ error: 'Contest has ended' });
            }
        }

        // Create submission record with PENDING status
        const submission = await prisma.submission.create({
            data: {
                user_id: userId,
                problem_id: problemId,
                contest_id: contestId || null,
                code,
                language,
                status: SubmissionStatus.PENDING,
            }
        });

        // Add to processing queue
        const jobData: SubmissionJob = {
            submissionId: submission.id,
            userId,
            problemId,
            contestId,
            code,
            language,
        };

        try {
            // Attempt to add to async queue
            await submissionQueue.add(jobData, {
                jobId: submission.id,
                priority: contestId ? 1 : 2,
            });
        } catch (queueError) {
            console.warn('[Queue] Failed to add to Redis queue, falling back to direct execution');
            // Fallback: Process immediately in background (don't block the HTTP response)
            processSubmission(jobData).catch(err =>
                console.error('[Fallback] Direct execution failed:', err)
            );
        }

        res.status(201).json({
            id: submission.id,
            status: 'PENDING',
            message: 'Submission received and processing...',
            fallback: true
        });

    } catch (error) {
        console.error('Submission error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get submission status/result
 * GET /api/submissions/:id
 */
export const getSubmissionById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const userId = (req as any).user.id;

        const submission = await prisma.submission.findUnique({
            where: { id },
            include: {
                problem: {
                    select: {
                        title: true,
                        difficulty: true,
                    }
                }
            }
        });

        if (!submission) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        // Students can only see their own submissions
        if ((req as any).user.role !== 'ADMIN' && submission.user_id !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(submission);
    } catch (error) {
        console.error('Error fetching submission:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get all submissions for the logged-in user
 * GET /api/submissions
 */
export const getSubmissions = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { problemId, language, status, limit = 50 } = req.query;

        let whereClause: any = { user_id: userId };

        if (problemId) whereClause.problem_id = problemId;
        if (language) whereClause.language = language;
        if (status) whereClause.status = status;

        const submissions = await prisma.submission.findMany({
            where: whereClause,
            include: {
                problem: {
                    select: {
                        title: true,
                        difficulty: true,
                    }
                }
            },
            orderBy: { created_at: 'desc' },
            take: Math.min(Number(limit), 100),
        });

        res.json(submissions);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get user's analytics/statistics
 * GET /api/submissions/analytics
 */
export const getAnalytics = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        // Language usage statistics
        const languageStats = await prisma.submission.groupBy({
            by: ['language'],
            where: { user_id: userId },
            _count: { id: true },
        });

        // Success rate per language
        const languageResults = await prisma.submission.groupBy({
            by: ['language', 'status'],
            where: { user_id: userId },
            _count: { id: true },
        });

        // Build language analysis
        const languageAnalysis: Record<string, {
            total: number;
            passed: number;
            failed: number;
            errors: number;
            successRate: number;
        }> = {};

        for (const stat of languageResults) {
            if (!languageAnalysis[stat.language]) {
                languageAnalysis[stat.language] = { total: 0, passed: 0, failed: 0, errors: 0, successRate: 0 };
            }
            languageAnalysis[stat.language].total += stat._count.id;
            if (stat.status === 'PASS') languageAnalysis[stat.language].passed += stat._count.id;
            else if (stat.status === 'FAIL') languageAnalysis[stat.language].failed += stat._count.id;
            else languageAnalysis[stat.language].errors += stat._count.id;
        }

        for (const lang of Object.keys(languageAnalysis)) {
            const stats = languageAnalysis[lang];
            stats.successRate = stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;
        }

        // Most used language
        const mostUsedLanguage = languageStats.sort((a, b) => b._count.id - a._count.id)[0]?.language || 'N/A';

        // Total unique problems solved
        const solvedProblems = await prisma.submission.findMany({
            where: {
                user_id: userId,
                status: SubmissionStatus.PASS,
            },
            distinct: ['problem_id'],
            select: { problem_id: true },
        });

        // Difficulty-wise breakdown
        const problemDetails = await prisma.problem.findMany({
            where: {
                id: { in: solvedProblems.map(s => s.problem_id) }
            },
            select: {
                id: true,
                difficulty: true,
                problem_type: true,
            }
        });

        const difficultyBreakdown = {
            Easy: problemDetails.filter(p => p.difficulty === 'Easy').length,
            Medium: problemDetails.filter(p => p.difficulty === 'Medium').length,
            Hard: problemDetails.filter(p => p.difficulty === 'Hard').length,
        };

        // Coding vs SQL accuracy
        const codingProblems = problemDetails.filter(p => p.problem_type === 'CODING').length;
        const sqlProblems = problemDetails.filter(p => p.problem_type === 'SQL').length;

        // Total submissions
        const totalSubmissions = await prisma.submission.count({
            where: { user_id: userId }
        });

        // Contest participation history
        const contestHistory = await prisma.participation.findMany({
            where: { user_id: userId },
            include: {
                contest: {
                    select: {
                        id: true,
                        title: true,
                        start_time: true,
                        end_time: true,
                    }
                }
            },
            orderBy: { created_at: 'desc' },
        });

        // Submission heatmap (last 90 days)
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const recentSubmissions = await prisma.submission.findMany({
            where: {
                user_id: userId,
                created_at: { gte: ninetyDaysAgo }
            },
            select: { created_at: true, status: true },
            orderBy: { created_at: 'asc' }
        });

        const heatmap: Record<string, number> = {};
        for (const sub of recentSubmissions) {
            const date = sub.created_at.toISOString().split('T')[0];
            heatmap[date] = (heatmap[date] || 0) + 1;
        }

        res.json({
            totalSubmissions,
            totalSolved: solvedProblems.length,
            mostUsedLanguage,
            languageAnalysis,
            difficultyBreakdown,
            codingVsSql: {
                coding: codingProblems,
                sql: sqlProblems,
            },
            contestHistory: contestHistory.map(ch => ({
                contestId: ch.contest.id,
                contestTitle: ch.contest.title,
                startTime: ch.contest.start_time,
                endTime: ch.contest.end_time,
                score: ch.score,
                solvedCount: ch.solved_count,
                penaltyTime: ch.penalty_time,
            })),
            heatmap,
        });
    } catch (error) {
        console.error('Error generating analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get supported languages with configs (for frontend)
 * GET /api/submissions/languages
 */
export const getSupportedLanguages = async (req: Request, res: Response) => {
    const languages = Object.entries(LANGUAGE_CONFIGS).map(([key, config]) => ({
        id: key,
        name: config.display_name,
        monacoId: config.monaco_id,
        boilerplate: config.boilerplate,
        fileExtension: config.file_extension,
        timeLimit: config.time_limit,
        memoryLimit: config.memory_limit,
    }));

    res.json(languages);
};
