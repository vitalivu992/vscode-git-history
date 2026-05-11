import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Relative Date Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  test('types.ts should have copyRelativeDate message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copyRelativeDate'"),
      'types.ts should have copyRelativeDate message type');
  });

  test('types.ts should have copyRelativeDate in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);/);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyRelativeDate'"),
      'WebviewAction should include copyRelativeDate');
  });

  test('types.ts should have copyRelativeDate in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);/);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copyRelativeDate'"),
      'WebviewToExtMessage should include copyRelativeDate');
  });

  test('messageHandler.ts should handle copyRelativeDate case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyRelativeDate':"),
      'messageHandler.ts should handle copyRelativeDate case');
  });

  test('messageHandler.ts should have handleCopyRelativeDate function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyRelativeDate'),
      'messageHandler.ts should have handleCopyRelativeDate function');
  });

  test('handleCopyRelativeDate should calculate relative date', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyRelativeDate');
    assert.ok(fnStart >= 0, 'handleCopyRelativeDate function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('diffDays'),
      'handleCopyRelativeDate should calculate days difference');
    assert.ok(fnBody.includes('toLocaleTimeString') || fnBody.includes('toLocaleDateString'),
      'handleCopyRelativeDate should format date using locale methods');
  });

  test('handleCopyRelativeDate should write to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyRelativeDate');
    assert.ok(fnStart >= 0, 'handleCopyRelativeDate function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyRelativeDate should write to clipboard');
    assert.ok(fnBody.includes('Copied relative date'),
      'handleCopyRelativeDate should show confirmation');
  });

  test('handleCopyRelativeDate should handle commit not found', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyRelativeDate');
    assert.ok(fnStart >= 0, 'handleCopyRelativeDate function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'handleCopyRelativeDate should handle commit not found');
  });

  test('main.js should have handleCopyRelativeDate function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyRelativeDate'),
      'main.js should have handleCopyRelativeDate function');
  });

  test('main.js should send copyRelativeDate message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copyRelativeDate'"),
      'main.js should send copyRelativeDate message');
  });

  test('main.js should handle Ctrl+Shift+8 keyboard shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("e.key === '8'") && source.includes('handleCopyRelativeDate'),
      'main.js should handle Ctrl+Shift+8 and call handleCopyRelativeDate');
  });

  test('main.js triggerAction should dispatch copyRelativeDate', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyRelativeDate': handleCopyRelativeDate()"),
      'main.js triggerAction should dispatch copyRelativeDate');
  });

  test('main.js should have context menu item for copy-relative-date', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('copy-relative-date'),
      'main.js should have context menu item for copy-relative-date');
  });

  test('main.js context menu should handle copy-relative-date action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'copy-relative-date'"),
      'main.js should handle copy-relative-date action');
  });

  test('main.js keyboard help should include Copy relative date', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("description: 'Copy relative date'") ||
      source.includes("description: 'Copy Relative Date'"),
      'main.js keyboard help should include Copy relative date');
  });

  test('package.json should register copyRelativeDate command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copyRelativeDate'),
      'package.json should register gitHistory.copyRelativeDate command');
  });

  test('package.json should have Copy Relative Date command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Copy Relative Date'),
      'package.json should have Copy Relative Date command title');
  });

  test('package.json should register Ctrl+Shift+8 keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyRelativeDate'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyRelativeDate');
    assert.strictEqual(binding.key, 'ctrl+shift+8');
    assert.strictEqual(binding.mac, 'cmd+shift+8');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('extension.ts should register copyRelativeDate webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyRelativeDate'"),
      'extension.ts should register copyRelativeDate webview action');
  });

  test('CLAUDE.md should document Copy Relative Date feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy Relative Date'),
      'CLAUDE.md should document Copy Relative Date feature');
    assert.ok(source.includes('handleCopyRelativeDate'),
      'CLAUDE.md should reference handleCopyRelativeDate');
  });

  test('CLAUDE.md should document Ctrl+Shift+8 / Cmd+Shift+8 keyboard shortcut', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Ctrl+Shift+8') || source.includes('Cmd+Shift+8'),
      'CLAUDE.md should document Copy Relative Date keyboard shortcut');
  });

  test('README.md should document Copy Relative Date feature', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('Copy relative date') || source.includes('Ctrl+Shift+8'),
      'README.md should document copy relative date feature or keyboard shortcut');
  });
});
