import { exec } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import util from 'util';

const execPromise = util.promisify(exec);

const DOCKER_IMAGE = 'gpcet-runner';

// Setup: docker build -t gpcet-runner .
export const setupDockerImage = async () => {
    try {
        const { stdout } = await execPromise(`docker images -q ${DOCKER_IMAGE}`);
        if (!stdout.trim()) {
            console.log('Building Docker image for code execution...');
            await execPromise(`docker build -t ${DOCKER_IMAGE} ${path.join(__dirname)}`);
            console.log('Docker image built successfully.');
        }
    } catch (error) {
        console.error('Failed to setup Docker image:', error);
    }
};

interface ExecutionResult {
    output: string;
    error?: string;
    executionTime: number;
}

export const executeCode = async (code: string, language: string, input: string): Promise<ExecutionResult> => {
    const jobId = uuidv4();
    const jobFolder = path.join(__dirname, 'jobs', jobId);

    if (!fs.existsSync(jobFolder)) {
        fs.mkdirSync(jobFolder, { recursive: true });
    }

    let fileName = '';
    let runCommand = '';

    if (language === 'python') {
        fileName = 'main.py';
        runCommand = `python3 ${fileName}`;
    } else if (language === 'javascript') {
        fileName = 'main.js';
        runCommand = `node ${fileName}`;
    } else if (language === 'cpp') {
        fileName = 'main.cpp';
        runCommand = `g++ ${fileName} -o main && ./main`;
    } else {
        throw new Error('Unsupported language');
    }

    const filePath = path.join(jobFolder, fileName);
    const inputPath = path.join(jobFolder, 'input.txt');

    fs.writeFileSync(filePath, code);
    fs.writeFileSync(inputPath, input);

    // 2s time limit, 256m memory, no network
    const dockerCmd = `docker run --rm -v "${jobFolder}":/app -w /app --network none --memory 256m --cpus 1.0 ${DOCKER_IMAGE} sh -c "timeout 2s ${runCommand} < input.txt"`;

    const startTime = Date.now();
    let resultOutput = '';
    let resultError = '';

    try {
        const { stdout, stderr } = await execPromise(dockerCmd);
        resultOutput = stdout;
        if (stderr) resultError = stderr;
    } catch (err: any) {
        resultError = err.stderr || err.message;
        if (err.code === 124 || resultError.includes('timeout')) {
            resultError = 'Time Limit Exceeded';
        }
    }

    const executionTime = Date.now() - startTime;

    // Cleanup
    fs.rmSync(jobFolder, { recursive: true, force: true });

    return {
        output: resultOutput.trim(),
        error: resultError ? resultError.trim() : undefined,
        executionTime
    };
};
