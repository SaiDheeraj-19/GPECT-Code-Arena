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
exports.getProblem = exports.getProblems = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getProblems = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { difficulty, tags } = req.query;
        let whereClause = {};
        if (difficulty) {
            whereClause.difficulty = difficulty;
        }
        if (tags) {
            const tagsArray = tags.split(',');
            whereClause.tags = { hasSome: tagsArray };
        }
        const problems = yield prisma_1.default.problem.findMany({
            where: whereClause,
            select: {
                id: true,
                title: true,
                difficulty: true,
                tags: true,
            }
        });
        res.json(problems);
    }
    catch (error) {
        console.error('Error fetching problems:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getProblems = getProblems;
const getProblem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const problem = yield prisma_1.default.problem.findUnique({
            where: { id: id },
            include: {
                testCases: {
                    where: { is_hidden: false },
                    select: {
                        id: true,
                        input: true,
                        expected_output: true
                    }
                }
            }
        });
        if (!problem) {
            return res.status(404).json({ error: 'Problem not found' });
        }
        res.json(problem);
    }
    catch (error) {
        console.error('Error fetching problem:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getProblem = getProblem;
