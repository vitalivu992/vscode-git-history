import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Copy File URL E2E Tests', () => {
  let tempDir: string;
  let testFile: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-file-url-'));
    testFile = path.join(tempDir, 'test.txt');

    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Create initial commit
    fs.writeFileSync(testFile, 'Hello World\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit"', { cwd: tempDir });

    // Add a remote for URL testing
    execSync('git remote add origin https://github.com/test/repo.git', { cwd: tempDir });
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('gitService getFileUrl exists and generates correct URLs', async () => {
    const gitServicePath = path.resolve(__dirname, '../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    assert.ok(source.includes('export async function getFileUrl'),
      'getFileUrl should be exported from gitService');

    const fnStart = source.indexOf('export async function getFileUrl');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('/blob/'), 'Should use /blob/ path for GitHub files');
    assert.ok(fnBody.includes('github'), 'Should handle GitHub');
    assert.ok(fnBody.includes('gitlab'), 'Should handle GitLab');
    assert.ok(fnBody.includes('bitbucket'), 'Should handle Bitbucket');
  });

  test('getFileUrl uses short hash for URLs', async () => {
    const gitServicePath = path.resolve(__dirname, '../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    const fnStart = source.indexOf('export async function getFileUrl');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('substring(0, 7)'),
      'Should use 7-character short hash for file URLs');
  });

  test('getFileUrl normalizes file paths', async () => {
    const gitServicePath = path.resolve(__dirname, '../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    const fnStart = source.indexOf('export async function getFileUrl');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('startsWith') && fnBody.includes('slice'),
      'Should normalize file path (remove leading ./)');
  });

  test('handleCopyFileUrl gets commit from panel', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFileUrl'),
      'handleCopyFileUrl should be defined');
    assert.ok(source.includes('panel.getCommits()'),
      'Should get commits from panel');
  });

  test('handleCopyFileUrl calls getFileUrl with correct parameters', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyFileUrl');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('getFileUrl(filePath, hash'),
      'Should call getFileUrl with filePath and hash');
  });

  test('handleCopyFileUrl writes URL to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyFileUrl');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write to clipboard');
    assert.ok(fnBody.includes('File URL copied'),
      'Should show confirmation message');
  });

  test('handleCopyFileUrl handles commit not found', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyFileUrl');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'Should handle commit not found case');
  });

  test('handleCopyFileUrl handles URL generation failure', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyFileUrl');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Unable to generate file URL'),
      'Should handle URL generation failure');
  });

  test('main.js handleCopyFileUrl sends correct message type', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyFileUrl');
    assert.ok(fnStart >= 0, 'handleCopyFileUrl should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copyFileUrl'"),
      'Should send copyFileUrl message type');
    assert.ok(fnBody.includes('hash: targetCommit.hash'),
      'Should include commit hash');
    assert.ok(fnBody.includes('filePath: selectedFile'),
      'Should include file path');
  });

  test('main.js handleCopyFileUrl checks for selected file', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyFileUrl');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('if (!selectedFile)'),
      'Should check if file is selected');
    assert.ok(fnBody.includes('Select a file to copy its URL'),
      'Should show error when no file selected');
  });

  test('main.js handleCopyFileUrl gets target commit correctly', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyFileUrl');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('getOrderedCommits'),
      'Should get ordered commits');
    assert.ok(fnBody.includes('focusedIndex') || fnBody.includes('selectedCommits'),
      'Should get target commit from focus or selection');
  });

  test('context menu has copy-file-url item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-file-url"'),
      'Context menu should include copy-file-url');
    assert.ok(source.includes('Copy file permalink'),
      'Context menu should have label Copy file permalink');
  });

  test('context menu click handles copy-file-url action', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("action === 'copy-file-url'"),
      'Should handle copy-file-url action');
    const handlerIdx = source.indexOf("action === 'copy-file-url'");
    const nearby = source.substring(handlerIdx, handlerIdx + 200);
    assert.ok(nearby.includes('copyFileUrl'),
      'Should send copyFileUrl message');
  });

  test('Ctrl+Alt+Shift+U keyboard shortcut integration', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('e.altKey') && source.includes('e.shiftKey') && source.includes("key === 'u'") && source.includes('handleCopyFileUrl'),
      'Ctrl+Alt+Shift+U shortcut should be handled');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyFileUrl"'),
      'package.json should register copyFileUrl command');
    assert.ok(content.includes('"ctrl+alt+shift+u"'),
      'package.json should define Ctrl+Alt+Shift+U keybinding');
  });

  test('extension.ts registers copyFileUrl action', async () => {
    const extensionPath = path.resolve(__dirname, '../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes("action: 'copyFileUrl'"),
      'extension.ts should register copyFileUrl webview action');
  });

  test('getFileUrl returns null for unknown platforms', async () => {
    const gitServicePath = path.resolve(__dirname, '../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    const fnStart = source.indexOf('export async function getFileUrl');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('return null'),
      'Should return null for unknown platforms');
  });

  test('getFileUrl checks for remote URL', async () => {
    const gitServicePath = path.resolve(__dirname, '../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    const fnStart = source.indexOf('export async function getFileUrl');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('getRemoteUrl'),
      'Should check for remote URL');
  });

  test('types.ts has copyFileUrl in WebviewToExtMessage', async () => {
    const typesPath = path.resolve(__dirname, '../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("{ type: 'copyFileUrl'; hash: string; filePath: string }"),
      'WebviewToExtMessage should include copyFileUrl with hash and filePath');
  });
});
