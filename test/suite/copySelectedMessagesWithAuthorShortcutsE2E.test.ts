import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Copy Selected Messages With Author Shortcuts E2E Tests', () => {
  let tempDir: string;
  let testFile: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-msg-author-shortcuts-'));
    testFile = path.join(tempDir, 'test.txt');

    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    fs.writeFileSync(testFile, 'Line 1\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Commit 1: Add line 1"', { cwd: tempDir });

    fs.writeFileSync(testFile, 'Line 1\nLine 2\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Commit 2: Add line 2"', { cwd: tempDir });

    fs.writeFileSync(testFile, 'Line 1\nLine 2\nLine 3\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Commit 3: Add line 3"', { cwd: tempDir });
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // Checklist with author E2E tests
  test('handleCopySelectedMessagesChecklistWithAuthor formats with author prefix', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopySelectedMessagesChecklistWithAuthor'),
      'handleCopySelectedMessagesChecklistWithAuthor should be defined');
    assert.ok(source.includes('- [ ]'),
      'Should format messages with markdown checklist prefix');
    assert.ok(source.includes('c.author'),
      'Should include author name in output');
    assert.ok(source.includes('c.message'),
      'Should include commit message in output');
  });

  test('handleCopySelectedMessagesChecklistWithAuthor shows confirmation', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopySelectedMessagesChecklistWithAuthor');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('message') && fnBody.includes('messages'),
      'Should show singular/plural confirmation');
    assert.ok(fnBody.includes('with author'),
      'Confirmation should mention "with author"');
  });

  test('main.js handleCopySelectedMessagesChecklistWithAuthor falls back to focused when 0 selected', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopySelectedMessagesChecklistWithAuthor');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("selectedHashes.length === 0"),
      'Should handle 0 selected case');
    assert.ok(fnBody.includes('copySelectedMessagesChecklistWithAuthor'),
      'Should send copySelectedMessagesChecklistWithAuthor message');
  });

  test('Ctrl+Alt+Shift+C keyboard shortcut integration', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const kdStart = source.indexOf('function handleKeyDown');
    const kdEnd = source.indexOf('\nfunction', kdStart + 1);
    const kdBody = source.substring(kdStart, kdEnd > kdStart ? kdEnd : undefined);

    assert.ok(
      kdBody.includes("e.key === 'c'") && kdBody.includes('handleCopySelectedMessagesChecklistWithAuthor'),
      'Ctrl+Alt+Shift+C shortcut should call handleCopySelectedMessagesChecklistWithAuthor'
    );
    assert.ok(kdBody.includes('e.shiftKey'),
      'Should require shift key');
    assert.ok(kdBody.includes('e.altKey'),
      'Should require alt key');
  });

  test('triggerAction handles copySelectedMessagesChecklistWithAuthor', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'copySelectedMessagesChecklistWithAuthor': handleCopySelectedMessagesChecklistWithAuthor()"),
      'triggerAction should handle copySelectedMessagesChecklistWithAuthor');
  });

  // Numbered list with author E2E tests
  test('handleCopySelectedMessagesNumberedWithAuthor formats with author prefix', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopySelectedMessagesNumberedWithAuthor'),
      'handleCopySelectedMessagesNumberedWithAuthor should be defined');
    assert.ok(source.includes('c.author'),
      'Should include author name in output');
    assert.ok(source.includes('c.message'),
      'Should include commit message in output');
  });

  test('handleCopySelectedMessagesNumberedWithAuthor shows confirmation', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopySelectedMessagesNumberedWithAuthor');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('message') && fnBody.includes('messages'),
      'Should show singular/plural confirmation');
    assert.ok(fnBody.includes('with author'),
      'Confirmation should mention "with author"');
  });

  test('Ctrl+Alt+Shift+N keyboard shortcut integration', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const kdStart = source.indexOf('function handleKeyDown');
    const kdEnd = source.indexOf('\nfunction', kdStart + 1);
    const kdBody = source.substring(kdStart, kdEnd > kdStart ? kdEnd : undefined);

    assert.ok(
      kdBody.includes("e.key === 'n'") && kdBody.includes('handleCopySelectedMessagesNumberedWithAuthor'),
      'Ctrl+Alt+Shift+N shortcut should call handleCopySelectedMessagesNumberedWithAuthor'
    );
    assert.ok(kdBody.includes('e.shiftKey'),
      'Should require shift key');
    assert.ok(kdBody.includes('e.altKey'),
      'Should require alt key');
  });

  test('triggerAction handles copySelectedMessagesNumberedWithAuthor', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'copySelectedMessagesNumberedWithAuthor': handleCopySelectedMessagesNumberedWithAuthor()"),
      'triggerAction should handle copySelectedMessagesNumberedWithAuthor');
  });

  // Keybinding uniqueness E2E tests
  test('package.json has unique keybinding for checklistWithAuthor (ctrl+alt+shift+c)', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copySelectedMessagesChecklistWithAuthor"'),
      'package.json should register copySelectedMessagesChecklistWithAuthor command');
    assert.ok(content.includes('"ctrl+alt+shift+c"'),
      'package.json should define ctrl+alt+shift+c keybinding');
    assert.ok(content.includes('"cmd+alt+shift+c"'),
      'package.json should define cmd+alt+shift+c keybinding');
  });

  test('package.json has unique keybinding for numberedWithAuthor (ctrl+alt+shift+n)', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copySelectedMessagesNumberedWithAuthor"'),
      'package.json should register copySelectedMessagesNumberedWithAuthor command');
    assert.ok(content.includes('"ctrl+alt+shift+n"'),
      'package.json should define ctrl+alt+shift+n keybinding');
    assert.ok(content.includes('"cmd+alt+shift+n"'),
      'package.json should define cmd+alt+shift+n keybinding');
  });

  test('WithAuthor keybindings do not conflict with base commands', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    // Extract keybinding entries for each command
    const checklistIdx = content.indexOf('gitHistory.copySelectedMessagesChecklist');
    const checklistEnd = content.indexOf('}', checklistIdx);
    const checklistBlock = content.substring(checklistIdx, checklistEnd);
    assert.ok(checklistBlock.includes('ctrl+alt+z'), 'Base checklist should use ctrl+alt+z');

    const checklistWithAuthorIdx = content.indexOf('gitHistory.copySelectedMessagesChecklistWithAuthor');
    const checklistWithAuthorEnd = content.indexOf('}', checklistWithAuthorIdx);
    const checklistWithAuthorBlock = content.substring(checklistWithAuthorIdx, checklistWithAuthorEnd);
    assert.ok(!checklistWithAuthorBlock.includes('ctrl+alt+z'), 'WithAuthor should NOT use ctrl+alt+z');
    assert.ok(checklistWithAuthorBlock.includes('ctrl+alt+shift+c'), 'WithAuthor should use ctrl+alt+shift+c');

    const numberedIdx = content.indexOf('gitHistory.copySelectedMessagesNumbered');
    const numberedEnd = content.indexOf('}', numberedIdx);
    const numberedBlock = content.substring(numberedIdx, numberedEnd);
    assert.ok(numberedBlock.includes('ctrl+alt+shift+z'), 'Base numbered should use ctrl+alt+shift+z');

    const numberedWithAuthorIdx = content.indexOf('gitHistory.copySelectedMessagesNumberedWithAuthor');
    const numberedWithAuthorEnd = content.indexOf('}', numberedWithAuthorIdx);
    const numberedWithAuthorBlock = content.substring(numberedWithAuthorIdx, numberedWithAuthorEnd);
    assert.ok(!numberedWithAuthorBlock.includes('ctrl+alt+shift+z'), 'WithAuthor should NOT use ctrl+alt+shift+z');
    assert.ok(numberedWithAuthorBlock.includes('ctrl+alt+shift+n'), 'WithAuthor should use ctrl+alt+shift+n');
  });

  // Context menu E2E tests
  test('context menu shows copy messages as checklist with author when multi-selected', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-selected-messages-checklist-with-author"'),
      'Context menu should include copy-selected-messages-checklist-with-author action');
  });

  test('context menu shows copy messages as numbered list with author when multi-selected', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-selected-messages-numbered-with-author"'),
      'Context menu should include copy-selected-messages-numbered-with-author action');
  });

  // Keyboard help E2E tests
  test('keyboard help includes copy messages as checklist with author', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Copy selected messages as checklist with author'),
      'Keyboard help should include copy messages as checklist with author entry');
  });

  test('keyboard help includes copy messages as numbered list with author', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Copy selected messages as numbered list with author'),
      'Keyboard help should include copy messages as numbered list with author entry');
  });

  // Types and extension registration E2E tests
  test('types.ts has WithAuthor message types in WebviewToExtMessage', async () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("type: 'copySelectedMessagesChecklistWithAuthor'"),
      'WebviewToExtMessage should include copySelectedMessagesChecklistWithAuthor');
    assert.ok(source.includes("type: 'copySelectedMessagesNumberedWithAuthor'"),
      'WebviewToExtMessage should include copySelectedMessagesNumberedWithAuthor');
    assert.ok(source.includes("hashes: string[]"),
      'Both message types should include hashes field');
  });

  test('extension.ts registers webview actions for both WithAuthor commands', async () => {
    const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes('copySelectedMessagesChecklistWithAuthor'),
      'extension.ts should register copySelectedMessagesChecklistWithAuthor webview action');
    assert.ok(source.includes('copySelectedMessagesNumberedWithAuthor'),
      'extension.ts should register copySelectedMessagesNumberedWithAuthor webview action');
  });
});
