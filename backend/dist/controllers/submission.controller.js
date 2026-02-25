"use strict";
/**
 * Submission Controller
 *
 *
 * Handles code submissions with async queue processing.
 * Supports both coding and SQL problem types with multi-language support.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGlobalLeaderboard = exports.getSupportedLanguages = exports.getAnalytics = exports.getSubmissions = exports.getSubmissionById = exports.runCode = exports.submitCode = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const submissionQueue_1 = require("../services/submissionQueue");
const similarity_1 = require("../utils/similarity");
const languageConfig_1 = require("../dockerRunner/languageConfig");
const execute_1 = require("../dockerRunner/execute");
const sqlExecutor_1 = require("../dockerRunner/sqlExecutor");
const client_1 = require("@prisma/client");
/**
 * Submit code for evaluation
 * POST /api/submissions
 */
const submitCode = async (req, res) => {
    try {
        const { problemId, code, language, contestId } = req.body;
        const userId = req.user.id;
        if (!problemId || !code || !language) {
            return res.status(400).json({ error: 'Missing required fields: problemId, code, language' });
        }
        // Validate language
        if (!(0, languageConfig_1.isLanguageSupported)(language)) {
            return res.status(400).json({
                error: `Unsupported language: ${language}`,
                supported: Object.keys(languageConfig_1.LANGUAGE_CONFIGS)
            });
        }
        // Fetch problem
        const problem = await prisma_1.default.problem.findUnique({
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
            const contest = await prisma_1.default.contest.findUnique({ where: { id: contestId } });
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
        // ── 1. MOSS-Lite Similarity Check (Anti-Cheat) ──
        try {
            const othersSubmissions = await prisma_1.default.submission.findMany({
                where: {
                    problem_id: problemId,
                    status: client_1.SubmissionStatus.PASS,
                    user_id: { not: userId }
                },
                take: 3,
                orderBy: { created_at: 'desc' }
            });
            for (const otherSub of othersSubmissions) {
                const similarity = (0, similarity_1.calculateSimilarity)(code, otherSub.code);
                if (similarity > 0.85) {
                    await prisma_1.default.suspiciousLog.create({
                        data: {
                            user_id: userId,
                            reason: `High similarity (${Math.round(similarity * 100)}%) with submission ${otherSub.id} from user ${otherSub.user_id}`,
                        }
                    });
                    console.warn(`[Anti-Cheat] Potential plagiarism detected for user ${userId}: ${Math.round(similarity * 100)}% match`);
                    break;
                }
            }
        }
        catch (err) {
            console.error('[Anti-Cheat] Similarity check failed:', err);
        }
        // Create submission record with PENDING status
        const submission = await prisma_1.default.submission.create({
            data: {
                user_id: userId,
                problem_id: problemId,
                contest_id: contestId || null,
                code,
                language,
                status: client_1.SubmissionStatus.PENDING,
            }
        });
        // Add to processing queue
        const jobData = {
            submissionId: submission.id,
            userId,
            problemId,
            contestId,
            code,
            language,
        };
        try {
            // Attempt to add to async queue
            await submissionQueue_1.submissionQueue.add(jobData, {
                jobId: submission.id,
                priority: contestId ? 1 : 2,
            });
        }
        catch (queueError) {
            console.warn('[Queue] Failed to add to Redis queue, falling back to direct execution');
            // Fallback: Process immediately in background (don't block the HTTP response)
            (0, submissionQueue_1.processSubmission)(jobData).catch(err => console.error('[Fallback] Direct execution failed:', err));
        }
        res.status(201).json({
            id: submission.id,
            status: 'PENDING',
            message: 'Submission received and processing...',
            fallback: true
        });
    }
    catch (error) {
        console.error('Submission error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.submitCode = submitCode;
/**
 * Run code against the first test case instantly
 * POST /api/submissions/run
 */
const runCode = async (req, res) => {
    var _a;
    try {
        const { problemId, code, language, input: customInput } = req.body;
        if (!problemId || !code || !language) {
            return res.status(400).json({ error: 'Missing required fields: problemId, code, language' });
        }
        if (!(0, languageConfig_1.isLanguageSupported)(language)) {
            return res.status(400).json({ error: `Unsupported language: ${language}` });
        }
        const problem = await prisma_1.default.problem.findUnique({
            where: { id: problemId },
            include: { testCases: { take: 1 } }
        });
        if (!problem) {
            return res.status(404).json({ error: 'Problem not found' });
        }
        let inputToUse = customInput;
        let expectedOutput = '';
        if (!inputToUse && problem.testCases && problem.testCases.length > 0) {
            inputToUse = problem.testCases[0].input;
            expectedOutput = problem.testCases[0].expected_output;
        }
        inputToUse = inputToUse || '';
        // Handle SQL
        if (problem.problem_type === 'SQL') {
            if (language !== 'sql') {
                return res.status(400).json({ error: 'SQL problems only accept SQL submissions' });
            }
            let expectedJson = [];
            const rawExpected = (_a = problem.testCases[0]) === null || _a === void 0 ? void 0 : _a.expected_result_json;
            if (typeof rawExpected === 'string') {
                try {
                    expectedJson = JSON.parse(rawExpected);
                }
                catch (e) { }
            }
            else if (Array.isArray(rawExpected)) {
                expectedJson = rawExpected;
            }
            const sqlResult = await (0, sqlExecutor_1.executeSQLProblem)(code, problem.sql_schema || '', inputToUse, JSON.stringify(expectedJson), problem.time_limit);
            return res.json({
                status: sqlResult.verdict === 'WRONG_ANSWER' ? 'FAIL' : (sqlResult.verdict === 'SUCCESS' ? 'PASS' : sqlResult.verdict),
                execution_time: sqlResult.executionTime / 1000,
                error: sqlResult.error,
                output: JSON.stringify(sqlResult.resultJson, null, 2),
                expected: JSON.stringify(expectedJson, null, 2)
            });
        }
        // Handle normal code
        const result = await (0, execute_1.executeCode)(code, language, inputToUse, problem.time_limit, problem.memory_limit);
        let status = result.verdict === 'SUCCESS' ? 'COMPLETE' : result.verdict;
        // simple string compare if SUCCESS
        if (status === 'COMPLETE' && expectedOutput) {
            const outStr = result.output.trim();
            const expStr = expectedOutput.trim();
            if (outStr === expStr) {
                status = 'PASS';
            }
            else {
                status = 'FAIL';
            }
        }
        res.json({
            status,
            execution_time: result.executionTime / 1000,
            memory_used: result.memoryUsed,
            error: result.error,
            output: result.output,
            expected: expectedOutput
        });
    }
    catch (error) {
        console.error('Run Code error:', error);
        res.status(500).json({ error: 'Internal server error while executing' });
    }
};
exports.runCode = runCode;
/**

 * Get submission status/result
 * GET /api/submissions/:id
 */
const getSubmissionById = async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user.id;
        const submission = await prisma_1.default.submission.findUnique({
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
        if (req.user.role !== 'ADMIN' && submission.user_id !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        res.json(submission);
    }
    catch (error) {
        console.error('Error fetching submission:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getSubmissionById = getSubmissionById;
/**
 * Get all submissions for the logged-in user
 * GET /api/submissions
 */
const getSubmissions = async (req, res) => {
    try {
        const userId = req.user.id;
        const { problemId, language, status, limit = 50 } = req.query;
        let whereClause = { user_id: userId };
        if (problemId)
            whereClause.problem_id = problemId;
        if (language)
            whereClause.language = language;
        if (status)
            whereClause.status = status;
        const submissions = await prisma_1.default.submission.findMany({
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
    }
    catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getSubmissions = getSubmissions;
/**
 * Get user's analytics/statistics
 * GET /api/submissions/analytics
 */
const getAnalytics = async (req, res) => {
    var _a;
    try {
        const userId = req.user.id;
        // Language usage statistics
        const languageStats = await prisma_1.default.submission.groupBy({
            by: ['language'],
            where: { user_id: userId },
            _count: { id: true },
        });
        // Success rate per language
        const languageResults = await prisma_1.default.submission.groupBy({
            by: ['language', 'status'],
            where: { user_id: userId },
            _count: { id: true },
        });
        // Build language analysis
        const languageAnalysis = {};
        for (const stat of languageResults) {
            if (!languageAnalysis[stat.language]) {
                languageAnalysis[stat.language] = { total: 0, passed: 0, failed: 0, errors: 0, successRate: 0 };
            }
            languageAnalysis[stat.language].total += stat._count.id;
            if (stat.status === 'PASS')
                languageAnalysis[stat.language].passed += stat._count.id;
            else if (stat.status === 'FAIL')
                languageAnalysis[stat.language].failed += stat._count.id;
            else
                languageAnalysis[stat.language].errors += stat._count.id;
        }
        for (const lang of Object.keys(languageAnalysis)) {
            const stats = languageAnalysis[lang];
            stats.successRate = stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;
        }
        // Most used language
        const mostUsedLanguage = ((_a = languageStats.sort((a, b) => b._count.id - a._count.id)[0]) === null || _a === void 0 ? void 0 : _a.language) || 'N/A';
        // Total unique problems solved
        const solvedProblems = await prisma_1.default.submission.findMany({
            where: {
                user_id: userId,
                status: client_1.SubmissionStatus.PASS,
            },
            distinct: ['problem_id'],
            select: { problem_id: true },
        });
        // Difficulty-wise breakdown
        const problemDetails = await prisma_1.default.problem.findMany({
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
        const totalSubmissions = await prisma_1.default.submission.count({
            where: { user_id: userId }
        });
        // Contest participation history
        const contestHistory = await prisma_1.default.participation.findMany({
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
        const recentSubmissions = await prisma_1.default.submission.findMany({
            where: {
                user_id: userId,
                created_at: { gte: ninetyDaysAgo }
            },
            select: { created_at: true, status: true },
            orderBy: { created_at: 'asc' }
        });
        const heatmap = {};
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
    }
    catch (error) {
        console.error('Error generating analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getAnalytics = getAnalytics;
/**
 * Get supported languages with configs (for frontend)
 * GET /api/submissions/languages
 */
const getSupportedLanguages = async (req, res) => {
    const languages = Object.entries(languageConfig_1.LANGUAGE_CONFIGS).map(([key, config]) => ({
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
exports.getSupportedLanguages = getSupportedLanguages;
/**
 * Get Global Leaderboard
 */
const getGlobalLeaderboard = async (req, res) => {
    try {
        const users = await prisma_1.default.user.findMany({
            where: {
                role: 'STUDENT'
            },
            select: {
                id: true,
                name: true,
                username: true,
                roll_number: true,
                points: true,
                streak: true,
                avatar_url: true,
            },
            orderBy: {
                points: 'desc'
            },
            take: 500
        });
        const rankedUsers = users.map((user, index) => ({
            ...user,
            rank: index + 1
        }));
        res.json(rankedUsers);
    }
    catch (error) {
        console.error('Error fetching global leaderboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getGlobalLeaderboard = getGlobalLeaderboard;
