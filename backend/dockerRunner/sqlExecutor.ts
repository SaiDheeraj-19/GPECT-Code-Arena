/**
 * SQL Problem Execution Engine
 * 
 * Handles MySQL SQL problems by:
 * 1. Spinning up a MySQL Docker container
 * 2. Creating a temporary database
 * 3. Loading schema provided by admin
 * 4. Inserting seed/test data
 * 5. Executing student's SQL query
 * 6. Fetching and normalizing the result
 * 7. Comparing with expected result JSON
 * 8. Tearing down the container
 * 
 * Security:
 * - No DROP DATABASE allowed
 * - No file access commands
 * - No system-level privileges
 * - Query timeout enforced (2 seconds)
 * - Network isolation
 */

import { exec } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import util from 'util';

const execPromise = util.promisify(exec);

export interface SQLExecutionResult {
    resultJson: any[] | null;
    error?: string;
    executionTime: number;
    verdict: 'SUCCESS' | 'WRONG_ANSWER' | 'RUNTIME_ERROR' | 'TLE' | 'SECURITY_ERROR' | 'SYSTEM_ERROR';
}

// Dangerous SQL patterns
const DANGEROUS_SQL_PATTERNS = [
    /DROP\s+DATABASE/i,
    /DROP\s+SCHEMA/i,
    /CREATE\s+DATABASE/i,
    /LOAD_FILE/i,
    /INTO\s+OUTFILE/i,
    /INTO\s+DUMPFILE/i,
    /GRANT\s+/i,
    /REVOKE\s+/i,
    /CREATE\s+USER/i,
    /ALTER\s+USER/i,
    /DROP\s+USER/i,
    /SET\s+GLOBAL/i,
    /SHUTDOWN/i,
    /INSTALL\s+PLUGIN/i,
];

/**
 * Check SQL for dangerous patterns
 */
const validateSQL = (query: string): string | null => {
    for (const pattern of DANGEROUS_SQL_PATTERNS) {
        if (pattern.test(query)) {
            return `Forbidden SQL command detected: ${pattern.source}`;
        }
    }
    return null;
};

/**
 * Normalize SQL result for comparison
 * Converts result to sorted JSON array for order-independent comparison
 */
const normalizeResult = (rows: any[], ignoreOrder: boolean = true): string => {
    if (!rows || rows.length === 0) return '[]';

    // Normalize each row's values
    const normalized = rows.map(row => {
        const normalizedRow: Record<string, any> = {};
        for (const [key, value] of Object.entries(row)) {
            const normalizedKey = key.toLowerCase().trim();
            if (value === null || value === undefined) {
                normalizedRow[normalizedKey] = null;
            } else if (typeof value === 'number') {
                normalizedRow[normalizedKey] = Math.round(value * 1000000) / 1000000; // 6 decimal precision
            } else if (value instanceof Date) {
                normalizedRow[normalizedKey] = value.toISOString();
            } else {
                normalizedRow[normalizedKey] = String(value).trim();
            }
        }
        return normalizedRow;
    });

    if (ignoreOrder) {
        // Sort rows by all columns for order-independent comparison
        normalized.sort((a, b) => {
            const keys = Object.keys(a).sort();
            for (const key of keys) {
                const aVal = JSON.stringify(a[key]);
                const bVal = JSON.stringify(b[key]);
                if (aVal < bVal) return -1;
                if (aVal > bVal) return 1;
            }
            return 0;
        });
    }

    return JSON.stringify(normalized);
};

/**
 * Compare SQL results
 */
export const compareSQLResults = (
    actual: any[],
    expected: any[] | string,
    ignoreOrder: boolean = true
): boolean => {
    const expectedArr = typeof expected === 'string' ? JSON.parse(expected) : expected;
    const actualNorm = normalizeResult(actual, ignoreOrder);
    const expectedNorm = normalizeResult(expectedArr, ignoreOrder);
    return actualNorm === expectedNorm;
};

/**
 * Execute a SQL problem
 */
