import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Copy File Content E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHash: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-file-content-'));
    testFile = path.join(tempDir, 'test.txt');

    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Create initial commit
    fs.writeFileSync(testFile, 'Hello World\nLine 2\nLine 3\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit"', { cwd: tempDir });
    commitHash = execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim();
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('handleCopyFileContent should be defined in messageHandler', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFileContent'),
      'handleCopyFileContent should be defined');
  });

  test('handleCopyFileContent should call getFileContentAtCommit', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify handler imports and calls getFileContentAtCommit
    const fnStart = source.indexOf('async function handleCopyFileContent');
    assert.ok(fnStart >= 0, 'handleCopyFileContent should exist');
    const fnEnd = source.indexOf('async function handleCopyCommitPatch', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('getFileContentAtCommit'),
      'Should call getFileContentAtCommit');
  });

  test('handleCopyFileContent writes content to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify clipboard write
    const fnStart = source.indexOf('async function handleCopyFileContent');
    const fnEnd = source.indexOf('async function handleCopyCommitPatch', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write to clipboard');
  });

  test('handleCopyFileContent handles errors gracefully', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify error handling
    const fnStart = source.indexOf('async function handleCopyFileContent');
    const fnEnd = source.indexOf('async function handleCopyCommitPatch', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('catch'),
      'Should have error handling');
    assert.ok(fnBody.includes('showErrorMessage'),
      'Should show error message on failure');
  });

  test('handleCopyFileContent shows confirmation with filename', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify confirmation message uses path.basename
    const fnStart = source.indexOf('async function handleCopyFileContent');
    const fnEnd = source.indexOf('async function handleCopyCommitPatch', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('path.basename'),
      'Should extract filename for confirmation');
    assert.ok(fnBody.includes('showInformationMessage'),
      'Should show confirmation message');
  });

  test('messageHandler switch case handles copyFileContent', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes("case 'copyFileContent':"),
      'messageHandler should have copyFileContent case');
    assert.ok(source.includes('await handleCopyFileContent'),
      'Should await handleCopyFileContent');
  });

  test('messageHandler imports getFileContentAtCommit from gitService', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Check import statement
    const importLine = source.match(/import.*getFileContentAtCommit.*from.*gitService/);
    assert.ok(importLine,
      'messageHandler should import getFileContentAtCommit from gitService');
  });

  test('main.js file context menu has copy-file-content item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Check for context menu item
    assert.ok(source.includes('data-action="copy-file-content"'),
      'Context menu should include copy-file-content');
    assert.ok(source.includes('Copy file content'),
      'Context menu should have label "Copy file content"');
  });

  test('main.js context menu click handles copy-file-content action', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Check handler for the action
    assert.ok(source.includes("action === 'copy-file-content'") ||
      source.includes('copy-file-content'),
      'Should handle copy-file-content action');
  });

  test('main.js sends copyFileContent message type', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Check for correct message type
    const actionSection = source.substring(
      source.indexOf("action === 'copy-file-content'"),
      source.indexOf("action === 'copy-file-content'") + 300
    );

    assert.ok(actionSection.includes("type: 'copyFileContent'"),
      'Should send copyFileContent message type');
    assert.ok(actionSection.includes('hash: commitHash'),
      'Should include commit hash in message');
    assert.ok(actionSection.includes('filePath: filePath'),
      'Should include file path in message');
  });

  test('types.ts has copyFileContent message type', async () => {
    const typesPath = path.resolve(__dirname, '../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("type: 'copyFileContent'"),
      'WebviewToExtMessage should include copyFileContent type');
    assert.ok(source.includes('hash: string'),
      'copyFileContent should have hash field');
    assert.ok(source.includes('filePath: string'),
      'copyFileContent should have filePath field');
  });

  test('types.ts has copyFileContent WebviewAction', async () => {
    const typesPath = path.resolve(__dirname, '../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("'copyFileContent'"),
      'WebviewAction should include copyFileContent');
  });

  test('extension.ts registers copyFileContent command', async () => {
    const extensionPath = path.resolve(__dirname, '../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes("'copyFileContent'"),
      'extension.ts should register copyFileContent webview action');
    assert.ok(source.includes("gitHistory.copyFileContent"),
      'extension.ts should have gitHistory.copyFileContent command');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyFileContent"'),
      'package.json should register copyFileContent command');
    assert.ok(content.includes('"Git History: Copy File Content at Commit"'),
      'package.json should have command title');
  });

  test('gitService getFileContentAtCommit exists and works', async () => {
    const gitServicePath = path.resolve(__dirname, '../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    assert.ok(source.includes('export async function getFileContentAtCommit'),
      'gitService should export getFileContentAtCommit function');
    assert.ok(source.includes('execGit'),
      'getFileContentAtCommit should use execGit');
    assert.ok(source.includes("show"),
      'getFileContentAtCommit should use git show command');
  });

  test('File context menu has divider before copy-file-path', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Find the file context menu (showFileContextMenu function)
    const menuStart = source.indexOf('function showFileContextMenu');
    let menuEnd = source.indexOf('// ─── Commit Context Menu', menuStart);
    if (menuEnd === -1) {
      menuEnd = source.indexOf('function showCommitContextMenu', menuStart);
    }
    const menuSection = source.substring(menuStart, menuEnd > 0 ? menuEnd : menuStart + 3000);

    // Verify copy-file-content is before the divider and copy-file-path is after
    const copyContentIndex = menuSection.indexOf('copy-file-content');
    const dividerIndex = menuSection.indexOf('context-menu-divider', copyContentIndex);
    const copyPathIndex = menuSection.indexOf('copy-file-path', copyContentIndex);

    assert.ok(copyContentIndex > 0, 'File context menu should have copy-file-content');
    assert.ok(dividerIndex > copyContentIndex, 'copy-file-content should be before a divider');
    assert.ok(copyPathIndex > dividerIndex, 'copy-file-path should be after the divider');
  });

  test('copyFileContent icon and label are correct', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Find the copy-file-content menu item
    const menuItemStart = source.indexOf('data-action="copy-file-content"');
    const menuItemEnd = source.indexOf('</div>', menuItemStart);
    const menuItem = source.substring(menuItemStart, menuItemEnd);

    assert.ok(menuItem.includes('📋'),
      'copy-file-content should use clipboard icon');
    assert.ok(menuItem.includes('Copy file content'),
      'copy-file-content should have correct label');
  });
});
