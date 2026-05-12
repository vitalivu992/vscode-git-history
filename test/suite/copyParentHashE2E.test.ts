import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

suite('Copy Parent Hash E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let rootCommitHash: string;
  let secondCommitHash: string;
  let thirdCommitHash: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-parent-'));
    testFile = path.join(tempDir, 'test.txt');

    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Commit 1: root commit (no parent)
    fs.writeFileSync(testFile, 'Hello World\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit"', { cwd: tempDir });
    rootCommitHash = execSync('git rev-parse HEAD', { cwd: tempDir, encoding: 'utf-8' }).trim();

    // Commit 2: has parent (commit 1)
    fs.writeFileSync(testFile, 'Hello World 2\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Second commit"', { cwd: tempDir });
    secondCommitHash = execSync('git rev-parse HEAD', { cwd: tempDir, encoding: 'utf-8' }).trim();

    // Commit 3: has parent (commit 2)
    fs.writeFileSync(testFile, 'Hello World 3\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Third commit"', { cwd: tempDir });
    thirdCommitHash = execSync('git rev-parse HEAD', { cwd: tempDir, encoding: 'utf-8' }).trim();
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('git parent hash can be retrieved for non-root commit', () => {
    const parentHash = execSync('git rev-parse HEAD~1', { cwd: tempDir, encoding: 'utf-8' }).trim();
    assert.strictEqual(parentHash, secondCommitHash,
      'Parent of third commit should be second commit');
    assert.strictEqual(parentHash.length, 40, 'Parent hash should be 40 characters');
  });

  test('root commit has no parent', () => {
    const result = execSync(`git log --format=%P -1 ${rootCommitHash}`, {
      cwd: tempDir, encoding: 'utf-8'
    }).trim();
    assert.strictEqual(result, '', 'Root commit should have empty parent');
  });

  test('handleCopyParentHash function exists and gets commits from panel', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyParentHash'),
      'handleCopyParentHash should be defined');
    assert.ok(source.includes('panel.getCommits()'),
      'Should get commits from panel');
  });

  test('handleCopyParentHash copies parentHashes[0] to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyParentHash');
    assert.ok(fnStart >= 0, 'handleCopyParentHash function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('parentHashes[0]'),
      'Should read parentHashes[0]');
    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write to clipboard');
  });

  test('handleCopyParentHash shows confirmation with short hash', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyParentHash');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Parent hash copied'),
      'Should show "Parent hash copied" confirmation');
    assert.ok(fnBody.includes('parentShort'),
      'Should compute short hash for display');
    assert.ok(fnBody.includes('substring(0, 7)'),
      'Should use 7-character short hash');
  });

  test('handleCopyParentHash handles root commit (no parent)', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyParentHash');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('parentHashes.length === 0'),
      'Should check for empty parentHashes');
    assert.ok(fnBody.includes('Root commit has no parent'),
      'Should show "Root commit has no parent" error');
  });

  test('handleCopyParentHash handles commit not found', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyParentHash');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'Should show "Commit not found" error');
  });

  test('main.js handleCopyParentHash prioritizes focused row', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyParentHash');
    assert.ok(fnStart >= 0, 'handleCopyParentHash should exist in main.js');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('focusedIndex'),
      'Should check focusedIndex');
    assert.ok(fnBody.includes('focusedIndex >= 0'),
      'Should prioritize focused over selected');
    assert.ok(fnBody.includes('selectedCommits'),
      'Should fall back to selectedCommits');
  });

  test('main.js handleCopyParentHash sends correct message type', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyParentHash');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copyParentHash'"),
      'Should send copyParentHash message type');
    assert.ok(fnBody.includes('hash: targetCommit.hash'),
      'Should send commit hash');
  });

  test('context menu has copy-parent-hash item with correct icon and label', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-parent-hash"'),
      'Context menu should have copy-parent-hash action');
    assert.ok(source.includes('⧁'),
      'Context menu should have ⧁ icon');
    assert.ok(source.includes('Copy parent hash'),
      'Context menu should have "Copy parent hash" label');
  });

  test('context menu click handles copy-parent-hash action', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("action === 'copy-parent-hash'"),
      'Should handle copy-parent-hash action');
  });

  test('Ctrl+Shift+V keyboard shortcut triggers handleCopyParentHash', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("e.key === 'v'") && source.includes('handleCopyParentHash'),
      'Ctrl+Shift+V should trigger handleCopyParentHash');
  });

  test('package.json registers gitHistory.copyParentHash command', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyParentHash"'),
      'package.json should register gitHistory.copyParentHash command');
  });

  test('package.json has correct keybinding for copyParentHash', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    const json = JSON.parse(content);

    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyParentHash'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyParentHash');
    assert.strictEqual(binding.key, 'ctrl+shift+v');
    assert.strictEqual(binding.mac, 'cmd+shift+v');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('keyboard help includes Copy parent hash', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Copy parent hash'),
      'Keyboard help should include Copy parent hash');
  });
});
