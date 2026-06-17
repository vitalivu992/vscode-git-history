import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Commit Date Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  test('types.ts should have copyCommitDate message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copyCommitDate'"),
      'types.ts should have copyCommitDate message type');
  });

  test('types.ts should have copyCommitDate in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyCommitDate'"),
      'WebviewAction should include copyCommitDate');
  });

  test('types.ts should have copyCommitDate in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copyCommitDate'"),
      'WebviewToExtMessage should include copyCommitDate');
  });

  test('messageHandler.ts should handle copyCommitDate case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitDate':"),
      'messageHandler.ts should handle copyCommitDate case');
  });

  test('messageHandler.ts should have handleCopyCommitDate function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyCommitDate'),
      'messageHandler.ts should have handleCopyCommitDate function');
  });

  test('handleCopyCommitDate should use toISOString()', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitDate');
    assert.ok(fnStart >= 0, 'handleCopyCommitDate function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('toISOString()'),
      'handleCopyCommitDate should format date using toISOString()');
  });

  test('handleCopyCommitDate should write to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitDate');
    assert.ok(fnStart >= 0, 'handleCopyCommitDate function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyCommitDate should write to clipboard');
    assert.ok(fnBody.includes('Copied date'),
      'handleCopyCommitDate should show confirmation');
  });

  test('handleCopyCommitDate should handle commit not found', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitDate');
    assert.ok(fnStart >= 0, 'handleCopyCommitDate function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'handleCopyCommitDate should handle commit not found');
  });

  test('main.js should have handleCopyCommitDate function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyCommitDate'),
      'main.js should have handleCopyCommitDate function');
  });

  test('main.js should send copyCommitDate message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copyCommitDate'"),
      'main.js should send copyCommitDate message');
  });

  test('main.js should handle Ctrl+Shift+T keyboard shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("e.key === 't'") && source.includes('handleCopyCommitDate'),
      'main.js should handle Ctrl+Shift+T and call handleCopyCommitDate');
  });

  test('main.js triggerAction should dispatch copyCommitDate', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitDate': handleCopyCommitDate()"),
      'main.js triggerAction should dispatch copyCommitDate');
  });

  test('main.js should have context menu item for copy-commit-date', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('copy-commit-date'),
      'main.js should have context menu item for copy-commit-date');
  });

  test('main.js context menu should handle copy-commit-date action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'copy-commit-date'"),
      'main.js should handle copy-commit-date action');
  });

  test('package.json should register copyCommitDate command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copyCommitDate'),
      'package.json should register gitHistory.copyCommitDate command');
  });

  test('package.json should have Copy Commit Date command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Copy Commit Date'),
      'package.json should have Copy Commit Date command title');
  });

  test('package.json should register Ctrl+Shift+T keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyCommitDate'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyCommitDate');
    assert.strictEqual(binding.key, 'ctrl+shift+t');
    assert.strictEqual(binding.mac, 'cmd+shift+t');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('extension.ts should register copyCommitDate webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyCommitDate'"),
      'extension.ts should register copyCommitDate webview action');
  });

  test('CLAUDE.md should document Copy Commit Date feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy Commit Date'),
      'CLAUDE.md should document Copy Commit Date feature');
    assert.ok(source.includes('handleCopyCommitDate'),
      'CLAUDE.md should reference handleCopyCommitDate');
  });

  test('CLAUDE.md should document Ctrl+Shift+T / Cmd+Shift+T keyboard shortcut', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Ctrl+Shift+T') || source.includes('Cmd+Shift+T'),
      'CLAUDE.md should document Copy Commit Date keyboard shortcut');
  });

  test('README.md should document Copy Commit Date feature', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('Copy commit date') || source.includes('Ctrl+Shift+T'),
      'README.md should document copy commit date feature or keyboard shortcut');
  });
});
