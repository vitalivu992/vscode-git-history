import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Diff Stat Summary Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  test('types.ts should have copyDiffStatSummary message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copyDiffStatSummary'"),
      'types.ts should have copyDiffStatSummary message type');
  });

  test('types.ts should have copyDiffStatSummary in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyDiffStatSummary'"),
      'WebviewAction should include copyDiffStatSummary');
  });

  test('types.ts should have copyDiffStatSummary in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copyDiffStatSummary'"),
      'WebviewToExtMessage should include copyDiffStatSummary');
  });

  test('types.ts should have copyDiffStatSummary with hash property', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/copyDiffStatSummary.*?hash: string/);
    assert.ok(msgMatch, 'types.ts should have copyDiffStatSummary with hash property');
  });

  test('messageHandler.ts should handle copyDiffStatSummary case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyDiffStatSummary':"),
      'messageHandler.ts should handle copyDiffStatSummary case');
  });

  test('messageHandler.ts should have handleCopyDiffStatSummary function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyDiffStatSummary'),
      'messageHandler.ts should have handleCopyDiffStatSummary function');
  });

  test('handleCopyDiffStatSummary should use commit.stats', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyDiffStatSummary');
    assert.ok(fnStart >= 0, 'handleCopyDiffStatSummary function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 300);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('commit.stats'),
      'handleCopyDiffStatSummary should use commit.stats');
    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyDiffStatSummary should write to clipboard');
  });

  test('handleCopyDiffStatSummary should format diff stat summary with singular/plural', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyDiffStatSummary');
    assert.ok(fnStart >= 0, 'handleCopyDiffStatSummary function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 300);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('filesWord'),
      'handleCopyDiffStatSummary should handle singular/plural for files');
    assert.ok(fnBody.includes('insertionsWord'),
      'handleCopyDiffStatSummary should handle singular/plural for insertions');
    assert.ok(fnBody.includes('deletionsWord'),
      'handleCopyDiffStatSummary should handle singular/plural for deletions');
  });

  test('handleCopyDiffStatSummary should output format "X files changed, Y insertion(s)(+), Z deletion(s)(-)"', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyDiffStatSummary');
    assert.ok(fnStart >= 0, 'handleCopyDiffStatSummary function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 300);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('files changed'),
      'handleCopyDiffStatSummary should format files changed');
    assert.ok(fnBody.includes('insertions(+)'),
      'handleCopyDiffStatSummary should format insertions');
    assert.ok(fnBody.includes('deletions(-)'),
      'handleCopyDiffStatSummary should format deletions');
  });

  test('handleCopyDiffStatSummary should handle commit not found', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyDiffStatSummary');
    assert.ok(fnStart >= 0, 'handleCopyDiffStatSummary function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 300);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'handleCopyDiffStatSummary should handle commit not found');
  });

  test('handleCopyDiffStatSummary should handle no statistics', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyDiffStatSummary');
    assert.ok(fnStart >= 0, 'handleCopyDiffStatSummary function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 300);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('No statistics available'),
      'handleCopyDiffStatSummary should handle no statistics');
  });

  test('handleCopyDiffStatSummary should show confirmation message', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyDiffStatSummary');
    assert.ok(fnStart >= 0, 'handleCopyDiffStatSummary function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 300);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('showInformationMessage'),
      'handleCopyDiffStatSummary should show confirmation');
    assert.ok(fnBody.includes('Diff stat summary copied'),
      'handleCopyDiffStatSummary should show confirmation with proper message');
  });

  test('main.js should have handleCopyDiffStatSummary function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyDiffStatSummary'),
      'main.js should have handleCopyDiffStatSummary function');
  });

  test('main.js should send copyDiffStatSummary message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copyDiffStatSummary'"),
      'main.js should send copyDiffStatSummary message');
  });

  test('main.js should handle Ctrl+Shift+9 keyboard shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("e.key === '9'") && source.includes('handleCopyDiffStatSummary'),
      'main.js should handle Ctrl+Shift+9 and call handleCopyDiffStatSummary');
  });

  test('main.js triggerAction should dispatch copyDiffStatSummary', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyDiffStatSummary': handleCopyDiffStatSummary()"),
      'main.js triggerAction should dispatch copyDiffStatSummary');
  });

  test('main.js should have context menu item for copy-diff-stat-summary', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('copy-diff-stat-summary'),
      'main.js should have context menu item for copy-diff-stat-summary');
  });

  test('main.js context menu should have 📊 icon', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('data-action="copy-diff-stat-summary"'),
      'main.js should have context menu entry for copy-diff-stat-summary');
    assert.ok(source.includes('📊'),
      'main.js should have 📊 icon for diff stat summary');
  });

  test('main.js context menu should handle copy-diff-stat-summary action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'copy-diff-stat-summary'") ||
      source.includes('copy-diff-stat-summary'),
      'main.js should handle copy-diff-stat-summary action');
  });

  test('package.json should register copyDiffStatSummary command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copyDiffStatSummary'),
      'package.json should register gitHistory.copyDiffStatSummary command');
  });

  test('package.json should have Copy Diff Stat Summary command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Copy Diff Stat Summary'),
      'package.json should have Copy Diff Stat Summary command title');
  });

  test('package.json should register Ctrl+Shift+9 keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyDiffStatSummary'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyDiffStatSummary');
    assert.strictEqual(binding.key, 'ctrl+shift+9');
    assert.strictEqual(binding.mac, 'cmd+shift+9');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('extension.ts should register copyDiffStatSummary webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyDiffStatSummary'"),
      'extension.ts should register copyDiffStatSummary webview action');
  });
});