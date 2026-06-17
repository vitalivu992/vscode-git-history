import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Oneline Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  test('types.ts should have copyOneline message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copyOneline'"),
      'types.ts should have copyOneline message type');
  });

  test('types.ts should have copyOneline in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyOneline'"),
      'WebviewAction should include copyOneline');
  });

  test('types.ts should have copyOneline in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copyOneline'"),
      'WebviewToExtMessage should include copyOneline');
  });

  test('messageHandler.ts should handle copyOneline case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyOneline':"),
      'messageHandler.ts should handle copyOneline case');
  });

  test('messageHandler.ts should have handleCopyOneline function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyOneline'),
      'messageHandler.ts should have handleCopyOneline function');
  });

  test('handleCopyOneline should format as shortHash + message', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyOneline');
    assert.ok(fnStart >= 0, 'handleCopyOneline function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 200);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('commit.shortHash'),
      'handleCopyOneline should use commit.shortHash');
    assert.ok(fnBody.includes('commit.message'),
      'handleCopyOneline should use commit.message');
    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyOneline should write to clipboard');
  });

  test('handleCopyOneline should show confirmation with truncated message', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyOneline');
    assert.ok(fnStart >= 0, 'handleCopyOneline function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 200);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Copied:'),
      'handleCopyOneline should show confirmation');
    assert.ok(fnBody.includes('shortMsg') || fnBody.includes('truncated'),
      'handleCopyOneline should truncate long messages');
  });

  test('handleCopyOneline should handle commit not found', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyOneline');
    assert.ok(fnStart >= 0, 'handleCopyOneline function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 200);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'handleCopyOneline should handle commit not found');
  });

  test('main.js should have handleCopyOneline function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyOneline'),
      'main.js should have handleCopyOneline function');
  });

  test('main.js should send copyOneline message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copyOneline'"),
      'main.js should send copyOneline message');
  });

  test('main.js should handle Ctrl+Shift+Y keyboard shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("e.key === 'y'") && source.includes('handleCopyOneline'),
      'main.js should handle Ctrl+Shift+Y and call handleCopyOneline');
  });

  test('main.js triggerAction should dispatch copyOneline', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyOneline': handleCopyOneline()"),
      'main.js triggerAction should dispatch copyOneline');
  });

  test('main.js should have context menu item for copy-oneline', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('copy-oneline'),
      'main.js should have context menu item for copy-oneline');
  });

  test('main.js context menu should handle copy-oneline action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'copy-oneline'") ||
      source.includes('copy-oneline'),
      'main.js should handle copy-oneline action');
  });

  test('main.js context menu should have ≡ icon for copy oneline', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('≡'),
      'main.js should have ≡ icon for copy oneline');
  });

  test('package.json should register copyOneline command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copyOneline'),
      'package.json should register gitHistory.copyOneline command');
  });

  test('package.json should have Copy Commit as Oneline command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Copy Commit as Oneline'),
      'package.json should have Copy Commit as Oneline command title');
  });

  test('package.json should register Ctrl+Shift+Y keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyOneline'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyOneline');
    assert.strictEqual(binding.key, 'ctrl+shift+y');
    assert.strictEqual(binding.mac, 'cmd+shift+y');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('extension.ts should register copyOneline webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyOneline'"),
      'extension.ts should register copyOneline webview action');
  });

  test('CLAUDE.md should document Copy as Oneline feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy as Oneline'),
      'CLAUDE.md should document Copy as Oneline feature');
    assert.ok(source.includes('handleCopyOneline'),
      'CLAUDE.md should reference handleCopyOneline');
  });

  test('CLAUDE.md should document Ctrl+Shift+Y / Cmd+Shift+Y keyboard shortcut', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Ctrl+Shift+Y') || source.includes('Cmd+Shift+Y'),
      'CLAUDE.md should document Copy Oneline keyboard shortcut');
  });

  test('README.md should document Copy as Oneline feature', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('oneline') || source.includes('Oneline') || source.includes('Ctrl+Shift+Y'),
      'README.md should document copy oneline feature or keyboard shortcut');
  });

  test('README.md should have ≡ icon for Copy as Oneline', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('≡'),
      'README.md should have ≡ icon for Copy as Oneline');
  });
});
