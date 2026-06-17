import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Commit Short Date Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  test('types.ts should have copyCommitShortDate message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copyCommitShortDate'"),
      'types.ts should have copyCommitShortDate message type');
  });

  test('types.ts should have copyCommitShortDate in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyCommitShortDate'"),
      'WebviewAction should include copyCommitShortDate');
  });

  test('types.ts should have copyCommitShortDate in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copyCommitShortDate'"),
      'WebviewToExtMessage should include copyCommitShortDate');
  });

  test('messageHandler.ts should handle copyCommitShortDate case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitShortDate':"),
      'messageHandler.ts should handle copyCommitShortDate case');
  });

  test('messageHandler.ts should have handleCopyCommitShortDate function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyCommitShortDate'),
      'messageHandler.ts should have handleCopyCommitShortDate function');
  });

  test('handleCopyCommitShortDate should format date as YYYY-MM-DD', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitShortDate');
    assert.ok(fnStart >= 0, 'handleCopyCommitShortDate function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 100);
    const fnBody = source.substring(fnStart, fnEnd);

    // Check for year extraction
    assert.ok(fnBody.includes('getFullYear') || fnBody.includes('getUTCFullYear'),
      'handleCopyCommitShortDate should extract year');
    // Check for month extraction with padding
    assert.ok(fnBody.includes('getMonth') && (fnBody.includes('padStart') || fnBody.includes('pad')),
      'handleCopyCommitShortDate should extract and pad month');
    // Check for day extraction with padding
    assert.ok(fnBody.includes('getDate') && (fnBody.includes('padStart') || fnBody.includes('pad')),
      'handleCopyCommitShortDate should extract and pad day');
    // Check for YYYY-MM-DD format
    assert.ok(fnBody.includes('${year}-${month}-${day}') || fnBody.includes('`'),
      'handleCopyCommitShortDate should format date as YYYY-MM-DD');
  });

  test('handleCopyCommitShortDate should write to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitShortDate');
    assert.ok(fnStart >= 0, 'handleCopyCommitShortDate function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 100);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyCommitShortDate should write to clipboard');
    assert.ok(fnBody.includes('Copied short date'),
      'handleCopyCommitShortDate should show confirmation');
  });

  test('handleCopyCommitShortDate should handle commit not found', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitShortDate');
    assert.ok(fnStart >= 0, 'handleCopyCommitShortDate function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 100);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'handleCopyCommitShortDate should handle commit not found');
  });

  test('main.js should have handleCopyCommitShortDate function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyCommitShortDate'),
      'main.js should have handleCopyCommitShortDate function');
  });

  test('main.js should send copyCommitShortDate message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copyCommitShortDate'"),
      'main.js should send copyCommitShortDate message');
  });

  test('main.js should handle Ctrl+Shift+J keyboard shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    // Check for Shift+J keyboard shortcut handling
    const hasShiftJ = source.includes("'j'") || source.includes("'J'");
    const hasCopyShortDate = source.includes('handleCopyCommitShortDate');
    assert.ok(hasShiftJ && hasCopyShortDate,
      'main.js should handle Ctrl+Shift+J and call handleCopyCommitShortDate');
  });

  test('main.js triggerAction should dispatch copyCommitShortDate', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitShortDate': handleCopyCommitShortDate()"),
      'main.js triggerAction should dispatch copyCommitShortDate');
  });

  test('main.js should have context menu item for copy-commit-short-date', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('copy-commit-short-date'),
      'main.js should have context menu item for copy-commit-short-date');
  });

  test('main.js context menu should handle copy-commit-short-date action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'copy-commit-short-date'"),
      'main.js should handle copy-commit-short-date action');
  });

  test('main.js should have calendar icon for short date menu item', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const hasMenu = source.includes('copy-commit-short-date');
    const hasIcon = source.includes('📅');
    assert.ok(hasMenu && hasIcon,
      'main.js should have calendar icon for short date menu item');
  });

  test('main.js keyboard help should include Copy short date', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const hasDesc = source.includes("'Copy short date'") || source.includes('"Copy short date"');
    const hasShiftJ = source.includes("'J'");
    assert.ok(hasDesc && hasShiftJ,
      'main.js keyboard help should include Copy short date description');
  });

  test('package.json should register copyCommitShortDate command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copyCommitShortDate'),
      'package.json should register gitHistory.copyCommitShortDate command');
  });

  test('package.json should have Copy Commit Short Date command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Copy Commit Short Date'),
      'package.json should have Copy Commit Short Date command title');
  });

  test('package.json should register Ctrl+Shift+J keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyCommitShortDate'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyCommitShortDate');
    assert.strictEqual(binding.key, 'ctrl+shift+j');
    assert.strictEqual(binding.mac, 'cmd+shift+j');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('extension.ts should register copyCommitShortDate webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyCommitShortDate'"),
      'extension.ts should register copyCommitShortDate webview action');
  });

  test('CLAUDE.md should document Copy Commit Short Date feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy Commit Short Date'),
      'CLAUDE.md should document Copy Commit Short Date feature');
    assert.ok(source.includes('handleCopyCommitShortDate'),
      'CLAUDE.md should reference handleCopyCommitShortDate');
  });

  test('CLAUDE.md should document Ctrl+Shift+J / Cmd+Shift+J keyboard shortcut', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Ctrl+Shift+J') || source.includes('Cmd+Shift+J'),
      'CLAUDE.md should document Copy Commit Short Date keyboard shortcut');
  });

  test('README.md should document Copy Commit Short Date feature', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('Copy short date') || source.includes('Ctrl+Shift+J') || source.includes('copyCommitShortDate'),
      'README.md should document copy short date feature or keyboard shortcut');
  });
});
