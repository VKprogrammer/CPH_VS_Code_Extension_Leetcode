# cph-leetcode-extension-by-vijay README

This is the README for our extension "cph-leetcode-extension-by-vijay". 

## Features and Uses

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
## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: Enable/disable this extension.
* `myExtension.thing`: Set to `blah` to do something.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

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
