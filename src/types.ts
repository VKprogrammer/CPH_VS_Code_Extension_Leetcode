// First, create a new file called types.ts to share interfaces between files

export interface TestResult {
    testNumber: number;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
    executionTime: number;
    error?: string;
}

export interface TestConfig {
    filePath: string;
    manualTest?: {
        input: string[];
        expectedOutput: string;
        language?: string;
    };
    fileExt?: string;
}