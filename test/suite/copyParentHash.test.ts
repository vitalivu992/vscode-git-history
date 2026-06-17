import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Parent Hash Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  test('types.ts should have copyParentHash message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copyParentHash'"),
      'types.ts should have copyParentHash message type');
  });

  test('types.ts should have copyParentHash in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyParentHash'"),
      'WebviewAction should include copyParentHash');
  });

  test('types.ts should have copyParentHash in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copyParentHash'"),
      'WebviewToExtMessage should include copyParentHash');
  });

  test('messageHandler.ts should handle copyParentHash case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyParentHash':"),
      'messageHandler.ts should handle copyParentHash case');
  });

  test('messageHandler.ts should have handleCopyParentHash function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyParentHash'),
      'messageHandler.ts should have handleCopyParentHash function');
  });

  test('handleCopyParentHash should read parentHashes[0]', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyParentHash');
    assert.ok(fnStart >= 0, 'handleCopyParentHash function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('parentHashes[0]'),
      'handleCopyParentHash should read parentHashes[0]');
  });

  test('handleCopyParentHash should write to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyParentHash');
    assert.ok(fnStart >= 0, 'handleCopyParentHash function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyParentHash should write to clipboard');
    assert.ok(fnBody.includes('Parent hash copied'),
      'handleCopyParentHash should show confirmation');
  });

  test('handleCopyParentHash should handle root commit (no parent)', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyParentHash');
    assert.ok(fnStart >= 0, 'handleCopyParentHash function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Root commit has no parent'),
      'handleCopyParentHash should handle root commit');
  });

  test('handleCopyParentHash should handle commit not found', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyParentHash');
    assert.ok(fnStart >= 0, 'handleCopyParentHash function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'handleCopyParentHash should handle commit not found');
  });

  test('main.js should have handleCopyParentHash function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyParentHash'),
      'main.js should have handleCopyParentHash function');
  });

  test('main.js should send copyParentHash message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copyParentHash'"),
      'main.js should send copyParentHash message');
  });

  test('main.js should handle Ctrl+Shift+V keyboard shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("e.key === 'v'") && source.includes('handleCopyParentHash'),
      'main.js should handle Ctrl+Shift+V and call handleCopyParentHash');
  });

  test('main.js triggerAction should dispatch copyParentHash', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyParentHash': handleCopyParentHash()"),
      'main.js triggerAction should dispatch copyParentHash');
  });

  test('main.js should have context menu item for copy-parent-hash', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('copy-parent-hash'),
      'main.js should have context menu item for copy-parent-hash');
  });

  test('main.js context menu should handle copy-parent-hash action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'copy-parent-hash'") ||
      source.includes('copy-parent-hash'),
      'main.js should handle copy-parent-hash action');
  });

  test('package.json should register copyParentHash command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copyParentHash'),
      'package.json should register gitHistory.copyParentHash command');
  });

  test('package.json should have Copy Parent Hash command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Copy Parent Hash'),
      'package.json should have Copy Parent Hash command title');
  });

  test('package.json should register Ctrl+Shift+V keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyParentHash'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyParentHash');
    assert.strictEqual(binding.key, 'ctrl+shift+v');
    assert.strictEqual(binding.mac, 'cmd+shift+v');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('extension.ts should register copyParentHash webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyParentHash'"),
      'extension.ts should register copyParentHash webview action');
  });

  test('CLAUDE.md should document Copy Parent Hash feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy Parent Hash'),
      'CLAUDE.md should document Copy Parent Hash feature');
    assert.ok(source.includes('handleCopyParentHash'),
      'CLAUDE.md should reference handleCopyParentHash');
  });

  test('README.md should document Copy Parent Hash feature', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('Copy parent hash') || source.includes('Ctrl+Shift+V'),
      'README.md should document copy parent hash feature or keyboard shortcut');
  });
});
