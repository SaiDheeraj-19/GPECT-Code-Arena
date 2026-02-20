"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const problem_controller_1 = require("../controllers/problem.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken); // Both student and admin can access
router.get('/', problem_controller_1.getProblems);
router.get('/:id', problem_controller_1.getProblem);
exports.default = router;
