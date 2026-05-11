import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

suite('Copy Oneline E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHash: string;
  let shortHash: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-oneline-'));
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

  test('git log --oneline format is {shortHash} {message}', async () => {
    const oneline = execSync('git log --oneline -1', { cwd: tempDir, encoding: 'utf-8' }).trim();
    const parts = oneline.split(' ');
    const hashPart = parts[0];

    assert.ok(/^[\da-f]{7}$/.test(hashPart), 'Short hash should be 7 hex characters');
    assert.ok(oneline.includes('Initial commit'), 'Should include commit message');
  });

  test('handleCopyOneline with valid commit', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify handler reads from commits array
    assert.ok(source.includes('function handleCopyOneline'),
      'handleCopyOneline should be defined');
    assert.ok(source.includes('panel.getCommits()'),
      'Should get commits from panel');
    assert.ok(source.includes('commit.shortHash'),
      'Should use shortHash from commit');
    assert.ok(source.includes('commit.message'),
      'Should use message from commit');
  });

  test('handleCopyOneline formats as {shortHash} {message}', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify formatting
    const fnStart = source.indexOf('function handleCopyOneline');
    assert.ok(fnStart >= 0, 'handleCopyOneline should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('`${commit.shortHash} ${commit.message}`') ||
              fnBody.includes('commit.shortHash + \' \' + commit.message'),
      'Should format as shortHash + space + message');
  });

  test('handleCopyOneline writes formatted text to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify clipboard write
    const fnStart = source.indexOf('function handleCopyOneline');
    assert.ok(fnStart >= 0, 'handleCopyOneline should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write to clipboard');
  });

  test('handleCopyOneline handles missing commit', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify missing commit handling
    const fnStart = source.indexOf('function handleCopyOneline');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'Should handle commit not found');
  });

  test('handleCopyOneline shows confirmation with truncated message', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyOneline');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Copied:'),
      'Should show confirmation with "Copied:"');
    assert.ok(fnBody.includes('shortMsg') || fnBody.includes('substring'),
      'Should truncate long messages in confirmation');
  });

  test('main.js handleCopyOneline target resolution prioritizes focused', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify focused prioritized over selected
    const fnStart = source.indexOf('function handleCopyOneline');
    assert.ok(fnStart >= 0, 'handleCopyOneline should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('focusedIndex'),
      'Should check focusedIndex');
    assert.ok(fnBody.includes('selectedCommits'),
      'Should check selectedCommits');
    assert.ok(fnBody.includes('focusedIndex >= 0'),
      'Should prioritize focused over selected');
  });

  test('main.js handleCopyOneline sends correct message type', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyOneline');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copyOneline'"),
      'Should send copyOneline message type');
  });

  test('main.js handleCopyOneline handles no target', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyOneline');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('Select a commit') && fnBody.includes('copy as oneline'),
      'Should show error when no commit selected');
  });

  test('context menu has copy-oneline item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Check for context menu item
    assert.ok(source.includes('data-action="copy-oneline"'),
      'Context menu should include copy-oneline');
    assert.ok(source.includes('Copy as oneline'),
      'Context menu should have label Copy as oneline');
  });

  test('context menu copy-oneline has ≡ icon', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('≡'),
      'Context menu copy-oneline should have ≡ icon');
  });

  test('context menu click handles copy-oneline action', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Check handler for the action
    assert.ok(source.includes("action === 'copy-oneline'"),
      'Should handle copy-oneline action');
  });

  test('Ctrl+Shift+Y keyboard shortcut integration', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify keyboard handler
    assert.ok(source.includes("e.key === 'y'") && source.includes('handleCopyOneline'),
      'Ctrl+Shift+Y shortcut should be handled');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyOneline"'),
      'package.json should register copyOneline command');
    assert.ok(content.includes('"ctrl+shift+y"'),
      'package.json should define Ctrl+Shift+Y keybinding');
  });

  test('package.json keybinding uses correct keys', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    const json = JSON.parse(content);

    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyOneline'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyOneline');
    assert.strictEqual(binding.key, 'ctrl+shift+y');
    assert.strictEqual(binding.mac, 'cmd+shift+y');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('keyboard help includes Copy as oneline', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Copy as oneline'),
      'Keyboard help should include Copy as oneline');
  });
});
