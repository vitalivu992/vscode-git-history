import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Commit Unix Timestamp Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');

  test('types.ts should have copyCommitTimestamp message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copyCommitTimestamp'"),
      'types.ts should have copyCommitTimestamp message type');
  });

  test('types.ts should have copyCommitTimestamp in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);/);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyCommitTimestamp'"),
      'WebviewAction should include copyCommitTimestamp');
  });

  test('types.ts should have copyCommitTimestamp in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);/);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copyCommitTimestamp'"),
      'WebviewToExtMessage should include copyCommitTimestamp');
  });

  test('messageHandler.ts should handle copyCommitTimestamp case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitTimestamp':"),
      'messageHandler.ts should handle copyCommitTimestamp case');
  });

  test('messageHandler.ts should have handleCopyCommitTimestamp function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyCommitTimestamp'),
      'messageHandler.ts should have handleCopyCommitTimestamp function');
  });

  test('handleCopyCommitTimestamp should use Math.floor for Unix timestamp', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitTimestamp');
    assert.ok(fnStart >= 0, 'handleCopyCommitTimestamp function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Math.floor'),
      'handleCopyCommitTimestamp should use Math.floor for Unix timestamp');
    assert.ok(fnBody.includes('/ 1000'),
      'handleCopyCommitTimestamp should convert milliseconds to seconds');
  });

  test('handleCopyCommitTimestamp should write to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitTimestamp');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyCommitTimestamp should write to clipboard');
    assert.ok(fnBody.includes('Copied timestamp'),
      'handleCopyCommitTimestamp should show confirmation');
  });

  test('handleCopyCommitTimestamp should handle commit not found', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitTimestamp');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'handleCopyCommitTimestamp should handle commit not found');
  });

  test('main.js should have handleCopyCommitTimestamp function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyCommitTimestamp'),
      'main.js should have handleCopyCommitTimestamp function');
  });

  test('main.js should send copyCommitTimestamp message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copyCommitTimestamp'"),
      'main.js should send copyCommitTimestamp message');
  });

  test('main.js should handle Ctrl+Shift+2 keyboard shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("e.key === '2'") && source.includes('handleCopyCommitTimestamp'),
      'main.js should handle Ctrl+Shift+2 and call handleCopyCommitTimestamp');
  });

  test('main.js triggerAction should dispatch copyCommitTimestamp', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitTimestamp': handleCopyCommitTimestamp()"),
      'main.js triggerAction should dispatch copyCommitTimestamp');
  });

  test('main.js should have context menu item for copy-timestamp', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('copy-timestamp'),
      'main.js should have context menu item for copy-timestamp');
  });

  test('main.js context menu should handle copy-timestamp action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'copy-timestamp'"),
      'main.js should handle copy-timestamp action');
  });

  test('package.json should register copyCommitTimestamp command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copyCommitTimestamp'),
      'package.json should register gitHistory.copyCommitTimestamp command');
  });

  test('package.json should have Copy Commit Unix Timestamp command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Copy Commit Unix Timestamp'),
      'package.json should have Copy Commit Unix Timestamp command title');
  });

  test('package.json should register Ctrl+Shift+2 keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyCommitTimestamp'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyCommitTimestamp');
    assert.strictEqual(binding.key, 'ctrl+shift+2');
    assert.strictEqual(binding.mac, 'cmd+shift+2');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('extension.ts should register copyCommitTimestamp webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyCommitTimestamp'"),
      'extension.ts should register copyCommitTimestamp webview action');
  });

  test('CLAUDE.md should document Copy Commit Unix Timestamp feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy Commit Unix Timestamp'),
      'CLAUDE.md should document Copy Commit Unix Timestamp feature');
    assert.ok(source.includes('handleCopyCommitTimestamp'),
      'CLAUDE.md should reference handleCopyCommitTimestamp');
  });

  test('CLAUDE.md should document Ctrl+Shift+2 / Cmd+Shift+2 keyboard shortcut', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Ctrl+Shift+2') || source.includes('Cmd+Shift+2'),
      'CLAUDE.md should document Copy Commit Unix Timestamp keyboard shortcut');
  });

  test('main.js keyboard help should list Copy Unix timestamp', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const helpEntries = source.match(/{ keys: \[.*?\], description: '.*?' }/g);
    assert.ok(helpEntries && helpEntries.some((e: string) => e.includes('Copy Unix timestamp')),
      'main.js keyboard help should list Copy Unix timestamp');
  });
});