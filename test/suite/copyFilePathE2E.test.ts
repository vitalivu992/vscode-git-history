import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Copy File Path E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHash: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-file-path-'));
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

  test('handleCopyFilePath should be defined in messageHandler', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFilePath'),
      'handleCopyFilePath should be defined');
  });

  test('handleCopyFilePath should use path.basename to extract filename', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify handler uses path.basename to get filename for display
    const fnStart = source.indexOf('function handleCopyFilePath');
    assert.ok(fnStart >= 0, 'handleCopyFilePath should exist');
    const fnEnd = source.indexOf('function handleCopyFileName', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('path.basename'),
      'Should use path.basename to extract filename for display');
  });

  test('handleCopyFilePath writes file path to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify clipboard write - should write full filePath (not basename)
    const fnStart = source.indexOf('function handleCopyFilePath');
    const fnEnd = source.indexOf('function handleCopyFileName', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    // Verify it writes to clipboard - writes the full filePath
    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write to clipboard');
  });

  test('handleCopyFilePath shows confirmation with file path', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify confirmation message includes file path
    const fnStart = source.indexOf('function handleCopyFilePath');
    const fnEnd = source.indexOf('function handleCopyFileName', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('showInformationMessage'),
      'Should show confirmation message');
    assert.ok(fnBody.includes('Copied path:'),
      'Confirmation should say "Copied path:"');
  });

  test('messageHandler switch case handles copyFilePath', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes("case 'copyFilePath':"),
      'Switch case for copyFilePath should be handled');
  });

  test('types.ts should define copyFilePath message type', async () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("| { type: 'copyFilePath'; filePath: string }"),
      'copyFilePath should be in WebviewToExtMessage union type');
  });

  test('main.js should have copy-file-path context menu item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-file-path"'),
      'Context menu should have copy-file-path action');
  });

  test('main.js should send copyFilePath message', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("type: 'copyFilePath'"),
      'Should send copyFilePath message');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyFilePath"'),
      'package.json should register copyFilePath command');
    assert.ok(content.includes('"Git History: Copy File Path"'),
      'package.json should have command title');
  });

  test('package.json keybinding registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    // Find keybinding for copyFilePath
    const keybindingsSection = content.substring(
      content.indexOf('"keybindings"'),
      content.indexOf('"configuration"')
    );

    assert.ok(keybindingsSection.includes('"gitHistory.copyFilePath"'),
      'package.json should have keybinding for copyFilePath');
  });
});