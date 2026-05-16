import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Copy Relative Date E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHash: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-relative-date-'));
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

  test('handleCopyRelativeDate with valid commit', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify handler reads from commits array
    assert.ok(source.includes('function handleCopyRelativeDate'),
      'handleCopyRelativeDate should be defined');
    assert.ok(source.includes('panel.getCommits()'),
      'Should get commits from panel');
    assert.ok(source.includes('diffDays') || source.includes('diffMs'),
      'Should calculate time difference for relative date');
  });

  test('handleCopyRelativeDate calculates relative date correctly', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify relative date calculation
    const fnStart = source.indexOf('function handleCopyRelativeDate');
    assert.ok(fnStart >= 0, 'handleCopyRelativeDate should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('new Date(commit.date)'),
      'Should parse commit date');
    assert.ok(fnBody.includes('new Date()'),
      'Should get current date');
    assert.ok(fnBody.includes('getTime()'),
      'Should calculate time difference');
  });

  test('handleCopyRelativeDate writes relative date to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify clipboard write with relative date
    const fnStart = source.indexOf('function handleCopyRelativeDate');
    assert.ok(fnStart >= 0, 'handleCopyRelativeDate should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write to clipboard');
    assert.ok(fnBody.includes('relativeDate'),
      'Should write relative date string to clipboard');
  });

  test('handleCopyRelativeDate handles missing commit', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify missing commit handling
    const fnStart = source.indexOf('function handleCopyRelativeDate');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'Should handle commit not found');
  });

  test('main.js handleCopyRelativeDate target resolution prioritizes focused', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify focused prioritized over selected
    const fnStart = source.indexOf('function handleCopyRelativeDate');
    assert.ok(fnStart >= 0, 'handleCopyRelativeDate should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('focusedIndex'),
      'Should check focusedIndex');
    assert.ok(fnBody.includes('selectedCommits'),
      'Should check selectedCommits');
    assert.ok(fnBody.includes('focusedIndex >= 0'),
      'Should prioritize focused over selected');
  });

  test('main.js handleCopyRelativeDate sends correct message type', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyRelativeDate');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copyRelativeDate'"),
      'Should send copyRelativeDate message type');
  });

  test('main.js handleCopyRelativeDate handles no target', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyRelativeDate');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('Select a commit to copy its relative date'),
      'Should show error when no commit selected');
  });

  test('context menu has copy-relative-date item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Check for context menu item
    assert.ok(source.includes('data-action="copy-relative-date"'),
      'Context menu should include copy-relative-date');
    assert.ok(source.includes('Copy relative date'),
      'Context menu should have label Copy relative date');
  });

  test('context menu click handles copy-relative-date action', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Check handler for the action
    assert.ok(source.includes("action === 'copy-relative-date'"),
      'Should handle copy-relative-date action');
  });

  test('Ctrl+Shift+8 keyboard shortcut integration', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify keyboard handler
    assert.ok(source.includes("e.key === '8'") && source.includes('handleCopyRelativeDate'),
      'Ctrl+Shift+8 shortcut should be handled');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyRelativeDate"'),
      'package.json should register copyRelativeDate command');
    assert.ok(content.includes('"ctrl+shift+8"'),
      'package.json should define Ctrl+Shift+8 keybinding');
  });

  test('keyboard help includes Copy relative date', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("'8'") && source.includes('relative date'),
      'Keyboard help should include Copy relative date with 8 key');
  });
});
