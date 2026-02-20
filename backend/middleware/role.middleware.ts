import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { Role } from '@prisma/client';

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== Role.ADMIN) {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
};

export const requireStudent = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== Role.STUDENT) {
        return res.status(403).json({ error: 'Forbidden: Student access required' });
    }
    next();
};
