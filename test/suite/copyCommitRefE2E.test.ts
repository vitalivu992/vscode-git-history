import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Copy Commit Reference E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHash: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-commit-ref-'));
    testFile = path.join(tempDir, 'test.txt');

    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Create initial commit
    fs.writeFileSync(testFile, 'Hello World\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit"', { cwd: tempDir });

    // Get the commit hash
    commitHash = execSync('git rev-parse HEAD', { cwd: tempDir, encoding: 'utf-8' }).trim();
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('commit hash is valid 40-character SHA', () => {
    assert.ok(/^[0-9a-f]{40}$/.test(commitHash),
      `Commit hash should be 40-char hex: ${commitHash}`);
  });

  test('handleCopyCommitRef formats reference as refs/commit/hash', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitRef');
    assert.ok(fnStart >= 0, 'handleCopyCommitRef should be defined');

    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('refs/commit/'),
      'Should format as refs/commit/<hash>');
    assert.ok(fnBody.includes('commit.hash'),
      'Should use full commit hash');
  });

  test('handleCopyCommitRef writes reference to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitRef');
    assert.ok(fnStart >= 0, 'handleCopyCommitRef should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write to clipboard');
    assert.ok(fnBody.includes('Commit reference copied'),
      'Should show confirmation message');
  });

  test('handleCopyCommitRef uses short hash in confirmation', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitRef');
    assert.ok(fnStart >= 0, 'handleCopyCommitRef should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('shortHash'),
      'Should use shortHash in confirmation');
  });

  test('handleCopyCommitRef handles commit not found', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitRef');
    assert.ok(fnStart >= 0, 'handleCopyCommitRef should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'Should handle commit not found case');
  });

  test('main.js handleCopyRef sends correct message type', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyRef');
    assert.ok(fnStart >= 0, 'handleCopyRef should exist');
    const fnEnd = source.indexOf('\n}\nfunction', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copyCommitRef'"),
      'Should send copyCommitRef message type');
  });

  test('main.js handleCopyRef prioritizes focused row', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyRef');
    assert.ok(fnStart >= 0, 'handleCopyRef should exist');
    const fnEnd = source.indexOf('\n}\nfunction', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('focusedIndex'),
      'Should check focusedIndex first');
    assert.ok(fnBody.includes('displayCommits[focusedIndex]'),
      'Should get commit from focused row');
  });

  test('main.js handleCopyRef falls back to selected commit', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyRef');
    assert.ok(fnStart >= 0, 'handleCopyRef should exist');
    const fnEnd = source.indexOf('\n}\nfunction', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('selectedCommits.size === 1'),
      'Should fall back to selected commit');
  });

  test('main.js handleCopyRef shows error when no commit selected', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyRef');
    assert.ok(fnStart >= 0, 'handleCopyRef should exist');
    const fnEnd = source.indexOf('\n}\nfunction', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('showError') && fnBody.includes('Select a commit'),
      'Should show error when no commit selected');
  });

  test('context menu has copy-ref item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-ref"'),
      'Context menu should include copy-ref');
    assert.ok(source.includes('Copy commit reference'),
      'Context menu should have label Copy commit reference');
  });

  test('context menu click handles copy-ref action', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("action === 'copy-ref'"),
      'Should handle copy-ref action');
  });

  test('Ctrl+Shift+] keyboard shortcut integration', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const bracketIndex = source.indexOf("e.key === ']'");
    assert.ok(bracketIndex >= 0, 'Should have a handler for key ]');

    const nearby = source.substring(Math.max(0, bracketIndex - 100), bracketIndex + 100);
    assert.ok(nearby.includes('handleCopyRef'),
      'Ctrl+Shift+] shortcut should call handleCopyRef');
  });

  test('Ctrl+Shift+] uses correct modifiers (ctrl/meta + shift)', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const bracketIndex = source.indexOf("e.key === ']'");
    assert.ok(bracketIndex >= 0, 'Should have a handler for key ]');

    const nearby = source.substring(Math.max(0, bracketIndex - 100), bracketIndex + 100);
    assert.ok(nearby.includes('e.ctrlKey || e.metaKey') && nearby.includes('e.shiftKey'),
      'Ctrl+Shift+] shortcut should use ctrl/meta and shift modifiers');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyCommitRef"'),
      'package.json should register copyCommitRef command');
    assert.ok(content.includes('"ctrl+shift+]"'),
      'package.json should define Ctrl+Shift+] keybinding');
  });

  test('package.json keybinding uses when clause', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    const json = JSON.parse(content);

    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyCommitRef'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyCommitRef');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview',
      'Keybinding should only work when webview is active');
  });

  test('extension.ts registers copyCommitRef action', async () => {
    const extensionPath = path.resolve(__dirname, '../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes("action: 'copyCommitRef'"),
      'extension.ts should register copyCommitRef webview action');
  });

  test('messageHandler switch case handles copyCommitRef', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes("case 'copyCommitRef':"),
      'messageHandler should have case for copyCommitRef');
    assert.ok(source.includes('handleCopyCommitRef(message.hash, panel)'),
      'messageHandler should call handleCopyCommitRef with hash and panel');
  });

  test('reference format uses refs/commit/ prefix with full hash', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitRef');
    assert.ok(fnStart >= 0, 'handleCopyCommitRef should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('refs/commit/${commit.hash}'),
      'Reference should use refs/commit/<full-hash> format');
  });
});
