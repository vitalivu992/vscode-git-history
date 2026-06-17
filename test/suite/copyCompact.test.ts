import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Compact Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  test('types.ts should have copyCompact in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyCompact'"),
      'WebviewAction should include copyCompact');
  });

  test('types.ts should have copyCommitCompact in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copyCommitCompact'"),
      'WebviewToExtMessage should include copyCommitCompact');
  });

  test('messageHandler.ts should handle copyCommitCompact case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitCompact':"),
      'messageHandler.ts should handle copyCommitCompact case');
  });

  test('messageHandler.ts should have handleCopyCompact function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyCompact'),
      'messageHandler.ts should have handleCopyCompact function');
  });

  test('handleCopyCompact should format as shortHash - message (author, relativeDate)', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCompact');
    assert.ok(fnStart >= 0, 'handleCopyCompact function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 200);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('commit.shortHash'),
      'handleCopyCompact should use commit.shortHash');
    assert.ok(fnBody.includes('commit.message'),
      'handleCopyCompact should use commit.message');
    assert.ok(fnBody.includes('commit.author'),
      'handleCopyCompact should use commit.author');
    assert.ok(fnBody.includes('relativeDate'),
      'handleCopyCompact should use relativeDate');
    assert.ok(fnBody.includes('formatRelativeTime'),
      'handleCopyCompact should use formatRelativeTime');
    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyCompact should write to clipboard');
  });

  test('handleCopyCompact should show confirmation with truncated message', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCompact');
    assert.ok(fnStart >= 0, 'handleCopyCompact function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 200);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Copied:'),
      'handleCopyCompact should show confirmation');
    assert.ok(fnBody.includes('shortMsg') || fnBody.includes('substring'),
      'handleCopyCompact should truncate long messages');
  });

  test('handleCopyCompact should handle commit not found', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCompact');
    assert.ok(fnStart >= 0, 'handleCopyCompact function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 200);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'handleCopyCompact should handle commit not found');
  });

  test('main.js should have handleCopyCompact function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyCompact'),
      'main.js should have handleCopyCompact function');
  });

  test('main.js should send copyCommitCompact message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copyCommitCompact'"),
      'main.js should send copyCommitCompact message');
  });

  test('main.js triggerAction should dispatch copyCompact', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyCompact': handleCopyCompact()"),
      'main.js triggerAction should dispatch copyCompact');
  });

  test('main.js should have context menu item for copy-compact', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('copy-compact'),
      'main.js should have context menu item for copy-compact');
  });

  test('main.js context menu should handle copy-compact action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'copy-compact'"),
      'main.js should handle copy-compact action');
  });

  test('main.js context menu should have 📝 icon for copy compact', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const compactMenuStart = source.indexOf('copy-compact');
    assert.ok(compactMenuStart >= 0, 'Should find copy-compact in source');
    const nearbySource = source.substring(compactMenuStart - 200, compactMenuStart + 200);
    assert.ok(nearbySource.includes('📝'),
      'main.js should have 📝 icon near copy-compact');
  });

  test('package.json should register copyCompact command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copyCompact'),
      'package.json should register gitHistory.copyCompact command');
  });

  test('package.json should have Copy Commit as Compact command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Copy Commit as Compact'),
      'package.json should have Copy Commit as Compact command title');
  });

  test('package.json should register Ctrl+Shift+. keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyCompact'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyCompact');
    assert.strictEqual(binding.key, 'ctrl+shift+.');
    assert.strictEqual(binding.mac, 'cmd+shift+.');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('extension.ts should register copyCompact webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyCompact'"),
      'extension.ts should register copyCompact webview action');
  });

  test('messageHandler.ts should import formatRelativeTime', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("formatRelativeTime"),
      'messageHandler.ts should import formatRelativeTime');
  });

  test('CLAUDE.md should document Copy as Compact feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy as Compact'),
      'CLAUDE.md should document Copy as Compact feature');
    assert.ok(source.includes('handleCopyCompact'),
      'CLAUDE.md should reference handleCopyCompact');
  });

  test('CLAUDE.md should document Ctrl+Shift+. / Cmd+Shift+. keyboard shortcut', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Ctrl+Shift+.') || source.includes('Cmd+Shift+.'),
      'CLAUDE.md should document Copy Compact keyboard shortcut');
  });

  test('README.md should document Copy as Compact feature', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('compact') || source.includes('Compact') || source.includes('Ctrl+Shift+.'),
      'README.md should document copy compact feature or keyboard shortcut');
  });

  test('README.md should have 📝 icon for Copy as Compact', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('📝'),
      'README.md should have 📝 icon for Copy as Compact');
  });
});
