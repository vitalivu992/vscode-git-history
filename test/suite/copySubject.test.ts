import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Subject Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  test('types.ts should have copySubject message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copySubject'"),
      'types.ts should have copySubject message type');
  });

  test('types.ts should have copySubject in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copySubject'"),
      'WebviewAction should include copySubject');
  });

  test('types.ts should have copySubject in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copySubject'"),
      'WebviewToExtMessage should include copySubject');
  });

  test('messageHandler.ts should handle copySubject case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copySubject':"),
      'messageHandler.ts should handle copySubject case');
  });

  test('messageHandler.ts should have handleCopySubject function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopySubject'),
      'messageHandler.ts should have handleCopySubject function');
  });

  test('handleCopySubject should write commit.message to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopySubject');
    assert.ok(fnStart >= 0, 'handleCopySubject function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 200);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('commit.message'),
      'handleCopySubject should use commit.message');
    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopySubject should write to clipboard');
  });

  test('handleCopySubject should show confirmation with truncated message', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopySubject');
    assert.ok(fnStart >= 0, 'handleCopySubject function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 200);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Copied subject'),
      'handleCopySubject should show confirmation');
    assert.ok(fnBody.includes('truncatedSubject'),
      'handleCopySubject should truncate long messages');
  });

  test('handleCopySubject should handle commit not found', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopySubject');
    assert.ok(fnStart >= 0, 'handleCopySubject function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 200);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'handleCopySubject should handle commit not found');
  });

  test('main.js should have handleCopySubject function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopySubject'),
      'main.js should have handleCopySubject function');
  });

  test('main.js should send copySubject message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copySubject'"),
      'main.js should send copySubject message');
  });

  test('main.js should handle Ctrl+Shift+6 keyboard shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("e.key === '6'") && source.includes('handleCopySubject'),
      'main.js should handle Ctrl+Shift+6 and call handleCopySubject');
  });

  test('main.js triggerAction should dispatch copySubject', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copySubject': handleCopySubject()"),
      'main.js triggerAction should dispatch copySubject');
  });

  test('main.js should have context menu item for copy-subject', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('copy-subject'),
      'main.js should have context menu item for copy-subject');
  });

  test('main.js context menu should handle copy-subject action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'copy-subject'") ||
      source.includes('copy-subject'),
      'main.js should handle copy-subject action');
  });

  test('main.js context menu should have 📌 icon for copy subject', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('📌'),
      'main.js should have 📌 icon for copy subject');
  });

  test('package.json should register copySubject command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copySubject'),
      'package.json should register gitHistory.copySubject command');
  });

  test('package.json should have Copy Commit Subject command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Copy Commit Subject'),
      'package.json should have Copy Commit Subject command title');
  });

  test('package.json should register Ctrl+Shift+6 keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copySubject'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copySubject');
    assert.strictEqual(binding.key, 'ctrl+shift+6');
    assert.strictEqual(binding.mac, 'cmd+shift+6');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('extension.ts should register copySubject webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copySubject'"),
      'extension.ts should register copySubject webview action');
  });

  test('CLAUDE.md should document Copy Subject feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy Subject'),
      'CLAUDE.md should document Copy Subject feature');
    assert.ok(source.includes('handleCopySubject'),
      'CLAUDE.md should reference handleCopySubject');
  });

  test('CLAUDE.md should document Ctrl+Shift+6 / Cmd+Shift+6 keyboard shortcut', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Ctrl+Shift+6') || source.includes('Cmd+Shift+6'),
      'CLAUDE.md should document Copy Subject keyboard shortcut');
  });

  test('README.md should document Copy Subject feature', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('Copy subject') || source.includes('Ctrl+Shift+6'),
      'README.md should document copy subject feature or keyboard shortcut');
  });

  test('README.md should have 📌 icon for Copy Subject', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('📌'),
      'README.md should have 📌 icon for Copy Subject');
  });
});
