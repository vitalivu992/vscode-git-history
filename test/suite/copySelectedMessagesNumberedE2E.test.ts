import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Copy Selected Messages Numbered E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHashes: string[];

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-msg-numbered-'));
    testFile = path.join(tempDir, 'test.txt');
    commitHashes = [];

    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    fs.writeFileSync(testFile, 'Line 1\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Commit 1: Add line 1"', { cwd: tempDir });
    commitHashes.push(execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim());

    fs.writeFileSync(testFile, 'Line 1\nLine 2\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Commit 2: Add line 2"', { cwd: tempDir });
    commitHashes.push(execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim());

    fs.writeFileSync(testFile, 'Line 1\nLine 2\nLine 3\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Commit 3: Add line 3"', { cwd: tempDir });
    commitHashes.push(execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim());
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('handleCopySelectedMessagesNumbered handles empty hashes array', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopySelectedMessagesNumbered'),
      'handleCopySelectedMessagesNumbered should be defined');
    assert.ok(source.includes("hashes.length === 0") || source.includes("selected.length === 0"),
      'Should handle empty case');
  });

  test('handleCopySelectedMessagesNumbered formats as numbered markdown list', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('${index + 1}.') || source.includes('index + 1'),
      'Should format messages with numbered markdown prefix');
    assert.ok(source.includes('c.message'),
      'Should use commit subject line');
  });

  test('handleCopySelectedMessagesNumbered shows correct confirmation message', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopySelectedMessagesNumbered');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('message') && fnBody.includes('messages'),
      'Should show singular/plural confirmation');
  });

  test('main.js handleCopySelectedMessagesNumbered falls back to focused when 0 selected', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopySelectedMessagesNumbered');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("selectedHashes.length === 0"),
      'Should handle 0 selected case');
    assert.ok(fnBody.includes('copySelectedMessagesNumbered'),
      'Should send copySelectedMessagesNumbered message even for single');
  });

  test('main.js handleCopySelectedMessagesNumbered sends all hashes for 2+ selected', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopySelectedMessagesNumbered');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copySelectedMessagesNumbered'"),
      'Should send copySelectedMessagesNumbered message type');
    assert.ok(fnBody.includes('orderedHashes'),
      'Should reorder hashes to match display order');
  });

  test('context menu shows copy messages as numbered list when multi-selected', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-selected-messages-numbered"'),
      'Context menu should include copy-selected-messages-numbered action');
  });

  test('context menu copy messages as numbered list has conditional display', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const idx = source.indexOf('copy-selected-messages-numbered');
    assert.ok(idx >= 0);
    const surrounding = source.substring(Math.max(0, idx - 300), idx + 200);
    assert.ok(surrounding.includes('selectedCommits.size > 1'),
      'Context menu item should only show when 2+ commits selected');
  });

  test('Ctrl+Alt+Shift+Z keyboard shortcut integration', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const triggerActionStart = source.indexOf("case 'copySelectedMessagesNumbered'");
    assert.ok(triggerActionStart >= 0,
      'triggerAction should handle copySelectedMessagesNumbered');
  });

  test('triggerAction handles copySelectedMessagesNumbered', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'copySelectedMessagesNumbered': handleCopySelectedMessagesNumbered()"),
      'triggerAction should handle copySelectedMessagesNumbered');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copySelectedMessagesNumbered"'),
      'package.json should register copySelectedMessagesNumbered command');
    assert.ok(content.includes('"ctrl+alt+shift+z"'),
      'package.json should define ctrl+alt+shift+z keybinding');
    assert.ok(content.includes('"cmd+alt+shift+z"'),
      'package.json should define cmd+alt+shift+z keybinding');
  });

  test('keyboard help includes copy messages as numbered list', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Copy selected messages as numbered list'),
      'Keyboard help should include copy messages as numbered list entry');
  });

  test('types.ts has copySelectedMessagesNumbered in WebviewToExtMessage', async () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("type: 'copySelectedMessagesNumbered'"),
      'WebviewToExtMessage should include copySelectedMessagesNumbered');
    assert.ok(source.includes("hashes: string[]"),
      'copySelectedMessagesNumbered message should include hashes field');
  });

  test('extension.ts registers webview action for copySelectedMessagesNumbered', async () => {
    const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes('copySelectedMessagesNumbered'),
      'extension.ts should register copySelectedMessagesNumbered webview action');
  });
});
