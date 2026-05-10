import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Tags Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  test('types.ts should have copyTags message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copyTags'"),
      'types.ts should have copyTags message type');
  });

  test('types.ts should have copyTags in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);/);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyTags'"),
      'WebviewAction should include copyTags');
  });

  test('types.ts should have copyTags in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);/);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copyTags'"),
      'WebviewToExtMessage should include copyTags');
  });

  test('messageHandler.ts should handle copyTags case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyTags':"),
      'messageHandler.ts should handle copyTags case');
  });

  test('messageHandler.ts should have handleCopyTags function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyTags'),
      'messageHandler.ts should have handleCopyTags function');
  });

  test('handleCopyTags should access commit.tags', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyTags');
    assert.ok(fnStart >= 0, 'handleCopyTags function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('commit.tags'),
      'handleCopyTags should access commit.tags');
  });

  test('handleCopyTags should write tags to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyTags');
    assert.ok(fnStart >= 0, 'handleCopyTags function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyTags should write to clipboard');
    assert.ok(fnBody.includes('Copied tags'),
      'handleCopyTags should show confirmation message');
  });

  test('handleCopyTags should handle no tags case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyTags');
    assert.ok(fnStart >= 0, 'handleCopyTags function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('No tags on commit'),
      'handleCopyTags should handle no tags case');
  });

  test('main.js should have handleCopyTags function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyTags'),
      'main.js should have handleCopyTags function');
  });

  test('main.js should send copyTags message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copyTags'"),
      'main.js should send copyTags message');
  });

  test('main.js should handle Ctrl+Shift+G keyboard shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("e.key === 'g'") && source.includes('handleCopyTags'),
      'main.js should handle Ctrl+Shift+G and call handleCopyTags');
  });

  test('main.js triggerAction should dispatch copyTags', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyTags': handleCopyTags()"),
      'main.js triggerAction should dispatch copyTags');
  });

  test('package.json should register copyTags command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copyTags'),
      'package.json should register gitHistory.copyTags command');
  });

  test('package.json should have Copy Tags command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Copy Tags'),
      'package.json should have Copy Tags command title');
  });

  test('package.json should register Ctrl+Shift+G keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyTags'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyTags');
    assert.strictEqual(binding.key, 'ctrl+shift+g');
    assert.strictEqual(binding.mac, 'cmd+shift+g');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('extension.ts should register copyTags webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyTags'"),
      'extension.ts should register copyTags webview action');
  });

  test('context menu should have copy-tags item', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('data-action="copy-tags"'),
      'Context menu should include copy-tags');
  });

  test('context menu click handler should handle copy-tags action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'copy-tags'"),
      'Context menu click handler should handle copy-tags action');
    const handlerIdx = source.indexOf("action === 'copy-tags'");
    const nearby = source.substring(handlerIdx, handlerIdx + 200);
    assert.ok(nearby.includes('handleCopyTags'),
      'copy-tags handler should call handleCopyTags');
  });

  test('CLAUDE.md should document Copy Tags feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy Tags') || source.includes('copyTags'),
      'CLAUDE.md should document Copy Tags feature');
  });

  test('README.md should document copy tags feature', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('copy tags') || source.includes('Ctrl+Shift+G'),
      'README.md should document copy tags feature or keyboard shortcut');
  });
});