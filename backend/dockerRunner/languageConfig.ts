/**
 * Multi-Language Configuration Registry
 * Defines Docker images, compile/run commands, file extensions, and resource limits
 * for each supported programming language.
 */

export interface LanguageConfig {
    language_name: string;
    display_name: string;
    docker_image: string;
    compile_command: string | null;     // null if interpreted
    run_command: string;
    file_name: string;
    file_extension: string;
    time_limit: number;                 // ms
    memory_limit: number;               // MB
    monaco_id: string;                  // Monaco editor language ID
    boilerplate: string;                // Default code template
}

export const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
    c: {
        language_name: 'c',
        display_name: 'C (GCC 12)',
        docker_image: 'gcc:12',
        compile_command: 'gcc main.c -o main -lm -O2',
        run_command: './main',
        file_name: 'main.c',
        file_extension: '.c',
        time_limit: 2000,
        memory_limit: 256,
        monaco_id: 'c',
        boilerplate: `#include <stdio.h>
#include <stdlib.h>

int main() {
    // Write your solution here
    
    return 0;
}
`
    },

    cpp: {
        language_name: 'cpp',
        display_name: 'C++ (G++ 12)',
        docker_image: 'gcc:12',
        compile_command: 'g++ main.cpp -o main -O2 -std=c++17',
        run_command: './main',
        file_name: 'main.cpp',
        file_extension: '.cpp',
        time_limit: 2000,
        memory_limit: 256,
        monaco_id: 'cpp',
        boilerplate: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

int main() {
    // Write your solution here
    
    return 0;
}
`
    },

    python: {
        language_name: 'python',
        display_name: 'Python 3.10',
        docker_image: 'python:3.10-alpine',
        compile_command: null,
        run_command: 'python3 main.py',
        file_name: 'main.py',
        file_extension: '.py',
        time_limit: 5000,               // Python gets more time
        memory_limit: 256,
        monaco_id: 'python',
        boilerplate: `# Write your solution here

def main():
    pass

if __name__ == "__main__":
    main()
`
    },

    java: {
        language_name: 'java',
        display_name: 'Java 17',
        docker_image: 'openjdk:17-alpine',
        compile_command: 'javac Main.java',
        run_command: 'java Main',
        file_name: 'Main.java',
        file_extension: '.java',
        time_limit: 3000,               // Java gets a bit more time for JVM startup
        memory_limit: 256,
        monaco_id: 'java',
        boilerplate: `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your solution here
        
        sc.close();
    }
}
`
    },

    javascript: {
        language_name: 'javascript',
        display_name: 'JavaScript (Node.js 18)',
        docker_image: 'node:18-alpine',
        compile_command: null,
        run_command: 'node main.js',
        file_name: 'main.js',
        file_extension: '.js',
        time_limit: 3000,
        memory_limit: 256,
        monaco_id: 'javascript',
        boilerplate: `// Write your solution here
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

const lines = [];
rl.on('line', (line) => lines.push(line));
rl.on('close', () => {
    // Process input here
    
});
`
    },

    sql: {
        language_name: 'sql',
        display_name: 'MySQL 8.0',
        docker_image: 'mysql:8',
        compile_command: null,
        run_command: '',  // Handled by SQL executor
        file_name: 'query.sql',
        file_extension: '.sql',
        time_limit: 5000,
        memory_limit: 512,
        monaco_id: 'sql',
        boilerplate: `-- Write your SQL query here
SELECT * FROM table_name;
`
    },

    bash: {
        language_name: 'bash',
        display_name: 'Bash',
        docker_image: 'ubuntu:22.04',
        compile_command: null,
        run_command: 'bash main.sh',
        file_name: 'main.sh',
        file_extension: '.sh',
        time_limit: 2000,
        memory_limit: 128,
        monaco_id: 'shell',
        boilerplate: `#!/bin/bash
# Write your solution here

read input
echo "$input"
`
    },

    html: {
        language_name: 'html',
        display_name: 'HTML5',
        docker_image: 'none', // Handled client-side or by simple renderer
        compile_command: null,
        run_command: '',
        file_name: 'index.html',
        file_extension: '.html',
        time_limit: 0,
        memory_limit: 0,
        monaco_id: 'html',
        boilerplate: `<!DOCTYPE html>
<html>
<head>
    <title>Web Page</title>
</head>
<body>
    <h1>Hello World</h1>
</body>
</html>`
    },

    css: {
        language_name: 'css',
        display_name: 'CSS3',
        docker_image: 'none',
        compile_command: null,
        run_command: '',
        file_name: 'style.css',
        file_extension: '.css',
        time_limit: 0,
        memory_limit: 0,
        monaco_id: 'css',
        boilerplate: `body {
    background-color: #f0f0f0;
    font-family: sans-serif;
}`
    }
};

/**
 * Get language config by language name
 */
export const getLanguageConfig = (language: string): LanguageConfig | null => {
    return LANGUAGE_CONFIGS[language.toLowerCase()] || null;
};

/**
 * Get all supported language names
 */
export const getSupportedLanguages = (): string[] => {
    return Object.keys(LANGUAGE_CONFIGS);
};

/**
 * Validate if a language is supported
 */
export const isLanguageSupported = (language: string): boolean => {
    return language.toLowerCase() in LANGUAGE_CONFIGS;
};

/**
 * Get display name for a language
 */
export const getLanguageDisplayName = (language: string): string => {
    const config = getLanguageConfig(language);
    return config?.display_name || language;
};

/**
 * Dangerous patterns to check for in submitted code
 * Additional layer of security beyond Docker sandboxing
 */
export const DANGEROUS_PATTERNS: Record<string, RegExp[]> = {
    c: [
        /fork\s*\(/i,
        /exec[lv]?[pe]?\s*\(/i,
        /system\s*\(/i,
        /popen\s*\(/i,
    ],
    cpp: [
        /fork\s*\(/i,
        /exec[lv]?[pe]?\s*\(/i,
        /system\s*\(/i,
        /popen\s*\(/i,
    ],
    python: [
        /os\s*\.\s*system/i,
        /subprocess/i,
        /os\s*\.\s*exec/i,
        /__import__\s*\(\s*['"]os['"]\s*\)/i,
        /eval\s*\(/i,
    ],
    java: [
        /Runtime\s*\.\s*getRuntime/i,
        /ProcessBuilder/i,
    ],
    javascript: [
        /child_process/i,
        /execSync/i,
        /spawn\s*\(/i,
    ],
    sql: [
        /DROP\s+DATABASE/i,
        /DROP\s+SCHEMA/i,
        /LOAD_FILE/i,
        /INTO\s+OUTFILE/i,
        /INTO\s+DUMPFILE/i,
        /GRANT\s+/i,
        /CREATE\s+USER/i,
        /ALTER\s+USER/i,
    ],
    bash: [
        /rm\s+(-rf?\s+)?\/(?!app)/i,
        /dd\s+/i,
        /mkfs/i,
        /:?\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}/,  // fork bomb
    ],
};

/**
 * Check if code contains dangerous patterns
 */
export const containsDangerousCode = (code: string, language: string): string | null => {
    const patterns = DANGEROUS_PATTERNS[language.toLowerCase()];
    if (!patterns) return null;

    for (const pattern of patterns) {
        if (pattern.test(code)) {
            return `Potentially dangerous code detected: pattern ${pattern.source} is not allowed`;
        }
    }
    return null;
};
