import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Copy File Name E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHash: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-file-name-'));
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

  test('handleCopyFileName should be defined in messageHandler', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFileName'),
      'handleCopyFileName should be defined');
  });

  test('handleCopyFileName should use path.basename to extract filename', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify handler uses path.basename
    const fnStart = source.indexOf('function handleCopyFileName');
    assert.ok(fnStart >= 0, 'handleCopyFileName should exist');
    const fnEnd = source.indexOf('async function handleOpenFileAtCommit', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('path.basename'),
      'Should use path.basename to extract filename');
  });

  test('handleCopyFileName writes filename to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify clipboard write
    const fnStart = source.indexOf('function handleCopyFileName');
    const fnEnd = source.indexOf('async function handleOpenFileAtCommit', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write to clipboard');
  });

  test('handleCopyFileName shows confirmation with filename', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify confirmation message includes filename
    const fnStart = source.indexOf('function handleCopyFileName');
    const fnEnd = source.indexOf('async function handleOpenFileAtCommit', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('showInformationMessage'),
      'Should show confirmation message');
    assert.ok(fnBody.includes('Copied filename:'),
      'Confirmation should say "Copied filename:"');
  });

  test('messageHandler switch case handles copyFileName', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes("case 'copyFileName':"),
      'Switch case for copyFileName should be handled');
  });

  test('types.ts should define copyFileName message type', async () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("| { type: 'copyFileName'; filePath: string }"),
      'copyFileName should be in WebviewToExtMessage union type');
  });

  test('main.js should have copy-file-name context menu item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-file-name"'),
      'Context menu should have copy-file-name action');
  });

  test('main.js should send copyFileName message', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("type: 'copyFileName'"),
      'Should send copyFileName message');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyFileName"'),
      'package.json should register copyFileName command');
    assert.ok(content.includes('"Git History: Copy File Name Only"'),
      'package.json should have command title');
  });

  test('package.json keybinding registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    // Find keybinding for copyFileName
    const keybindingsSection = content.substring(
      content.indexOf('"keybindings"'),
      content.indexOf('"configuration"')
    );

    assert.ok(keybindingsSection.includes('"gitHistory.copyFileName"'),
      'package.json should have keybinding for copyFileName');
    assert.ok(keybindingsSection.includes('"ctrl+shift+,"'),
      'package.json should bind copyFileName to Ctrl+Shift+,');
    assert.ok(keybindingsSection.includes('"cmd+shift+,"'),
      'package.json should bind copyFileName to Cmd+Shift+, on Mac');
  });
});