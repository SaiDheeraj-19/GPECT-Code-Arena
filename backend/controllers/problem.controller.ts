import { Request, Response } from 'express';
import prisma from '../prisma';

export const getProblems = async (req: Request, res: Response) => {
    try {
        const { difficulty, tags } = req.query;

        let whereClause: any = {};

        if (difficulty) {
            whereClause.difficulty = difficulty;
        }

        if (tags) {
            const tagsArray = (tags as string).split(',');
            whereClause.tags = { hasSome: tagsArray };
        }

        const problems = await prisma.problem.findMany({
            where: whereClause,
            select: {
                id: true,
                title: true,
                difficulty: true,
                tags: true,
            }
        });

        res.json(problems);
    } catch (error) {
        console.error('Error fetching problems:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getProblem = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const problem = await prisma.problem.findUnique({
            where: { id: id as string },
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
    } catch (error) {
        console.error('Error fetching problem:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
