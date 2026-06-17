import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy All Filtered as Oneline Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  test('types.ts should have copyAllFilteredAsOneline in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyAllFilteredAsOneline'"),
      'WebviewAction should include copyAllFilteredAsOneline');
  });

  test('types.ts should have copyAllFilteredAsOneline in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copyAllFilteredAsOneline'"),
      'WebviewToExtMessage should include copyAllFilteredAsOneline');
  });

  test('messageHandler.ts should handle copyAllFilteredAsOneline case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyAllFilteredAsOneline':"),
      'messageHandler.ts should handle copyAllFilteredAsOneline case');
  });

  test('messageHandler.ts should have handleCopyAllFilteredAsOneline function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyAllFilteredAsOneline'),
      'messageHandler.ts should have handleCopyAllFilteredAsOneline function');
  });

  test('handleCopyAllFilteredAsOneline should format as shortHash message', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyAllFilteredAsOneline');
    assert.ok(fnStart >= 0, 'handleCopyAllFilteredAsOneline function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 300);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('commit.shortHash'),
      'handleCopyAllFilteredAsOneline should use commit.shortHash');
    assert.ok(fnBody.includes('commit.message'),
      'handleCopyAllFilteredAsOneline should use commit.message');
    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyAllFilteredAsOneline should write to clipboard');
    assert.ok(fnBody.includes("`${commit.shortHash} ${commit.message}`"),
      'handleCopyAllFilteredAsOneline should format as shortHash message');
  });

  test('handleCopyAllFilteredAsOneline should show confirmation with singular/plural', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyAllFilteredAsOneline');
    assert.ok(fnStart >= 0, 'handleCopyAllFilteredAsOneline function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 300);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('commit') && fnBody.includes('>'),
      'handleCopyAllFilteredAsOneline should use singular/plural form');
    assert.ok(fnBody.includes('Copied'),
      'handleCopyAllFilteredAsOneline should show confirmation');
  });

  test('handleCopyAllFilteredAsOneline should handle empty hashes', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyAllFilteredAsOneline');
    assert.ok(fnStart >= 0, 'handleCopyAllFilteredAsOneline function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 300);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('hashes.length === 0'),
      'handleCopyAllFilteredAsOneline should check for empty hashes');
    assert.ok(fnBody.includes('No commits visible in current view'),
      'handleCopyAllFilteredAsOneline should show message when no commits visible');
  });

  test('handleCopyAllFilteredAsOneline should filter commits by hash', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyAllFilteredAsOneline');
    assert.ok(fnStart >= 0, 'handleCopyAllFilteredAsOneline function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 300);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('panel.getCommits()'),
      'handleCopyAllFilteredAsOneline should get commits from panel');
    assert.ok(fnBody.includes('.map(hash => commits.find'),
      'handleCopyAllFilteredAsOneline should map hashes to commits');
    assert.ok(fnBody.includes('.filter((commit): commit is CommitInfo => commit !== undefined)'),
      'handleCopyAllFilteredAsOneline should filter undefined commits');
  });

  test('main.js should have handleCopyAllFilteredAsOneline function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyAllFilteredAsOneline'),
      'main.js should have handleCopyAllFilteredAsOneline function');
  });

  test('main.js should send copyAllFilteredAsOneline message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copyAllFilteredAsOneline'"),
      'main.js should send copyAllFilteredAsOneline message');
  });

  test('main.js triggerAction should dispatch copyAllFilteredAsOneline', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyAllFilteredAsOneline': handleCopyAllFilteredAsOneline()"),
      'main.js triggerAction should dispatch copyAllFilteredAsOneline');
  });

  test('main.js should have context menu item for copy-all-filtered-as-oneline', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('copy-all-filtered-as-oneline'),
      'main.js should have context menu item for copy-all-filtered-as-oneline');
  });

  test('main.js context menu should handle copy-all-filtered-as-oneline action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'copy-all-filtered-as-oneline'"),
      'main.js should handle copy-all-filtered-as-oneline action');
  });

  test('main.js context menu should have ≡ icon for copy all filtered as oneline', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const menuStart = source.indexOf('copy-all-filtered-as-oneline');
    assert.ok(menuStart >= 0, 'Should find copy-all-filtered-as-oneline in source');
    const nearbySource = source.substring(menuStart - 200, menuStart + 200);
    assert.ok(nearbySource.includes('≡'),
      'main.js should have ≡ icon near copy-all-filtered-as-oneline');
  });

  test('main.js should handle Ctrl+Shift+Alt+Y keyboard shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('Ctrl+Shift+Alt+Y') || source.includes('ctrl+shift+alt+y') ||
      source.includes('Cmd+Shift+Alt+Y') || source.includes('cmd+shift+alt+y'),
      'main.js should handle Ctrl+Shift+Alt+Y keyboard shortcut');
  });

  test('main.js should have keyboard help entry for Copy all filtered as oneline', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('Copy all filtered as oneline'),
      'main.js should have keyboard help entry for Copy all filtered as oneline');
  });

  test('package.json should register copyAllFilteredAsOneline command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copyAllFilteredAsOneline'),
      'package.json should register gitHistory.copyAllFilteredAsOneline command');
  });

  test('package.json should have Copy All Filtered as Oneline command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Copy All Filtered as Oneline'),
      'package.json should have Copy All Filtered as Oneline command title');
  });

  test('package.json should register Ctrl+Shift+Alt+Y keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyAllFilteredAsOneline'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyAllFilteredAsOneline');
    assert.strictEqual(binding.key, 'ctrl+shift+alt+y');
    assert.strictEqual(binding.mac, 'cmd+shift+alt+y');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('extension.ts should register copyAllFilteredAsOneline webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyAllFilteredAsOneline'"),
      'extension.ts should register copyAllFilteredAsOneline webview action');
  });

  test('CLAUDE.md should document Copy All Filtered as Oneline feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy All Filtered as Oneline'),
      'CLAUDE.md should document Copy All Filtered as Oneline feature');
    assert.ok(source.includes('handleCopyAllFilteredAsOneline'),
      'CLAUDE.md should reference handleCopyAllFilteredAsOneline');
  });

  test('CLAUDE.md should document Ctrl+Shift+Alt+Y / Cmd+Shift+Alt+Y keyboard shortcut', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Ctrl+Shift+Alt+Y') || source.includes('Cmd+Shift+Alt+Y'),
      'CLAUDE.md should document Copy All Filtered as Oneline keyboard shortcut');
  });

  test('README.md should document Copy All Filtered as Oneline feature', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('Copy All Filtered as Oneline') ||
      source.includes('Copy all filtered as oneline') ||
      source.includes('Ctrl+Shift+Alt+Y'),
      'README.md should document copy all filtered as oneline feature or keyboard shortcut');
  });
});
