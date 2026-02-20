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
exports.submitCode = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const execute_1 = require("../dockerRunner/execute");
const client_1 = require("@prisma/client");
const submitCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { problemId, code, language } = req.body;
        const userId = req.user.id;
        if (!problemId || !code || !language) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const problem = yield prisma_1.default.problem.findUnique({
            where: { id: problemId },
            include: { testCases: true }
        });
        if (!problem) {
            return res.status(404).json({ error: 'Problem not found' });
        }
        const testCases = problem.testCases;
        let finalStatus = client_1.SubmissionStatus.PASS;
        let maxExecutionTime = 0;
        let errorMsg = '';
        for (const testcase of testCases) {
            const { output, error, executionTime } = yield (0, execute_1.executeCode)(code, language, testcase.input);
            maxExecutionTime = Math.max(maxExecutionTime, executionTime);
            if (error) {
                finalStatus = client_1.SubmissionStatus.ERROR;
                errorMsg = error;
                break;
            }
            if (output.trim() !== testcase.expected_output.trim()) {
                finalStatus = client_1.SubmissionStatus.FAIL;
                errorMsg = `Testcase failed. Expected output did not match actual output.`;
                break;
            }
        }
        const submission = yield prisma_1.default.submission.create({
            data: {
                user_id: userId,
                problem_id: problemId,
                code,
                language,
                status: finalStatus,
                execution_time: maxExecutionTime / 1000, // seconds
            }
        });
        res.json({
            id: submission.id,
            status: submission.status,
            execution_time: submission.execution_time,
            error: errorMsg || null,
        });
    }
    catch (error) {
        console.error('Submission error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.submitCode = submitCode;
