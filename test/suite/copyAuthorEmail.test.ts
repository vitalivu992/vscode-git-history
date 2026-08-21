import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Author Email Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  test('types.ts should have copyAuthorEmail message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copyAuthorEmail'"),
      'types.ts should have copyAuthorEmail message type');
  });

  test('types.ts should have copyAuthorEmail in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyAuthorEmail'"),
      'WebviewAction should include copyAuthorEmail');
  });

  test('types.ts should have copyAuthorEmail in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copyAuthorEmail'"),
      'WebviewToExtMessage should include copyAuthorEmail');
  });

  test('messageHandler.ts should handle copyAuthorEmail case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyAuthorEmail':"),
      'messageHandler.ts should handle copyAuthorEmail case');
  });

  test('messageHandler.ts should have handleCopyAuthorEmail function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyAuthorEmail'),
      'messageHandler.ts should have handleCopyAuthorEmail function');
  });

  test('handleCopyAuthorEmail should read commit.email', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyAuthorEmail');
    assert.ok(fnStart >= 0, 'handleCopyAuthorEmail function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('commit.email'),
      'handleCopyAuthorEmail should read commit.email');
  });

  test('handleCopyAuthorEmail should write to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyAuthorEmail');
    assert.ok(fnStart >= 0, 'handleCopyAuthorEmail function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyAuthorEmail should write to clipboard');
    assert.ok(fnBody.includes('Author email copied'),
      'handleCopyAuthorEmail should show confirmation');
  });

  test('handleCopyAuthorEmail should handle commit not found', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyAuthorEmail');
    assert.ok(fnStart >= 0, 'handleCopyAuthorEmail function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'handleCopyAuthorEmail should handle commit not found');
  });

  test('main.js should have handleCopyAuthorEmail function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyAuthorEmail'),
      'main.js should have handleCopyAuthorEmail function');
  });

  test('main.js should send copyAuthorEmail message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copyAuthorEmail'"),
      'main.js should send copyAuthorEmail message');
  });

  test('main.js should handle Ctrl+Shift+A keyboard shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("e.key === 'a'") && source.includes('handleCopyAuthorEmail'),
      'main.js should handle Ctrl+Shift+A and call handleCopyAuthorEmail');
  });

  test('main.js triggerAction should dispatch copyAuthorEmail', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyAuthorEmail': handleCopyAuthorEmail()"),
      'main.js triggerAction should dispatch copyAuthorEmail');
  });

  test('main.js should have context menu item for copy-author-email', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('copy-author-email'),
      'main.js should have context menu item for copy-author-email');
  });

  test('main.js context menu should handle copy-author-email action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'copy-author-email'") ||
      source.includes('copy-author-email'),
      'main.js should handle copy-author-email action');
  });

  test('package.json should register copyAuthorEmail command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copyAuthorEmail'),
      'package.json should register gitHistory.copyAuthorEmail command');
  });

  test('package.json should have Copy Author Email command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Copy Author Email'),
      'package.json should have Copy Author Email command title');
  });

  test('package.json should register Ctrl+Shift+A keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyAuthorEmail'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyAuthorEmail');
    assert.strictEqual(binding.key, 'ctrl+shift+a');
    assert.strictEqual(binding.mac, 'cmd+shift+a');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('extension.ts should register copyAuthorEmail webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyAuthorEmail'"),
      'extension.ts should register copyAuthorEmail webview action');
  });

  test('CLAUDE.md should document Copy Author Email feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy Author Email'),
      'CLAUDE.md should document Copy Author Email feature');
    assert.ok(source.includes('handleCopyAuthorEmail'),
      'CLAUDE.md should reference handleCopyAuthorEmail');
  });

  test('README.md should document Copy Author Email feature', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('Copy author email') || source.includes('Ctrl+Shift+A'),
      'README.md should document copy author email feature or keyboard shortcut');
  });
});