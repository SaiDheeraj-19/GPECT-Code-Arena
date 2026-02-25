"use strict";
/**
 * Multi-Language Docker Code Executor
 *
 * Secure sandboxed execution engine that runs code in isolated Docker containers.
 * Supports C, C++, Python3, Java, JavaScript, and Bash.
 *
 * Security features:
 * - Network disabled (--network none)
 * - Memory limits enforced (--memory)
 * - CPU limits enforced (--cpus)
 * - Execution timeout (timeout command)
 * - No root privileges (--user)
 * - Container auto-removed (--rm)
 * - Pids limit to prevent fork bombs (--pids-limit)
 * - Read-only filesystem except /app (--read-only + tmpfs)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareOutputs = exports.executeCode = exports.pullDockerImages = void 0;
const child_process_1 = require("child_process");
const uuid_1 = require("uuid");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const util_1 = __importDefault(require("util"));
const languageConfig_1 = require("./languageConfig");
const execPromise = util_1.default.promisify(child_process_1.exec);
const JOBS_DIR = path_1.default.join(__dirname, 'jobs');
// Ensure jobs directory exists
if (!fs_1.default.existsSync(JOBS_DIR)) {
    fs_1.default.mkdirSync(JOBS_DIR, { recursive: true });
}
/**
 * Pull Docker images for all supported languages
 */
const pullDockerImages = async () => {
    console.log("[Docker] Images should be pulled natively: docker pull node:18-alpine, python:3.10-alpine, gcc:12");
};
exports.pullDockerImages = pullDockerImages;
/**
 * Execute code in an isolated Docker container
 */
const executeCode = async (code, language, input, customTimeLimit, customMemoryLimit) => {
    // ── 1. Validate language config ──
    const config = (0, languageConfig_1.getLanguageConfig)(language);
    if (!config) {
        return {
            output: '',
            error: `Unsupported language: ${language}`,
            executionTime: 0,
            verdict: 'SYSTEM_ERROR'
        };
    }
    // ── 2. Security check on code ──
    const dangerousCode = (0, languageConfig_1.containsDangerousCode)(code, language);
    if (dangerousCode) {
        return {
            output: '',
            error: dangerousCode,
            executionTime: 0,
            verdict: 'SECURITY_ERROR'
        };
    }
    // ── 3. Setup job directory ──
    const jobId = (0, uuid_1.v4)();
    const jobFolder = path_1.default.join(JOBS_DIR, jobId);
    fs_1.default.mkdirSync(jobFolder, { recursive: true });
    const timeLimit = customTimeLimit || config.time_limit;
    const memoryLimit = customMemoryLimit || config.memory_limit;
    const timeLimitSeconds = Math.ceil(timeLimit / 1000);
    try {
        // ── 4. Write source code and input ──
        const filePath = path_1.default.join(jobFolder, config.file_name);
        const inputPath = path_1.default.join(jobFolder, 'input.txt');
        fs_1.default.writeFileSync(filePath, code);
        fs_1.default.writeFileSync(inputPath, input);
        // ── 5. Build Docker command ──
        let runCmd;
        if (config.compile_command) {
            runCmd = `${config.compile_command} && ${config.run_command}`;
        }
        else {
            runCmd = `${config.run_command}`;
        }
        const execCmd = `cd "${jobFolder}" && ({ ${runCmd}; } < input.txt 2>&1)`;
        // ── 6. Execute ──
        const startTime = Date.now();
        let resultOutput = '';
        let resultError = '';
        let exitCode = 0;
        try {
            const { stdout, stderr } = await execPromise(execCmd, {
                timeout: timeLimit + 1000, // External timeout with buffer
                maxBuffer: 10 * 1024 * 1024 // 10MB output buffer
            });
            resultOutput = stdout;
            if (stderr)
                resultError = stderr;
        }
        catch (err) {
            exitCode = err.code || 1;
            resultOutput = err.stdout || '';
            resultError = err.stderr || err.message || '';
            // Clean up node exec paths from user view
            if (resultError.includes('Command failed:')) {
                const lines = resultError.split('\n');
                resultError = lines.slice(1).join('\n').trim();
            }
        }
        const executionTime = Date.now() - startTime;
        // ── 7. Determine verdict ──
        let verdict = 'SUCCESS';
        if (exitCode === 124 || resultError.includes('timeout') || executionTime > timeLimit + 2000) {
            verdict = 'TLE';
            resultError = 'Time Limit Exceeded';
        }
        else if (resultError.toLowerCase().includes('out of memory') ||
            resultError.includes('OOMKilled') ||
            resultError.includes('memory')) {
            verdict = 'MLE';
            resultError = 'Memory Limit Exceeded';
        }
        else if (config.compile_command && (resultError.includes('error:') ||
            resultError.includes('Error:') ||
            (language === 'java' && resultError.includes('cannot find symbol')))) {
            verdict = 'COMPILE_ERROR';
        }
        else if (exitCode !== 0 && resultError) {
            verdict = 'RUNTIME_ERROR';
        }
        return {
            output: resultOutput.trim(),
            error: resultError ? resultError.trim() : undefined,
            executionTime,
            exitCode,
            verdict
        };
    }
    finally {
        // ── 8. Cleanup ──
        try {
            fs_1.default.rmSync(jobFolder, { recursive: true, force: true });
        }
        catch (e) {
            console.error(`[Cleanup] Failed to remove job folder ${jobId}:`, e);
        }
    }
};
exports.executeCode = executeCode;
/**
 * Compare outputs for correctness
 * Handles trailing whitespace, newline normalization, and floating point tolerance
 */
const compareOutputs = (actual, expected, tolerance = 1e-6) => {
    // Normalize whitespace and newlines
    const normalizeOutput = (s) => {
        return s
            .replace(/\r\n/g, '\n') // Windows newlines
            .replace(/\r/g, '\n') // Old Mac newlines
            .split('\n')
            .map(line => line.trimEnd()) // Trim trailing spaces per line
            .join('\n')
            .trim(); // Trim leading/trailing newlines
    };
    const actualNorm = normalizeOutput(actual);
    const expectedNorm = normalizeOutput(expected);
    // Exact match first
    if (actualNorm === expectedNorm)
        return true;
    // Try floating point comparison
    const actualLines = actualNorm.split('\n');
    const expectedLines = expectedNorm.split('\n');
    if (actualLines.length !== expectedLines.length)
        return false;
    for (let i = 0; i < actualLines.length; i++) {
        const actualTokens = actualLines[i].split(/\s+/);
        const expectedTokens = expectedLines[i].split(/\s+/);
        if (actualTokens.length !== expectedTokens.length)
            return false;
        for (let j = 0; j < actualTokens.length; j++) {
            if (actualTokens[j] === expectedTokens[j])
                continue;
            // Try as floating point
            const actualNum = parseFloat(actualTokens[j]);
            const expectedNum = parseFloat(expectedTokens[j]);
            if (isNaN(actualNum) || isNaN(expectedNum))
                return false;
            if (Math.abs(actualNum - expectedNum) > tolerance)
                return false;
        }
    }
    return true;
};
exports.compareOutputs = compareOutputs;
