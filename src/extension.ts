import * as vscode from 'vscode';
import { fetchTestCases } from './fetchTestCases';
import { runTests } from './testRunner';
import path from 'path';

export function activate(context: vscode.ExtensionContext) {
    console.log('CPH LeetCode extension is now active!');
    

    const config = vscode.workspace.getConfiguration('cphLeetcodeHelper');
    if (!config.has('languages')) {
        config.update('languages', {
            python: {
                compile: '',
                run: 'python3 {file}'
            },
            cpp: {
                compile: 'g++ -std=c++17 {file} -o {fileNoExt}',
                run: './{fileNoExt}'
            }
        }, vscode.ConfigurationTarget.Global);
    }
    // Register fetch test cases command
    let fetchDisposable = vscode.commands.registerCommand(
        'cph-leetcode-extension-by-vijay.fetchTestCases',
        async () => {
            if (!vscode.workspace.workspaceFolders) {
                vscode.window.showErrorMessage('Please open a folder before fetching test cases.');
                return;
            }

            const url = await vscode.window.showInputBox({
                prompt: 'Enter LeetCode problem URL',
                placeHolder: 'https://leetcode.com/problems/...',
                validateInput: (value) => {
                    return value.includes('leetcode.com/problems/')
                        ? null
                        : 'Please enter a valid LeetCode problem URL';
                }
            });

            if (!url) {
                return;
            }

            // Ask user for preferred language
            const language = await vscode.window.showQuickPick(
                ['C++', 'Python', 'Both'],
                {
                    placeHolder: 'Select language for solution template',
                }
            );

            if (!language) {
                return;
            }

            try {
                const progressOptions = {
                    location: vscode.ProgressLocation.Notification,
                    title: "Fetching test cases...",
                    cancellable: true
                };

                await vscode.window.withProgress(progressOptions, async (progress) => {
                    progress.report({ increment: 0 });
                    const result = await fetchTestCases(url, context);
                    progress.report({ increment: 100 });
                    return result;
                });

                vscode.window.showInformationMessage('Successfully fetched test cases!');
            } catch (error: any) {
                vscode.window.showErrorMessage(`Error fetching test cases: ${error.message}`);
            }
        }
    );

    // Register command to run manual test case
    let addManualTestDisposable = vscode.commands.registerCommand(
        'cph-leetcode-extension-by-vijay.addManualTest',
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('Please open a solution file first.');
                return;
            }

            const fileExt = path.extname(editor.document.uri.fsPath);
            const language = fileExt === '.cpp' ? 'C++' : fileExt === '.py' ? 'Python' : null;

            if (!language) {
                vscode.window.showErrorMessage('Unsupported file type. Please use .cpp or .py files.');
                return;
            }

            try {
                const inputStr = await vscode.window.showInputBox({
                    prompt: 'Enter test case inputs (comma-separated for multiple inputs)',
                    placeHolder: 'e.g. [1,2,3], "test", 42'
                });
                if (!inputStr) {return;}

                const expectedOutput = await vscode.window.showInputBox({
                    prompt: 'Enter expected output',
                    placeHolder: 'e.g. [1,2,3] or "result" or 42'
                });
                if (!expectedOutput) {return;}

                const inputs = inputStr.split(',').map(s => s.trim());
                const results = await runTests({
                    filePath: editor.document.uri.fsPath,
                    manualTest: {
                        input: inputs,
                        expectedOutput,
                        language
                    }
                });
                
                const doc = await vscode.workspace.openTextDocument({
                    content: formatTestResults(results),
                    language: 'markdown',
                });

                await vscode.window.showTextDocument(doc, {
                    viewColumn: vscode.ViewColumn.Beside,
                });
            } catch (error: any) {
                vscode.window.showErrorMessage(`Error running manual test: ${error.message}`);
            }
        }
    );

    // Register run tests command
    let runDisposable = vscode.commands.registerCommand(
        'cph-leetcode-extension-by-vijay.runTests',
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || !editor.document || !editor.document.uri.fsPath) {
                vscode.window.showErrorMessage('Please open a solution file first.');
                return;
            }

            const filePath = editor.document.uri.fsPath;
            const fileExt = path.extname(filePath).slice(1);
            const dirName = path.basename(path.dirname(filePath));
            
            if (!dirName.match(/^[a-z0-9-]+$/)) {
                vscode.window.showErrorMessage('Please run tests from a solution file in a problem directory.');
                return;
            }

            try {
                await editor.document.save();

                const progressOptions = {
                    location: vscode.ProgressLocation.Notification,
                    title: "Running tests...",
                    cancellable: true
                };

                const results = await vscode.window.withProgress(progressOptions, async (progress) => {
                    progress.report({ increment: 0 });
                    const result = await runTests({
                        filePath,
                        fileExt
                    });
                    progress.report({ increment: 100 });
                    return result;
                });

                const doc = await vscode.workspace.openTextDocument({
                    content: formatTestResults(results),
                    language: 'markdown',
                });

                await vscode.window.showTextDocument(doc, {
                    viewColumn: vscode.ViewColumn.Beside,
                });
            } catch (error: any) {
                vscode.window.showErrorMessage(`Error running tests: ${error.message}`);
            }
        }
    );

    context.subscriptions.push(fetchDisposable, addManualTestDisposable, runDisposable);
}

function formatTestResults(results: any[]): string {
    let output = '# Test Results\n\n';

    const totalTests = results.length;
    const passedTests = results.filter((r) => r.passed).length;

    output += `**Summary:** ${passedTests}/${totalTests} tests passed\n\n`;

    results.forEach((result) => {
        output += `### Test Case ${result.testNumber}\n`;
        output += `**Status:** ${result.passed ? '✅ Passed' : '❌ Failed'}\n`;
        output += `**Execution Time:** ${result.executionTime?.toFixed(2) || 0}ms\n\n`;

        output += '**Input:**\n```\n' + result.input + '\n```\n\n';
        output += '**Expected Output:**\n```\n' + result.expectedOutput + '\n```\n\n';

        if (!result.passed) {
            output += '**Actual Output:**\n```\n' + (result.actualOutput || 'N/A') + '\n```\n\n';
            if (result.error) {
                output += '**Error:**\n```\n' + result.error + '\n```\n\n';
            }
        }

        output += '---\n\n';
    });
    return output;
}

export function deactivate() {}