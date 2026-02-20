import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { Role } from '@prisma/client';

export const login = async (req: Request, res: Response) => {
    try {
        const { identifier, password } = req.body; // identifier can be email or roll_number

        if (!identifier || !password) {
            return res.status(400).json({ error: 'Identifier and password are required' });
        }

        // Determine if identifier is an email or roll number
        const isRollNumber = /^2\dATA[0-9A-Z]{5}$/i.test(identifier);

        if (!isRollNumber && !identifier.includes('@')) {
            return res.status(400).json({ error: 'Invalid identifier format. Must be an email or a valid roll number.' });
        }

        let user;
        if (isRollNumber) {
            user = await prisma.user.findUnique({ where: { roll_number: identifier.toUpperCase() } });
        } else {
            user = await prisma.user.findUnique({ where: { email: identifier } });
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if account is locked
        if (user.locked_until && user.locked_until > new Date()) {
            return res.status(403).json({ error: 'Account temporarily locked. Please try again later.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            const newAttempts = user.failed_attempts + 1;
            let lockedUntil = null;

            if (newAttempts >= 5) {
                // Lock out for 15 minutes
                lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
            }

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    failed_attempts: newAttempts,
                    locked_until: lockedUntil
                }
            });

            if (lockedUntil) {
                return res.status(403).json({ error: 'Account locked due to too many failed attempts' });
            }

            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Password is correct, reset failed attempts
        if (user.failed_attempts > 0 || user.locked_until) {
            await prisma.user.update({
                where: { id: user.id },
                data: { failed_attempts: 0, locked_until: null }
            });
        }

        // Role enforcement for admin
        const adminEmail = process.env.ADMIN_EMAIL || 'founder@codearena.gpcet.ac.in';
        let role = user.role;

        if (user.email === adminEmail && role !== Role.ADMIN) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: { role: Role.ADMIN, must_change_password: false }
            });
            role = Role.ADMIN;
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, roll_number: user.roll_number, role: user.role, must_change_password: user.must_change_password },
            process.env.JWT_SECRET || 'your_jwt_secret_here',
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                roll_number: user.roll_number,
                role: user.role,
                must_change_password: user.must_change_password
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const register = async (req: Request, res: Response) => {
    try {
        const { name, roll_number, email } = req.body;

        if (!name || (!roll_number && !email)) {
            return res.status(400).json({ error: 'Name and either Roll Number or Email are required' });
        }

        if (roll_number) {
            const isRollNumber = /^2\dATA[0-9A-Z]{5}$/i.test(roll_number);
            if (!isRollNumber) {
                return res.status(400).json({ error: 'Invalid Roll Number format. Example: 24ata0512a or 24ATA0512A' });
            }
            const existingUser = await prisma.user.findUnique({ where: { roll_number: roll_number.toUpperCase() } });
            if (existingUser) return res.status(400).json({ error: 'Roll number already exists' });
        }

        if (email) {
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) return res.status(400).json({ error: 'Email already exists' });
        }

        // Set default password
        const hashedPassword = await bcrypt.hash('Gpcet@codeATA', 10);

        const adminEmail = process.env.ADMIN_EMAIL || 'founder@codearena.gpcet.ac.in';
        const determineRole = (email && email === adminEmail) ? Role.ADMIN : Role.STUDENT;

        const user = await prisma.user.create({
            data: {
                name,
                email: email || null,
                roll_number: roll_number ? roll_number.toUpperCase() : null,
                password_hash: hashedPassword,
                role: determineRole,
                must_change_password: determineRole !== Role.ADMIN // admin skips forced reset internally
            }
        });

        res.status(201).json({ message: 'User registered successfully. Use the default password to log in.' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { newPassword } = req.body;
        const userId = (req as any).user.id;

        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
        }

        // Strong password regex: 1 lower, 1 upper, 1 digit, 1 special character
        const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!strongRegex.test(newPassword)) {
            return res.status(400).json({ error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                password_hash: hashedPassword,
                must_change_password: false
            }
        });

        const token = jwt.sign(
            { id: updatedUser.id, email: updatedUser.email, roll_number: updatedUser.roll_number, role: updatedUser.role, must_change_password: updatedUser.must_change_password },
            process.env.JWT_SECRET || 'your_jwt_secret_here',
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Password updated successfully',
            token,
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                roll_number: updatedUser.roll_number,
                role: updatedUser.role,
                must_change_password: updatedUser.must_change_password
            }
        });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
