import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Copy File Basename E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHash: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-file-basename-'));
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

  test('handleCopyFileBasename should be defined in messageHandler', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFileBasename'),
      'handleCopyFileBasename should be defined');
  });

  test('handleCopyFileBasename should use path.basename to extract filename', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify handler uses path.basename
    const fnStart = source.indexOf('function handleCopyFileBasename');
    assert.ok(fnStart >= 0, 'handleCopyFileBasename should exist');
    const fnEnd = source.indexOf('function handleCopyFileDirectory', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('path.basename'),
      'Should use path.basename to extract filename');
  });

  test('handleCopyFileBasename should use path.extname to extract extension', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify handler uses path.extname
    const fnStart = source.indexOf('function handleCopyFileBasename');
    const fnEnd = source.indexOf('function handleCopyFileDirectory', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('path.extname'),
      'Should use path.extname to extract extension');
  });

  test('handleCopyFileBasename removes extension from filename', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify extension removal logic
    const fnStart = source.indexOf('function handleCopyFileBasename');
    const fnEnd = source.indexOf('function handleCopyFileDirectory', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('replace') || fnBody.includes('.replace'),
      'Should have logic to remove extension');
  });

  test('handleCopyFileBasename writes basename to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify clipboard write
    const fnStart = source.indexOf('function handleCopyFileBasename');
    const fnEnd = source.indexOf('function handleCopyFileDirectory', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write to clipboard');
  });

  test('handleCopyFileBasename shows confirmation with basename', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify confirmation message includes basename
    const fnStart = source.indexOf('function handleCopyFileBasename');
    const fnEnd = source.indexOf('function handleCopyFileDirectory', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('showInformationMessage'),
      'Should show confirmation message');
    assert.ok(fnBody.includes('Copied basename:'),
      'Confirmation should say "Copied basename:"');
  });

  test('messageHandler switch case handles copyFileBasename', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes("case 'copyFileBasename':"),
      'Switch case for copyFileBasename should be handled');
  });

  test('types.ts should define copyFileBasename message type', async () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("| { type: 'copyFileBasename'; filePath: string }"),
      'copyFileBasename should be in WebviewToExtMessage union type');
  });

  test('types.ts should define copyFileBasename WebviewAction', async () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("'copyFileBasename'"),
      'copyFileBasename should be in WebviewAction type');
  });

  test('main.js should have copy-file-basename context menu item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-file-basename"'),
      'Context menu should have copy-file-basename action');
  });

  test('main.js should send copyFileBasename message', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("type: 'copyFileBasename'"),
      'Should send copyFileBasename message');
  });

  test('main.js should have handleCopyFileBasename function', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFileBasename'),
      'main.js should have handleCopyFileBasename function');
  });

  test('main.js should have case for copyFileBasename in message handler', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'copyFileBasename':"),
      'main.js should have case for copyFileBasename');
  });

  test('extension.ts should register copyFileBasename command', async () => {
    const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes('gitHistory.copyFileBasename'),
      'extension.ts should register copyFileBasename command');
    assert.ok(source.includes('action: \'copyFileBasename\''),
      'extension.ts should map command to action');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyFileBasename"'),
      'package.json should register copyFileBasename command');
    assert.ok(content.includes('"Git History: Copy File Basename"'),
      'package.json should have command title');
  });

  test('package.json keybinding registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    // Find keybinding for copyFileBasename
    const keybindingsSection = content.substring(
      content.indexOf('"keybindings"'),
      content.indexOf('"configuration"')
    );

    assert.ok(keybindingsSection.includes('"gitHistory.copyFileBasename"'),
      'package.json should have keybinding for copyFileBasename');
    assert.ok(keybindingsSection.includes('"ctrl+shift+alt+n"'),
      'package.json should bind copyFileBasename to Ctrl+Shift+Alt+N');
    assert.ok(keybindingsSection.includes('"cmd+shift+alt+n"'),
      'package.json should bind copyFileBasename to Cmd+Shift+Alt+N on Mac');
  });

  test('main.js keyboard help should include copyFileBasename', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Copy file basename (without extension)'),
      'main.js keyboard help should include copyFileBasename');
    assert.ok(source.includes("'Shift', 'Alt', 'N'"),
      'main.js should show the keyboard shortcut');
  });
});
