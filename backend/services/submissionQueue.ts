/**
 * Async Submission Queue
 * 
 * Uses Bull (Redis-backed) for reliable async processing of code submissions.
 * Processing flow:
 * 1. Submission received → saved as PENDING → added to queue
 * 2. Queue worker picks up job → executes code in Docker
 * 3. Results compared with test cases → verdict determined
 * 4. Submission record updated → WebSocket notification sent
 * 5. If contest submission → leaderboard recalculated
 */

import Bull from 'bull';
import prisma from '../prisma';
import { executeCode, compareOutputs } from '../dockerRunner/execute';
import { executeSQLProblem } from '../dockerRunner/sqlExecutor';
import { getLanguageConfig } from '../dockerRunner/languageConfig';
import { SubmissionStatus } from '@prisma/client';
import { broadcastLeaderboardUpdate, broadcastSubmissionUpdate } from './websocket';

// Initialize Bull queue with Redis
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const submissionQueue = new Bull('submission-processing', REDIS_URL, {
    redis: {
        maxRetriesPerRequest: 1,
        enableReadyCheck: false,
        connectTimeout: 5000,
    },
    defaultJobOptions: {
        attempts: 2,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: 100,   // Keep last 100 completed jobs
        removeOnFail: 50,        // Keep last 50 failed jobs
        timeout: 60000,          // 60 second timeout per job
    },
    limiter: {
        max: 5,                  // Max 5 concurrent jobs
        duration: 1000,
    },
});

export interface SubmissionJob {
    submissionId: string;
    userId: string;
    problemId: string;
    contestId?: string;
    code: string;
    language: string;
}

/**
 * Core processing logic for a submission
 * Extracted to allow direct execution in development/no-redis environments
 */
export const processSubmission = async (data: SubmissionJob, jobProgress?: (progress: number) => void) => {
    const { submissionId, userId, problemId, contestId, code, language } = data;

    console.log(`\n[Processor] >>> Starting processing for submission ${submissionId} (${language})`);

    try {
        // Fetch problem with test cases
        const problem = await prisma.problem.findUnique({
            where: { id: problemId },
            include: { testCases: true }
        });

        if (!problem) {
            await updateSubmissionStatus(submissionId, SubmissionStatus.ERROR, 'Problem not found', 0);
            return;
        }

        const langConfig = getLanguageConfig(language);
        if (!langConfig) {
            await updateSubmissionStatus(submissionId, SubmissionStatus.ERROR, `Unsupported language: ${language}`, 0);
            return;
        }

        // Check if language is allowed for this problem
        if (problem.allowed_languages.length > 0 && !problem.allowed_languages.includes(language)) {
            await updateSubmissionStatus(submissionId, SubmissionStatus.ERROR, `Language ${language} is not allowed for this problem`, 0);
            return;
        }

        const testCases = problem.testCases;
        let finalStatus: SubmissionStatus = SubmissionStatus.PASS;
        let maxExecutionTime = 0;
        let maxMemoryUsed = 0;
        let errorMsg = '';
        let passedCount = 0;

        // ── Handle SQL Problems ──
        if (problem.problem_type === 'SQL') {
            for (const testcase of testCases) {
                if (!testcase.expected_result_json) continue;

                const sqlResult = await executeSQLProblem(
                    code,
                    problem.sql_schema || '',
                    testcase.input,  // For SQL, input = seed data / test-specific data
                    testcase.expected_result_json,
                    problem.time_limit
                );

                maxExecutionTime = Math.max(maxExecutionTime, sqlResult.executionTime);

                if (sqlResult.verdict === 'TLE') {
                    finalStatus = SubmissionStatus.TLE;
                    errorMsg = 'Time Limit Exceeded';
                    break;
                } else if (sqlResult.verdict === 'SECURITY_ERROR') {
                    finalStatus = SubmissionStatus.ERROR;
                    errorMsg = sqlResult.error || 'Security violation';
                    break;
                } else if (sqlResult.verdict === 'RUNTIME_ERROR' || sqlResult.verdict === 'SYSTEM_ERROR') {
                    finalStatus = SubmissionStatus.RUNTIME_ERROR;
                    errorMsg = sqlResult.error || 'SQL execution error';
                    break;
                } else if (sqlResult.verdict === 'WRONG_ANSWER') {
                    finalStatus = SubmissionStatus.FAIL;
                    errorMsg = 'Wrong Answer: result set does not match expected output';
                    break;
                }

                passedCount++;
            }
        }
        // ── Handle Coding Problems ──
        else {
            for (let i = 0; i < testCases.length; i++) {
                const testcase = testCases[i];

                if (jobProgress) jobProgress(Math.round(((i + 1) / testCases.length) * 100));

                const result = await executeCode(
                    code,
                    language,
                    testcase.input,
                    problem.time_limit,
                    problem.memory_limit
                );

                maxExecutionTime = Math.max(maxExecutionTime, result.executionTime);
                if (result.memoryUsed) {
                    maxMemoryUsed = Math.max(maxMemoryUsed, result.memoryUsed);
                }

                // Check verdict
                if (result.verdict === 'TLE') {
                    finalStatus = SubmissionStatus.TLE;
                    errorMsg = `Time Limit Exceeded on test case ${i + 1}`;
                    break;
                } else if (result.verdict === 'MLE') {
                    finalStatus = SubmissionStatus.MLE;
                    errorMsg = `Memory Limit Exceeded on test case ${i + 1}`;
                    break;
                } else if (result.verdict === 'COMPILE_ERROR') {
                    finalStatus = SubmissionStatus.COMPILATION_ERROR;
                    errorMsg = result.error || 'Compilation Error';
                    break;
                } else if (result.verdict === 'RUNTIME_ERROR') {
                    finalStatus = SubmissionStatus.RUNTIME_ERROR;
                    errorMsg = result.error || `Runtime Error on test case ${i + 1}`;
                    break;
                } else if (result.verdict === 'SECURITY_ERROR') {
                    finalStatus = SubmissionStatus.ERROR;
                    errorMsg = result.error || 'Security violation detected';
                    break;
                } else if (result.verdict === 'SYSTEM_ERROR') {
                    finalStatus = SubmissionStatus.ERROR;
                    errorMsg = result.error || 'System error during execution';
                    break;
                }

                // Compare output
                if (!compareOutputs(result.output, testcase.expected_output)) {
                    finalStatus = SubmissionStatus.FAIL;
                    errorMsg = testcase.is_hidden
                        ? `Wrong Answer on hidden test case ${i + 1}`
                        : `Wrong Answer on test case ${i + 1}`;
                    break;
                }

                passedCount++;
            }
        }

        // Update submission
        await updateSubmissionStatus(
            submissionId,
            finalStatus,
            errorMsg,
            maxExecutionTime / 1000,
            maxMemoryUsed
        );

        // If it's Accepted, handle points and streaks
        if (finalStatus === SubmissionStatus.PASS) {
            await handlePointsAndStreaks(userId, problemId, submissionId);

            // If this is a contest submission, update contest leaderboard
            if (contestId) {
                await updateContestLeaderboard(userId, contestId, problemId, submissionId);
            }
        }

        console.log(`[Processor] Submission ${submissionId} completed: ${finalStatus}`);

    } catch (error: any) {
        console.error(`[Processor] Error processing submission ${submissionId}:`, error);
        await updateSubmissionStatus(submissionId, SubmissionStatus.ERROR, 'Internal system error', 0);
    }
};

