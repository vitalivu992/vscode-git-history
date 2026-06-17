import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Copy File Stats E2E Tests', () => {
  let tempDir: string;
  let testFile1: string;
  let testFile2: string;
  let commitHash: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-file-stats-'));
    testFile1 = path.join(tempDir, 'test1.txt');
    testFile2 = path.join(tempDir, 'test2.txt');

    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Create initial commit
    fs.writeFileSync(testFile1, 'Hello World\nLine 2\nLine 3\n');
    fs.writeFileSync(testFile2, 'Another file\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit"', { cwd: tempDir });

    // Create second commit with file changes
    fs.writeFileSync(testFile1, 'Hello World\nModified line 2\nNew line 3\nAdded line 4\n');
    fs.writeFileSync(testFile2, 'Modified file content\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Second commit with changes"', { cwd: tempDir });
    commitHash = execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim();
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('handleCopyFileStats should be defined in messageHandler', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('async function handleCopyFileStats'),
      'handleCopyFileStats should be defined');
  });

  test('handleCopyFileStats should call getFileStats', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify handler imports and calls getFileStats
    const fnStart = source.indexOf('async function handleCopyFileStats');
    assert.ok(fnStart >= 0, 'handleCopyFileStats should exist');
    const fnEnd = source.indexOf('function handleCopyDiffStatSummary', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('getFileStats'),
      'Should call getFileStats');
  });

  test('handleCopyFileStats formats output correctly', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify formatting
    const fnStart = source.indexOf('async function handleCopyFileStats');
    const fnEnd = source.indexOf('function handleCopyDiffStatSummary', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('insertions'),
      'Should include insertions in output');
    assert.ok(fnBody.includes('deletions'),
      'Should include deletions in output');
    assert.ok(fnBody.includes('isBinary'),
      'Should check for binary files');
  });

  test('handleCopyFileStats writes to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify clipboard write
    const fnStart = source.indexOf('async function handleCopyFileStats');
    const fnEnd = source.indexOf('function handleCopyDiffStatSummary', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write to clipboard');
  });

  test('handleCopyFileStats handles errors gracefully', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify error handling
    const fnStart = source.indexOf('async function handleCopyFileStats');
    const fnEnd = source.indexOf('function handleCopyDiffStatSummary', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('catch'),
      'Should have error handling');
    assert.ok(fnBody.includes('showErrorMessage'),
      'Should show error message on failure');
  });

  test('handleCopyFileStats shows confirmation with file count', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify confirmation message shows file count
    const fnStart = source.indexOf('async function handleCopyFileStats');
    const fnEnd = source.indexOf('function handleCopyDiffStatSummary', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('files.length'),
      'Should show file count in confirmation');
    assert.ok(fnBody.includes('showInformationMessage'),
      'Should show confirmation message');
  });

  test('handleCopyFileStats handles empty commit gracefully', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify handling of commits with no files changed
    const fnStart = source.indexOf('async function handleCopyFileStats');
    const fnEnd = source.indexOf('function handleCopyDiffStatSummary', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('files.length === 0'),
      'Should check for empty file list');
  });

  test('messageHandler switch case handles copyFileStats', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes("case 'copyFileStats':"),
      'messageHandler should have case for copyFileStats');
    assert.ok(source.includes('await handleCopyFileStats(message.hash, panel)'),
      'Should call handleCopyFileStats with correct parameters');
  });

  test('getFileStats returns correct data structure', async () => {
    const { getFileStats } = require('../../src/git/gitService');

    const stats = await getFileStats(commitHash, tempDir);

    assert.ok(Array.isArray(stats), 'getFileStats should return an array');
    if (stats.length > 0) {
      const stat = stats[0];
      assert.ok(typeof stat.path === 'string', 'Each stat should have path string');
      assert.ok(typeof stat.insertions === 'number', 'Each stat should have insertions number');
      assert.ok(typeof stat.deletions === 'number', 'Each stat should have deletions number');
      assert.ok(typeof stat.isBinary === 'boolean', 'Each stat should have isBinary boolean');
    }
  });

  test('getFileStats handles git output format correctly', async () => {
    const { getFileStats } = require('../../src/git/gitService');

    const stats = await getFileStats(commitHash, tempDir);

    // Verify the output format matches git numstat
    assert.ok(stats.length > 0, 'Should return at least one file stat');

    // Check that regular files have numeric insertions/deletions
    const regularFiles = stats.filter((s: any) => !s.isBinary);
    for (const file of regularFiles) {
      assert.ok(typeof file.insertions === 'number', `${file.path} insertions should be number`);
      assert.ok(typeof file.deletions === 'number', `${file.path} deletions should be number`);
    }
  });

  test('main.js handleCopyFileStats should send correct message', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify the handler function exists and sends the correct message
    assert.ok(source.includes('function handleCopyFileStats()'),
      'main.js should have handleCopyFileStats function');
    assert.ok(source.includes("type: 'copyFileStats'"),
      'Should send copyFileStats message type');
  });

  test('main.js should handle triggerAction for copyFileStats', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'copyFileStats':"),
      'main.js should handle copyFileStats action in triggerAction');
    assert.ok(source.includes('handleCopyFileStats()'),
      'Should call handleCopyFileStats function');
  });

  test('context menu should include copy-file-stats action', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-file-stats"'),
      'Context menu should include copy-file-stats action');
    assert.ok(source.includes('Copy file stats'),
      'Context menu label should say "Copy file stats"');
  });

  test('keyboard shortcut should trigger handleCopyFileStats', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify the action is wired up in triggerAction handler
    const triggerActionIndex = source.indexOf("case 'triggerAction':");
    assert.ok(triggerActionIndex >= 0, 'Should have triggerAction handler');

    const triggerActionSection = source.substring(triggerActionIndex, triggerActionIndex + 3000);
    assert.ok(triggerActionSection.includes("case 'copyFileStats':"),
      'triggerAction should handle copyFileStats');
  });

  test('extension.ts should register copyFileStats command', async () => {
    const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes('gitHistory.copyFileStats'),
      'extension.ts should register gitHistory.copyFileStats command');
    assert.ok(source.includes("'copyFileStats'"),
      'Should map to copyFileStats action');
  });
});
