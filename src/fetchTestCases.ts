import puppeteer from "puppeteer";
import fs from 'fs/promises';
import path from 'path';
import * as vscode from 'vscode';

interface TestCase {
  inputs: string[];
  outputs: string[];
  inputTypes: string[];
}

async function ensureDirectoryExists(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

// Helper to generate Python input parsing code based on type
function generatePythonInputParser(type: string): string {
  switch (type.toLowerCase()) {
    case 'vector<int>':
      return `def parse_list():
    line = input().strip()
    # Remove [] and split by comma
    return [int(x) for x in line[1:-1].split(',') if x]`;
    
    case 'vector<vector<int>>':
      return `def parse_matrix():
    line = input().strip()
    # Remove outer brackets
    line = line[1:-1]
    matrix = []
    current = []
    num = ''
    in_array = False
    
    for char in line:
        if char == '[':
            in_array = True
            current = []
        elif char == ']':
            if num:
                current.append(int(num))
                num = ''
            in_array = False
            if current:
                matrix.append(current)
        elif char == ',':
            if num:
                current.append(int(num))
                num = ''
        elif char.strip():
            num += char
            
    return matrix`;

    case 'string':
      return `def parse_string():
    line = input().strip()
    # Remove quotes
    return line[1:-1]`;

    case 'vector<string>':
      return `def parse_string_list():
    line = input().strip()
    # Remove [] and split by comma, then remove quotes
    return [x.strip().strip('"') for x in line[1:-1].split(',') if x.strip()]`;

    default:
      return '';
  }
}

function generatePythonTemplate(functionName: string, inputTypes: string[], returnType: string): string {
  const parsers = new Set<string>();
  let template = `from typing import List, Optional

`;

  // Add required parsers
  inputTypes.forEach(type => {
    const parser = generatePythonInputParser(type);
    if (parser) {
      parsers.add(parser);
    }
  });
  
  parsers.forEach(parser => {
    template += parser + '\n\n';
  });

  // Helper functions for output formatting
  template += `def format_output(result) -> str:
    if isinstance(result, list):
        if result and isinstance(result[0], list):
            # Matrix
            return str([[int(x) for x in row] for row in result]).replace(' ', '')
        else:
            # Single list
            return str([int(x) for x in result]).replace(' ', '')
    elif isinstance(result, str):
        return f'"{result}"'
    else:
        return str(result)

`;

  // Generate Solution class
  template += `class Solution:
    def ${functionName}(self${inputTypes.length > 0 ? ', ' : ''}${inputTypes.map((type, i) => {
      const paramName = String.fromCharCode(97 + i);
      let pythonType = type.toLowerCase();
      // Convert C++ types to Python type hints
      if (pythonType === 'vector<int>') {
        return `${paramName}: List[int]`;
      } else if (pythonType === 'vector<vector<int>>') {
        return `${paramName}: List[List[int]]`;
      } else if (pythonType === 'string') {
        return `${paramName}: str`;
      } else if (pythonType === 'vector<string>') {
        return `${paramName}: List[str]`;
      } else if (pythonType === 'int') {
        return `${paramName}: int`;
      }
      return `${paramName}: ${pythonType}`;
    }).join(', ')}) -> ${returnType === 'vector<int>' ? 'List[int]' : 
              returnType === 'vector<vector<int>>' ? 'List[List[int]]' : 
              returnType === 'vector<string>' ? 'List[str]' :
              returnType}:
        # TODO: Implement your solution here
        pass

def main():
    solution = Solution()
    
    # Parse input
`;

  // Add input parsing
  inputTypes.forEach((type, i) => {
    const varName = String.fromCharCode(97 + i);
    switch (type.toLowerCase()) {
      case 'vector<int>':
        template += `    ${varName} = parse_list()\n`;
        break;
      case 'vector<vector<int>>':
        template += `    ${varName} = parse_matrix()\n`;
        break;
      case 'string':
        template += `    ${varName} = parse_string()\n`;
        break;
      case 'vector<string>':
        template += `    ${varName} = parse_string_list()\n`;
        break;
      default:
        template += `    ${varName} = int(input())\n`;
    }
  });

  template += `
    # Call solution and format output
    result = solution.${functionName}(${inputTypes.map((_, i) => String.fromCharCode(97 + i)).join(', ')})
    print(format_output(result))

if __name__ == '__main__':
    main()`;

  return template;
}

// Helper to generate C++ input parsing code based on type
function generateInputParser(type: string): string {
  switch (type.toLowerCase()) {
    case 'vector<int>':
      return `vector<int> parseVector() {
    string line;
    getline(cin, line);
    stringstream ss(line.substr(1, line.length()-2)); // Remove [] brackets
    vector<int> result;
    string num;
    while (getline(ss, num, ',')) {
        result.push_back(stoi(num));
    }
    return result;
}`;
    
    case 'vector<vector<int>>':
      return `vector<vector<int>> parseMatrix() {
    string line;
    getline(cin, line);
    vector<vector<int>> matrix;
    stringstream ss(line.substr(1, line.length()-2)); // Remove outer []
    string row;
    while (getline(ss, row, ']')) {
        if (row.empty() || row == "[") continue;
        if (row[0] == ',') row = row.substr(1);
        if (row[0] == '[') row = row.substr(1);
        stringstream rowss(row);
        vector<int> rowVec;
        string num;
        while (getline(rowss, num, ',')) {
            if (!num.empty()) {
                rowVec.push_back(stoi(num));
            }
        }
        if (!rowVec.empty()) {
            matrix.push_back(rowVec);
        }
    }
    return matrix;
}`;

    case 'string':
      return `string parseString() {
    string line;
    getline(cin, line);
    return line.substr(1, line.length()-2); // Remove quotes
}`;

    case 'vector<string>':
      return `vector<string> parseStringVector() {
    string line;
    getline(cin, line);
    stringstream ss(line.substr(1, line.length()-2)); // Remove [] brackets
    vector<string> result;
    string word;
    while (getline(ss, word, ',')) {
        // Remove quotes and whitespace
        word = word.substr(word.find('"') + 1);
        word = word.substr(0, word.find('"'));
        result.push_back(word);
    }
    return result;
}`;

    default:
      return '';
  }
}

function generateCppTemplate(functionName: string, inputTypes: string[], returnType: string): string {
  const parsers = new Set<string>();
  let template = `#include <bits/stdc++.h>
using namespace std;

`;

  // Add required parsers
  inputTypes.forEach(type => {
    const parser = generateInputParser(type);
    if (parser) {
      parsers.add(parser);
    }
  });
  
  parsers.forEach(parser => {
    template += parser + '\n\n';
  });

  // Helper function for output formatting
  template += `template<typename T>
void printVector(const vector<T>& vec) {
    cout << "[";
    for(int i = 0; i < vec.size(); i++) {
        cout << vec[i];
        if(i < vec.size() - 1) cout << ",";
    }
    cout << "]";
}

template<typename T>
void printMatrix(const vector<vector<T>>& matrix) {
    cout << "[";
    for(int i = 0; i < matrix.size(); i++) {
        cout << "[";
        for(int j = 0; j < matrix[i].size(); j++) {
            cout << matrix[i][j];
            if(j < matrix[i].size() - 1) cout << ",";
        }
        cout << "]";
        if(i < matrix.size() - 1) cout << ",";
    }
    cout << "]";
}

template<typename T>
void printResult(const T& result) {
    cout << result;
}

template<>
void printResult(const vector<int>& result) {
    printVector(result);
}

template<>
void printResult(const string& result) {
    cout << "\\"" << result << "\\""; // Wrap the string in quotes using raw strings
}



template<>
void printResult(const vector<vector<int>>& result) {
    printMatrix(result);
}

`;

  template += `class Solution {
public:
    ${returnType} ${functionName}(${inputTypes.map((type, i) => `${type} ${String.fromCharCode(97 + i)}`).join(', ')}) {
        // TODO: Implement your solution here
    }
};

int main() {
    Solution solution;
    
    // Parse input
`;

  inputTypes.forEach((type, i) => {
    switch (type.toLowerCase()) {
      case 'vector<int>':
        template += `    auto ${String.fromCharCode(97 + i)} = parseVector();\n`;
        break;
      case 'vector<vector<int>>':
        template += `    auto ${String.fromCharCode(97 + i)} = parseMatrix();\n`;
        break;
      case 'string':
        template += `    auto ${String.fromCharCode(97 + i)} = parseString();\n`;
        break;
      case 'vector<string>':
        template += `    auto ${String.fromCharCode(97 + i)} = parseStringVector();\n`;
        break;
      default:
        template += `    ${type} ${String.fromCharCode(97 + i)};\n    cin >> ${String.fromCharCode(97 + i)};\n`;
    }
  });

  template += `
    // Call solution and output result
    auto result = solution.${functionName}(${inputTypes.map((_, i) => String.fromCharCode(97 + i)).join(', ')});
    
    // Print result using the appropriate template specialization
    printResult(result);
    cout << endl;
    
    return 0;
}`;

  return template;
}

async function detectInputTypes(testCase: TestCase): Promise<string[]> {
  const types: string[] = [];
  
  for (const input of testCase.inputs) {
    if (input.startsWith('[') && input.endsWith(']')) {
      if (input.includes('[', 1)) {
        types.push('vector<vector<int>>');
      } else {
        if (input.includes('"')) {
          types.push('vector<string>');
        } else {
          types.push('vector<int>');
        }
      }
    } else if (input.startsWith('"') && input.endsWith('"')) {
      types.push('string');
    } else if (!isNaN(Number(input))) {
      types.push('int');
    } else {
      types.push('string');
    }
  }
  
  return types;
}

async function saveTestCases(testCases: TestCase[], problemName: string, functionName: string) {
  try {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      throw new Error('No workspace folder is opened');
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const problemDir = path.join(workspaceRoot, problemName);
    const testCasesDir = path.join(problemDir, 'test_cases');

    await ensureDirectoryExists(problemDir);
    await ensureDirectoryExists(testCasesDir);

    const inputTypes = await detectInputTypes(testCases[0]);
    
    // Save C++ solution
    const cppSolutionPath = path.join(problemDir, 'solution.cpp');
    const cppTemplate = generateCppTemplate(functionName, inputTypes, 'int'); // Default to int, can be enhanced
    await fs.writeFile(cppSolutionPath, cppTemplate);

    // Save Python solution
    const pythonSolutionPath = path.join(problemDir, 'solution.py');
    const pythonTemplate = generatePythonTemplate(functionName, inputTypes, 'int'); // Default to int, can be enhanced
    await fs.writeFile(pythonSolutionPath, pythonTemplate);

    // Save test cases
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const testNumber = i + 1;

      await fs.writeFile(
        path.join(testCasesDir, `input_${testNumber}.txt`),
        testCase.inputs.join('\n')
      );
      await fs.writeFile(
        path.join(testCasesDir, `output_${testNumber}.txt`),
        testCase.outputs.join('\n')
      );
    }

    const cphConfig = {
      batch: {
        id: problemName,
        size: testCases.length,
      },
      tests: testCases.map((_, index) => ({
        input: `test_cases/input_${index + 1}.txt`,
        output: `test_cases/output_${index + 1}.txt`,
      })),
    };

    await fs.writeFile(
      path.join(problemDir, '.cph'),
      JSON.stringify(cphConfig, null, 2)
    );

    vscode.window.showInformationMessage(
      `Created ${testCases.length} test cases with C++ and Python templates in ${problemDir}`
    );

    // Open both files in editor
    const cppDocument = await vscode.workspace.openTextDocument(cppSolutionPath);
    const pythonDocument = await vscode.workspace.openTextDocument(pythonSolutionPath);
    
    await vscode.window.showTextDocument(cppDocument, { viewColumn: vscode.ViewColumn.One });
    await vscode.window.showTextDocument(pythonDocument, { viewColumn: vscode.ViewColumn.Two });

    return problemDir;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Failed to save test cases: ${errorMessage}`);
    throw error;
  }
}

async function fetchTestCases(
  url: string, 
  context: vscode.ExtensionContext,
  problemDir?: string  // Make the third parameter optional
): Promise<{ testCases: TestCase[] }> {
  if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
    throw new Error('Please open a folder in VS Code before fetching test cases.');
  }

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle2" });
    await page.waitForSelector('.elfjS[data-track-load="description_content"]');

    // Extract problem name and function name
    const problemName = problemDir || new URL(url).pathname.split('/')[2];
    const functionNameElement = await page.$('div[class*="content"] code');
    let functionName = 'solve'; // default
    if (functionNameElement) {
      const text = await page.evaluate(el => el.textContent, functionNameElement);
      if (text) {
        const match = text.match(/\b\w+\(/);
        if (match) {
          functionName = match[0].slice(0, -1);
        }
      }
    }

    const testCases = await page.evaluate(() => {
      const container = document.querySelector('.elfjS[data-track-load="description_content"]');
      if (!container) {
        return { testCases: [] };
      }

      const testCases: { inputs: string[], outputs: string[], inputTypes: string[] }[] = [];

      function extractValue(line: string): string {
        const equalPos = line.indexOf('=');
        if (equalPos === -1) { return line.trim(); }
        return line.substring(equalPos + 1).trim();
      }

      function processInput(input: string): string[] {
        const values: string[] = [];
        let currentValue = "";
        let bracketCount = 0;
        let quoteCount = 0;

        for (let i = 0; i < input.length; i++) {
          const char = input[i];
          if (char === '[') { bracketCount++; }
          if (char === ']') { bracketCount--; }
          if (char === '"') { quoteCount = 1 - quoteCount; }

          if (char === ',' && bracketCount === 0 && quoteCount === 0) {
            if (currentValue.trim()) {
              values.push(extractValue(currentValue));
            }
            currentValue = "";
          } else {
            currentValue += char;
          }
        }

        if (currentValue.trim()) {
          values.push(extractValue(currentValue));
        }

        return values;
      }

      // Handle the first format (pre tags with input/output structure)
      const preTags = container.querySelectorAll("pre");
      preTags.forEach((preTag) => {
        const fullText = preTag.textContent || "";
        const lines = fullText.split('\n');

        let currentInputs: string[] = [];
        let currentOutputs: string[] = [];
        let isProcessingInput = false;
        let isProcessingOutput = false;
        let isProcessingExplanation = false;

        lines.forEach(line => {
          line = line.trim();
          if (!line) { return; }

          if (line.toLowerCase().includes('explanation:')) {
            isProcessingExplanation = true;
            isProcessingInput = false;
            isProcessingOutput = false;
            return;
          }

          if (isProcessingExplanation) {
            return;
          }

          if (line.toLowerCase().includes('input:')) {
            isProcessingInput = true;
            isProcessingOutput = false;
            const inputPart = line.substring(line.toLowerCase().indexOf('input:') + 6).trim();
            if (inputPart) {
              currentInputs = processInput(inputPart);
            }
          } else if (line.toLowerCase().includes('output:')) {
            isProcessingInput = false;
            isProcessingOutput = true;
            const outputPart = line.substring(line.toLowerCase().indexOf('output:') + 7).trim();
            if (outputPart) {
              currentOutputs = processInput(outputPart);
            }
          } else if (isProcessingInput) {
            const values = processInput(line);
            currentInputs.push(...values);
          } else if (isProcessingOutput) {
            const values = processInput(line);
            currentOutputs.push(...values);
          }
        });

        if (currentInputs.length > 0 && currentOutputs.length > 0) {
          testCases.push({
            inputs: currentInputs,
            outputs: currentOutputs,
            inputTypes: []
          });
        }
      });

      // Handle the second format (example-block structure)
      const exampleBlocks = container.querySelectorAll('.example-block');
      exampleBlocks.forEach((block) => {
        const inputs: string[] = [];
        const outputs: string[] = [];

        // Find input spans
        const inputSpans = block.querySelectorAll('span.example-io');
        inputSpans.forEach((span) => {
          const text = span.textContent || '';
          const parent = span.closest('p');
          if (!parent) {return;}

          const parentText = parent.textContent || '';
          if (parentText.toLowerCase().includes('input:')) {
            // Handle input values
            const value = text.includes('=') ? text.split('=')[1].trim() : text.trim();
            inputs.push(value);
          } else if (parentText.toLowerCase().includes('output:')) {
            // Handle output values
            outputs.push(text.trim());
          }
        });

        if (inputs.length > 0 && outputs.length > 0) {
          testCases.push({
            inputs,
            outputs,
            inputTypes: []
          });
        }
      });

      return { testCases };
    });

    if (testCases.testCases.length > 0) {
      await saveTestCases(testCases.testCases, problemName, functionName);
    } else {
      vscode.window.showWarningMessage('No test cases found in the problem description.');
    }

    return testCases;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Error fetching test cases: ${errorMessage}`);
    throw error;
  } finally {
    await browser.close();
  }
}

export { fetchTestCases, saveTestCases, ensureDirectoryExists, TestCase };