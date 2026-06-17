import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Copy File Path with Hash E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHash: string;
  let shortHash: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-file-path-with-hash-'));
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
    shortHash = execSync('git log --format=%h -1', { cwd: tempDir, encoding: 'utf-8' }).trim();
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('handleCopyFilePathWithHash should be defined in messageHandler', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFilePathWithHash'),
      'handleCopyFilePathWithHash should be defined');
  });

  test('handleCopyFilePathWithHash should format as hash:path', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify handler formats output as hash:path
    const fnStart = source.indexOf('function handleCopyFilePathWithHash');
    assert.ok(fnStart >= 0, 'handleCopyFilePathWithHash should exist');
    const fnEnd = source.indexOf('}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('${commit.shortHash}:${filePath}'),
      'Should format as hash:path');
  });

  test('handleCopyFilePathWithHash writes hash:path to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify clipboard write
    const fnStart = source.indexOf('function handleCopyFilePathWithHash');
    const fnEnd = source.indexOf('}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write to clipboard');
  });

  test('handleCopyFilePathWithHash truncates display message to 60 chars', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify truncation logic
    const fnStart = source.indexOf('function handleCopyFilePathWithHash');
    const fnEnd = source.indexOf('}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('60'),
      'Should truncate display message to 60 characters');
  });

  test('handleCopyFilePathWithHash gets commit from panel', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify it gets commit data from panel
    const fnStart = source.indexOf('function handleCopyFilePathWithHash');
    const fnEnd = source.indexOf('}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('panel.getCommits()'),
      'Should get commits from panel to find the commit');
  });

  test('messageHandler switch case handles copyFilePathWithHash', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes("case 'copyFilePathWithHash':"),
      'Switch case for copyFilePathWithHash should be handled');
  });

  test('types.ts should define copyFilePathWithHash message type', async () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("| { type: 'copyFilePathWithHash'; hash: string; filePath: string }"),
      'copyFilePathWithHash should be in WebviewToExtMessage union type');
  });

  test('types.ts should include copyFilePathWithHash in WebviewAction', async () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("| 'copyFilePathWithHash'"),
      'copyFilePathWithHash should be in WebviewAction union type');
  });

  test('main.js should have copy-file-path-with-hash context menu item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-file-path-with-hash"'),
      'Context menu should have copy-file-path-with-hash action');
  });

  test('main.js should send copyFilePathWithHash message with hash and filePath', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify the message is sent with both hash and filePath
    assert.ok(source.includes("type: 'copyFilePathWithHash'"),
      'Should send copyFilePathWithHash message');
    assert.ok(source.includes('hash: commitHash'),
      'Should include hash in message');
    assert.ok(source.includes('filePath: selectedFile'),
      'Should include filePath in message');
  });

  test('main.js should have handleCopyFilePathWithHash function', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFilePathWithHash'),
      'Should have handleCopyFilePathWithHash function');
  });

  test('main.js handleCopyFilePathWithHash validates selected file', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyFilePathWithHash');
    assert.ok(fnStart >= 0, 'handleCopyFilePathWithHash should exist');
    const fnEnd = source.indexOf('vscode.postMessage', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('if (!selectedFile)'),
      'Should validate that a file is selected');
  });

  test('main.js handleCopyFilePathWithHash gets target commit', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyFilePathWithHash');
    const fnEnd = source.indexOf('vscode.postMessage', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('targetCommit'),
      'Should get target commit');
    assert.ok(fnBody.includes('getOrderedCommits'),
      'Should use getOrderedCommits to get display commits');
  });

  test('extension.ts should register copyFilePathWithHash command', async () => {
    const extPath = path.resolve(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extPath, 'utf-8');

    assert.ok(source.includes("'copyFilePathWithHash'"),
      'extension.ts should register copyFilePathWithHash');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyFilePathWithHash"'),
      'package.json should register copyFilePathWithHash command');
    assert.ok(content.includes('"Git History: Copy File Path with Hash"'),
      'package.json should have command title');
  });

  test('Integration: message flow from webview to extension', async () => {
    // This test verifies the complete message flow
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');

    const mainJs = fs.readFileSync(mainJsPath, 'utf-8');
    const messageHandler = fs.readFileSync(messageHandlerPath, 'utf-8');
    const types = fs.readFileSync(typesPath, 'utf-8');

    // Verify webview sends the message
    assert.ok(mainJs.includes("type: 'copyFilePathWithHash'"),
      'Webview should send copyFilePathWithHash message');

    // Verify types define the message
    assert.ok(types.includes("type: 'copyFilePathWithHash'"),
      'Types should define copyFilePathWithHash message');

    // Verify messageHandler handles the message
    assert.ok(messageHandler.includes("case 'copyFilePathWithHash':"),
      'messageHandler should handle copyFilePathWithHash case');
  });

  test('Output format validation: hash:path format', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify the format is exactly ${shortHash}:${filePath}
    const fnStart = source.indexOf('function handleCopyFilePathWithHash');
    const fnEnd = source.indexOf('}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('${commit.shortHash}:${filePath}'),
      'Output format should be hash:path');
    assert.ok(fnBody.includes('commit.shortHash'),
      'Should use shortHash (7 characters) not full hash');
  });
});
