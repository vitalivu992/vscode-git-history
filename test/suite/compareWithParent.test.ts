import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Compare With Parent Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const usagePath = path.resolve(__dirname, '../../../USAGE.md');

  test('types.ts should have compareWithParent in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'compareWithParent'"),
      'WebviewAction should include compareWithParent');
  });

  test('main.js should have handleCompareWithParent function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCompareWithParent'),
      'main.js should have handleCompareWithParent function');
  });

  test('handleCompareWithParent should diff parent..commit via requestRangeDiff', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function handleCompareWithParent');
    assert.ok(fnStart >= 0, 'handleCompareWithParent function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('parentHashes'),
      'handleCompareWithParent should read the commit parent hash');
    assert.ok(fnBody.includes('requestRangeDiff(parentHash, targetCommit.hash)'),
      'handleCompareWithParent should request the parent..commit range diff');
    assert.ok(fnBody.includes('no parent'),
      'handleCompareWithParent should reject root commits');
    assert.ok(fnBody.includes('Select a commit'),
      'handleCompareWithParent should require a focused/selected commit');
  });

  test('main.js should handle Ctrl+Alt+P keyboard shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("e.altKey && e.key === 'p'") && source.includes('handleCompareWithParent()'),
      'main.js should handle Ctrl+Alt+P and call handleCompareWithParent');
  });

  test('main.js triggerAction should dispatch compareWithParent', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'compareWithParent': handleCompareWithParent()"),
      'main.js triggerAction should dispatch compareWithParent');
  });

  test('main.js keyboard help should list quick compare with parent', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("Quick compare with parent"),
      'keyboard help data should list quick compare with parent');
  });

  test('package.json should register compareWithParent command and keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const command = json.contributes.commands.find((c: any) => c.command === 'gitHistory.compareWithParent');
    assert.ok(command, 'Should declare gitHistory.compareWithParent command');
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.compareWithParent'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.compareWithParent');
    assert.strictEqual(binding.key, 'ctrl+alt+p');
    assert.strictEqual(binding.mac, 'cmd+alt+p');
    assert.strictEqual(binding.when, 'activeWebviewViewId == gitHistory.webview');
  });

  test('extension.ts should register compareWithParent webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'compareWithParent'"),
      'extension.ts should register compareWithParent webview action');
  });

  test('CLAUDE.md should document the Compare with Parent feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Compare with Parent'),
      'CLAUDE.md should document the Compare with Parent feature');
  });

  test('USAGE.md should document the Ctrl+Alt+P shortcut', () => {
    const source = fs.readFileSync(usagePath, 'utf-8');
    assert.ok(source.includes('Ctrl+Alt+P'),
      'USAGE.md should document Ctrl+Alt+P');
  });
});
