"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.resetPassword = exports.register = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../prisma"));
const client_1 = require("@prisma/client");
const login = async (req, res) => {
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
            if (!password)
                return res.status(400).json({ error: 'Password is required for admin login' });
            user = await prisma_1.default.user.findUnique({ where: { email: identifier.toLowerCase() } });
            if (!user)
                return res.status(401).json({ error: 'Invalid credentials' });
            if (user.locked_until && user.locked_until > new Date()) {
                return res.status(403).json({ error: 'Account temporarily locked. Please try again later.' });
            }
            const isMatch = await bcryptjs_1.default.compare(password, user.password_hash);
            if (!isMatch) {
                const newAttempts = user.failed_attempts + 1;
                let lockedUntil = null;
                if (newAttempts >= 5)
                    lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
                await prisma_1.default.user.update({
                    where: { id: user.id },
                    data: { failed_attempts: newAttempts, locked_until: lockedUntil }
                });
                return res.status(lockedUntil ? 403 : 401).json({ error: lockedUntil ? 'Account locked due to too many failed attempts' : 'Invalid credentials' });
            }
            if (user.failed_attempts > 0 || user.locked_until) {
                await prisma_1.default.user.update({
                    where: { id: user.id },
                    data: { failed_attempts: 0, locked_until: null }
                });
            }
        }
        // --- STUDENT LOGIN FLOW (PASSWORDLESS + AUTO-CREATE) ---
        else if (isStudentRoll) {
            const rollNumber = identifier.toUpperCase();
            user = await prisma_1.default.user.findUnique({ where: { roll_number: rollNumber } });
            if (!user) {
                const defaultHash = await bcryptjs_1.default.hash('AutoRegister@123', 10);
                user = await prisma_1.default.user.create({
                    data: {
                        name: 'Coder',
                        roll_number: rollNumber,
                        password_hash: defaultHash,
                        role: client_1.Role.STUDENT,
                        must_change_password: false,
                        // @ts-ignore
                        is_profile_complete: false
                    }
                });
            }
        }
        if (!user) {
            return res.status(401).json({ error: 'Authentication failed' });
        }
        // Password is correct, reset failed attempts
        if (user.failed_attempts > 0 || user.locked_until) {
            await prisma_1.default.user.update({
                where: { id: user.id },
                data: { failed_attempts: 0, locked_until: null }
            });
        }
        // Role enforcement for admin
        const adminEmail = process.env.ADMIN_EMAIL || 'founder@codearena.gpcet.ac.in';
        let role = user.role;
        if (user.email === adminEmail && role !== client_1.Role.ADMIN) {
            user = await prisma_1.default.user.update({
                where: { id: user.id },
                data: { role: client_1.Role.ADMIN, must_change_password: false }
            });
            role = client_1.Role.ADMIN;
        }
        // Logic for Daily Points and Streak
        const now = new Date();
        // @ts-ignore
        const lastLogin = user.last_login ? new Date(user.last_login) : null;
        let pointsToAdd = 0;
        let newPoints = user.points || 0;
        let newStreak = user.streak || 0;
        if (!lastLogin || lastLogin.toDateString() !== now.toDateString()) {
            pointsToAdd = 1;
            newPoints += pointsToAdd;
            // Streak logic
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            if (lastLogin && lastLogin.toDateString() === yesterday.toDateString()) {
                newStreak += 1;
            }
            else {
                newStreak = 1;
            }
            // Update user and record point activity
            user = await prisma_1.default.user.update({
                where: { id: user.id },
                data: {
                    points: newPoints,
                    streak: newStreak,
                    last_login: now,
                    // @ts-ignore
                    pointActivities: {
                        create: {
                            amount: pointsToAdd,
                            reason: 'Daily Login Bonus'
                        }
                    }
                }
            });
        }
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            email: user.email,
            roll_number: user.roll_number,
            role: user.role,
            must_change_password: user.must_change_password,
            // @ts-ignore
            is_profile_complete: user.is_profile_complete,
            // @ts-ignore
            points: user.points,
            // @ts-ignore
            streak: user.streak
        }, process.env.JWT_SECRET || 'your_jwt_secret_here', { expiresIn: '1d' });
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                roll_number: user.roll_number,
                role: user.role,
                must_change_password: user.must_change_password,
                // @ts-ignore
                is_profile_complete: user.is_profile_complete,
                // @ts-ignore
                points: user.points,
                // @ts-ignore
                streak: user.streak
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.login = login;
const register = async (req, res) => {
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
            const existingUser = await prisma_1.default.user.findUnique({ where: { roll_number: roll_number.toUpperCase() } });
            if (existingUser)
                return res.status(400).json({ error: 'Roll number already exists' });
        }
        if (email) {
            const existingUser = await prisma_1.default.user.findUnique({ where: { email } });
            if (existingUser)
                return res.status(400).json({ error: 'Email already exists' });
        }
        // Set default password
        const hashedPassword = await bcryptjs_1.default.hash('Gpcet@codeATA', 10);
        const adminEmail = process.env.ADMIN_EMAIL || 'founder@codearena.gpcet.ac.in';
        const determineRole = (email && email === adminEmail) ? client_1.Role.ADMIN : client_1.Role.STUDENT;
        const user = await prisma_1.default.user.create({
            data: {
                name,
                email: email ? email.toLowerCase() : null,
                roll_number: roll_number ? roll_number.toUpperCase() : null,
                password_hash: hashedPassword,
                role: determineRole,
                must_change_password: determineRole !== client_1.Role.ADMIN // admin skips forced reset internally
            }
        });
        res.status(201).json({ message: 'User registered successfully. Use the default password to log in.' });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.register = register;
const resetPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const userId = req.user.id;
        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
        }
        // Strong password regex: 1 lower, 1 upper, 1 digit, 1 special character
        const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!strongRegex.test(newPassword)) {
            return res.status(400).json({ error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        const updatedUser = await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                password_hash: hashedPassword,
                must_change_password: false
            }
        });
        const token = jsonwebtoken_1.default.sign({ id: updatedUser.id, email: updatedUser.email, roll_number: updatedUser.roll_number, role: updatedUser.role, must_change_password: updatedUser.must_change_password }, process.env.JWT_SECRET || 'your_jwt_secret_here', { expiresIn: '1d' });
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
    }
    catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.resetPassword = resetPassword;
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, username, bio, portfolio_url, avatar_url, year, semester, branch, section } = req.body;
        const updatedUser = await prisma_1.default.user.update({
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
        const token = jsonwebtoken_1.default.sign({
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
        }, process.env.JWT_SECRET || 'your_jwt_secret_here', { expiresIn: '1d' });
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
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Username already taken' });
        }
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.updateProfile = updateProfile;
