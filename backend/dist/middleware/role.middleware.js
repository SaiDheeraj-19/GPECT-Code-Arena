"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireStudent = exports.requireAdmin = void 0;
const client_1 = require("@prisma/client");
const requireAdmin = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== client_1.Role.ADMIN) {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
};
exports.requireAdmin = requireAdmin;
const requireStudent = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== client_1.Role.STUDENT) {
        return res.status(403).json({ error: 'Forbidden: Student access required' });
    }
    next();
};
exports.requireStudent = requireStudent;
