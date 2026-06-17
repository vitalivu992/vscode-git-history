import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

suite('Copy Commit Body E2E Tests', () => {
  let tempDir: string;
  let testFile: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-body-'));
    testFile = path.join(tempDir, 'test.txt');

    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Create commit with multi-line message (subject + body)
    fs.writeFileSync(testFile, 'Hello World\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit\n\nThis is the body of the commit.\nIt has multiple lines."', { cwd: tempDir });

    // Create commit with single-line message (no body)
    fs.writeFileSync(testFile, 'Hello World 2\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Single line commit"', { cwd: tempDir });
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('git commit with body can be extracted', async () => {
    const fullMsg = execSync('git log --format=%B -1 --skip=1', { cwd: tempDir, encoding: 'utf-8' }).trim();
    const newlineIdx = fullMsg.indexOf('\n');
    assert.ok(newlineIdx >= 0, 'Commit should have a newline separating subject from body');
    const body = fullMsg.substring(newlineIdx + 1).trim();
    assert.ok(body.length > 0, 'Body should not be empty');
    assert.ok(body.includes('This is the body'), 'Body should contain expected text');
  });

  test('git commit without body has no newline in message', async () => {
    const fullMsg = execSync('git log --format=%B -1', { cwd: tempDir, encoding: 'utf-8' }).trim();
    assert.strictEqual(fullMsg, 'Single line commit', 'Single-line commit should have no body');
  });

  test('handleCopyCommitBody with valid commit', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyCommitBody'),
      'handleCopyCommitBody should be defined');
    assert.ok(source.includes('panel.getCommits()'),
      'Should get commits from panel');
  });

  test('handleCopyCommitBody extracts body from fullMessage', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitBody');
    assert.ok(fnStart >= 0, 'handleCopyCommitBody should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 200);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('fullMessage'),
      'Should use fullMessage');
    assert.ok(fnBody.includes("indexOf('\\n')"),
      'Should find newline to split subject from body');
    assert.ok(fnBody.includes('substring(newlineIndex'),
      'Should extract text after newline');
    assert.ok(fnBody.includes('.trim()'),
      'Should trim the body');
  });

  test('handleCopyCommitBody writes body to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitBody');
    const fnEnd = source.indexOf('\n}', fnStart + 200);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write to clipboard');
  });

  test('handleCopyCommitBody handles missing commit', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitBody');
    const fnEnd = source.indexOf('\n}', fnStart + 200);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'Should handle commit not found');
  });

  test('handleCopyCommitBody handles no body (single-line)', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitBody');
    const fnEnd = source.indexOf('\n}', fnStart + 200);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit has no body'),
      'Should show message for commits without body');
  });

  test('handleCopyCommitBody handles empty body after newline', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitBody');
    const fnEnd = source.indexOf('\n}', fnStart + 200);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes("body === ''"),
      'Should check for empty body');
  });

  test('handleCopyCommitBody shows confirmation with truncated body', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitBody');
    const fnEnd = source.indexOf('\n}', fnStart + 200);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Copied body'),
      'Should show confirmation with "Copied body"');
    assert.ok(fnBody.includes('truncatedBody'),
      'Should have truncatedBody variable for long bodies');
  });

  test('main.js handleCopyCommitBody target resolution prioritizes focused', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitBody');
    assert.ok(fnStart >= 0, 'handleCopyCommitBody should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('focusedIndex'),
      'Should check focusedIndex');
    assert.ok(fnBody.includes('selectedCommits'),
      'Should check selectedCommits');
    assert.ok(fnBody.includes('focusedIndex >= 0'),
      'Should prioritize focused over selected');
  });

  test('main.js handleCopyCommitBody sends correct message type', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitBody');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copyCommitBody'"),
      'Should send copyCommitBody message type');
  });

  test('main.js handleCopyCommitBody handles no target', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitBody');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('Select a commit') && fnBody.includes('body'),
      'Should show error when no commit selected');
  });

  test('context menu has copy-commit-body item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-commit-body"'),
      'Context menu should include copy-commit-body');
    assert.ok(source.includes('Copy commit body'),
      'Context menu should have label Copy commit body');
  });

  test('context menu copy-commit-body has 📄 icon', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('📄'),
      'Context menu copy-commit-body should have 📄 icon');
  });

  test('context menu click handles copy-commit-body action', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("action === 'copy-commit-body'"),
      'Should handle copy-commit-body action');
  });

  test('Ctrl+Shift+Z keyboard shortcut integration', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("e.key === 'z'") && source.includes('handleCopyCommitBody'),
      'Ctrl+Shift+Z shortcut should be handled');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyCommitBody"'),
      'package.json should register copyCommitBody command');
    assert.ok(content.includes('"ctrl+shift+z"'),
      'package.json should define Ctrl+Shift+Z keybinding');
  });

  test('package.json keybinding uses correct keys', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    const json = JSON.parse(content);

    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyCommitBody'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyCommitBody');
    assert.strictEqual(binding.key, 'ctrl+shift+z');
    assert.strictEqual(binding.mac, 'cmd+shift+z');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('keyboard help includes Copy commit body', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Copy commit body'),
      'Keyboard help should include Copy commit body');
  });
});
