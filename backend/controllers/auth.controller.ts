import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { Role } from '@prisma/client';

export const login = async (req: Request, res: Response) => {
    try {
        const { identifier, password } = req.body; // identifier can be email or roll_number

        if (!identifier) {
            return res.status(400).json({ error: 'Identifier is required' });
        }

        const isEmail = identifier.includes('@');
        const rollNumberPattern = /^\d{2}[a-zA-Z]{3}\d{5}$/i;
        const isStudentRoll = rollNumberPattern.test(identifier);

        if (!isEmail && !isStudentRoll) {
            return res.status(400).json({ error: 'Invalid login format. Use a student roll number (e.g., 24ATA05269) or admin email.' });
        }

        let user;

        // --- ADMIN LOGIN FLOW (REQUIRES EMAIL + PASSWORD) ---
        if (isEmail) {
            if (!password) return res.status(400).json({ error: 'Password is required for admin login' });

            user = await prisma.user.findUnique({ where: { email: identifier.toLowerCase() } });
            if (!user) return res.status(401).json({ error: 'Invalid credentials' });

            if (user.locked_until && user.locked_until > new Date()) {
                return res.status(403).json({ error: 'Account temporarily locked. Please try again later.' });
            }

            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                const newAttempts = user.failed_attempts + 1;
                let lockedUntil = null;
                if (newAttempts >= 5) lockedUntil = new Date(Date.now() + 15 * 60 * 1000);

                await prisma.user.update({
                    where: { id: user.id },
                    data: { failed_attempts: newAttempts, locked_until: lockedUntil }
                });
                return res.status(lockedUntil ? 403 : 401).json({ error: lockedUntil ? 'Account locked due to too many failed attempts' : 'Invalid credentials' });
            }

            if (user.failed_attempts > 0 || user.locked_until) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { failed_attempts: 0, locked_until: null }
                });
            }
        }
        // --- STUDENT LOGIN FLOW (SECURE AUTO-CREATE) ---
        else if (isStudentRoll) {
            const rollNumber = identifier.toUpperCase();
            user = await prisma.user.findUnique({ where: { roll_number: rollNumber } });

            if (!user) {
                // First time: Create with a random temp hash and force immediate password setup
                const tempPassword = `TEMP_${Math.random().toString(36).substring(7)}`;
                const tempHash = await bcrypt.hash(tempPassword, 10);
                user = await prisma.user.create({
                    data: {
                        name: 'Coder',
                        roll_number: rollNumber,
                        password_hash: tempHash,
                        role: Role.STUDENT,
                        must_change_password: true, // Force the student to set a secure password immediately
                        // @ts-ignore
                        is_profile_complete: false
                    }
                });
            } else {
                // Existing student: We MUST verify the password to keep accounts safe
                // Compatibility layer: If they haven't set a password yet (matching the old default)
                // we allow them in one last time (even without a password) but force a password reset
                const isMatch = await bcrypt.compare(password || '', user.password_hash);
                const isOldDefaultMatch = await bcrypt.compare('AutoRegister@123', user.password_hash);

                if (!isMatch && !isOldDefaultMatch) {
                    return res.status(401).json({ error: 'Incorrect password for this student account.' });
                }

                // If they are using the old default, force them to upgrade security
                if (isOldDefaultMatch) {
                    user = await prisma.user.update({
                        where: { id: user.id },
                        data: { must_change_password: true }
                    });
                }
            }
        }

        if (!user) {
            return res.status(401).json({ error: 'Authentication failed' });
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

        // Handle daily bonus and streak
        user = await handleDailyBonus(user);

        // Generate token with COMPLETE profile info
        const tokenData = getUserTokenData(user);
        const token = jwt.sign(tokenData, process.env.JWT_SECRET || 'your_jwt_secret_here', { expiresIn: '1d' });

        res.json({ token, user: tokenData });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const handleDailyBonus = async (user: any) => {
    const now = new Date();
    const lastLogin = user.last_login ? new Date(user.last_login) : null;
    let pointsToAdd = 0;
    let newPoints = user.points || 0;
    let newStreak = user.streak || 0;

    if (!lastLogin || lastLogin.toDateString() !== now.toDateString()) {
        pointsToAdd = 1;
        newPoints += pointsToAdd;

        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastLogin && lastLogin.toDateString() === yesterday.toDateString()) {
            newStreak += 1;
        } else {
            newStreak = 1;
        }

        return await prisma.user.update({
            where: { id: user.id },
            data: {
                points: newPoints,
                streak: newStreak,
                last_login: now,
                pointActivities: {
                    create: {
                        amount: pointsToAdd,
                        reason: 'Daily Login Bonus'
                    }
                }
            }
        });
    }
    return user;
};

