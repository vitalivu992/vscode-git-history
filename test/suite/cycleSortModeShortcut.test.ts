import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('Cycle Sort Mode Shortcut Test Suite', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const packageJsonPath = path.resolve(__dirname, '../../../package.json');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  test('types.ts should have cycleSortMode in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'cycleSortMode'"),
      'WebviewAction should include cycleSortMode');
  });

  test('main.js should have handleSortToggle function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleSortToggle()'),
      'main.js should have handleSortToggle function');
  });

  test('main.js triggerAction should dispatch cycleSortMode', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'cycleSortMode': handleSortToggle()"),
      'main.js triggerAction should dispatch cycleSortMode');
  });

  test('main.js should have Ctrl+Shift+3 keyboard shortcut comment', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('// Ctrl+Shift+3: Cycle sort mode'),
      'main.js should have Ctrl+Shift+3 keyboard shortcut comment');
  });

  test('extension.ts should register cycleSortMode command', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("command: 'gitHistory.cycleSortMode'"),
      'extension.ts should register gitHistory.cycleSortMode command');
    assert.ok(source.includes("action: 'cycleSortMode'"),
      'extension.ts should map cycleSortMode action');
  });

  test('package.json should have cycleSortMode keybinding', () => {
    const source = fs.readFileSync(packageJsonPath, 'utf-8');
    const json = JSON.parse(source);
    const keybinding = json.contributes.keybindings?.find(
      (kb: { command: string }) => kb.command === 'gitHistory.cycleSortMode'
    );
    assert.ok(keybinding, 'package.json should have gitHistory.cycleSortMode keybinding');
    assert.strictEqual(keybinding.key, 'ctrl+shift+3');
    assert.ok(keybinding.when.includes('activeWebviewViewId == gitHistory.webview'),
      'keybinding should have correct when clause');
  });

  test('README.md should document Ctrl+Shift+3 shortcut', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('Ctrl+Shift+3') || source.includes('Cmd+Shift+3'),
      'README.md should document Ctrl+Shift+3 or Cmd+Shift+3 shortcut');
    assert.ok(source.includes('Cycle sort mode') || source.includes('cycle sort mode'),
      'README.md should describe the shortcut as Cycle sort mode');
  });
});