/**
 * Process submission jobs using the queue
 */
submissionQueue.process(3, async (job) => {
    return await processSubmission(job.data as SubmissionJob, (progress) => job.progress(progress));
});

/**
 * Update submission status in database
 */
async function updateSubmissionStatus(
    submissionId: string,
    status: SubmissionStatus,
    verdict: string,
    executionTime: number,
    memoryUsed?: number
): Promise<void> {
    await prisma.submission.update({
        where: { id: submissionId },
        data: {
            status,
            verdict: verdict || null,
            execution_time: executionTime,
            memory_used: memoryUsed || null,
        }
    });

    // Notify frontend via WebSocket
    broadcastSubmissionUpdate(submissionId, status, verdict);
}

/**
 * Update contest leaderboard on Accepted submission
 * Ranking: Most problems solved first, then least penalty time
 * Penalty = submission_time (in minutes from contest start) + (wrong_attempts × 20)
 */
async function updateContestLeaderboard(
    userId: string,
    contestId: string,
    problemId: string,
    submissionId: string
): Promise<void> {
    try {
        const contest = await prisma.contest.findUnique({
            where: { id: contestId }
        });

        if (!contest) return;

        // Count wrong attempts for this problem before this accepted submission
        const wrongAttempts = await prisma.submission.count({
            where: {
                user_id: userId,
                problem_id: problemId,
                contest_id: contestId,
                status: { not: SubmissionStatus.PASS },
                id: { not: submissionId },
            }
        });

        // Calculate time penalty (minutes from contest start)
        const submission = await prisma.submission.findUnique({ where: { id: submissionId } });
        const timePenalty = submission
            ? Math.floor((submission.created_at.getTime() - contest.start_time.getTime()) / 60000)
            : 0;

        const penaltyForThisProblem = timePenalty + (wrongAttempts * 20);

        // Count total unique problems solved in this contest
        const solvedProblems = await prisma.submission.findMany({
            where: {
                user_id: userId,
                contest_id: contestId,
                status: SubmissionStatus.PASS,
            },
            distinct: ['problem_id'],
            select: { problem_id: true }
        });

        // Calculate total penalty across all solved problems
        let totalPenalty = 0;
        for (const solved of solvedProblems) {
            // Get the first accepted submission for each problem
            const firstAccepted = await prisma.submission.findFirst({
                where: {
                    user_id: userId,
                    contest_id: contestId,
                    problem_id: solved.problem_id,
                    status: SubmissionStatus.PASS,
                },
                orderBy: { created_at: 'asc' }
            });

            if (!firstAccepted) continue;

            const wrongBefore = await prisma.submission.count({
                where: {
                    user_id: userId,
                    problem_id: solved.problem_id,
                    contest_id: contestId,
                    status: { not: SubmissionStatus.PASS },
                    created_at: { lt: firstAccepted.created_at }
                }
            });

            const solveTime = Math.floor(
                (firstAccepted.created_at.getTime() - contest.start_time.getTime()) / 60000
            );

            totalPenalty += solveTime + (wrongBefore * 20);
        }

        // Upsert participation record
        await prisma.participation.upsert({
            where: {
                user_id_contest_id: {
                    user_id: userId,
                    contest_id: contestId
                }
            },
            update: {
                solved_count: solvedProblems.length,
                penalty_time: totalPenalty,
                score: solvedProblems.length * 100, // 100 points per problem
            },
            create: {
                user_id: userId,
                contest_id: contestId,
                solved_count: solvedProblems.length,
                penalty_time: totalPenalty,
                score: solvedProblems.length * 100,
            }
        });

        // Broadcast leaderboard update via WebSocket
        broadcastLeaderboardUpdate(contestId);

    } catch (error) {
        console.error('[Leaderboard] Error updating leaderboard:', error);
    }
}

