import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Copy Show Command E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHash: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-show-command-'));
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

  test('handleCopyShowCommand should be defined in messageHandler', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyShowCommand'),
      'handleCopyShowCommand should be defined');
  });

  test('handleCopyShowCommand should format as git show <hash>', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyShowCommand');
    assert.ok(fnStart >= 0, 'handleCopyShowCommand should exist');
    const fnEnd = source.indexOf('function handleCopyCommitFiles', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('git show'),
      'Should format as git show command');
  });

  test('handleCopyShowCommand writes command to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyShowCommand');
    const fnEnd = source.indexOf('function handleCopyCommitFiles', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write to clipboard');
  });

  test('handleCopyShowCommand shows confirmation with short hash', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyShowCommand');
    const fnEnd = source.indexOf('function handleCopyCommitFiles', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('showInformationMessage'),
      'Should show confirmation message');
    assert.ok(fnBody.includes('Copied git show command for'),
      'Confirmation should say "Copied git show command for"');
  });

  test('handleCopyShowCommand handles commit not found', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyShowCommand');
    const fnEnd = source.indexOf('function handleCopyCommitFiles', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('Commit not found'),
      'Should handle commit not found case');
  });

  test('messageHandler switch case handles copyShowCommand', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes("case 'copyShowCommand':"),
      'Switch case for copyShowCommand should be handled');
  });

  test('types.ts should define copyShowCommand message type', async () => {
    const typesPath = path.resolve(__dirname, '../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("| { type: 'copyShowCommand'; hash: string }"),
      'copyShowCommand should be in WebviewToExtMessage union type');
  });

  test('types.ts should have copyShowCommand in WebviewAction', async () => {
    const typesPath = path.resolve(__dirname, '../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("| 'copyShowCommand'"),
      'copyShowCommand should be in WebviewAction union type');
  });

  test('main.js should have copy-show-command context menu item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-show-command"'),
      'Context menu should have copy-show-command action');
  });

  test('main.js should send copyShowCommand message', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("type: 'copyShowCommand'"),
      'Should send copyShowCommand message');
  });

  test('main.js should have handleCopyShowCommand function', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleCopyShowCommand'),
      'Should have handleCopyShowCommand function');
  });

  test('main.js should handle copyShowCommand action in triggerAction switch', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'copyShowCommand':"),
      'Should handle copyShowCommand action in triggerAction switch');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyShowCommand"'),
      'package.json should register copyShowCommand command');
    assert.ok(content.includes('"Git History: Copy Git Show Command"'),
      'package.json should have command title');
  });

  test('package.json keybinding registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    const keybindingsSection = content.substring(
      content.indexOf('"keybindings"'),
      content.indexOf('"configuration"')
    );

    assert.ok(keybindingsSection.includes('"gitHistory.copyShowCommand"'),
      'package.json should have keybinding for copyShowCommand');
    assert.ok(keybindingsSection.includes('"ctrl+alt+v"'),
      'package.json should bind copyShowCommand to Ctrl+Alt+V');
    assert.ok(keybindingsSection.includes('"cmd+alt+v"'),
      'package.json should bind copyShowCommand to Cmd+Alt+V on Mac');
  });

  test('extension.ts should register copyShowCommand command', async () => {
    const extensionPath = path.resolve(__dirname, '../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes("'gitHistory.copyShowCommand'"),
      'extension.ts should register copyShowCommand command');
    assert.ok(source.includes("'copyShowCommand'"),
      'extension.ts should map to copyShowCommand webview action');
  });

  test('main.js keyboard shortcuts help should include copy git show command', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Copy git show command'),
      'Keyboard shortcuts help should include copy git show command');
    assert.ok(source.includes("'Alt', 'V'"),
      'Keyboard shortcuts help should show Alt+V shortcut');
  });

  test('main.js should handle Ctrl+Alt+V keyboard shortcut', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const kdStart = source.indexOf('function handleKeyDown');
    const kdEnd = source.indexOf('function ', kdStart + 1);
    const kdBody = source.substring(kdStart, kdEnd > 0 ? kdEnd : kdStart + 3000);

    assert.ok(
      kdBody.includes('e.altKey') &&
      kdBody.includes("e.key === 'v'") &&
      kdBody.includes('handleCopyShowCommand'),
      'handleKeyDown should handle Ctrl+Alt+V and call handleCopyShowCommand'
    );
  });
});
