import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: Role;
    };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied, token missing' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_here', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token is invalid or expired' });
        }
        req.user = user as any;
        next();
    });
};