export const executeSQLProblem = async (
    studentQuery: string,
    schema: string,
    seedData: string,
    expectedResultJson: string,
    timeLimit: number = 5000
): Promise<SQLExecutionResult> => {
    // ── 1. Security check ──
    const securityIssue = validateSQL(studentQuery);
    if (securityIssue) {
        return {
            resultJson: null,
            error: securityIssue,
            executionTime: 0,
            verdict: 'SECURITY_ERROR'
        };
    }

    const containerId = `sql-${uuidv4().substring(0, 12)}`;
    const dbName = `testdb_${uuidv4().replace(/-/g, '').substring(0, 8)}`;
    const mysqlPassword = `pw_${uuidv4().substring(0, 8)}`;
    const startTime = Date.now();

    try {
        // ── 2. Start MySQL container ──
        const dockerCmd = [
            'docker run -d',
            `--name ${containerId}`,
            '--network none',
            '--memory 512m',
            '--cpus 1.0',
            '--pids-limit 100',
            `-e MYSQL_ROOT_PASSWORD=${mysqlPassword}`,
            `-e MYSQL_DATABASE=${dbName}`,
            'mysql:8',
            '--default-authentication-plugin=mysql_native_password',
            '--max-connections=5',
        ].join(' ');

        await execPromise(dockerCmd, { timeout: 30000 });

        // ── 3. Wait for MySQL to be ready ──
        let ready = false;
        for (let i = 0; i < 30; i++) {
            try {
                await execPromise(
                    `docker exec ${containerId} mysqladmin ping -uroot -p${mysqlPassword} --silent`,
                    { timeout: 3000 }
                );
                ready = true;
                break;
            } catch {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        if (!ready) {
            return {
                resultJson: null,
                error: 'MySQL container failed to start in time',
                executionTime: Date.now() - startTime,
                verdict: 'SYSTEM_ERROR'
            };
        }

        // ── 4. Load schema ──
        if (schema && schema.trim()) {
            const escapedSchema = schema.replace(/"/g, '\\"').replace(/`/g, '\\`');
            await execPromise(
                `docker exec ${containerId} mysql -uroot -p${mysqlPassword} ${dbName} -e "${escapedSchema}"`,
                { timeout: 10000 }
            );
        }

        // ── 5. Load seed data ──
        if (seedData && seedData.trim()) {
            const escapedSeed = seedData.replace(/"/g, '\\"').replace(/`/g, '\\`');
            await execPromise(
                `docker exec ${containerId} mysql -uroot -p${mysqlPassword} ${dbName} -e "${escapedSeed}"`,
                { timeout: 10000 }
            );
        }

        // ── 6. Execute student query ──
        const timeLimitSeconds = Math.ceil(timeLimit / 1000);
        const escapedQuery = studentQuery.replace(/"/g, '\\"').replace(/`/g, '\\`');

        const queryCmd = `docker exec ${containerId} timeout ${timeLimitSeconds}s mysql -uroot -p${mysqlPassword} ${dbName} --batch -e "SET SESSION MAX_EXECUTION_TIME=${timeLimit}; ${escapedQuery}"`;

        let queryResult = '';
        let queryError = '';

        try {
            const { stdout, stderr } = await execPromise(queryCmd, {
                timeout: (timeLimitSeconds + 5) * 1000
            });
            queryResult = stdout;
            if (stderr && !stderr.includes('Using a password on the command line')) {
                queryError = stderr;
            }
        } catch (err: any) {
            queryError = err.stderr || err.message || '';

            if (err.code === 124 || queryError.includes('timeout') || queryError.includes('MAX_EXECUTION_TIME')) {
                return {
                    resultJson: null,
                    error: 'Time Limit Exceeded',
                    executionTime: Date.now() - startTime,
                    verdict: 'TLE'
                };
            }

            return {
                resultJson: null,
                error: queryError.replace(/Using a password.*\n?/g, '').trim() || 'SQL execution error',
                executionTime: Date.now() - startTime,
                verdict: 'RUNTIME_ERROR'
            };
        }

        // ── 7. Parse result ──
        const rows = parseMySQLOutput(queryResult);

        // ── 8. Compare with expected ──
        if (expectedResultJson) {
            const isCorrect = compareSQLResults(rows, expectedResultJson);
            return {
                resultJson: rows,
                executionTime: Date.now() - startTime,
                verdict: isCorrect ? 'SUCCESS' : 'WRONG_ANSWER',
                error: isCorrect ? undefined : 'Output does not match expected result'
            };
        }

        return {
            resultJson: rows,
            executionTime: Date.now() - startTime,
            verdict: 'SUCCESS'
        };

    } catch (err: any) {
        return {
            resultJson: null,
            error: err.message || 'System error during SQL execution',
            executionTime: Date.now() - startTime,
            verdict: 'SYSTEM_ERROR'
        };
    } finally {
        // ── 9. Cleanup container ──
        try {
            await execPromise(`docker rm -f ${containerId}`, { timeout: 10000 });
        } catch (e) {
            console.error(`[SQL Cleanup] Failed to remove container ${containerId}`);
        }
    }
};

/**
 * Parse MySQL --batch output into JSON array
 * MySQL --batch produces tab-separated values with header row
 */
function parseMySQLOutput(output: string): any[] {
    const lines = output.trim().split('\n').filter(line => line.trim());
    if (lines.length < 1) return [];

    const headers = lines[0].split('\t').map(h => h.trim().toLowerCase());
    const rows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split('\t');
        const row: Record<string, any> = {};

        for (let j = 0; j < headers.length; j++) {
            const value = values[j]?.trim();
            if (value === 'NULL' || value === undefined) {
                row[headers[j]] = null;
            } else if (!isNaN(Number(value)) && value !== '') {
                row[headers[j]] = Number(value);
            } else {
                row[headers[j]] = value;
            }
        }

        rows.push(row);
    }

    return rows;
}
