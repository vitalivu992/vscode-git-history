import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Copy Selected Messages Checklist E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHashes: string[];

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-msg-checklist-'));
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

  test('handleCopySelectedMessagesChecklist handles empty hashes array', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopySelectedMessagesChecklist'),
      'handleCopySelectedMessagesChecklist should be defined');
    assert.ok(source.includes("hashes.length === 0") || source.includes("selected.length === 0"),
      'Should handle empty case');
  });

  test('handleCopySelectedMessagesChecklist formats as markdown checklist', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('- [ ]'),
      'Should format messages with markdown checklist prefix');
    assert.ok(source.includes('c.message'),
      'Should use commit subject line');
  });

  test('handleCopySelectedMessagesChecklist shows correct confirmation message', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopySelectedMessagesChecklist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('message') && fnBody.includes('messages'),
      'Should show singular/plural confirmation');
  });

  test('main.js handleCopySelectedMessagesChecklist falls back to focused when 0 selected', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopySelectedMessagesChecklist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("selectedHashes.length === 0"),
      'Should handle 0 selected case');
    assert.ok(fnBody.includes('copySelectedMessagesChecklist'),
      'Should send copySelectedMessagesChecklist message even for single');
  });

  test('main.js handleCopySelectedMessagesChecklist sends all hashes for 2+ selected', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopySelectedMessagesChecklist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copySelectedMessagesChecklist'"),
      'Should send copySelectedMessagesChecklist message type');
    assert.ok(fnBody.includes('orderedHashes'),
      'Should reorder hashes to match display order');
  });

  test('context menu shows copy messages as checklist when multi-selected', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-selected-messages-checklist"'),
      'Context menu should include copy-selected-messages-checklist action');
  });

  test('context menu copy messages as checklist has conditional display', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const idx = source.indexOf('copy-selected-messages-checklist');
    assert.ok(idx >= 0);
    const surrounding = source.substring(Math.max(0, idx - 300), idx + 200);
    assert.ok(surrounding.includes('selectedCommits.size > 1'),
      'Context menu item should only show when 2+ commits selected');
  });

  test('Ctrl+Alt+Z keyboard shortcut integration', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const kdStart = source.indexOf('function handleKeyDown');
    const kdEnd = source.indexOf('\nfunction', kdStart + 1);
    const kdBody = source.substring(kdStart, kdEnd > kdStart ? kdEnd : undefined);

    assert.ok(kdBody.includes("e.key === 'z'") && kdBody.includes('handleCopySelectedMessagesChecklist'),
      'Ctrl+Alt+Z shortcut should be handled');
  });

  test('triggerAction handles copySelectedMessagesChecklist', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'copySelectedMessagesChecklist': handleCopySelectedMessagesChecklist()"),
      'triggerAction should handle copySelectedMessagesChecklist');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copySelectedMessagesChecklist"'),
      'package.json should register copySelectedMessagesChecklist command');
    assert.ok(content.includes('"ctrl+alt+z"'),
      'package.json should define ctrl+alt+z keybinding');
    assert.ok(content.includes('"cmd+alt+z"'),
      'package.json should define cmd+alt+z keybinding');
  });

  test('keyboard help includes copy messages as checklist', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Copy selected messages as checklist'),
      'Keyboard help should include copy messages as checklist entry');
  });

  test('types.ts has copySelectedMessagesChecklist in WebviewToExtMessage', async () => {
    const typesPath = path.resolve(__dirname, '../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("type: 'copySelectedMessagesChecklist'"),
      'WebviewToExtMessage should include copySelectedMessagesChecklist');
    assert.ok(source.includes("hashes: string[]"),
      'copySelectedMessagesChecklist message should include hashes field');
  });

  test('extension.ts registers webview action for copySelectedMessagesChecklist', async () => {
    const extensionPath = path.resolve(__dirname, '../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes('copySelectedMessagesChecklist'),
      'extension.ts should register copySelectedMessagesChecklist webview action');
  });
});
