import { Request, Response } from 'express';
import prisma from '../prisma';
import { executeCode } from '../dockerRunner/execute';
import { SubmissionStatus } from '@prisma/client';

export const submitCode = async (req: Request, res: Response) => {
    try {
        const { problemId, code, language } = req.body;
        const userId = (req as any).user.id;

        if (!problemId || !code || !language) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const problem = await prisma.problem.findUnique({
            where: { id: problemId },
            include: { testCases: true }
        });

        if (!problem) {
            return res.status(404).json({ error: 'Problem not found' });
        }

        const testCases = problem.testCases;
        let finalStatus: SubmissionStatus = SubmissionStatus.PASS;
        let maxExecutionTime = 0;
        let errorMsg = '';

        for (const testcase of testCases) {
            const { output, error, executionTime } = await executeCode(code, language, testcase.input);
            maxExecutionTime = Math.max(maxExecutionTime, executionTime);

            if (error) {
                finalStatus = SubmissionStatus.ERROR;
                errorMsg = error;
                break;
            }

            if (output.trim() !== testcase.expected_output.trim()) {
                finalStatus = SubmissionStatus.FAIL;
                errorMsg = `Testcase failed. Expected output did not match actual output.`;
                break;
            }
        }

        const submission = await prisma.submission.create({
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
    } catch (error) {
        console.error('Submission error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getSubmissions = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const submissions = await prisma.submission.findMany({
            where: { user_id: userId },
            include: {
                problem: {
                    select: {
                        title: true,
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });
        res.json(submissions);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
