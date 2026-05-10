import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Copy Commit Info E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHash: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-commit-info-'));
    testFile = path.join(tempDir, 'test.txt');

    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Create initial commit
    fs.writeFileSync(testFile, 'Hello World\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit"', { cwd: tempDir });
    commitHash = execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim();
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('handleCopyCommitInfo with valid commit', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify handler reads from commits array
    assert.ok(source.includes('function handleCopyCommitInfo'),
      'handleCopyCommitInfo should be defined');
    assert.ok(source.includes('panel.getCommits()'),
      'Should get commits from panel');
    assert.ok(source.includes('commit.author') && source.includes('commit.email'),
      'Should reference author and email');
  });

  test('handleCopyCommitInfo writes formatted info to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify clipboard write with formatted data
    const fnStart = source.indexOf('function handleCopyCommitInfo');
    assert.ok(fnStart >= 0, 'handleCopyCommitInfo should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write to clipboard');
    assert.ok(fnBody.includes('Author:'),
      'Should include Author: in format');
    assert.ok(fnBody.includes('Date:'),
      'Should include Date: in format');
    assert.ok(fnBody.includes('commit.fullMessage') || fnBody.includes('commit.message'),
      'Should include message in format');
  });

  test('handleCopyCommitInfo handles missing commit', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify missing commit handling
    const fnStart = source.indexOf('function handleCopyCommitInfo');
    const fnEnd = source.indexOf('\nfunction', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'Should handle commit not found');
  });

  test('main.js handleCopyInfo prioritizes focused over selected', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify focused prioritized over selected
    const fnStart = source.indexOf('function handleCopyInfo');
    assert.ok(fnStart >= 0, 'handleCopyInfo should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('focusedIndex'),
      'Should check focusedIndex');
    assert.ok(fnBody.includes('selectedCommits'),
      'Should check selectedCommits');
    assert.ok(fnBody.includes('focusedIndex >= 0'),
      'Should prioritize focused over selected');
  });

  test('main.js handleCopyInfo sends correct message type', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyInfo');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copyCommitInfo'"),
      'Should send copyCommitInfo message type');
  });

  test('main.js handleCopyInfo handles no target', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyInfo');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('Select a commit to copy its info'),
      'Should show error when no commit selected');
  });

  test('main.js handleCopyInfo uses getFilteredCommits', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyInfo');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('getOrderedCommits(getFilteredCommits())'),
      'Should use getOrderedCommits(getFilteredCommits())');
  });

  test('context menu has copy-info item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Check for context menu item
    assert.ok(source.includes('data-action="copy-info"'),
      'Context menu should include copy-info');
    assert.ok(source.includes('Copy commit info'),
      'Context menu should have label Copy commit info');
  });

  test('context menu click handles copy-info action', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Check handler for the action
    assert.ok(source.includes("action === 'copy-info'"),
      'Should handle copy-info action');
  });

  test('Ctrl+Shift+I keyboard shortcut integration', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify keyboard handler
    assert.ok(source.includes("e.key === 'i'") && source.includes('handleCopyInfo'),
      'Ctrl+Shift+I shortcut should be handled');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyCommitInfo"'),
      'package.json should register copyCommitInfo command');
    assert.ok(content.includes('"ctrl+shift+i"'),
      'package.json should define Ctrl+Shift+I keybinding');
  });

  test('keyboard help includes Copy commit info', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Copy commit info'),
      'Keyboard help should include Copy commit info');
  });
});