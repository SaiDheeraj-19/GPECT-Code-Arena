"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logSuspiciousActivity = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const logSuspiciousActivity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { reason } = req.body;
        const userId = req.user.id;
        if (!reason) {
            return res.status(400).json({ error: 'Reason is required' });
        }
        const log = yield prisma_1.default.suspiciousLog.create({
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
});
exports.logSuspiciousActivity = logSuspiciousActivity;
