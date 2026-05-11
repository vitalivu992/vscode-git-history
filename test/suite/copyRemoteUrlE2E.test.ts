import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Copy Remote URL E2E Tests', () => {
  let tempDir: string;
  let testFile: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-remote-url-'));
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

  test('gitService getRemoteUrl exists and retrieves remote URL', async () => {
    const gitServicePath = path.resolve(__dirname, '../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    assert.ok(source.includes('export async function getRemoteUrl'),
      'getRemoteUrl should be exported from gitService');

    const fnStart = source.indexOf('export async function getRemoteUrl');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('remote'), 'Should use remote parameter');
    assert.ok(fnBody.includes('get-url'), 'Should use git remote get-url command');
  });

  test('handleCopyRemoteUrl reads remote URL via getRemoteUrl', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyRemoteUrl'),
      'handleCopyRemoteUrl should be defined');
    assert.ok(source.includes('getRemoteUrl'),
      'Should call getRemoteUrl');
  });

  test('handleCopyRemoteUrl writes URL to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyRemoteUrl');
    assert.ok(fnStart >= 0, 'handleCopyRemoteUrl should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write to clipboard');
    assert.ok(fnBody.includes('Remote URL copied'),
      'Should show confirmation message');
  });

  test('handleCopyRemoteUrl handles missing remote', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyRemoteUrl');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('No git remote configured'),
      'Should handle no remote case');
  });

  test('main.js handleCopyRemoteUrl sends correct message type', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyRemoteUrl');
    assert.ok(fnStart >= 0, 'handleCopyRemoteUrl should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copyRemoteUrl'"),
      'Should send copyRemoteUrl message type');
  });

  test('context menu has copy-remote-url item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-remote-url"'),
      'Context menu should include copy-remote-url');
    assert.ok(source.includes('Copy remote URL'),
      'Context menu should have label Copy remote URL');
  });

  test('context menu click handles copy-remote-url action', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("action === 'copy-remote-url'"),
      'Should handle copy-remote-url action');
  });

  test('Ctrl+Alt+O keyboard shortcut integration', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('e.altKey') && source.includes("e.key === 'o'") && source.includes('handleCopyRemoteUrl'),
      'Ctrl+Alt+O shortcut should be handled');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyRemoteUrl"'),
      'package.json should register copyRemoteUrl command');
    assert.ok(content.includes('"ctrl+alt+o"'),
      'package.json should define Ctrl+Alt+O keybinding');
  });

  test('keyboard help includes Copy remote URL', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Copy remote URL'),
      'Keyboard help should include Copy remote URL');
  });

  test('extension.ts registers copyRemoteUrl action', async () => {
    const extensionPath = path.resolve(__dirname, '../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes("action: 'copyRemoteUrl'"),
      'extension.ts should register copyRemoteUrl webview action');
  });
});
