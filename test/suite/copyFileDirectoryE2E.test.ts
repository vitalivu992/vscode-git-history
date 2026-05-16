import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Copy File Directory E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHash: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-file-directory-'));
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

  test('handleCopyFileDirectory should be defined in messageHandler', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFileDirectory'),
      'handleCopyFileDirectory should be defined');
  });

  test('handleCopyFileDirectory should use path.dirname to extract directory', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyFileDirectory');
    assert.ok(fnStart >= 0, 'handleCopyFileDirectory should exist');
    const fnEnd = source.indexOf('function handleCopyRelativePath', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('path.dirname'),
      'Should use path.dirname to extract directory');
  });

  test('handleCopyFileDirectory should add trailing separator to directory path', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyFileDirectory');
    const fnEnd = source.indexOf('function handleCopyRelativePath', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('path.sep') || fnBody.includes("'/'") || fnBody.includes('"\\"'),
      'Should add trailing separator using path.sep or literal');
  });

  test('handleCopyFileDirectory writes directory path to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyFileDirectory');
    const fnEnd = source.indexOf('function handleCopyRelativePath', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write directory path to clipboard');
  });

  test('handleCopyFileDirectory shows confirmation with directory name', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyFileDirectory');
    const fnEnd = source.indexOf('function handleCopyRelativePath', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('showInformationMessage'),
      'Should show confirmation message');
    assert.ok(fnBody.includes('Copied directory:'),
      'Confirmation should say "Copied directory:"');
  });

  test('handleCopyFileDirectory extracts directory name for confirmation', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyFileDirectory');
    const fnEnd = source.indexOf('function handleCopyRelativePath', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('path.basename'),
      'Should use path.basename to extract directory name for confirmation');
  });

  test('messageHandler switch case handles copyFileDirectory', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes("case 'copyFileDirectory':"),
      'Switch case for copyFileDirectory should be handled');
  });

  test('types.ts should define copyFileDirectory message type', async () => {
    const typesPath = path.resolve(__dirname, '../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("| { type: 'copyFileDirectory'; filePath: string }"),
      'copyFileDirectory should be in WebviewToExtMessage union type');
  });

  test('types.ts should have copyFileDirectory WebviewAction', async () => {
    const typesPath = path.resolve(__dirname, '../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("'copyFileDirectory'"),
      'copyFileDirectory should be in WebviewAction type');
  });

  test('main.js should have copy-file-directory context menu item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-file-directory"'),
      'Context menu should have copy-file-directory action');
  });

  test('main.js should have folder icon for copy file directory', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Find the copy-file-directory menu item and check for icon
    const menuStart = source.indexOf('data-action="copy-file-directory"');
    assert.ok(menuStart >= 0, 'copy-file-directory menu item should exist');
    const menuSection = source.substring(menuStart - 30, menuStart + 50);

    assert.ok(menuSection.includes('context-menu-icon'),
      'Copy file directory should have an icon');
  });

  test('main.js should send copyFileDirectory message', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("type: 'copyFileDirectory'"),
      'Should send copyFileDirectory message');
  });

  test('main.js should have handleCopyFileDirectory function', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFileDirectory'),
      'main.js should have handleCopyFileDirectory function');
  });

  test('main.js handleCopyFileDirectory should check selectedFile', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyFileDirectory');
    const fnEnd = source.indexOf('function handleCopyFilePath', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 200);

    assert.ok(fnBody.includes('selectedFile'),
      'handleCopyFileDirectory should check selectedFile');
  });

  test('main.js should handle copyFileDirectory message in handleMessage', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'copyFileDirectory':"),
      'main.js handleMessage should handle copyFileDirectory case');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyFileDirectory"'),
      'package.json should register copyFileDirectory command');
    assert.ok(content.includes('"Git History: Copy File Directory"'),
      'package.json should have command title');
  });

  test('package.json keybinding registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    // Find keybinding for copyFileDirectory
    const keybindingsSection = content.substring(
      content.indexOf('"keybindings"'),
      content.indexOf('"configuration"')
    );

    assert.ok(keybindingsSection.includes('"gitHistory.copyFileDirectory"'),
      'package.json should have keybinding for copyFileDirectory');
    assert.ok(keybindingsSection.includes('ctrl+alt+k') || keybindingsSection.includes('cmd+alt+k'),
      'package.json should have ctrl+alt+k/cmd+alt+k keybinding for copyFileDirectory');
  });

  test('extension.ts should register copyFileDirectory webview action', async () => {
    const extensionPath = path.resolve(__dirname, '../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes("'copyFileDirectory'"),
      'extension.ts should register copyFileDirectory in webviewActions');
  });

  test('main.js keyboard help should include copy file directory', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Copy file directory'),
      'Keyboard help should include Copy file directory');
  });

  test('README.md should document copy file directory feature', async () => {
    const readmePath = path.resolve(__dirname, '../../../README.md');
    const source = fs.readFileSync(readmePath, 'utf-8');

    assert.ok(source.includes('Copy file directory'),
      'README should document Copy file directory feature');
  });

  test('README.md should have keyboard shortcut for copy file directory', async () => {
    const readmePath = path.resolve(__dirname, '../../../README.md');
    const source = fs.readFileSync(readmePath, 'utf-8');

    assert.ok(source.includes('Ctrl+Alt+K') || source.includes('Cmd+Alt+K'),
      'README should document keyboard shortcut for copy file directory');
  });

  test('CHANGELOG.md should mention copy file directory feature', async () => {
    const changelogPath = path.resolve(__dirname, '../../CHANGELOG.md');
    const source = fs.readFileSync(changelogPath, 'utf-8');

    assert.ok(source.includes('Copy file directory') || source.includes('copy file directory'),
      'CHANGELOG should mention copy file directory feature');
  });
});
