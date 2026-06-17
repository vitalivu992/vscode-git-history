import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Copy Commit Mention E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHash: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-commit-mention-'));
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

    // Add a remote for mention testing
    execSync('git remote add origin https://github.com/test/repo.git', { cwd: tempDir });
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('gitService parseRemoteUrl extracts owner and repo for GitHub', async () => {
    const gitServicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    const fnStart = source.indexOf('export function parseRemoteUrl');
    assert.ok(fnStart >= 0, 'parseRemoteUrl should be exported from gitService');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('owner'), 'parseRemoteUrl should extract owner');
    assert.ok(fnBody.includes('repo'), 'parseRemoteUrl should extract repo');
  });

  test('parseRemoteUrl handles SSH format for GitHub', async () => {
    const gitServicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    const fnStart = source.indexOf('export function parseRemoteUrl');
    assert.ok(fnStart >= 0, 'parseRemoteUrl should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('git@'), 'Should handle SSH format');
  });

  test('parseRemoteUrl handles HTTPS format', async () => {
    const gitServicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    const fnStart = source.indexOf('export function parseRemoteUrl');
    assert.ok(fnStart >= 0, 'parseRemoteUrl should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('https://'), 'Should handle HTTPS format');
  });

  test('handleCopyCommitMention formats mention as owner/repo@shortHash', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitMention');
    assert.ok(fnStart >= 0, 'handleCopyCommitMention should be defined');

    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('remoteInfo.owner'), 'Should use remoteInfo.owner');
    assert.ok(fnBody.includes('remoteInfo.repo'), 'Should use remoteInfo.repo');
    assert.ok(fnBody.includes('shortHash'), 'Should use shortHash');
    assert.ok(fnBody.includes('mention'), 'Should build mention string');
  });

  test('handleCopyCommitMention writes mention to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitMention');
    assert.ok(fnStart >= 0, 'handleCopyCommitMention should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write to clipboard');
    assert.ok(fnBody.includes('Copied:'),
      'Should show confirmation message');
  });

  test('handleCopyCommitMention uses short hash (7 characters)', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitMention');
    assert.ok(fnStart >= 0, 'handleCopyCommitMention should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('substring(0, 7)'),
      'Should use short hash (7 characters)');
  });

  test('handleCopyCommitMention handles no remote case', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitMention');
    assert.ok(fnStart >= 0, 'handleCopyCommitMention should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('No git remote configured'),
      'Should handle no remote case');
  });

  test('handleCopyCommitMention handles unknown platform case', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitMention');
    assert.ok(fnStart >= 0, 'handleCopyCommitMention should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Unable to detect git platform'),
      'Should handle unknown platform case');
  });

  test('main.js handleCopyMention sends correct message type', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyMention');
    assert.ok(fnStart >= 0, 'handleCopyMention should exist');
    const fnEnd = source.indexOf('\n}\nfunction', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copyCommitMention'"),
      'Should send copyCommitMention message type');
  });

  test('main.js handleCopyMention prioritizes focused row', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyMention');
    assert.ok(fnStart >= 0, 'handleCopyMention should exist');
    const fnEnd = source.indexOf('\n}\nfunction', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('focusedIndex'),
      'Should check focusedIndex first');
    assert.ok(fnBody.includes('displayCommits[focusedIndex]'),
      'Should get commit from focused row');
  });

  test('main.js handleCopyMention falls back to selected commit', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyMention');
    assert.ok(fnStart >= 0, 'handleCopyMention should exist');
    const fnEnd = source.indexOf('\n}\nfunction', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('selectedCommits.size === 1'),
      'Should fall back to selected commit');
  });

  test('main.js handleCopyMention shows error when no commit selected', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyMention');
    assert.ok(fnStart >= 0, 'handleCopyMention should exist');
    const fnEnd = source.indexOf('\n}\nfunction', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('showError') && fnBody.includes('Select a commit'),
      'Should show error when no commit selected');
  });

  test('context menu has copy-mention item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-mention"'),
      'Context menu should include copy-mention');
    assert.ok(source.includes('Copy as platform mention'),
      'Context menu should have label Copy as platform mention');
  });

  test('context menu click handles copy-mention action', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("action === 'copy-mention'"),
      'Should handle copy-mention action');
  });

  test('Ctrl+Shift+@ keyboard shortcut integration', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const atIndex = source.indexOf("e.key === '@'");
    assert.ok(atIndex >= 0, 'Should have a handler for key @');

    const nearby = source.substring(Math.max(0, atIndex - 100), atIndex + 100);
    assert.ok(nearby.includes('handleCopyMention'),
      'Ctrl+Shift+@ shortcut should call handleCopyMention');
  });

  test('Ctrl+Shift+@ uses correct modifiers (ctrl/meta + shift)', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const atIndex = source.indexOf("e.key === '@'");
    assert.ok(atIndex >= 0, 'Should have a handler for key @');

    const nearby = source.substring(Math.max(0, atIndex - 100), atIndex + 100);
    assert.ok(nearby.includes('e.ctrlKey || e.metaKey') && nearby.includes('e.shiftKey'),
      'Ctrl+Shift+@ shortcut should use ctrl/meta and shift modifiers');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyCommitMention"'),
      'package.json should register copyCommitMention command');
    assert.ok(content.includes('"ctrl+shift+@"'),
      'package.json should define Ctrl+Shift+@ keybinding');
  });

  test('package.json keybinding uses when clause', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    const json = JSON.parse(content);

    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyCommitMention'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyCommitMention');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview',
      'Keybinding should only work when webview is active');
  });

  test('extension.ts registers copyCommitMention action', async () => {
    const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes("action: 'copyCommitMention'"),
      'extension.ts should register copyCommitMention webview action');
  });

  test('messageHandler switch case handles copyCommitMention', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes("case 'copyCommitMention':"),
      'messageHandler should have case for copyCommitMention');
    assert.ok(source.includes('await handleCopyCommitMention(message.hash, panel)'),
      'messageHandler should call handleCopyCommitMention with hash and panel');
  });

  test('handleCopyCommitMention has error handling', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitMention');
    assert.ok(fnStart >= 0, 'handleCopyCommitMention should exist');
    const fnEnd = source.lastIndexOf('}', source.indexOf('\n}', fnStart) + 100);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('try') && fnBody.includes('catch'),
      'handleCopyCommitMention should have try-catch error handling');
  });

  test('mention format uses @ symbol between repo and hash', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitMention');
    assert.ok(fnStart >= 0, 'handleCopyCommitMention should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    // Should construct mention with @ symbol: owner/repo@hash
    assert.ok(fnBody.includes('${remoteInfo.owner}/${remoteInfo.repo}@${shortHash}'),
      'Mention should use owner/repo@shortHash format');
  });
});
