"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllStudents = exports.getStudentAnalytics = exports.getDashboardStats = exports.getLogs = exports.getAllSubmissions = exports.deleteTestCase = exports.updateTestCase = exports.addTestCase = exports.deleteProblem = exports.editProblem = exports.createProblem = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const languageConfig_1 = require("../dockerRunner/languageConfig");
/**
 * Create a problem with multi-language and SQL support
 * POST /api/admin/problems
 */
const createProblem = async (req, res) => {
    try {
        const { title, description, difficulty, tags, testCases, problem_type, time_limit, memory_limit, allowed_languages, sql_schema, sql_seed_data, default_solution, } = req.body;
        const userId = req.user.id;
        if (!title || !description || !difficulty) {
            return res.status(400).json({ error: 'Title, description, and difficulty are required' });
        }
        // Validate allowed languages
        const validLanguages = (0, languageConfig_1.getSupportedLanguages)();
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
        const problem = await prisma_1.default.problem.create({
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
                created_by: userId,
                testCases: {
                    create: (testCases === null || testCases === void 0 ? void 0 : testCases.map((tc) => ({
                        input: tc.input,
                        expected_output: tc.expected_output || '',
                        expected_result_json: tc.expected_result_json || null,
                        is_hidden: tc.is_hidden || false,
                    }))) || []
                }
            },
            include: {
                testCases: true
            }
        });
        res.status(201).json(problem);
    }
    catch (error) {
        console.error('Error creating problem:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.createProblem = createProblem;
/**
 * Edit a problem
 * PUT /api/admin/problems/:id
 */
const editProblem = async (req, res) => {
    try {
        const id = req.params.id;
        const { title, description, difficulty, tags, problem_type, testCases, // Added this
        time_limit, memory_limit, allowed_languages, sql_schema, sql_seed_data, default_solution, } = req.body;
        const updateData = {};
        if (title !== undefined)
            updateData.title = title;
        if (description !== undefined)
            updateData.description = description;
        if (difficulty !== undefined)
            updateData.difficulty = difficulty;
        if (tags !== undefined)
            updateData.tags = tags;
        if (problem_type !== undefined)
            updateData.problem_type = problem_type;
        if (time_limit !== undefined)
            updateData.time_limit = time_limit;
        if (memory_limit !== undefined)
            updateData.memory_limit = memory_limit;
        if (allowed_languages !== undefined)
            updateData.allowed_languages = allowed_languages;
        if (sql_schema !== undefined)
            updateData.sql_schema = sql_schema;
        if (sql_seed_data !== undefined)
            updateData.sql_seed_data = sql_seed_data;
        // @ts-ignore
        if (default_solution !== undefined)
            updateData.default_solution = default_solution;
        // Use a transaction to update problem and recreate test cases if provided
        const problem = await prisma_1.default.$transaction(async (tx) => {
            if (testCases) {
                // Delete existing test cases
                await tx.testCase.deleteMany({
                    where: { problem_id: id }
                });
                // Add new test cases
                updateData.testCases = {
                    create: testCases.map((tc) => ({
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
    }
    catch (error) {
        console.error('Error editing problem:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.editProblem = editProblem;
/**
 * Delete a problem
 * DELETE /api/admin/problems/:id
 */
const deleteProblem = async (req, res) => {
    try {
        const id = req.params.id;
        await prisma_1.default.problem.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting problem:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.deleteProblem = deleteProblem;
/**
 * Add test case to a problem
 * POST /api/admin/problems/:problemId/testcases
 */
const addTestCase = async (req, res) => {
    try {
        const problemId = req.params.problemId;
        const { input, expected_output, expected_result_json, is_hidden } = req.body;
        const testCase = await prisma_1.default.testCase.create({
            data: {
                problem_id: problemId,
                input,
                expected_output: expected_output || '',
                expected_result_json: expected_result_json || null,
                is_hidden: is_hidden || false,
            }
        });
        res.status(201).json(testCase);
    }
    catch (error) {
        console.error('Error adding testcase:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.addTestCase = addTestCase;
/**
 * Update a test case
 * PUT /api/admin/testcases/:id
 */
const updateTestCase = async (req, res) => {
    try {
        const id = req.params.id;
        const { input, expected_output, expected_result_json, is_hidden } = req.body;
        const updated = await prisma_1.default.testCase.update({
            where: { id },
            data: {
                ...(input !== undefined && { input }),
                ...(expected_output !== undefined && { expected_output }),
                ...(expected_result_json !== undefined && { expected_result_json }),
                ...(is_hidden !== undefined && { is_hidden }),
            }
        });
        res.json(updated);
    }
    catch (error) {
        console.error('Error updating testcase:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateTestCase = updateTestCase;
/**
 * Delete a test case
 * DELETE /api/admin/testcases/:id
 */
const deleteTestCase = async (req, res) => {
    try {
        const id = req.params.id;
        await prisma_1.default.testCase.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting testcase:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.deleteTestCase = deleteTestCase;
/**
 * Get all submissions (admin view)
 * GET /api/admin/submissions
 */
const getAllSubmissions = async (req, res) => {
    try {
        const { userId, problemId, language, status, limit = 100 } = req.query;
        let whereClause = {};
        if (userId)
            whereClause.user_id = userId;
        if (problemId)
            whereClause.problem_id = problemId;
        if (language)
            whereClause.language = language;
        if (status)
            whereClause.status = status;
        const submissions = await prisma_1.default.submission.findMany({
            where: whereClause,
            include: {
                user: { select: { name: true, email: true, roll_number: true } },
                problem: { select: { title: true, difficulty: true } }
            },
            orderBy: { created_at: 'desc' },
            take: Math.min(Number(limit), 500),
        });
        res.json(submissions);
    }
    catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getAllSubmissions = getAllSubmissions;
/**
 * Get suspicious activity logs
 * GET /api/admin/logs
 */
const getLogs = async (req, res) => {
    try {
        const logs = await prisma_1.default.suspiciousLog.findMany({
            include: {
                user: { select: { name: true, email: true, roll_number: true } }
            },
            orderBy: { timestamp: 'desc' }
        });
        res.json(logs);
    }
    catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getLogs = getLogs;
/**
 * Get comprehensive dashboard statistics
 * GET /api/admin/stats
 */
const getDashboardStats = async (req, res) => {
    try {
        const totalStudents = await prisma_1.default.user.count({ where: { role: 'STUDENT' } });
        const totalProblems = await prisma_1.default.problem.count();
        const totalSubmissions = await prisma_1.default.submission.count();
        const problemsSolved = await prisma_1.default.submission.count({ where: { status: 'PASS' } });
        const suspiciousEvents = await prisma_1.default.suspiciousLog.count();
        const activeContests = await prisma_1.default.contest.count({
            where: {
                start_time: { lte: new Date() },
                end_time: { gte: new Date() },
            }
        });
        // Language distribution
        const languageDistribution = await prisma_1.default.submission.groupBy({
            by: ['language'],
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } }
        });
        // Difficulty distribution of problems
        const difficultyDistribution = await prisma_1.default.problem.groupBy({
            by: ['difficulty'],
            _count: { id: true },
        });
        // Problem type distribution
        const typeDistribution = await prisma_1.default.problem.groupBy({
            by: ['problem_type'],
            _count: { id: true },
        });
        // Submissions per day (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentSubmissions = await prisma_1.default.submission.findMany({
            where: { created_at: { gte: thirtyDaysAgo } },
            select: { created_at: true, status: true },
        });
        const submissionsByDay = {};
        for (const sub of recentSubmissions) {
            const date = sub.created_at.toISOString().split('T')[0];
            if (!submissionsByDay[date])
                submissionsByDay[date] = { total: 0, passed: 0 };
            submissionsByDay[date].total++;
            if (sub.status === 'PASS')
                submissionsByDay[date].passed++;
        }
        const recentLogs = await prisma_1.default.suspiciousLog.findMany({
            include: { user: { select: { name: true, roll_number: true } } },
            orderBy: { timestamp: 'desc' },
            take: 10
        });
        // Top performers
        const topPerformers = await prisma_1.default.submission.groupBy({
            by: ['user_id'],
            where: { status: 'PASS' },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 10,
        });
        const topPerformerDetails = await Promise.all(topPerformers.map(async (tp) => {
            const user = await prisma_1.default.user.findUnique({
                where: { id: tp.user_id },
                select: { name: true, roll_number: true, username: true, avatar_url: true }
            });
            const uniqueSolved = await prisma_1.default.submission.findMany({
                where: { user_id: tp.user_id, status: 'PASS' },
                distinct: ['problem_id'],
                select: { problem_id: true },
            });
            return {
                userId: tp.user_id,
                name: user === null || user === void 0 ? void 0 : user.name,
                rollNumber: user === null || user === void 0 ? void 0 : user.roll_number,
                username: user === null || user === void 0 ? void 0 : user.username,
                avatarUrl: user === null || user === void 0 ? void 0 : user.avatar_url,
                totalAccepted: tp._count.id,
                uniqueSolved: uniqueSolved.length,
            };
        }));
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
    }
    catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getDashboardStats = getDashboardStats;
/**
 * Get student analytics (admin view)
 * GET /api/admin/students/:userId/analytics
 */
const getStudentAnalytics = async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, roll_number: true, username: true }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Language usage
        const languageStats = await prisma_1.default.submission.groupBy({
            by: ['language', 'status'],
            where: { user_id: userId },
            _count: { id: true },
        });
        // Unique solved
        const solvedProblems = await prisma_1.default.submission.findMany({
            where: { user_id: userId, status: 'PASS' },
            distinct: ['problem_id'],
            select: { problem_id: true },
        });
        // Contest history
        const contestHistory = await prisma_1.default.participation.findMany({
            where: { user_id: userId },
            include: {
                contest: { select: { title: true, start_time: true, end_time: true } }
            },
            orderBy: { created_at: 'desc' },
        });
        // Recent submissions
        const recentSubs = await prisma_1.default.submission.findMany({
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
    }
    catch (error) {
        console.error('Error fetching student analytics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getStudentAnalytics = getStudentAnalytics;
/**
 * Get all students for directory (admin view)
 * GET /api/admin/students/directory
 */
const getAllStudents = async (req, res) => {
    try {
        const students = await prisma_1.default.user.findMany({
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
    }
    catch (error) {
        console.error('Error fetching students directory:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getAllStudents = getAllStudents;
