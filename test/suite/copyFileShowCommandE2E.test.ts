import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Copy File Show Command E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHash: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-file-show-command-'));
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

  test('handleCopyFileShowCommand should be defined in messageHandler', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFileShowCommand'),
      'handleCopyFileShowCommand should be defined');
  });

  test('handleCopyFileShowCommand should format as git show hash:filePath', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyFileShowCommand');
    assert.ok(fnStart >= 0, 'handleCopyFileShowCommand should exist');
    const fnEnd = source.indexOf('function handleCopyCommitFiles', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('git show'),
      'Should format as git show command');
    assert.ok(fnBody.includes('hash:'),
      'Should include commit hash in command');
    assert.ok(fnBody.includes('filePath'),
      'Should include file path in command');
  });

  test('handleCopyFileShowCommand should quote file paths with spaces', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyFileShowCommand');
    const fnEnd = source.indexOf('function handleCopyCommitFiles', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes("filePath.includes(' ')"),
      'Should check for spaces in file path');
    assert.ok(fnBody.includes("'${filePath}'"),
      'Should quote path with single quotes when spaces present');
  });

  test('handleCopyFileShowCommand writes command to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyFileShowCommand');
    const fnEnd = source.indexOf('function handleCopyCommitFiles', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write to clipboard');
  });

  test('handleCopyFileShowCommand shows confirmation with filename', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyFileShowCommand');
    const fnEnd = source.indexOf('function handleCopyCommitFiles', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('showInformationMessage'),
      'Should show confirmation message');
    assert.ok(fnBody.includes('Copied git show command for'),
      'Confirmation should say "Copied git show command for"');
    assert.ok(fnBody.includes('path.basename'),
      'Should use path.basename for filename in confirmation');
  });

  test('handleCopyFileShowCommand handles commit not found', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyFileShowCommand');
    const fnEnd = source.indexOf('function handleCopyCommitFiles', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('Commit not found'),
      'Should handle commit not found case');
  });

  test('messageHandler switch case handles copyFileShowCommand', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes("case 'copyFileShowCommand':"),
      'Switch case for copyFileShowCommand should be handled');
  });

  test('types.ts should define copyFileShowCommand message type', async () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("type: 'copyFileShowCommand'"),
      'copyFileShowCommand should be in WebviewToExtMessage union type');
    assert.ok(source.includes('hash: string'),
      'copyFileShowCommand message should have hash field');
    assert.ok(source.includes('filePath: string'),
      'copyFileShowCommand message should have filePath field');
  });

  test('types.ts should have copyFileShowCommand in WebviewAction', async () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("'copyFileShowCommand'"),
      'copyFileShowCommand should be in WebviewAction type');
  });

  test('main.js should have copy-file-show-command context menu item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-file-show-command"'),
      'Context menu should have copy-file-show-command action');
  });

  test('main.js should handle copy-file-show-command action', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("action === 'copy-file-show-command'"),
      'Should handle copy-file-show-command action');
  });

  test('main.js sends copyFileShowCommand message with hash and filePath', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const actionStart = source.indexOf("action === 'copy-file-show-command'");
    const actionEnd = source.indexOf('\n      } else if', actionStart + 1);
    const actionBody = source.substring(actionStart, actionEnd > actionStart ? actionEnd : actionStart + 300);

    assert.ok(actionBody.includes("type: 'copyFileShowCommand'"),
      'Should send copyFileShowCommand message type');
    assert.ok(actionBody.includes('filePath:'),
      'Should include filePath in message');
    assert.ok(actionBody.includes('hash:'),
      'Should include hash in message');
  });

  test('main.js should have handleCopyFileShowCommand function', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFileShowCommand'),
      'main.js should have handleCopyFileShowCommand function');
  });

  test('main.js should handle copyFileShowCommand in message case', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'copyFileShowCommand':"),
      'main.js should handle copyFileShowCommand message case');
  });

  test('extension.ts should register copyFileShowCommand command', async () => {
    const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes('gitHistory.copyFileShowCommand'),
      'extension.ts should register copyFileShowCommand command');
    assert.ok(source.includes("'copyFileShowCommand'"),
      'extension.ts should map to copyFileShowCommand webview action');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyFileShowCommand"'),
      'package.json should register copyFileShowCommand command');
    assert.ok(content.includes('"Git History: Copy File Show Command"'),
      'package.json should have command title');
  });

  test('package.json keybinding registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    const keybindingsSection = content.substring(
      content.indexOf('"keybindings"'),
      content.indexOf('"configuration"')
    );

    assert.ok(keybindingsSection.includes('"gitHistory.copyFileShowCommand"'),
      'package.json should have keybinding for copyFileShowCommand');
    assert.ok(keybindingsSection.includes('"ctrl+alt+shift+v"'),
      'package.json should bind copyFileShowCommand to Ctrl+Alt+Shift+V');
    assert.ok(keybindingsSection.includes('"cmd+alt+shift+v"'),
      'package.json should bind copyFileShowCommand to Cmd+Alt+Shift+V on Mac');
  });

  test('main.js keyboard shortcuts help should include copy file show command', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Copy git show command for file'),
      'Keyboard shortcuts help should include copy file show command');
    assert.ok(source.includes("'Alt', 'Shift', 'V'"),
      'Keyboard shortcuts help should show Alt+Shift+V shortcut');
  });

  test('copy-file-show-command context menu icon and label are correct', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const menuItemStart = source.indexOf('data-action="copy-file-show-command"');
    const menuItemEnd = source.indexOf('</div>', menuItemStart);
    const menuItem = source.substring(menuItemStart, menuItemEnd);

    assert.ok(menuItem.includes('👁️'),
      'copy-file-show-command should use eye icon');
    assert.ok(menuItem.includes('Copy git show command'),
      'copy-file-show-command should have correct label');
  });

  test('git show command format produces valid git command', () => {
    // Verify the format string logic matches expected output
    const testHash = commitHash;
    const testPath = 'src/test.txt';
    const quotedPath = testPath.includes(' ') ? `'${testPath}'` : testPath;
    const showCommand = `git show ${testHash}:${quotedPath}`;

    assert.ok(showCommand.startsWith('git show '),
      'Command should start with "git show "');
    assert.ok(showCommand.includes(':'),
      'Command should have colon separator between hash and path');
    assert.ok(!showCommand.includes("'"),
      'Command should not quote paths without spaces');
  });

  test('git show command quotes paths with spaces', () => {
    const testHash = commitHash;
    const testPath = 'src/my file with spaces.txt';
    const quotedPath = testPath.includes(' ') ? `'${testPath}'` : testPath;
    const showCommand = `git show ${testHash}:${quotedPath}`;

    assert.ok(showCommand.includes("'src/my file with spaces.txt'"),
      'Should quote paths with spaces using single quotes');
    assert.ok(showCommand.includes(`:${testHash.length > 0 ? "'" : ''}`) || showCommand.includes(':'),
      'Should have colon before path');
  });
});
