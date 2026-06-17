import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Commit Body Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  test('types.ts should have copyCommitBody message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copyCommitBody'"),
      'types.ts should have copyCommitBody message type');
  });

  test('types.ts should have copyCommitBody in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyCommitBody'"),
      'WebviewAction should include copyCommitBody');
  });

  test('types.ts should have copyCommitBody in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copyCommitBody'"),
      'WebviewToExtMessage should include copyCommitBody');
  });

  test('messageHandler.ts should handle copyCommitBody case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitBody':"),
      'messageHandler.ts should handle copyCommitBody case');
  });

  test('messageHandler.ts should have handleCopyCommitBody function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyCommitBody'),
      'messageHandler.ts should have handleCopyCommitBody function');
  });

  test('handleCopyCommitBody should extract body after first newline', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitBody');
    assert.ok(fnStart >= 0, 'handleCopyCommitBody function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 200);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('fullMessage') || fnBody.includes('commit.message'),
      'handleCopyCommitBody should use fullMessage or commit.message');
    assert.ok(fnBody.includes("indexOf('\\n')"),
      'handleCopyCommitBody should find newline index');
    assert.ok(fnBody.includes('substring(newlineIndex'),
      'handleCopyCommitBody should extract text after newline');
  });

  test('handleCopyCommitBody should trim the body', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitBody');
    assert.ok(fnStart >= 0, 'handleCopyCommitBody function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 200);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('.trim()'),
      'handleCopyCommitBody should trim the body');
  });

  test('handleCopyCommitBody should write to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitBody');
    assert.ok(fnStart >= 0, 'handleCopyCommitBody function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 200);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyCommitBody should write to clipboard');
  });

  test('handleCopyCommitBody should handle commit not found', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitBody');
    assert.ok(fnStart >= 0, 'handleCopyCommitBody function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 200);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'handleCopyCommitBody should handle commit not found');
  });

  test('handleCopyCommitBody should handle no body (single-line message)', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitBody');
    assert.ok(fnStart >= 0, 'handleCopyCommitBody function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 200);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit has no body'),
      'handleCopyCommitBody should show message for no body');
  });

  test('handleCopyCommitBody should handle empty body after newline', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitBody');
    assert.ok(fnStart >= 0, 'handleCopyCommitBody function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 200);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes("body === ''"),
      'handleCopyCommitBody should check for empty body');
  });

  test('handleCopyCommitBody should truncate long body in confirmation', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitBody');
    assert.ok(fnStart >= 0, 'handleCopyCommitBody function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 200);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('truncatedBody'),
      'handleCopyCommitBody should truncate long body in confirmation');
    assert.ok(fnBody.includes('Copied body'),
      'handleCopyCommitBody should show confirmation with body preview');
  });

  test('main.js should have handleCopyCommitBody function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyCommitBody'),
      'main.js should have handleCopyCommitBody function');
  });

  test('main.js should send copyCommitBody message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copyCommitBody'"),
      'main.js should send copyCommitBody message');
  });

  test('main.js should handle Ctrl+Shift+Z keyboard shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("e.key === 'z'") && source.includes('handleCopyCommitBody'),
      'main.js should handle Ctrl+Shift+Z and call handleCopyCommitBody');
  });

  test('main.js triggerAction should dispatch copyCommitBody', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitBody': handleCopyCommitBody()"),
      'main.js triggerAction should dispatch copyCommitBody');
  });

  test('main.js should have context menu item for copy-commit-body', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('copy-commit-body'),
      'main.js should have context menu item for copy-commit-body');
  });

  test('main.js context menu should handle copy-commit-body action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'copy-commit-body'"),
      'main.js should handle copy-commit-body action');
  });

  test('main.js context menu should have 📄 icon for copy commit body', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('📄'),
      'main.js should have 📄 icon for copy commit body');
  });

  test('main.js keyboard help should include Copy commit body shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("Copy commit body"),
      'main.js keyboard help should include Copy commit body');
    assert.ok(source.includes("'Z'"),
      'main.js keyboard help should include Z key for copy commit body');
  });

  test('package.json should register copyCommitBody command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copyCommitBody'),
      'package.json should register gitHistory.copyCommitBody command');
  });

  test('package.json should have Copy Commit Body command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Copy Commit Body'),
      'package.json should have Copy Commit Body command title');
  });

  test('package.json should register Ctrl+Shift+Z keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyCommitBody'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyCommitBody');
    assert.strictEqual(binding.key, 'ctrl+shift+z');
    assert.strictEqual(binding.mac, 'cmd+shift+z');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('extension.ts should register copyCommitBody webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyCommitBody'"),
      'extension.ts should register copyCommitBody webview action');
  });

  test('CLAUDE.md should document Copy Commit Body feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy Commit Body'),
      'CLAUDE.md should document Copy Commit Body feature');
    assert.ok(source.includes('handleCopyCommitBody'),
      'CLAUDE.md should reference handleCopyCommitBody');
  });

  test('CLAUDE.md should document Ctrl+Shift+Z / Cmd+Shift+Z keyboard shortcut', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Ctrl+Shift+Z') || source.includes('Cmd+Shift+Z'),
      'CLAUDE.md should document Copy Commit Body keyboard shortcut');
  });

  test('README.md should document Copy Commit Body feature', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('Copy Commit Body') || source.includes('Ctrl+Shift+Z'),
      'README.md should document Copy Commit Body feature or keyboard shortcut');
  });

  test('README.md should have 📄 icon for Copy Commit Body', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('📄'),
      'README.md should have 📄 icon for Copy Commit Body');
  });
});