// Queue event handlers
submissionQueue.on('failed', (job, err) => {
    console.error(`[Queue] Job ${job.id} failed:`, err.message);
});

submissionQueue.on('completed', (job) => {
    console.log(`[Queue] Job ${job.id} completed successfully`);
});

submissionQueue.on('stalled', (job) => {
    console.warn(`[Queue] Job ${job.id} stalled`);
});

/**
 * Handle honor points and streaks upon successful submission
 */
async function handlePointsAndStreaks(userId: string, problemId: string, submissionId: string) {
    try {
        // 1. Check if user already solved this problem before
        const previousSuccess = await prisma.submission.findFirst({
            where: {
                user_id: userId,
                problem_id: problemId,
                status: SubmissionStatus.PASS,
                id: { not: submissionId }
            }
        });

        const isFirstSolve = !previousSuccess;

        // 2. Fetch User and Problem details
        const [user, problem] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId } }),
            prisma.problem.findUnique({ where: { id: problemId } })
        ]);

        if (!user || !problem) return;

        // 3. Update Streak
        let newStreak = user.streak || 0;
        const now = new Date();
        const lastLogin = user.last_login ? new Date(user.last_login) : null;

        if (!lastLogin) {
            newStreak = 1;
        } else {
            const diffInDays = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 3600 * 24));
            if (diffInDays === 1) {
                newStreak += 1;
            } else if (diffInDays > 1) {
                newStreak = 1;
            }
        }

        // 4. Calculate Points (only if first time solving)
        if (isFirstSolve) {
            let basePoints = 10;
            if (problem.difficulty === 'Medium') basePoints = 20;
            if (problem.difficulty === 'Hard') basePoints = 50;

            const streakBonus = Math.floor(basePoints * Math.min(newStreak * 0.1, 1.0));
            const totalPoints = basePoints + streakBonus;

            // 5. Atomic Update: User Points + Streak
            await prisma.user.update({
                where: { id: userId },
                data: {
                    points: { increment: totalPoints },
                    streak: newStreak,
                    last_login: now // Use this to track daily activity
                }
            });

            // 6. Record Activity
            await prisma.pointActivity.create({
                data: {
                    user_id: userId,
                    amount: totalPoints,
                    reason: `Solved ${isFirstSolve ? 'new' : 'existing'} problem: ${problem.title}${streakBonus > 0 ? ` (+${streakBonus} streak bonus)` : ''}`,
                    type: 'ADD'
                }
            });

            console.log(`[Gamification] Awarded ${totalPoints} points to user ${userId} (Streak: ${newStreak})`);
        } else {
            // Just update streak/last_login if already solved
            await prisma.user.update({
                where: { id: userId },
                data: {
                    streak: newStreak,
                    last_login: now
                }
            });
        }
    } catch (error) {
        console.error('[Gamification] Error handling points/streaks:', error);
    }
}

export default submissionQueue;
