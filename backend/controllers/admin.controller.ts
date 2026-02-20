import { Request, Response } from 'express';
import prisma from '../prisma';

export const createProblem = async (req: Request, res: Response) => {
    try {
        const { title, description, difficulty, tags, testCases } = req.body;

        // Explicit assertion to any for req.user assuming AuthRequest populated it
        const userId = (req as any).user.id;

        const problem = await prisma.problem.create({
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
    } catch (error) {
        console.error('Error creating problem:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const editProblem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, description, difficulty, tags } = req.body;

        const problem = await prisma.problem.update({
            where: { id: id as string },
            data: { title, description, difficulty, tags }
        });

        res.json(problem);
    } catch (error) {
        console.error('Error editing problem:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteProblem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.problem.delete({ where: { id: id as string } });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting problem:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const addTestCase = async (req: Request, res: Response) => {
    try {
        const { problemId } = req.params;
        const { input, expected_output, is_hidden } = req.body;

        const testCase = await prisma.testCase.create({
            data: {
                problem_id: problemId as string,
                input,
                expected_output,
                is_hidden
            }
        });

        res.status(201).json(testCase);
    } catch (error) {
        console.error('Error adding testcase:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAllSubmissions = async (req: Request, res: Response) => {
    try {
        const submissions = await prisma.submission.findMany({
            include: {
                user: { select: { name: true, email: true } },
                problem: { select: { title: true } }
            },
            orderBy: { created_at: 'desc' }
        });
        res.json(submissions);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getLogs = async (req: Request, res: Response) => {
    try {
        const logs = await prisma.suspiciousLog.findMany({
            include: {
                user: { select: { name: true, email: true } }
            },
            orderBy: { timestamp: 'desc' }
        });
        res.json(logs);
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
