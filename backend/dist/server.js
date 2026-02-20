"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const problem_routes_1 = __importDefault(require("./routes/problem.routes"));
const submission_routes_1 = __importDefault(require("./routes/submission.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const log_routes_1 = __importDefault(require("./routes/log.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/problems', problem_routes_1.default);
app.use('/api/submissions', submission_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/logs', log_routes_1.default);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
