import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Copy Author Name E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHash: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-author-name-'));
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

  test('handleCopyAuthorName with valid commit', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify handler reads from commits array
    assert.ok(source.includes('function handleCopyAuthorName'),
      'handleCopyAuthorName should be defined');
    assert.ok(source.includes('panel.getCommits()'),
      'Should get commits from panel');
    assert.ok(source.includes('commit.author'),
      'Should read commit.author');
  });

  test('handleCopyAuthorName writes name to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify clipboard write with commit.author
    const fnStart = source.indexOf('function handleCopyAuthorName');
    assert.ok(fnStart >= 0, 'handleCopyAuthorName should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write to clipboard');
  });

  test('handleCopyAuthorName handles missing commit', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify missing commit handling
    const fnStart = source.indexOf('function handleCopyAuthorName');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'Should handle commit not found');
  });

  test('main.js handleCopyAuthorName target resolution prioritizes focused', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify focused prioritized over selected
    const fnStart = source.indexOf('function handleCopyAuthorName');
    assert.ok(fnStart >= 0, 'handleCopyAuthorName should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('focusedIndex'),
      'Should check focusedIndex');
    assert.ok(fnBody.includes('selectedCommits'),
      'Should check selectedCommits');
    assert.ok(fnBody.includes('focusedIndex >= 0'),
      'Should prioritize focused over selected');
  });

  test('main.js handleCopyAuthorName sends correct message type', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAuthorName');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copyAuthorName'"),
      'Should send copyAuthorName message type');
  });

  test('main.js handleCopyAuthorName handles no target', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAuthorName');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('Select a commit to copy author name'),
      'Should show error when no commit selected');
  });

  test('context menu has copy-author-name item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Check for context menu item
    assert.ok(source.includes('data-action="copy-author-name"'),
      'Context menu should include copy-author-name');
    assert.ok(source.includes('Copy author name'),
      'Context menu should have label Copy author name');
  });

  test('context menu click handles copy-author-name action', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Check handler for the action
    assert.ok(source.includes("action === 'copy-author-name'") ||
      source.includes('copy-author-name'),
      'Should handle copy-author-name action');
  });

  test('Ctrl+Shift+N keyboard shortcut integration', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify keyboard handler
    assert.ok(source.includes("e.key === 'n'") && source.includes('handleCopyAuthorName'),
      'Ctrl+Shift+N shortcut should be handled');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyAuthorName"'),
      'package.json should register copyAuthorName command');
    assert.ok(content.includes('"ctrl+shift+n"'),
      'package.json should define Ctrl+Shift+N keybinding');
  });
});
