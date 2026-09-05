import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Author Name Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  test('types.ts should have copyAuthorName message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copyAuthorName'"),
      'types.ts should have copyAuthorName message type');
  });

  test('types.ts should have copyAuthorName in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyAuthorName'"),
      'WebviewAction should include copyAuthorName');
  });

  test('types.ts should have copyAuthorName in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copyAuthorName'"),
      'WebviewToExtMessage should include copyAuthorName');
  });

  test('messageHandler.ts should handle copyAuthorName case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyAuthorName':"),
      'messageHandler.ts should handle copyAuthorName case');
  });

  test('messageHandler.ts should have handleCopyAuthorName function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyAuthorName'),
      'messageHandler.ts should have handleCopyAuthorName function');
  });

  test('handleCopyAuthorName should read commit.author', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyAuthorName');
    assert.ok(fnStart >= 0, 'handleCopyAuthorName function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('commit.author'),
      'handleCopyAuthorName should read commit.author');
  });

  test('handleCopyAuthorName should write to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyAuthorName');
    assert.ok(fnStart >= 0, 'handleCopyAuthorName function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyAuthorName should write to clipboard');
    assert.ok(fnBody.includes('Author name copied'),
      'handleCopyAuthorName should show confirmation');
  });

  test('handleCopyAuthorName should handle commit not found', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyAuthorName');
    assert.ok(fnStart >= 0, 'handleCopyAuthorName function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'handleCopyAuthorName should handle commit not found');
  });

  test('main.js should have handleCopyAuthorName function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyAuthorName'),
      'main.js should have handleCopyAuthorName function');
  });

  test('main.js should send copyAuthorName message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copyAuthorName'"),
      'main.js should send copyAuthorName message');
  });

  test('main.js should handle Ctrl+Shift+N keyboard shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("e.key === 'n'") && source.includes('handleCopyAuthorName'),
      'main.js should handle Ctrl+Shift+N and call handleCopyAuthorName');
  });

  test('main.js triggerAction should dispatch copyAuthorName', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyAuthorName': handleCopyAuthorName()"),
      'main.js triggerAction should dispatch copyAuthorName');
  });

  test('main.js should have context menu item for copy-author-name', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('copy-author-name'),
      'main.js should have context menu item for copy-author-name');
  });

  test('main.js context menu should handle copy-author-name action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'copy-author-name'") ||
      source.includes('copy-author-name'),
      'main.js should handle copy-author-name action');
  });

  test('package.json should register copyAuthorName command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copyAuthorName'),
      'package.json should register gitHistory.copyAuthorName command');
  });

  test('package.json should have Copy Author Name command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Copy Author Name'),
      'package.json should have Copy Author Name command title');
  });

  test('package.json should register Ctrl+Shift+N keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyAuthorName'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyAuthorName');
    assert.strictEqual(binding.key, 'ctrl+shift+n');
    assert.strictEqual(binding.mac, 'cmd+shift+n');
    assert.strictEqual(binding.when, 'activeWebviewViewId == gitHistory.webview');
  });

  test('extension.ts should register copyAuthorName webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyAuthorName'"),
      'extension.ts should register copyAuthorName webview action');
  });

  test('CLAUDE.md should document Copy Author Name feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy Author Name'),
      'CLAUDE.md should document Copy Author Name feature');
    assert.ok(source.includes('handleCopyAuthorName'),
      'CLAUDE.md should reference handleCopyAuthorName');
  });

  test('README.md should document Copy Author Name feature', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('Copy author name') || source.includes('Ctrl+Shift+N'),
      'README.md should document copy author name feature or keyboard shortcut');
  });
});
