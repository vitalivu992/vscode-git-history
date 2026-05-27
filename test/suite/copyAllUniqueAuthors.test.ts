import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy All Unique Authors Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  test('types.ts should have copyAllUniqueAuthors in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);/);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyAllUniqueAuthors'"),
      'WebviewAction should include copyAllUniqueAuthors');
  });

  test('types.ts should have copyAllUniqueAuthors in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);/);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copyAllUniqueAuthors'"),
      'WebviewToExtMessage should include copyAllUniqueAuthors');
  });

  test('messageHandler.ts should handle copyAllUniqueAuthors case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyAllUniqueAuthors':"),
      'messageHandler.ts should handle copyAllUniqueAuthors case');
  });

  test('messageHandler.ts should have handleCopyAllUniqueAuthors function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyAllUniqueAuthors'),
      'messageHandler.ts should have handleCopyAllUniqueAuthors function');
  });

  test('handleCopyAllUniqueAuthors should format as Name <email>', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyAllUniqueAuthors');
    assert.ok(fnStart >= 0, 'handleCopyAllUniqueAuthors function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('commit.author'),
      'handleCopyAllUniqueAuthors should use commit.author');
    assert.ok(fnBody.includes('commit.email'),
      'handleCopyAllUniqueAuthors should use commit.email');
    assert.ok(fnBody.includes('`${commit.author} <${commit.email}>`'),
      'handleCopyAllUniqueAuthors should format as Name <email>');
  });

  test('handleCopyAllUniqueAuthors should use deduplication', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyAllUniqueAuthors');
    assert.ok(fnStart >= 0, 'handleCopyAllUniqueAuthors function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Map') || fnBody.includes('Set') || fnBody.includes('unique'),
      'handleCopyAllUniqueAuthors should use deduplication');
  });

  test('handleCopyAllUniqueAuthors should sort alphabetically', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyAllUniqueAuthors');
    assert.ok(fnStart >= 0, 'handleCopyAllUniqueAuthors function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('.sort()'),
      'handleCopyAllUniqueAuthors should sort authors alphabetically');
  });

  test('handleCopyAllUniqueAuthors should show confirmation with singular/plural', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyAllUniqueAuthors');
    assert.ok(fnStart >= 0, 'handleCopyAllUniqueAuthors function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('authorsArray.length') && fnBody.includes('!=='),
      'handleCopyAllUniqueAuthors should use singular/plural form');
    assert.ok(fnBody.includes('Copied'),
      'handleCopyAllUniqueAuthors should show confirmation');
    assert.ok(fnBody.includes('unique author'),
      'handleCopyAllUniqueAuthors should mention unique authors');
  });

  test('handleCopyAllUniqueAuthors should handle empty hashes', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyAllUniqueAuthors');
    assert.ok(fnStart >= 0, 'handleCopyAllUniqueAuthors function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('hashes.length === 0'),
      'handleCopyAllUniqueAuthors should check for empty hashes');
    assert.ok(fnBody.includes('No commits visible in current view'),
      'handleCopyAllUniqueAuthors should show message when no commits visible');
  });

  test('handleCopyAllUniqueAuthors should write to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyAllUniqueAuthors');
    assert.ok(fnStart >= 0, 'handleCopyAllUniqueAuthors function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyAllUniqueAuthors should write to clipboard');
  });

  test('main.js should have handleCopyAllUniqueAuthors function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyAllUniqueAuthors'),
      'main.js should have handleCopyAllUniqueAuthors function');
  });

  test('main.js should send copyAllUniqueAuthors message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copyAllUniqueAuthors'"),
      'main.js should send copyAllUniqueAuthors message');
  });

  test('main.js triggerAction should dispatch copyAllUniqueAuthors', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyAllUniqueAuthors': handleCopyAllUniqueAuthors()"),
      'main.js triggerAction should dispatch copyAllUniqueAuthors');
  });

  test('main.js should have context menu item for copy-all-unique-authors', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('copy-all-unique-authors'),
      'main.js should have context menu item for copy-all-unique-authors');
  });

  test('main.js context menu should handle copy-all-unique-authors action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'copy-all-unique-authors'"),
      'main.js should handle copy-all-unique-authors action');
  });

  test('main.js context menu should have 👥 icon for copy all unique authors', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const menuStart = source.indexOf('copy-all-unique-authors');
    assert.ok(menuStart >= 0, 'Should find copy-all-unique-authors in source');
    const nearbySource = source.substring(menuStart - 200, menuStart + 200);
    assert.ok(nearbySource.includes('👥'),
      'main.js should have 👥 icon near copy-all-unique-authors');
  });

  test('main.js should handle Ctrl+Shift+Alt+P keyboard shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('Ctrl+Shift+Alt+P') || source.includes('ctrl+shift+alt+p') ||
      source.includes('Cmd+Shift+Alt+P') || source.includes('cmd+shift+alt+p'),
      'main.js should handle Ctrl+Shift+Alt+P keyboard shortcut');
  });

  test('main.js should have keyboard help entry for Copy all unique authors', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('Copy all unique authors'),
      'main.js should have keyboard help entry for Copy all unique authors');
  });

  test('package.json should register copyAllUniqueAuthors command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copyAllUniqueAuthors'),
      'package.json should register gitHistory.copyAllUniqueAuthors command');
  });

  test('package.json should have Copy All Unique Authors command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Copy All Unique Authors'),
      'package.json should have Copy All Unique Authors command title');
  });

  test('package.json should register Ctrl+Shift+Alt+P keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyAllUniqueAuthors'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyAllUniqueAuthors');
    assert.strictEqual(binding.key, 'ctrl+shift+alt+p');
    assert.strictEqual(binding.mac, 'cmd+shift+alt+p');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('extension.ts should register copyAllUniqueAuthors webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyAllUniqueAuthors'"),
      'extension.ts should register copyAllUniqueAuthors webview action');
  });

  test('CLAUDE.md should document Copy All Unique Authors feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy All Unique Authors'),
      'CLAUDE.md should document Copy All Unique Authors feature');
    assert.ok(source.includes('handleCopyAllUniqueAuthors'),
      'CLAUDE.md should reference handleCopyAllUniqueAuthors');
  });

  test('CLAUDE.md should document Ctrl+Shift+Alt+P / Cmd+Shift+Alt+P keyboard shortcut', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Ctrl+Shift+Alt+P') || source.includes('Cmd+Shift+Alt+P'),
      'CLAUDE.md should document Copy All Unique Authors keyboard shortcut');
  });

  test('README.md should document Copy All Unique Authors feature', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('Copy All Unique Authors') ||
      source.includes('Copy all unique authors') ||
      source.includes('Ctrl+Shift+Alt+P'),
      'README.md should document copy all unique authors feature or keyboard shortcut');
  });
});
