"use strict";
/**
 * Problem Controller
 *
 * Enhanced problem listing with filters for difficulty, tags, and problem type.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPointActivities = exports.toggleDislike = exports.toggleLike = exports.getSolutions = exports.addSolution = exports.getProblem = exports.getProblems = void 0;
const prisma_1 = __importDefault(require("../prisma"));
/**
 * Get all problems with filters
 * GET /api/problems
 */
const getProblems = async (req, res) => {
    var _a;
    try {
        const { difficulty, tags, problem_type, search } = req.query;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        let whereClause = {};
        if (difficulty) {
            whereClause.difficulty = difficulty;
        }
        if (tags) {
            const tagsArray = tags.split(',');
            whereClause.tags = { hasSome: tagsArray };
        }
        if (problem_type) {
            whereClause.problem_type = problem_type;
        }
        if (search) {
            whereClause.title = { contains: search, mode: 'insensitive' };
        }
        const problems = await prisma_1.default.problem.findMany({
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
            const user = await prisma_1.default.user.findUnique({ where: { id: userId }, select: { points: true } });
            userPoints = (user === null || user === void 0 ? void 0 : user.points) || 0;
        }
        // Get acceptance rate and user status for each problem
        const result = await Promise.all(problems.map(async (p) => {
            var _a;
            const totalSubs = ((_a = p._count) === null || _a === void 0 ? void 0 : _a.submissions) || 0;
            const passedSubs = await prisma_1.default.submission.count({
                where: { problem_id: p.id, status: 'PASS' }
            });
            let status = null;
            if (userId) {
                const solved = await prisma_1.default.submission.findFirst({
                    where: { problem_id: p.id, user_id: userId, status: 'PASS' }
                });
                status = solved ? 'SOLVED' : null;
                if (!status) {
                    const attempted = await prisma_1.default.submission.findFirst({
                        where: { problem_id: p.id, user_id: userId }
                    });
                    if (attempted)
                        status = 'ATTEMPTED';
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
    }
    catch (error) {
        console.error('Error fetching problems:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getProblems = getProblems;
/**
 * Get single problem details
 * GET /api/problems/:id
 */
const getProblem = async (req, res) => {
    var _a, _b;
    try {
        const id = req.params.id;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const isAdmin = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === 'ADMIN';
        const problem = await prisma_1.default.problem.findUnique({
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
            const userSubmission = await prisma_1.default.submission.findFirst({
                where: {
                    user_id: userId,
                    problem_id: id,
                    status: 'PASS'
                }
            });
            userStatus = userSubmission ? 'SOLVED' : null;
            if (!userStatus) {
                const anySubmission = await prisma_1.default.submission.findFirst({
                    where: {
                        user_id: userId,
                        problem_id: id,
                    }
                });
                if (anySubmission)
                    userStatus = 'ATTEMPTED';
            }
        }
        // Get problem stats
        const totalSubs = await prisma_1.default.submission.count({ where: { problem_id: id } });
        const passedSubs = await prisma_1.default.submission.count({ where: { problem_id: id, status: 'PASS' } });
        // Get user points
        let userPoints = 0;
        if (userId) {
            const user = await prisma_1.default.user.findUnique({ where: { id: userId }, select: { points: true } });
            userPoints = (user === null || user === void 0 ? void 0 : user.points) || 0;
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
    }
    catch (error) {
        console.error('Error fetching problem:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getProblem = getProblem;
/**
 * Add a new solution to a problem
 */
const addSolution = async (req, res) => {
    var _a;
    try {
        const id = req.params.id;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { title, explanation, code, language } = req.body;
        // @ts-ignore
        const solution = await prisma_1.default.solution.create({
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
    }
    catch (error) {
        console.error('Error adding solution:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.addSolution = addSolution;
/**
 * Get all solutions for a problem
 */
const getSolutions = async (req, res) => {
    try {
        const id = req.params.id;
        // @ts-ignore
        const solutions = await prisma_1.default.solution.findMany({
            where: { problem_id: id },
            include: {
                user: { select: { name: true, avatar_url: true } }
            },
            orderBy: { upvotes: 'desc' }
        });
        res.json(solutions);
    }
    catch (error) {
        console.error('Error fetching solutions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getSolutions = getSolutions;
/**
 * Toggle like for a problem
 */
const toggleLike = async (req, res) => {
    try {
        const id = req.params.id;
        // @ts-ignore
        await prisma_1.default.problem.update({
            where: { id },
            data: { likes_count: { increment: 1 } }
        });
        res.json({ message: 'Liked' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.toggleLike = toggleLike;
/**
 * Toggle dislike for a problem
 */
const toggleDislike = async (req, res) => {
    try {
        const id = req.params.id;
        // @ts-ignore
        await prisma_1.default.problem.update({
            where: { id },
            data: { dislikes_count: { increment: 1 } }
        });
        res.json({ message: 'Disliked' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.toggleDislike = toggleDislike;
const getPointActivities = async (req, res) => {
    try {
        const userId = req.user.id;
        // @ts-ignore
        const activities = await prisma_1.default.pointActivity.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
            take: 50
        });
        res.json(activities);
    }
    catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getPointActivities = getPointActivities;
