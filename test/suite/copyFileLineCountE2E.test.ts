import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Copy File Line Count E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHash: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-file-line-count-'));
    testFile = path.join(tempDir, 'test.txt');

    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Create initial commit with 3 lines
    fs.writeFileSync(testFile, 'Hello World\nLine 2\nLine 3\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit"', { cwd: tempDir });
    commitHash = execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim();
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('handleCopyFileLineCount should be defined in messageHandler', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFileLineCount'),
      'handleCopyFileLineCount should be defined');
  });

  test('handleCopyFileLineCount should use getFileContentAtCommit', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyFileLineCount');
    assert.ok(fnStart >= 0, 'handleCopyFileLineCount should exist');
    const fnEnd = source.indexOf('function handleCopyFileDirectory', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('getFileContentAtCommit'),
      'Should use getFileContentAtCommit to read file content');
  });

  test('handleCopyFileLineCount should write line count to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyFileLineCount');
    const fnEnd = source.indexOf('function handleCopyFileDirectory', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write to clipboard');
  });

  test('handleCopyFileLineCount should show confirmation message', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyFileLineCount');
    const fnEnd = source.indexOf('function handleCopyFileDirectory', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('showInformationMessage'),
      'Should show confirmation message');
    assert.ok(fnBody.includes('File line count copied:'),
      'Confirmation should say "File line count copied:"');
  });

  test('handleCopyFileLineCount should handle singular/plural forms', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyFileLineCount');
    const fnEnd = source.indexOf('function handleCopyFileDirectory', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes("'line'") || fnBody.includes('"line"'),
      'Should have singular form "line"');
    assert.ok(fnBody.includes("'lines'") || fnBody.includes('"lines"'),
      'Should have plural form "lines"');
  });

  test('handleCopyFileLineCount should handle empty files', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyFileLineCount');
    const fnEnd = source.indexOf('function handleCopyFileDirectory', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes("trim() === ''"),
      'Should handle empty/whitespace-only content');
  });

  test('messageHandler switch case handles copyFileLineCount', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes("case 'copyFileLineCount':"),
      'Switch case for copyFileLineCount should be handled');
  });

  test('types.ts should define copyFileLineCount message type', async () => {
    const typesPath = path.resolve(__dirname, '../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("| { type: 'copyFileLineCount'; hash: string; filePath: string }"),
      'copyFileLineCount should be in WebviewToExtMessage union type');
  });

  test('types.ts should have copyFileLineCount in WebviewAction', async () => {
    const typesPath = path.resolve(__dirname, '../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("| 'copyFileLineCount'"),
      'copyFileLineCount should be in WebviewAction union type');
  });

  test('main.js should have copy-file-line-count context menu item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-file-line-count"'),
      'Context menu should have copy-file-line-count action');
  });

  test('main.js should send copyFileLineCount message with hash and filePath', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("type: 'copyFileLineCount'"),
      'Should send copyFileLineCount message');
  });

  test('main.js should have handleCopyFileLineCount function', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFileLineCount'),
      'Should have handleCopyFileLineCount function');
  });

  test('main.js should handle copyFileLineCount action in triggerAction switch', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'copyFileLineCount':"),
      'Should handle copyFileLineCount action in triggerAction switch');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyFileLineCount"'),
      'package.json should register copyFileLineCount command');
    assert.ok(content.includes('"Git History: Copy File Line Count"'),
      'package.json should have command title');
  });

  test('package.json keybinding registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    const keybindingsSection = content.substring(
      content.indexOf('"keybindings"'),
      content.indexOf('"configuration"')
    );

    assert.ok(keybindingsSection.includes('"gitHistory.copyFileLineCount"'),
      'package.json should have keybinding for copyFileLineCount');
    assert.ok(keybindingsSection.includes('"ctrl+shift+alt+l"'),
      'package.json should bind copyFileLineCount to Ctrl+Shift+Alt+L');
    assert.ok(keybindingsSection.includes('"cmd+shift+alt+l"'),
      'package.json should bind copyFileLineCount to Cmd+Shift+Alt+L on Mac');
  });

  test('extension.ts should register copyFileLineCount command', async () => {
    const extensionPath = path.resolve(__dirname, '../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes("'gitHistory.copyFileLineCount'"),
      'extension.ts should register copyFileLineCount command');
    assert.ok(source.includes("'copyFileLineCount'"),
      'extension.ts should map to copyFileLineCount webview action');
  });
});