const getUserTokenData = (user: any) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    roll_number: user.roll_number,
    username: user.username,
    bio: user.bio,
    portfolio_url: user.portfolio_url,
    avatar_url: user.avatar_url,
    role: user.role,
    must_change_password: user.must_change_password,
    is_profile_complete: user.is_profile_complete,
    points: user.points,
    streak: user.streak,
    year: user.year,
    semester: user.semester,
    branch: user.branch,
    section: user.section
});

export const getMe = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        let user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) return res.status(404).json({ error: 'User not found' });

        // Check/Award daily bonus whenever they "check in" (initialize frontend)
        user = await handleDailyBonus(user);

        const tokenData = getUserTokenData(user);
        const token = jwt.sign(tokenData, process.env.JWT_SECRET || 'your_jwt_secret_here', { expiresIn: '1d' });

        res.json({ token, user: tokenData });
    } catch (error) {
        console.error('getMe error:', error);
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
            const isRollNumber = /^[a-zA-Z0-9_-]{5,15}$/i.test(roll_number);
            if (!isRollNumber) {
                return res.status(400).json({ error: 'Invalid Roll Number format.' });
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
                email: email ? email.toLowerCase() : null,
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

        const tokenData = {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            roll_number: updatedUser.roll_number,
            username: updatedUser.username,
            bio: updatedUser.bio,
            portfolio_url: updatedUser.portfolio_url,
            avatar_url: updatedUser.avatar_url,
            role: updatedUser.role,
            must_change_password: updatedUser.must_change_password,
            // @ts-ignore
            is_profile_complete: updatedUser.is_profile_complete,
            // @ts-ignore
            points: updatedUser.points,
            // @ts-ignore
            streak: updatedUser.streak,
            // @ts-ignore
            year: updatedUser.year,
            // @ts-ignore
            semester: updatedUser.semester,
            // @ts-ignore
            branch: updatedUser.branch,
            // @ts-ignore
            section: updatedUser.section
        };

        const token = jwt.sign(
            tokenData,
            process.env.JWT_SECRET || 'your_jwt_secret_here',
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Password updated successfully',
            token,
            user: tokenData
        });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { name, username, bio, portfolio_url, avatar_url, year, semester, branch, section } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name: name || undefined,
                username: username || null,
                bio: bio || null,
                portfolio_url: portfolio_url || null,
                avatar_url: avatar_url || null,
                year: year ? parseInt(year) : undefined,
                semester: semester ? parseInt(semester) : undefined,
                branch: branch || undefined,
                section: section || undefined,
                // Automatically mark complete if these fields are provided
                is_profile_complete: !!(year && semester && branch && section) ? true : undefined
            }
        });

        const token = jwt.sign(
            {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                roll_number: updatedUser.roll_number,
                username: updatedUser.username,
                bio: updatedUser.bio,
                portfolio_url: updatedUser.portfolio_url,
                avatar_url: updatedUser.avatar_url,
                role: updatedUser.role,
                must_change_password: updatedUser.must_change_password,
                // @ts-ignore
                is_profile_complete: updatedUser.is_profile_complete
            },
            process.env.JWT_SECRET || 'your_jwt_secret_here',
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Profile updated successfully',
            token,
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                roll_number: updatedUser.roll_number,
                username: updatedUser.username,
                bio: updatedUser.bio,
                portfolio_url: updatedUser.portfolio_url,
                avatar_url: updatedUser.avatar_url,
                role: updatedUser.role,
                must_change_password: updatedUser.must_change_password,
                // @ts-ignore
                is_profile_complete: updatedUser.is_profile_complete,
                // @ts-ignore
                year: updatedUser.year,
                // @ts-ignore
                semester: updatedUser.semester,
                // @ts-ignore
                branch: updatedUser.branch,
                // @ts-ignore
                section: updatedUser.section
            }
        });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Username already taken' });
        }
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
