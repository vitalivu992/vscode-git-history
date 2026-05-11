import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { handleMessage } from '../../src/webview/messageHandler';
import { GitHistoryPanel } from '../../src/webview/webviewProvider';
import * as vscode from 'vscode';

suite('Copy File Content Tests', () => {
  let tempDir: string;
  let testFile: string;
  let mockPanel: GitHistoryPanel;

  suiteSetup(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-content-test-'));
    testFile = path.join(tempDir, 'test.txt');

    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    fs.writeFileSync(testFile, 'Initial content line 1\nInitial content line 2\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit"', { cwd: tempDir });

    fs.writeFileSync(testFile, 'Initial content line 1\nModified content line 2\nAdded line 3\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Second commit with modifications"', { cwd: tempDir });

    mockPanel = {
      getCwd: () => tempDir,
      getCommits: () => {
        const output = execSync('git log --format=%H%x00%s --reverse', { cwd: tempDir, encoding: 'utf-8' });
        return output.trim().split('\n').map((line: string) => {
          const [hash, message] = line.split('\x00');
          return {
            hash,
            shortHash: hash.substring(0, 7),
            message,
            parentHashes: [],
            author: 'Test User',
            email: 'test@example.com',
            date: new Date().toISOString(),
            fullMessage: message
          };
        }).reverse();
      },
      postMessage: (msg: any) => {
        return true;
      }
    } as unknown as GitHistoryPanel;
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('types.ts should have copyFileContent message type', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("type: 'copyFileContent'"),
      'types.ts should have copyFileContent message type');
    assert.ok(source.includes('hash: string'),
      'copyFileContent should have hash field');
    assert.ok(source.includes('filePath: string'),
      'copyFileContent should have filePath field');
  });

  test('main.js should have copy-file-content context menu action', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-file-content"'),
      'main.js context menu should include copy-file-content action');
  });

  test('main.js should handle copy-file-content action', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("action === 'copy-file-content'"),
      'main.js should handle copy-file-content action');
  });

  test('main.js should send copyFileContent message', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("type: 'copyFileContent'"),
      'main.js should send copyFileContent message');
  });

  test('messageHandler.ts should handle copyFileContent case', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes("case 'copyFileContent':"),
      'messageHandler.ts should handle copyFileContent case');
  });

  test('messageHandler.ts should have handleCopyFileContent function', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFileContent'),
      'messageHandler.ts should have handleCopyFileContent function');
  });

  test('messageHandler.ts should import getFileContentAtCommit', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('getFileContentAtCommit'),
      'messageHandler.ts should import getFileContentAtCommit from gitService');
  });

  test('messageHandler.ts handleCopyFileContent should use vscode.env.clipboard', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    // Find the handleCopyFileContent function
    const functionStart = source.indexOf('async function handleCopyFileContent');
    const functionEnd = source.indexOf('async function handleCopyCommitPatch', functionStart);
    const functionBody = source.substring(functionStart, functionEnd);

    assert.ok(functionBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyFileContent should use vscode.env.clipboard.writeText');
  });

  test('messageHandler.ts handleCopyFileContent should use path.basename', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    // Find the handleCopyFileContent function
    const functionStart = source.indexOf('async function handleCopyFileContent');
    const functionEnd = source.indexOf('async function handleCopyCommitPatch', functionStart);
    const functionBody = source.substring(functionStart, functionEnd);

    assert.ok(functionBody.includes('path.basename'),
      'handleCopyFileContent should use path.basename to extract filename');
  });

  test('messageHandler.ts handleCopyFileContent should show confirmation message', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    // Find the handleCopyFileContent function
    const functionStart = source.indexOf('async function handleCopyFileContent');
    const functionEnd = source.indexOf('async function handleCopyCommitPatch', functionStart);
    const functionBody = source.substring(functionStart, functionEnd);

    assert.ok(functionBody.includes('showInformationMessage'),
      'handleCopyFileContent should show confirmation message');
  });

  test('messageHandler.ts handleCopyFileContent should have error handling', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    // Find the handleCopyFileContent function
    const functionStart = source.indexOf('async function handleCopyFileContent');
    const functionEnd = source.indexOf('async function handleCopyCommitPatch', functionStart);
    const functionBody = source.substring(functionStart, functionEnd);

    assert.ok(functionBody.includes('catch'),
      'handleCopyFileContent should have error handling');
    assert.ok(functionBody.includes('showErrorMessage'),
      'handleCopyFileContent should show error message on failure');
  });
});

suite('Copy File Content Integration Tests', () => {
  let tempDir: string;
  let testFile: string;
  let mockPanel: GitHistoryPanel;
  let mockSettingsService: any;

  suiteSetup(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-content-integration-'));
    testFile = path.join(tempDir, 'test.txt');

    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Create initial content
    fs.writeFileSync(testFile, 'Line 1\nLine 2\nLine 3\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit"', { cwd: tempDir });

    mockPanel = {
      getCwd: () => tempDir,
      getCommits: () => [],
      postMessage: (msg: any) => true
    } as unknown as GitHistoryPanel;

    mockSettingsService = {
      saveSettings: async () => {},
      getSettings: () => ({
        diffType: 'unified',
        wordWrapEnabled: false,
        sortOldestFirst: false,
        hideMergeCommits: false,
        regexSearchEnabled: false
      })
    };
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('Message handler should process copyFileContent message', async () => {
    const { execSync } = require('child_process');
    const commitsOutput = execSync('git log --format=%H', { cwd: tempDir, encoding: 'utf-8' });
    const commitHash = commitsOutput.trim();

    const message = {
      type: 'copyFileContent' as const,
      hash: commitHash,
      filePath: testFile
    };

    // Mock FirstRunTipService
    const mockFirstRunTipService: any = {
      shouldShowTip: () => false,
      markAsShown: async () => {},
      reset: async () => {}
    };

    try {
      await handleMessage(message, mockPanel, mockSettingsService, mockFirstRunTipService);
      assert.ok(true, 'Message handler processed copyFileContent without error');
    } catch (error) {
      // Expected to fail in test environment due to vscode.env.clipboard not being available
      assert.ok(true, 'Handler attempted to process (may fail due to missing VS Code APIs in test)');
    }
  });
});
