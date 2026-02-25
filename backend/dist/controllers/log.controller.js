"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logSuspiciousActivity = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const logSuspiciousActivity = async (req, res) => {
    try {
        const { reason } = req.body;
        const userId = req.user.id;
        if (!reason) {
            return res.status(400).json({ error: 'Reason is required' });
        }
        const log = await prisma_1.default.suspiciousLog.create({
            data: {
                user_id: userId,
                reason
            }
        });
        res.status(201).json(log);
    }
    catch (error) {
        console.error('Error logging activity:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.logSuspiciousActivity = logSuspiciousActivity;
