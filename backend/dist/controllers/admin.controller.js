"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogs = exports.getAllSubmissions = exports.addTestCase = exports.deleteProblem = exports.editProblem = exports.createProblem = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const createProblem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description, difficulty, tags, testCases } = req.body;
        // Explicit assertion to any for req.user assuming AuthRequest populated it
        const userId = req.user.id;
        const problem = yield prisma_1.default.problem.create({
            data: {
                title,
                description,
                difficulty,
                tags,
                created_by: userId,
                testCases: {
                    create: testCases || []
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
});
exports.createProblem = createProblem;
const editProblem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { title, description, difficulty, tags } = req.body;
        const problem = yield prisma_1.default.problem.update({
            where: { id: id },
            data: { title, description, difficulty, tags }
        });
        res.json(problem);
    }
    catch (error) {
        console.error('Error editing problem:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.editProblem = editProblem;
const deleteProblem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma_1.default.problem.delete({ where: { id: id } });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting problem:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.deleteProblem = deleteProblem;
const addTestCase = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { problemId } = req.params;
        const { input, expected_output, is_hidden } = req.body;
        const testCase = yield prisma_1.default.testCase.create({
            data: {
                problem_id: problemId,
                input,
                expected_output,
                is_hidden
            }
        });
        res.status(201).json(testCase);
    }
    catch (error) {
        console.error('Error adding testcase:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.addTestCase = addTestCase;
const getAllSubmissions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const submissions = yield prisma_1.default.submission.findMany({
            include: {
                user: { select: { name: true, email: true } },
                problem: { select: { title: true } }
            },
            orderBy: { created_at: 'desc' }
        });
        res.json(submissions);
    }
    catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getAllSubmissions = getAllSubmissions;
const getLogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const logs = yield prisma_1.default.suspiciousLog.findMany({
            include: {
                user: { select: { name: true, email: true } }
            },
            orderBy: { timestamp: 'desc' }
        });
        res.json(logs);
    }
    catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getLogs = getLogs;
