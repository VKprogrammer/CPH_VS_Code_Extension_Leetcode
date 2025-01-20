# cph-leetcode-extension-by-vijay 

This is the README for our extension "cph-leetcode-extension-by-vijay". 

## Features

### Core Features

#### 1. Test Case Management
- Fetches test cases from LeetCode problems automatically
- Supports both C++ and Python solutions
- Allows manual test case addition with custom inputs and expected outputs

#### 2. Multi-Language Support
- Configurable language settings for:
  - Python (using python3 interpreter)
  - C++ (using g++ compiler with C++17 standard)
- Allows users to choose between C++, Python, or both when fetching problem templates

#### 3. Test Execution
- Automated test runner for solution validation
- Supports running all test cases for a solution file
- Provides manual testing capability with custom inputs
- Real-time test execution with progress indicators

#### 4. Results Visualization
- Generates detailed test results in Markdown format including:
  - Overall test summary (passed/total tests)
  - Individual test case details:
    - Test status (passed/failed)
    - Execution time
    - Input values
    - Expected output
    - Actual output (for failed tests)
    - Error messages (if any)

### Technical Features

#### 1. Configuration Management
- Global configuration for language-specific settings
- Default configurations for supported languages
- Workspace-aware configuration handling

#### 2. Error Handling
- Comprehensive error checking and validation:
  - Workspace validation
  - URL validation for LeetCode problems
  - File type validation
  - Directory structure validation

#### 3. User Interface
- Interactive input collection via:
  - Input boxes for URLs and test cases
  - Quick pick menus for language selection
- Progress notifications for long-running operations
- Error messages and success notifications
- Side-by-side test results display

#### 4. File System Integration
- Automatic file saving before test execution
- Directory structure validation
- File extension detection and validation

### Commands

The extension provides three main commands:

1. `cph-leetcode-extension-by-vijay.fetchTestCases`
   - Fetches test cases from LeetCode problems
   - Requires valid LeetCode problem URL
   - Allows language selection

2. `cph-leetcode-extension-by-vijay.addManualTest`
   - Adds custom test cases
   - Supports comma-separated inputs
   - Requires expected output specification

3. `cph-leetcode-extension-by-vijay.runTests`
   - Executes tests for the current solution
   - Automatically saves file before running
   - Displays formatted results

## User Guide

# CPH LeetCode Extension - User Guide

## Installation

1. Download the extension package (`.vsix` file)
2. Create a directory for your LeetCode solutions without any spaces in the path
   - ✅ Good path: `/Users/username/leetcode-solutions`
   - ❌ Avoid: `/Users/username/leetcode solutions`
3. Open this directory in VS Code
4. Install the required dependencies:
   ```bash
   npm install
   ```
   This will create a `node_modules` folder necessary for the extension to work.

## Using the Extension

### Fetching Test Cases
1. Open the Command Palette (Ctrl/Cmd + Shift + P)
2. Type and select `CPH LeetCode: Fetch Test Cases`
3. Enter the LeetCode problem URL when prompted
4. Choose your preferred language (C++, Python, or Both)
5. The extension will fetch test cases and create necessary files

### Adding Manual Test Cases
1. Open your solution file (.cpp or .py)
2. Open the Command Palette
3. Select `CPH LeetCode: Add Manual Test`
4. Enter:
   - Test inputs (comma-separated for multiple inputs)
   - Expected output
5. The test results will appear in a new window

### Running Tests
1. Open your solution file
2. Open the Command Palette
3. Select `CPH LeetCode: Run Tests`
4. View the test results in the side panel showing:
   - Overall test summary
   - Individual test case results
   - Execution time
   - Input/Output comparison for failed tests

## Supported Languages

### Python
- File extension: `.py`
- Automatically runs with Python 3
- No compilation needed

### C++
- File extension: `.cpp`
- Compiles with g++ using C++17 standard
- Automatic compilation and execution

## Test Results Format
- Summary of passed/total tests
- For each test case:
  - Status (✅ Passed or ❌ Failed)
  - Execution time
  - Input values
  - Expected output
  - Actual output (for failed tests)
  - Error messages (if any)


## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
