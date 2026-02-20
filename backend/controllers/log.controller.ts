import { Request, Response } from 'express';
import prisma from '../prisma';

export const logSuspiciousActivity = async (req: Request, res: Response) => {
    try {
        const { reason } = req.body;
        const userId = (req as any).user.id;

        if (!reason) {
            return res.status(400).json({ error: 'Reason is required' });
        }

        const log = await prisma.suspiciousLog.create({
            data: {
                user_id: userId,
                reason
            }
        });

        res.status(201).json(log);
    } catch (error) {
        console.error('Error logging activity:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
