import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Copy Commit CSV E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHash: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-csv-'));
    testFile = path.join(tempDir, 'test.txt');

    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Create initial commit
    fs.writeFileSync(testFile, 'Hello World\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit"', { cwd: tempDir });
    commitHash = execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim();
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('handleCopyCommitCsv with valid commit', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify handler reads from commits array
    assert.ok(source.includes('function handleCopyCommitCsv'),
      'handleCopyCommitCsv should be defined');
    assert.ok(source.includes('panel.getCommits()'),
      'Should get commits from panel');
    assert.ok(source.includes('escapeCsvField'),
      'Should call escapeCsvField for CSV formatting');
  });

  test('handleCopyCommitCsv writes CSV to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify clipboard write with CSV format
    const fnStart = source.indexOf('function handleCopyCommitCsv');
    assert.ok(fnStart >= 0, 'handleCopyCommitCsv should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write to clipboard');
    assert.ok(fnBody.includes('Copied as CSV'),
      'Should show confirmation with CSV');
  });

  test('handleCopyCommitCsv handles missing commit', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify missing commit handling
    const fnStart = source.indexOf('function handleCopyCommitCsv');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'Should handle commit not found');
  });

  test('handleCopyCommitCsv generates CSV with header row', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitCsv');
    assert.ok(fnStart >= 0, 'handleCopyCommitCsv should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('headers'),
      'Should define CSV headers');
    assert.ok(fnBody.includes("'Hash'") || fnBody.includes('"Hash"'),
      'Should include Hash header');
    assert.ok(fnBody.includes("'Message'") || fnBody.includes('"Message"'),
      'Should include Message header');
  });

  test('handleCopyCommitCsv includes all commit fields', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitCsv');
    assert.ok(fnStart >= 0, 'handleCopyCommitCsv should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('commit.hash'),
      'Should include full hash');
    assert.ok(fnBody.includes('commit.shortHash'),
      'Should include short hash');
    assert.ok(fnBody.includes('commit.author'),
      'Should include author');
    assert.ok(fnBody.includes('commit.email'),
      'Should include email');
    assert.ok(fnBody.includes('commit.date'),
      'Should include date');
    assert.ok(fnBody.includes('commit.message'),
      'Should include message');
    assert.ok(fnBody.includes('commit.tags'),
      'Should include tags');
  });

  test('handleCopyCommitCsv escapes author and message fields', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitCsv');
    assert.ok(fnStart >= 0, 'handleCopyCommitCsv should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('escapeCsvField(commit.author)'),
      'Should escape author for CSV');
    assert.ok(fnBody.includes('escapeCsvField(commit.message)'),
      'Should escape message for CSV');
  });

  test('handleCopyCommitCsv defaults stats to 0', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitCsv');
    assert.ok(fnStart >= 0, 'handleCopyCommitCsv should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes("'0'"),
      'Should default missing stats to 0');
  });

  test('handleCopyCommitCsv joins tags with semicolon', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitCsv');
    assert.ok(fnStart >= 0, 'handleCopyCommitCsv should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes("join(';')"),
      'Should join tags with semicolon separator');
  });

  test('main.js handleCopyCsv target resolution prioritizes focused', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify focused prioritized over selected
    const fnStart = source.indexOf('function handleCopyCsv');
    assert.ok(fnStart >= 0, 'handleCopyCsv should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('focusedIndex'),
      'Should check focusedIndex');
    assert.ok(fnBody.includes('selectedCommits'),
      'Should check selectedCommits');
    assert.ok(fnBody.includes('focusedIndex >= 0'),
      'Should prioritize focused over selected');
  });

  test('main.js handleCopyCsv sends correct message type', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCsv');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copyCommitCsv'"),
      'Should send copyCommitCsv message type');
  });

  test('main.js handleCopyCsv handles no target', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCsv');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('Select a commit to copy as CSV'),
      'Should show error when no commit selected');
  });

  test('context menu has copy-csv item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Check for context menu item
    assert.ok(source.includes('data-action="copy-csv"'),
      'Context menu should include copy-csv');
    assert.ok(source.includes('Copy as CSV'),
      'Context menu should have label Copy as CSV');
  });

  test('context menu click handles copy-csv action', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Check handler for the action
    assert.ok(source.includes("action === 'copy-csv'"),
      'Should handle copy-csv action');
  });

  test('Ctrl+Alt+Shift+C keyboard shortcut integration', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify keyboard handler
    assert.ok(source.includes("e.key === 'C'") &&
      source.includes('ctrlKey') &&
      source.includes('altKey') &&
      source.includes('shiftKey') &&
      source.includes('handleCopyCsv'),
      'Ctrl+Alt+Shift+C shortcut should be handled');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyCommitCsv"'),
      'package.json should register copyCommitCsv command');
    assert.ok(content.includes('"ctrl+alt+shift+c"'),
      'package.json should define Ctrl+Alt+Shift+C keybinding');
    assert.ok(content.includes('"cmd+alt+shift+c"'),
      'package.json should define Cmd+Alt+Shift+C keybinding for Mac');
  });

  test('extension.ts webview action registration', async () => {
    const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes("{ command: 'gitHistory.copyCommitCsv', action: 'copyCommitCsv' }"),
      'extension.ts should register copyCommitCsv webview action');
  });

  test('types.ts includes copyCommitCsv in WebviewAction', async () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("'copyCommitCsv'"),
      'types.ts should include copyCommitCsv in WebviewAction');
  });

  test('types.ts includes copyCommitCsv in WebviewToExtMessage', async () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("{ type: 'copyCommitCsv'; hash: string }"),
      'types.ts should include copyCommitCsv message type');
  });

  test('triggerAction dispatches copyCommitCsv', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'copyCommitCsv': handleCopyCsv()"),
      'triggerAction should dispatch handleCopyCsv for copyCommitCsv action');
  });
});
