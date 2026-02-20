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
exports.executeCode = exports.setupDockerImage = void 0;
const child_process_1 = require("child_process");
const uuid_1 = require("uuid");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const util_1 = __importDefault(require("util"));
const execPromise = util_1.default.promisify(child_process_1.exec);
const DOCKER_IMAGE = 'gpcet-runner';
// Setup: docker build -t gpcet-runner .
const setupDockerImage = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { stdout } = yield execPromise(`docker images -q ${DOCKER_IMAGE}`);
        if (!stdout.trim()) {
            console.log('Building Docker image for code execution...');
            yield execPromise(`docker build -t ${DOCKER_IMAGE} ${path_1.default.join(__dirname)}`);
            console.log('Docker image built successfully.');
        }
    }
    catch (error) {
        console.error('Failed to setup Docker image:', error);
    }
});
exports.setupDockerImage = setupDockerImage;
const executeCode = (code, language, input) => __awaiter(void 0, void 0, void 0, function* () {
    const jobId = (0, uuid_1.v4)();
    const jobFolder = path_1.default.join(__dirname, 'jobs', jobId);
    if (!fs_1.default.existsSync(jobFolder)) {
        fs_1.default.mkdirSync(jobFolder, { recursive: true });
    }
    let fileName = '';
    let runCommand = '';
    if (language === 'python') {
        fileName = 'main.py';
        runCommand = `python3 ${fileName}`;
    }
    else if (language === 'javascript') {
        fileName = 'main.js';
        runCommand = `node ${fileName}`;
    }
    else if (language === 'cpp') {
        fileName = 'main.cpp';
        runCommand = `g++ ${fileName} -o main && ./main`;
    }
    else {
        throw new Error('Unsupported language');
    }
    const filePath = path_1.default.join(jobFolder, fileName);
    const inputPath = path_1.default.join(jobFolder, 'input.txt');
    fs_1.default.writeFileSync(filePath, code);
    fs_1.default.writeFileSync(inputPath, input);
    // 2s time limit, 256m memory, no network
    const dockerCmd = `docker run --rm -v "${jobFolder}":/app -w /app --network none --memory 256m --cpus 1.0 ${DOCKER_IMAGE} sh -c "timeout 2s ${runCommand} < input.txt"`;
    const startTime = Date.now();
    let resultOutput = '';
    let resultError = '';
    try {
        const { stdout, stderr } = yield execPromise(dockerCmd);
        resultOutput = stdout;
        if (stderr)
            resultError = stderr;
    }
    catch (err) {
        resultError = err.stderr || err.message;
        if (err.code === 124 || resultError.includes('timeout')) {
            resultError = 'Time Limit Exceeded';
        }
    }
    const executionTime = Date.now() - startTime;
    // Cleanup
    fs_1.default.rmSync(jobFolder, { recursive: true, force: true });
    return {
        output: resultOutput.trim(),
        error: resultError ? resultError.trim() : undefined,
        executionTime
    };
});
exports.executeCode = executeCode;
