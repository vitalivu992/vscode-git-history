import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Copy Commit BBCode E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHash: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-bbcode-'));
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

  test('handleCopyCommitBbcode with valid commit', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify handler reads from commits array
    assert.ok(source.includes('function handleCopyCommitBbcode'),
      'handleCopyCommitBbcode should be defined');
    assert.ok(source.includes('panel.getCommits()'),
      'Should get commits from panel');
    assert.ok(source.includes('formatCommitAsBbcode(commit)'),
      'Should call formatCommitAsBbcode');
  });

  test('handleCopyCommitBbcode writes BBCode to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify clipboard write with BBCode format
    const fnStart = source.indexOf('function handleCopyCommitBbcode');
    assert.ok(fnStart >= 0, 'handleCopyCommitBbcode should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write to clipboard');
    assert.ok(fnBody.includes('Copied as BBCode'),
      'Should show confirmation with BBCode');
  });

  test('handleCopyCommitBbcode handles missing commit', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify missing commit handling
    const fnStart = source.indexOf('function handleCopyCommitBbcode');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'Should handle commit not found');
  });

  test('formatCommitAsBbcode generates valid BBCode format', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify BBCode format structure
    const fnStart = source.indexOf('function formatCommitAsBbcode');
    assert.ok(fnStart >= 0, 'formatCommitAsBbcode should exist');
    const fnEnd = source.indexOf('}\n', fnStart) + 2;
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('[b]Commit:[/b]'),
      'Should include BBCode Commit header');
    assert.ok(fnBody.includes('[b]Author:[/b]'),
      'Should include BBCode Author header');
    assert.ok(fnBody.includes('[b]Date:[/b]'),
      'Should include BBCode Date header');
  });

  test('formatCommitAsBbcode includes commit hash and subject', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function formatCommitAsBbcode');
    const fnEnd = source.indexOf('}\n', fnStart) + 2;
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('commit.shortHash') && fnBody.includes('commit.message'),
      'Should include shortHash and message in BBCode');
  });

  test('formatCommitAsBbcode includes statistics with singular/plural', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function formatCommitAsBbcode');
    const fnEnd = source.indexOf('}\n', fnStart) + 2;
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('[b]Statistics:[/b]'),
      'Should include Statistics header');
    assert.ok(fnBody.includes("filesChanged === 1 ? 'file' : 'files'"),
      'Should handle singular/plural for file count');
  });

  test('formatCommitAsBbcode includes tags when available', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function formatCommitAsBbcode');
    const fnEnd = source.indexOf('}\n', fnStart) + 2;
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('[b]Tags:[/b]'),
      'Should include Tags header');
    assert.ok(fnBody.includes("commit.tags.join(', ')"),
      'Should comma-separated tags');
  });

  test('formatCommitAsBbcode includes body when different from subject', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function formatCommitAsBbcode');
    const fnEnd = source.indexOf('}\n', fnStart) + 2;
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('[b]Body:[/b]'),
      'Should include Body header');
    assert.ok(fnBody.includes('fullMessage') && fnBody.includes('replace'),
      'Should handle body extraction');
  });

  test('main.js handleCopyBbcode target resolution prioritizes focused', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify focused prioritized over selected
    const fnStart = source.indexOf('function handleCopyBbcode');
    assert.ok(fnStart >= 0, 'handleCopyBbcode should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('focusedIndex'),
      'Should check focusedIndex');
    assert.ok(fnBody.includes('selectedCommits'),
      'Should check selectedCommits');
    assert.ok(fnBody.includes('focusedIndex >= 0'),
      'Should prioritize focused over selected');
  });

  test('main.js handleCopyBbcode sends correct message type', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyBbcode');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copyCommitBbcode'"),
      'Should send copyCommitBbcode message type');
  });

  test('main.js handleCopyBbcode handles no target', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyBbcode');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('Select a commit to copy as BBCode'),
      'Should show error when no commit selected');
  });

  test('context menu has copy-bbcode item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Check for context menu item
    assert.ok(source.includes('data-action="copy-bbcode"'),
      'Context menu should include copy-bbcode');
    assert.ok(source.includes('Copy as BBCode'),
      'Context menu should have label Copy as BBCode');
  });

  test('context menu click handles copy-bbcode action', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Check handler for the action
    assert.ok(source.includes("action === 'copy-bbcode'"),
      'Should handle copy-bbcode action');
  });

  test('Ctrl+Alt+Shift+B keyboard shortcut integration', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify keyboard handler
    assert.ok(source.includes("e.key === 'B'") &&
      source.includes('ctrlKey') &&
      source.includes('altKey') &&
      source.includes('shiftKey') &&
      source.includes('handleCopyBbcode'),
      'Ctrl+Alt+Shift+B shortcut should be handled');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyCommitBbcode"'),
      'package.json should register copyCommitBbcode command');
    assert.ok(content.includes('"ctrl+alt+shift+b"'),
      'package.json should define Ctrl+Alt+Shift+B keybinding');
    assert.ok(content.includes('"cmd+alt+shift+b"'),
      'package.json should define Cmd+Alt+Shift+B keybinding for Mac');
  });

  test('extension.ts webview action registration', async () => {
    const extensionPath = path.resolve(__dirname, '../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes("{ command: 'gitHistory.copyCommitBbcode', action: 'copyCommitBbcode' }"),
      'extension.ts should register copyCommitBbcode webview action');
  });

  test('types.ts includes copyCommitBbcode in WebviewAction', async () => {
    const typesPath = path.resolve(__dirname, '../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("'copyCommitBbcode'"),
      'types.ts should include copyCommitBbcode in WebviewAction');
  });

  test('types.ts includes copyCommitBbcode in WebviewToExtMessage', async () => {
    const typesPath = path.resolve(__dirname, '../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("{ type: 'copyCommitBbcode'; hash: string }"),
      'types.ts should include copyCommitBbcode message type');
  });

  test('triggerAction dispatches copyCommitBbcode', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'copyCommitBbcode': handleCopyBbcode()"),
      'triggerAction should dispatch handleCopyBbcode for copyCommitBbcode action');
  });
});
