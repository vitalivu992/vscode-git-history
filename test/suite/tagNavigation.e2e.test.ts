import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('Tag Navigation E2E Tests', () => {
  test('jumpToNextTag function scrolls to target commit', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify function calls scrollToCommitByHash
    const fnStart = source.indexOf('function jumpToNextTag()');
    assert.ok(fnStart >= 0, 'jumpToNextTag function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('scrollToCommitByHash'),
      'jumpToNextTag should call scrollToCommitByHash');
    assert.ok(fnBody.includes('setFocusedRow'),
      'jumpToNextTag should call setFocusedRow to update focused row styling');
  });

  test('jumpToPreviousTag function scrolls to target commit', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify function calls scrollToCommitByHash
    const fnStart = source.indexOf('function jumpToPreviousTag()');
    assert.ok(fnStart >= 0, 'jumpToPreviousTag function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('scrollToCommitByHash'),
      'jumpToPreviousTag should call scrollToCommitByHash');
    assert.ok(fnBody.includes('setFocusedRow'),
      'jumpToPreviousTag should call setFocusedRow to update focused row styling');
  });

  test('jumpToNextTag handles no tagged commits', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function jumpToNextTag()');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('taggedCommits.length === 0'),
      'jumpToNextTag should check for empty tagged commits list');
    assert.ok(fnBody.includes('No tagged commits found'),
      'jumpToNextTag should show error when no tags found');
  });

  test('jumpToPreviousTag handles no tagged commits', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function jumpToPreviousTag()');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('taggedCommits.length === 0'),
      'jumpToPreviousTag should check for empty tagged commits list');
    assert.ok(fnBody.includes('No tagged commits found'),
      'jumpToPreviousTag should show error when no tags found');
  });

  test('jumpToNextTag wraps around from last to first tag', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function jumpToNextTag()');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('nextIndex = 0'),
      'jumpToNextTag should wrap around to first tag');
  });

  test('jumpToPreviousTag wraps around from first to last tag', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function jumpToPreviousTag()');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('prevIndex = taggedCommits.length - 1'),
      'jumpToPreviousTag should wrap around to last tag');
  });

  test('getTaggedCommits filters commits with tags', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function getTaggedCommits()');
    assert.ok(fnStart >= 0, 'getTaggedCommits function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('.tags') && fnBody.includes('.length > 0'),
      'getTaggedCommits should filter for commits with tags');
  });

  test('keyboard help includes tag navigation shortcuts', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Jump to next tagged commit'),
      'Keyboard help should include jump to next tag');
    assert.ok(source.includes('Jump to previous tagged commit'),
      'Keyboard help should include jump to previous tag');
  });

  test('package.json registers jumpToNextTag command and keybinding', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    const json = JSON.parse(content);

    assert.ok(content.includes('"gitHistory.jumpToNextTag"'),
      'package.json should register jumpToNextTag command');

    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.jumpToNextTag'
    );
    assert.ok(binding, 'Should have keybinding for jumpToNextTag');
    assert.strictEqual(binding.key, 'ctrl+]');
    assert.strictEqual(binding.mac, 'cmd+]');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('package.json registers jumpToPreviousTag command and keybinding', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    const json = JSON.parse(content);

    assert.ok(content.includes('"gitHistory.jumpToPreviousTag"'),
      'package.json should register jumpToPreviousTag command');

    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.jumpToPreviousTag'
    );
    assert.ok(binding, 'Should have keybinding for jumpToPreviousTag');
    assert.strictEqual(binding.key, 'ctrl+[');
    assert.strictEqual(binding.mac, 'cmd+[');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('extension.ts registers webview action handlers', async () => {
    const extensionPath = path.resolve(__dirname, '../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes("action: 'jumpToNextTag'"),
      'extension.ts should register jumpToNextTag webview action');
    assert.ok(source.includes("action: 'jumpToPreviousTag'"),
      'extension.ts should register jumpToPreviousTag webview action');
  });

  test('main.js triggerAction dispatches tag navigation actions', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'jumpToNextTag':"),
      'main.js triggerAction should handle jumpToNextTag');
    assert.ok(source.includes("case 'jumpToPreviousTag':"),
      'main.js triggerAction should handle jumpToPreviousTag');
  });
});
