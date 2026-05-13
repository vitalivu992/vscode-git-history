import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('Jump to Parent E2E Tests', () => {
  test('jumpToParent function scrolls to parent commit', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify function calls scrollToCommitByHash
    const fnStart = source.indexOf('function jumpToParent()');
    assert.ok(fnStart >= 0, 'jumpToParent function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('scrollToCommitByHash'),
      'jumpToParent should call scrollToCommitByHash');
    assert.ok(fnBody.includes('setFocusedRow'),
      'jumpToParent should call setFocusedRow to update focused row styling');
  });

  test('jumpToParent handles no focused commit', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function jumpToParent()');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('focusedIndex < 0'),
      'jumpToParent should check for invalid focusedIndex');
    assert.ok(fnBody.includes('No commit focused'),
      'jumpToParent should show error when no commit focused');
  });

  test('jumpToParent handles root commit (no parent)', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function jumpToParent()');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('parentHashes.length === 0'),
      'jumpToParent should check for empty parentHashes (root commit)');
    assert.ok(fnBody.includes('Root commit has no parent'),
      'jumpToParent should show error for root commit');
  });

  test('jumpToParent handles parent not in current view', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function jumpToParent()');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('parentExists'),
      'jumpToParent should check if parent exists in list');
    assert.ok(fnBody.includes('Parent commit not in current view'),
      'jumpToParent should show error when parent not in current view');
  });

  test('jumpToParent gets first parent for merge commits', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function jumpToParent()');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    // Should use parentHashes[0] for merge commits (first parent)
    assert.ok(fnBody.includes('parentHashes[0]'),
      'jumpToParent should use first parent hash for merge commits');
  });

  test('keyboard help includes jump to parent shortcut', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Find the keyboard help function
    const helpStart = source.indexOf('function showKeyboardHelpDialog()');
    assert.ok(helpStart >= 0, 'showKeyboardHelpDialog function should exist');

    // Get function body up to the end
    const helpEnd = source.indexOf('// ───', helpStart + 50);
    const helpBody = source.substring(helpStart, helpEnd);

    assert.ok(helpBody.includes('Jump to parent commit'),
      'Keyboard help should include jump to parent commit');
    assert.ok(helpBody.includes("cmdKey, 'P']"),
      'Keyboard help should show Ctrl+P / Cmd+P shortcut');
  });

  test('package.json registers command and keybinding', async () => {
    const packagePath = path.resolve(__dirname, '../../package.json');
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);

    // Verify command exists
    const command = json.contributes.commands.find(
      (c: any) => c.command === 'gitHistory.jumpToParent'
    );
    assert.ok(command, 'gitHistory.jumpToParent command should be registered');
    assert.strictEqual(command.title, 'Git History: Jump to Parent Commit');

    // Verify keybinding exists
    const keybinding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.jumpToParent'
    );
    assert.ok(keybinding, 'keybinding for gitHistory.jumpToParent should be registered');
    assert.strictEqual(keybinding.key, 'ctrl+p');
    assert.strictEqual(keybinding.mac, 'cmd+p');
  });

  test('extension.ts registers webview action', async () => {
    const extensionPath = path.resolve(__dirname, '../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes("action: 'jumpToParent'"),
      'extension.ts should register jumpToParent webview action');
    assert.ok(source.includes("command: 'gitHistory.jumpToParent'"),
      'extension.ts should register gitHistory.jumpToParent command');
  });

  test('triggerAction dispatches jumpToParent', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Find the message handler switch
    const switchStart = source.indexOf("case 'jumpToParent':");
    assert.ok(switchStart >= 0, "triggerAction should handle 'jumpToParent' case");
    assert.ok(source.includes("jumpToParent()"), "jumpToParent should be called");
  });
});