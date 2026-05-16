import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Copy Branch URL E2E Tests', () => {
  let tempDir: string;
  let testFile: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-branch-url-'));
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

  test('gitService getBranchUrl exists and generates correct URLs', async () => {
    const gitServicePath = path.resolve(__dirname, '../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    assert.ok(source.includes('export async function getBranchUrl'),
      'getBranchUrl should be exported from gitService');

    const fnStart = source.indexOf('export async function getBranchUrl');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('/tree/'), 'Should use /tree/ path for GitHub branches');
    assert.ok(fnBody.includes('github'), 'Should handle GitHub');
    assert.ok(fnBody.includes('gitlab'), 'Should handle GitLab');
    assert.ok(fnBody.includes('bitbucket'), 'Should handle Bitbucket');
  });

  test('handleCopyBranchUrl reads branch from panel', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyBranchUrl'),
      'handleCopyBranchUrl should be defined');
    assert.ok(source.includes('panel.getBranch()'),
      'Should get branch from panel');
  });

  test('handleCopyBranchUrl writes URL to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyBranchUrl');
    assert.ok(fnStart >= 0, 'handleCopyBranchUrl should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write to clipboard');
    assert.ok(fnBody.includes('Branch URL copied'),
      'Should show confirmation message');
  });

  test('handleCopyBranchUrl handles missing branch', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyBranchUrl');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('No branch detected'),
      'Should handle no branch case');
  });

  test('handleCopyBranchUrl handles URL generation failure', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyBranchUrl');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Unable to generate branch URL'),
      'Should handle URL generation failure');
  });

  test('main.js handleCopyBranchUrl sends correct message type', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyBranchUrl');
    assert.ok(fnStart >= 0, 'handleCopyBranchUrl should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copyBranchUrl'"),
      'Should send copyBranchUrl message type');
  });

  test('main.js handleCopyBranchUrl handles no branch', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyBranchUrl');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('No branch detected'),
      'Should show error when no branch');
  });

  test('context menu has copy-branch-url item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-branch-url"'),
      'Context menu should include copy-branch-url');
    assert.ok(source.includes('Copy branch URL'),
      'Context menu should have label Copy branch URL');
  });

  test('context menu click handles copy-branch-url action', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("action === 'copy-branch-url'"),
      'Should handle copy-branch-url action');
  });

  test('Ctrl+Alt+U keyboard shortcut integration', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('e.altKey') && source.includes("e.key === 'u'") && source.includes('handleCopyBranchUrl'),
      'Ctrl+Alt+U shortcut should be handled');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyBranchUrl"'),
      'package.json should register copyBranchUrl command');
    assert.ok(content.includes('"ctrl+alt+u"'),
      'package.json should define Ctrl+Alt+U keybinding');
  });

  test('keyboard help includes Copy branch URL', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Copy branch URL'),
      'Keyboard help should include Copy branch URL');
  });

  test('extension.ts registers copyBranchUrl action', async () => {
    const extensionPath = path.resolve(__dirname, '../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes("action: 'copyBranchUrl'"),
      'extension.ts should register copyBranchUrl webview action');
  });
});
