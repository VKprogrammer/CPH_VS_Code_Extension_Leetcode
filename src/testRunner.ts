import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';
import { spawn } from 'child_process';
import { TestResult, TestConfig } from './types';

const execAsync = promisify(exec);


export async function runTests(config: TestConfig): Promise<TestResult[]> {
    try {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            await editor.document.save();
        }

        const vscodeConfig = vscode.workspace.getConfiguration('cphLeetcodeHelper');
        const fileExt = config.fileExt || path.extname(config.filePath).slice(1);
        
        // Map file extensions to language keys
        const languageMap: { [key: string]: string } = {
            'py': 'python',
            'cpp': 'cpp'
        };

        const languageKey = languageMap[fileExt];
        if (!languageKey) {
            throw new Error(`Unsupported file extension: ${fileExt}`);
        }

        // Get language configuration from settings
        const languages = vscodeConfig.get<{
            [key: string]: { compile?: string; run: string }
        }>('languages');

        if (!languages || !languages[languageKey]) {
            throw new Error(`Configuration not found for language: ${languageKey}`);
        }

        const languageConfig = languages[languageKey];

        const problemDir = path.dirname(config.filePath);
        const testCasesDir = path.join(problemDir, 'test_cases');
        const results: TestResult[] = [];

        // Compile if needed
        if (languageConfig.compile) {
            try {
                const compileCommand = languageConfig.compile
                    .replace('{file}', `"${config.filePath}"`)
                    .replace('{fileNoExt}', `"${path.parse(config.filePath).name}"`);
                
                const { stderr: compileError } = await execAsync(compileCommand);
                if (compileError) {
                    throw new Error(compileError);
                }
            } catch (error) {
                throw new Error(`Compilation error: ${error}`);
            }
        }

        // Handle manual test case
        if (config.manualTest) {
            const result = await runSingleTest({
                filePath: config.filePath,
                runCommand: languageConfig.run,
                input: config.manualTest.input.join('\n'),
                expectedOutput: config.manualTest.expectedOutput,
                testNumber: 1,
                isManual: true
            });
            return [result];
        }

        // Run test cases from files
        try {
            const files = await fs.readdir(testCasesDir);
            const inputFiles = files.filter(f => f.startsWith('input_')).sort();
            
            for (const inputFile of inputFiles) {
                const testNumber = parseInt(inputFile.match(/\d+/)?.[0] || '0', 10);
                const outputFile = `output_${testNumber}.txt`;
                
                const input = await fs.readFile(path.join(testCasesDir, inputFile), 'utf-8');
                const expectedOutput = await fs.readFile(path.join(testCasesDir, outputFile), 'utf-8');
                
                const result = await runSingleTest({
                    filePath: config.filePath,
                    runCommand: languageConfig.run,
                    input,
                    expectedOutput,
                    testNumber
                });
                results.push(result);
            }
        } catch (error) {
            console.error('Error reading test cases:', error);
            throw error;
        }

        return results;
    } catch (error) {
        throw new Error(`Test runner error: ${error instanceof Error ? error.message : String(error)}`);
    }
}

interface SingleTestConfig {
    filePath: string;
    runCommand: string;
    input: string;
    expectedOutput: string;
    testNumber: number;
    isManual?: boolean;
}

async function runSingleTest(config: SingleTestConfig): Promise<TestResult> {
    const startTime = process.hrtime();

    try {
        const cmd = config.runCommand
            .replace('{file}', `"${config.filePath}"`)
            .replace('{fileNoExt}', `"${path.parse(config.filePath).name}"`);

        const child = spawn('powershell.exe', ['-Command', cmd], {
            shell: true,
            stdio: ['pipe', 'pipe', 'pipe']
        });

        child.stdin.write(config.input);
        child.stdin.end();

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        return new Promise((resolve) => {
            child.on('close', (code) => {
                const [seconds, nanoseconds] = process.hrtime(startTime);
                const executionTime = seconds * 1000 + nanoseconds / 1e6;

                if (code !== 0) {
                    resolve({
                        testNumber: config.testNumber,
                        input: config.input.trim(),
                        expectedOutput: config.expectedOutput.trim(),
                        actualOutput: '',
                        error: stderr,
                        passed: false,
                        executionTime
                    });
                } else {
                    const normalizedExpected = normalizeOutput(config.expectedOutput);
                    const normalizedActual = normalizeOutput(stdout);

                    resolve({
                        testNumber: config.testNumber,
                        input: config.input.trim(),
                        expectedOutput: config.expectedOutput.trim(),
                        actualOutput: stdout.trim(),
                        passed: normalizedActual === normalizedExpected,
                        executionTime
                    });
                }
            });
        });
    } catch (error) {
        return {
            testNumber: config.testNumber,
            input: config.input.trim(),
            expectedOutput: config.expectedOutput.trim(),
            actualOutput: '',
            error: error instanceof Error ? error.message : String(error),
            passed: false,
            executionTime: 0
        };
    }
}

function normalizeOutput(output: string): string {
    return output
        .trim()
        .replace(/\r\n/g, '\n')
        .replace(/\s+/g, ' ')
        .replace(/\[|\]|\s/g, '')
        .toLowerCase();
}