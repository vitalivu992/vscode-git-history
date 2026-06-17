import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Copy File Extension E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHash: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-file-extension-'));
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

  test('handleCopyFileExtension should be defined in messageHandler', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFileExtension'),
      'handleCopyFileExtension should be defined');
  });

  test('handleCopyFileExtension should use path.extname to extract extension', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify handler uses path.extname
    const fnStart = source.indexOf('function handleCopyFileExtension');
    assert.ok(fnStart >= 0, 'handleCopyFileExtension should exist');
    const fnEnd = source.indexOf('function handleCopyRelativePath', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('path.extname'),
      'Should use path.extname to extract extension');
  });

  test('handleCopyFileExtension should remove leading dot from extension', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify handler removes leading dot
    const fnStart = source.indexOf('function handleCopyFileExtension');
    const fnEnd = source.indexOf('function handleCopyRelativePath', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes(".replace(/^\\./, '')"),
      'Should remove leading dot from extension');
  });

  test('handleCopyFileExtension writes extension to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify clipboard write
    const fnStart = source.indexOf('function handleCopyFileExtension');
    const fnEnd = source.indexOf('function handleCopyRelativePath', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write to clipboard');
  });

  test('handleCopyFileExtension shows confirmation with extension', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify confirmation message includes extension
    const fnStart = source.indexOf('function handleCopyFileExtension');
    const fnEnd = source.indexOf('function handleCopyRelativePath', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('showInformationMessage'),
      'Should show confirmation message');
    assert.ok(fnBody.includes('Copied extension:'),
      'Confirmation should say "Copied extension:"');
  });

  test('handleCopyFileExtension handles files with no extension', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify handler handles no extension case
    const fnStart = source.indexOf('function handleCopyFileExtension');
    const fnEnd = source.indexOf('function handleCopyRelativePath', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes("|| 'no extension'") || fnBody.includes('|| "no extension"'),
      'Should handle files with no extension');
  });

  test('messageHandler switch case handles copyFileExtension', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes("case 'copyFileExtension':"),
      'Switch case for copyFileExtension should be handled');
  });

  test('types.ts should define copyFileExtension message type', async () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("| { type: 'copyFileExtension'; filePath: string }"),
      'copyFileExtension should be in WebviewToExtMessage union type');
  });

  test('types.ts should have copyFileExtension in WebviewAction', async () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("| 'copyFileExtension'"),
      'copyFileExtension should be in WebviewAction union type');
  });

  test('main.js should have copy-file-extension context menu item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-file-extension"'),
      'Context menu should have copy-file-extension action');
  });

  test('main.js should send copyFileExtension message', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("type: 'copyFileExtension'"),
      'Should send copyFileExtension message');
  });

  test('main.js should have handleCopyExtension function', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleCopyExtension'),
      'Should have handleCopyExtension function');
  });

  test('main.js should handle copyFileExtension action in triggerAction switch', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'copyFileExtension':"),
      'Should handle copyFileExtension action in triggerAction switch');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyFileExtension"'),
      'package.json should register copyFileExtension command');
    assert.ok(content.includes('"Git History: Copy File Extension"'),
      'package.json should have command title');
  });

  test('package.json keybinding registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    // Find keybinding for copyFileExtension
    const keybindingsSection = content.substring(
      content.indexOf('"keybindings"'),
      content.indexOf('"configuration"')
    );

    assert.ok(keybindingsSection.includes('"gitHistory.copyFileExtension"'),
      'package.json should have keybinding for copyFileExtension');
    assert.ok(keybindingsSection.includes('"ctrl+alt+e"'),
      'package.json should bind copyFileExtension to Ctrl+Alt+E');
    assert.ok(keybindingsSection.includes('"cmd+alt+e"'),
      'package.json should bind copyFileExtension to Cmd+Alt+E on Mac');
  });

  test('extension.ts should register copyFileExtension command', async () => {
    const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes("'gitHistory.copyFileExtension'"),
      'extension.ts should register copyFileExtension command');
    assert.ok(source.includes("'copyFileExtension'"),
      'extension.ts should map to copyFileExtension webview action');
  });

  test('main.js keyboard shortcuts help should include copy file extension', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Copy file extension'),
      'Keyboard shortcuts help should include copy file extension');
    assert.ok(source.includes("'Alt', 'E'") || source.includes("'cmdKey', 'Alt', 'E'"),
      'Keyboard shortcuts help should show Ctrl+Alt+E shortcut');
  });

  test('main.js should handle Ctrl+Alt+E keyboard shortcut', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Find handleKeyDown and verify Ctrl+Alt+E handler
    const kdStart = source.indexOf('function handleKeyDown');
    const kdEnd = source.indexOf('function ', kdStart + 1);
    const kdBody = source.substring(kdStart, kdEnd > 0 ? kdEnd : kdStart + 3000);

    assert.ok(
      kdBody.includes('e.altKey') &&
      kdBody.includes("e.key === 'e'") &&
      kdBody.includes('handleCopyExtension'),
      'handleKeyDown should handle Ctrl+Alt+E and call handleCopyExtension'
    );
  });
});
