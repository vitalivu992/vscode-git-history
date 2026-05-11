import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Copy Commit URL E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHash: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-commit-url-'));
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

    // Add a remote for URL testing
    execSync('git remote add origin https://github.com/test/repo.git', { cwd: tempDir });
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('gitService getCommitUrl exists and generates correct URLs', async () => {
    const gitServicePath = path.resolve(__dirname, '../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    assert.ok(source.includes('export async function getCommitUrl'),
      'getCommitUrl should be exported from gitService');

    const fnStart = source.indexOf('export async function getCommitUrl');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('/commit/'), 'Should use /commit/ path for GitHub commits');
    assert.ok(fnBody.includes('github'), 'Should handle GitHub');
    assert.ok(fnBody.includes('gitlab'), 'Should handle GitLab');
    assert.ok(fnBody.includes('bitbucket'), 'Should handle Bitbucket');
  });

  test('getCommitUrl uses short hash (7 characters) for URLs', async () => {
    const gitServicePath = path.resolve(__dirname, '../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    const fnStart = source.indexOf('export async function getCommitUrl');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('substring(0, 7)'),
      'getCommitUrl should use short hash (7 characters) for URLs');
  });

  test('getCommitUrl handles GitHub platform correctly', async () => {
    const gitServicePath = path.resolve(__dirname, '../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    const fnStart = source.indexOf('export async function getCommitUrl');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes("'github'"),
      'Should handle GitHub platform');
    assert.ok(fnBody.includes('/commit/'),
      'Should use /commit/ path for GitHub');
  });

  test('getCommitUrl handles GitLab platform correctly', async () => {
    const gitServicePath = path.resolve(__dirname, '../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    const fnStart = source.indexOf('export async function getCommitUrl');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes("'gitlab'"),
      'Should handle GitLab platform');
    assert.ok(fnBody.includes('/-/commit/'),
      'Should use /-/commit/ path for GitLab');
  });

  test('getCommitUrl handles Bitbucket platform correctly', async () => {
    const gitServicePath = path.resolve(__dirname, '../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    const fnStart = source.indexOf('export async function getCommitUrl');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes("'bitbucket'"),
      'Should handle Bitbucket platform');
    assert.ok(fnBody.includes('/commits/'),
      'Should use /commits/ path for Bitbucket');
  });

  test('getCommitUrl returns null when no remote configured', async () => {
    const gitServicePath = path.resolve(__dirname, '../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    const fnStart = source.indexOf('export async function getCommitUrl');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('return null'),
      'getCommitUrl should return null when no remote is configured');
  });

  test('handleCopyCommitUrl reads hash from message', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyCommitUrl'),
      'handleCopyCommitUrl should be defined');
    assert.ok(source.includes('hash: string'),
      'handleCopyCommitUrl should accept hash parameter');
  });

  test('handleCopyCommitUrl uses getCommitUrl to generate URL', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitUrl');
    assert.ok(fnStart >= 0, 'handleCopyCommitUrl should exist');
    const fnEnd = source.indexOf('}\n', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('getCommitUrl'),
      'handleCopyCommitUrl should call getCommitUrl');
  });

  test('handleCopyCommitUrl writes URL to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitUrl');
    assert.ok(fnStart >= 0, 'handleCopyCommitUrl should exist');
    const fnEnd = source.indexOf('}\n', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write to clipboard');
    assert.ok(fnBody.includes('Commit URL copied'),
      'Should show confirmation message');
  });

  test('handleCopyCommitUrl includes short hash in confirmation', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitUrl');
    assert.ok(fnStart >= 0, 'handleCopyCommitUrl should exist');
    const fnEnd = source.indexOf('}\n', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('substring(0, 7)'),
      'Should extract short hash for confirmation message');
  });

  test('handleCopyCommitUrl handles no remote case', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitUrl');
    assert.ok(fnStart >= 0, 'handleCopyCommitUrl should exist');
    const fnEnd = source.indexOf('}\n', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('No git remote configured'),
      'Should handle no remote case');
  });

  test('handleCopyCommitUrl handles unknown platform case', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitUrl');
    assert.ok(fnStart >= 0, 'handleCopyCommitUrl should exist');
    const fnEnd = source.indexOf('}\n', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Unable to detect git platform'),
      'Should handle unknown platform case');
    assert.ok(fnBody.includes('Supported: GitHub, GitLab, Bitbucket'),
      'Should list supported platforms in error message');
  });

  test('handleCopyCommitUrl handles URL generation failure', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitUrl');
    assert.ok(fnStart >= 0, 'handleCopyCommitUrl should exist');
    const fnEnd = source.indexOf('}\n', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Failed to generate commit URL'),
      'Should handle URL generation failure');
  });

  test('main.js handleCopyUrl sends correct message type', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyUrl');
    assert.ok(fnStart >= 0, 'handleCopyUrl should exist');
    const fnEnd = source.indexOf('\n}\nfunction', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copyCommitUrl'"),
      'Should send copyCommitUrl message type');
  });

  test('main.js handleCopyUrl prioritizes focused row', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyUrl');
    assert.ok(fnStart >= 0, 'handleCopyUrl should exist');
    const fnEnd = source.indexOf('\n}\nfunction', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('focusedIndex'),
      'Should check focusedIndex first');
    assert.ok(fnBody.includes('displayCommits[focusedIndex]'),
      'Should get commit from focused row');
  });

  test('main.js handleCopyUrl falls back to selected commit', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyUrl');
    assert.ok(fnStart >= 0, 'handleCopyUrl should exist');
    const fnEnd = source.indexOf('\n}\nfunction', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('selectedCommits.size === 1'),
      'Should fall back to selected commit');
  });

  test('main.js handleCopyUrl shows error when no commit selected', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyUrl');
    assert.ok(fnStart >= 0, 'handleCopyUrl should exist');
    const fnEnd = source.indexOf('\n}\nfunction', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('showError') && fnBody.includes('Select a commit'),
      'Should show error when no commit selected');
  });

  test('context menu has copy-commit-url item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-commit-url"'),
      'Context menu should include copy-commit-url');
    assert.ok(source.includes('Copy commit URL'),
      'Context menu should have label Copy commit URL');
  });

  test('context menu click handles copy-commit-url action', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("action === 'copy-commit-url'"),
      'Should handle copy-commit-url action');
  });

  test('Ctrl+Shift+L keyboard shortcut integration', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Find the Ctrl+Shift+L shortcut handler
    const lShortcutIndex = source.indexOf("e.key === 'l'");
    assert.ok(lShortcutIndex >= 0, 'Should have a handler for key l');

    const nearby = source.substring(Math.max(0, lShortcutIndex - 100), lShortcutIndex + 100);
    assert.ok(nearby.includes('handleCopyUrl'),
      'Ctrl+Shift+L shortcut should call handleCopyUrl');
  });

  test('Ctrl+Shift+L uses correct modifiers (ctrl/meta + shift)', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Find the Ctrl+Shift+L shortcut handler
    const lShortcutIndex = source.indexOf("e.key === 'l'");
    assert.ok(lShortcutIndex >= 0, 'Should have a handler for key l');

    const nearby = source.substring(Math.max(0, lShortcutIndex - 100), lShortcutIndex + 100);
    assert.ok(nearby.includes('e.ctrlKey || e.metaKey') && nearby.includes('e.shiftKey'),
      'Ctrl+Shift+L shortcut should use ctrl/meta and shift modifiers');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyCommitUrl"'),
      'package.json should register copyCommitUrl command');
    assert.ok(content.includes('"ctrl+shift+l"'),
      'package.json should define Ctrl+Shift+L keybinding');
  });

  test('package.json keybinding uses when clause', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    const json = JSON.parse(content);

    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyCommitUrl'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyCommitUrl');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview',
      'Keybinding should only work when webview is active');
  });

  test('keyboard help includes Copy commit URL', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Copy commit URL'),
      'Keyboard help should include Copy commit URL');
  });

  test('extension.ts registers copyCommitUrl action', async () => {
    const extensionPath = path.resolve(__dirname, '../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes("action: 'copyCommitUrl'"),
      'extension.ts should register copyCommitUrl webview action');
  });

  test('messageHandler switch case handles copyCommitUrl', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes("case 'copyCommitUrl':"),
      'messageHandler should have case for copyCommitUrl');
    assert.ok(source.includes('await handleCopyCommitUrl(message.hash, panel)'),
      'messageHandler should call handleCopyCommitUrl with hash and panel');
  });

  test('parseRemoteUrl handles different URL formats', async () => {
    const gitServicePath = path.resolve(__dirname, '../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    const fnStart = source.indexOf('export function parseRemoteUrl');
    assert.ok(fnStart >= 0, 'parseRemoteUrl should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('github.com'),
      'Should handle github.com URLs');
    assert.ok(fnBody.includes('gitlab.com'),
      'Should handle gitlab.com URLs');
    assert.ok(fnBody.includes('bitbucket.org'),
      'Should handle bitbucket.org URLs');
  });

  test('getRemoteUrl function exists for URL generation', async () => {
    const gitServicePath = path.resolve(__dirname, '../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    assert.ok(source.includes('export async function getRemoteUrl'),
      'getRemoteUrl should be exported from gitService');
  });

  test('platform detection function exists', async () => {
    const gitServicePath = path.resolve(__dirname, '../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    assert.ok(source.includes('function detectGitPlatform'),
      'detectGitPlatform function should exist');
    assert.ok(source.includes("'github'") && source.includes("'gitlab'") && source.includes("'bitbucket'"),
      'Should detect GitHub, GitLab, and Bitbucket platforms');
  });

  test('getCommitUrl function signature is correct', async () => {
    const gitServicePath = path.resolve(__dirname, '../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    assert.ok(source.includes('getCommitUrl(') && source.includes('hash: string') && source.includes('cwd: string'),
      'getCommitUrl should accept hash and cwd parameters');
  });

  test('handleCopyCommitUrl has error handling', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitUrl');
    assert.ok(fnStart >= 0, 'handleCopyCommitUrl should exist');
    const fnEnd = source.lastIndexOf('}', source.indexOf('\n}', fnStart) + 100);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('try') && fnBody.includes('catch'),
      'handleCopyCommitUrl should have try-catch error handling');
  });
});
