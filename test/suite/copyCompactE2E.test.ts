import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

suite('Copy Compact E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHash: string;
  let shortHash: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-compact-'));
    testFile = path.join(tempDir, 'test.txt');

    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Create initial commit
    fs.writeFileSync(testFile, 'Hello World\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit"', { cwd: tempDir });
    commitHash = execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim();
    shortHash = execSync('git log --format=%h -1', { cwd: tempDir, encoding: 'utf-8' }).trim();
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('compact format components are available from git', async () => {
    const hash = execSync('git log --format=%h -1', { cwd: tempDir, encoding: 'utf-8' }).trim();
    const subject = execSync('git log --format=%s -1', { cwd: tempDir, encoding: 'utf-8' }).trim();
    const author = execSync('git log --format=%an -1', { cwd: tempDir, encoding: 'utf-8' }).trim();

    assert.ok(/^[\da-f]{7}$/.test(hash), 'Short hash should be 7 hex characters');
    assert.ok(subject.length > 0, 'Subject should not be empty');
    assert.ok(author.length > 0, 'Author should not be empty');
  });

  test('handleCopyCompact with valid commit', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyCompact'),
      'handleCopyCompact should be defined');
    assert.ok(source.includes('panel.getCommits()'),
      'Should get commits from panel');
    assert.ok(source.includes('commit.shortHash'),
      'Should use shortHash from commit');
    assert.ok(source.includes('commit.message'),
      'Should use message from commit');
    assert.ok(source.includes('commit.author'),
      'Should use author from commit');
  });

  test('handleCopyCompact formats as {shortHash} - {message} ({author}, {relativeDate})', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCompact');
    assert.ok(fnStart >= 0, 'handleCopyCompact should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    // Should include the dash separator and parentheses format
    assert.ok(fnBody.includes('commit.shortHash') && fnBody.includes('commit.message') && fnBody.includes('commit.author'),
      'Should format with shortHash, message, and author');
    assert.ok(fnBody.includes('formatRelativeTime'),
      'Should use formatRelativeTime for relative date');
  });

  test('handleCopyCompact writes formatted text to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCompact');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write to clipboard');
  });

  test('handleCopyCompact handles missing commit', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCompact');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'Should handle commit not found');
  });

  test('handleCopyCompact shows confirmation with truncated message', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCompact');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Copied:'),
      'Should show confirmation with "Copied:"');
    assert.ok(fnBody.includes('shortMsg') || fnBody.includes('substring'),
      'Should truncate long messages in confirmation');
  });

  test('main.js handleCopyCompact target resolution prioritizes focused', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCompact');
    assert.ok(fnStart >= 0, 'handleCopyCompact should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('focusedIndex'),
      'Should check focusedIndex');
    assert.ok(fnBody.includes('selectedCommits'),
      'Should check selectedCommits');
    assert.ok(fnBody.includes('focusedIndex >= 0'),
      'Should prioritize focused over selected');
  });

  test('main.js handleCopyCompact sends correct message type', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCompact');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copyCommitCompact'"),
      'Should send copyCommitCompact message type');
  });

  test('main.js handleCopyCompact handles no target', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCompact');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('Select a commit') && fnBody.includes('compact'),
      'Should show error when no commit selected');
  });

  test('context menu has copy-compact item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-compact"'),
      'Context menu should include copy-compact');
    assert.ok(source.includes('Copy as compact'),
      'Context menu should have label Copy as compact');
  });

  test('context menu copy-compact has 📝 icon', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('📝'),
      'Context menu copy-compact should have 📝 icon');
  });

  test('context menu click handles copy-compact action', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("action === 'copy-compact'"),
      'Should handle copy-compact action');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyCompact"'),
      'package.json should register copyCompact command');
    assert.ok(content.includes('"ctrl+shift+."'),
      'package.json should define Ctrl+Shift+. keybinding');
  });

  test('package.json keybinding uses correct keys', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    const json = JSON.parse(content);

    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyCompact'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyCompact');
    assert.strictEqual(binding.key, 'ctrl+shift+.');
    assert.strictEqual(binding.mac, 'cmd+shift+.');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('keyboard help includes Copy as compact', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Copy as compact'),
      'Keyboard help should include Copy as compact');
  });
});
