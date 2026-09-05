import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Short Date Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const usagePath = path.resolve(__dirname, '../../../USAGE.md');

  test('types.ts should have copyShortDate message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copyShortDate'"),
      'types.ts should have copyShortDate message type');
  });

  test('types.ts should have copyShortDate in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyShortDate'"),
      'WebviewAction should include copyShortDate');
  });

  test('types.ts should have copyShortDate in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copyShortDate'"),
      'WebviewToExtMessage should include copyShortDate');
  });

  test('messageHandler.ts should handle copyShortDate case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyShortDate':"),
      'messageHandler.ts should handle copyShortDate case');
  });

  test('messageHandler.ts should have handleCopyShortDate function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyShortDate'),
      'messageHandler.ts should have handleCopyShortDate function');
  });

  test('handleCopyShortDate should format the date as YYYY-MM-DD', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyShortDate');
    assert.ok(fnStart >= 0, 'handleCopyShortDate function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('substring(0, 10)'),
      'handleCopyShortDate should extract the first 10 characters of the ISO date');
  });

  test('handleCopyShortDate should write to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyShortDate');
    assert.ok(fnStart >= 0, 'handleCopyShortDate function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyShortDate should write to clipboard');
    assert.ok(fnBody.includes('Copied short date'),
      'handleCopyShortDate should show confirmation');
  });

  test('handleCopyShortDate should handle commit not found', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyShortDate');
    assert.ok(fnStart >= 0, 'handleCopyShortDate function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'handleCopyShortDate should handle commit not found');
  });

  test('main.js should have handleCopyShortDate function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyShortDate'),
      'main.js should have handleCopyShortDate function');
  });

  test('main.js should send copyShortDate message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copyShortDate'"),
      'main.js should send copyShortDate message');
  });

  test('main.js should handle Ctrl+Alt+D keyboard shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("e.key === 'd'") && source.includes('handleCopyShortDate'),
      'main.js should handle Ctrl+Alt+D and call handleCopyShortDate');
  });

  test('main.js triggerAction should dispatch copyShortDate', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyShortDate': handleCopyShortDate()"),
      'main.js triggerAction should dispatch copyShortDate');
  });

  test('main.js should have context menu item for copy-short-date', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('copy-short-date'),
      'main.js should have context menu item for copy-short-date');
  });

  test('main.js context menu should handle copy-short-date action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'copy-short-date'") ||
      source.includes('copy-short-date'),
      'main.js should handle copy-short-date action');
  });

  test('package.json should register copyShortDate command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copyShortDate'),
      'package.json should register gitHistory.copyShortDate command');
  });

  test('package.json should have Copy Short Date command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Copy Short Date'),
      'package.json should have Copy Short Date command title');
  });

  test('package.json should register Ctrl+Alt+D keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyShortDate'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyShortDate');
    assert.strictEqual(binding.key, 'ctrl+alt+d');
    assert.strictEqual(binding.mac, 'cmd+alt+d');
    assert.strictEqual(binding.when, 'activeWebviewViewId == gitHistory.webview');
  });

  test('extension.ts should register copyShortDate webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyShortDate'"),
      'extension.ts should register copyShortDate webview action');
  });

  test('CLAUDE.md should document Copy Short Date feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy Short Date'),
      'CLAUDE.md should document Copy Short Date feature');
    assert.ok(source.includes('handleCopyShortDate'),
      'CLAUDE.md should reference handleCopyShortDate');
  });

  test('USAGE.md should document the copy short date shortcut', () => {
    const source = fs.readFileSync(usagePath, 'utf-8');
    assert.ok(source.includes('Ctrl+Alt+D') && source.toLowerCase().includes('short date'),
      'USAGE.md should document Ctrl+Alt+D copy short date');
  });
});
