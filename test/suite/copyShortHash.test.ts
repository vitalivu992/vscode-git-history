import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Short Hash Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  test('types.ts should have copyShortHash message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copyShortHash'"),
      'types.ts should have copyShortHash message type');
  });

  test('types.ts should have copyShortHash in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyShortHash'"),
      'WebviewAction should include copyShortHash');
  });

  test('types.ts should have copyShortHash in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copyShortHash'"),
      'WebviewToExtMessage should include copyShortHash');
  });

  test('messageHandler.ts should handle copyShortHash case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyShortHash':"),
      'messageHandler.ts should handle copyShortHash case');
  });

  test('messageHandler.ts should have handleCopyShortHash function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyShortHash'),
      'messageHandler.ts should have handleCopyShortHash function');
  });

  test('handleCopyShortHash should extract 7-char hash', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyShortHash');
    assert.ok(fnStart >= 0, 'handleCopyShortHash function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('substring(0, 7)'),
      'handleCopyShortHash should extract first 7 characters');
  });

  test('handleCopyShortHash should write to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyShortHash');
    assert.ok(fnStart >= 0, 'handleCopyShortHash function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyShortHash should write to clipboard');
    assert.ok(fnBody.includes('Copied short hash'),
      'handleCopyShortHash should show confirmation');
  });

  test('handleCopyShortHash should handle commit not found', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyShortHash');
    assert.ok(fnStart >= 0, 'handleCopyShortHash function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'handleCopyShortHash should handle commit not found');
  });

  test('main.js should have handleCopyShortHash function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyShortHash'),
      'main.js should have handleCopyShortHash function');
  });

  test('main.js should send copyShortHash message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copyShortHash'"),
      'main.js should send copyShortHash message');
  });

  test('main.js should handle Ctrl+Shift+7 keyboard shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("e.key === '7'") && source.includes('handleCopyShortHash'),
      'main.js should handle Ctrl+Shift+7 and call handleCopyShortHash');
  });

  test('main.js triggerAction should dispatch copyShortHash', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyShortHash': handleCopyShortHash()"),
      'main.js triggerAction should dispatch copyShortHash');
  });

  test('main.js should have context menu item for copy-short-hash', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('copy-short-hash'),
      'main.js should have context menu item for copy-short-hash');
  });

  test('main.js context menu should handle copy-short-hash action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'copy-short-hash'") ||
      source.includes('copy-short-hash'),
      'main.js should handle copy-short-hash action');
  });

  test('package.json should register copyShortHash command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copyShortHash'),
      'package.json should register gitHistory.copyShortHash command');
  });

  test('package.json should have Copy Short Hash command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Copy Short Hash'),
      'package.json should have Copy Short Hash command title');
  });

  test('package.json should register Ctrl+Shift+7 keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyShortHash'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyShortHash');
    assert.strictEqual(binding.key, 'ctrl+shift+7');
    assert.strictEqual(binding.mac, 'cmd+shift+7');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('extension.ts should register copyShortHash webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyShortHash'"),
      'extension.ts should register copyShortHash webview action');
  });

  test('CLAUDE.md should document Copy Short Hash feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy Short Hash'),
      'CLAUDE.md should document Copy Short Hash feature');
    assert.ok(source.includes('handleCopyShortHash'),
      'CLAUDE.md should reference handleCopyShortHash');
  });

  test('README.md should document Copy Short Hash feature', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('Copy short hash') || source.includes('Ctrl+Shift+7'),
      'README.md should document copy short hash feature or keyboard shortcut');
  });
});
