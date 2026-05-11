import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Co-Authors Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  // ─── Type definitions ──────────────────────────────────────────────────────

  test('types.ts should have copyCoAuthors message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copyCoAuthors'"),
      'types.ts should have copyCoAuthors message type');
  });

  test('types.ts should have copyCoAuthors in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);/);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyCoAuthors'"),
      'WebviewAction should include copyCoAuthors');
  });

  test('types.ts should have copyCoAuthors in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);/);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copyCoAuthors'"),
      'WebviewToExtMessage should include copyCoAuthors');
  });

  // ─── Message handler ───────────────────────────────────────────────────────

  test('messageHandler.ts should handle copyCoAuthors case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyCoAuthors':"),
      'messageHandler.ts should handle copyCoAuthors case');
  });

  test('messageHandler.ts should have handleCopyCoAuthors function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyCoAuthors'),
      'messageHandler.ts should have handleCopyCoAuthors function');
  });

  test('messageHandler.ts should have extractCoAuthors function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function extractCoAuthors'),
      'messageHandler.ts should have extractCoAuthors function');
  });

  test('handleCopyCoAuthors should handle commit not found', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCoAuthors');
    assert.ok(fnStart >= 0, 'handleCopyCoAuthors function should exist');
    const fnBody = source.substring(fnStart, source.indexOf('\n}', fnStart + 500));

    assert.ok(fnBody.includes('Commit not found'),
      'handleCopyCoAuthors should handle commit not found');
  });

  test('handleCopyCoAuthors should handle no co-authors', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCoAuthors');
    assert.ok(fnStart >= 0, 'handleCopyCoAuthors function should exist');
    const fnBody = source.substring(fnStart, source.indexOf('\n}', fnStart + 500));

    assert.ok(fnBody.includes('No co-authors on commit'),
      'handleCopyCoAuthors should handle no co-authors case');
  });

  test('handleCopyCoAuthors should write to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCoAuthors');
    assert.ok(fnStart >= 0, 'handleCopyCoAuthors function should exist');
    const fnBody = source.substring(fnStart, source.indexOf('\n}', fnStart + 500));

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyCoAuthors should write to clipboard');
    assert.ok(fnBody.includes('coAuthorsText'),
      'handleCopyCoAuthors should use coAuthorsText');
  });

  test('handleCopyCoAuthors should show confirmation with count', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCoAuthors');
    assert.ok(fnStart >= 0, 'handleCopyCoAuthors function should exist');
    const fnBody = source.substring(fnStart, source.indexOf('\n}', fnStart + 500));

    assert.ok(fnBody.includes('Copied'),
      'handleCopyCoAuthors should show confirmation');
    assert.ok(fnBody.includes('co-author'),
      'handleCopyCoAuthors should mention co-author(s)');
  });

  // ─── extractCoAuthors regex ────────────────────────────────────────────────

  test('extractCoAuthors should use case-insensitive regex', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function extractCoAuthors');
    assert.ok(fnStart >= 0, 'extractCoAuthors function should exist');
    const fnBody = source.substring(fnStart, source.indexOf('\n}', fnStart + 500));

    assert.ok(fnBody.includes('/i'),
      'extractCoAuthors regex should be case-insensitive');
    assert.ok(fnBody.includes('Co-authored-by'),
      'extractCoAuthors should look for Co-authored-by pattern');
  });

  test('extractCoAuthors should parse Name <email> format', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function extractCoAuthors');
    assert.ok(fnStart >= 0, 'extractCoAuthors function should exist');
    const fnBody = source.substring(fnStart, source.indexOf('\n}', fnStart + 500));

    assert.ok(fnBody.includes('<([^>]+)>'),
      'extractCoAuthors should capture email in angle brackets');
    assert.ok(fnBody.includes('coAuthors.push'),
      'extractCoAuthors should collect results');
    assert.ok(fnBody.includes('.join') || fnBody.includes('join'),
      'extractCoAuthors output should be joinable');
  });

  // ─── Webview (main.js) ────────────────────────────────────────────────────

  test('main.js should have handleCopyCoAuthors function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyCoAuthors'),
      'main.js should have handleCopyCoAuthors function');
  });

  test('main.js should send copyCoAuthors message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copyCoAuthors'"),
      'main.js should send copyCoAuthors message');
  });

  test('main.js should handle Ctrl+Shift+K keyboard shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("e.key === 'k'") && source.includes('handleCopyCoAuthors'),
      'main.js should handle Ctrl+Shift+K and call handleCopyCoAuthors');
  });

  test('main.js triggerAction should dispatch copyCoAuthors', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyCoAuthors': handleCopyCoAuthors()"),
      'main.js triggerAction should dispatch copyCoAuthors');
  });

  test('main.js should have context menu item for copy-co-authors', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('copy-co-authors'),
      'main.js should have context menu item for copy-co-authors');
  });

  test('main.js context menu should handle copy-co-authors action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'copy-co-authors'"),
      'main.js should handle copy-co-authors action');
  });

  test('main.js context menu should have 👥 icon for copy co-authors', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('👥'),
      'main.js should have 👥 icon for copy co-authors');
  });

  test('main.js should show error when no commit is selected', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCoAuthors');
    assert.ok(fnStart >= 0, 'handleCopyCoAuthors function should exist');
    const fnBody = source.substring(fnStart, source.indexOf('\n}', fnStart + 500));

    assert.ok(fnBody.includes("Select a commit to copy co-authors"),
      'handleCopyCoAuthors should show error when no commit selected');
  });

  test('main.js keyboard help should include Copy co-authors', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('Copy co-authors'),
      'main.js keyboard help should include Copy co-authors');
  });

  // ─── Command registration ──────────────────────────────────────────────────

  test('package.json should register copyCoAuthors command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copyCoAuthors'),
      'package.json should register gitHistory.copyCoAuthors command');
  });

  test('package.json should have Copy Co-Authors command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Copy Co-Authors'),
      'package.json should have Copy Co-Authors command title');
  });

  test('package.json should register Ctrl+Shift+K keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyCoAuthors'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyCoAuthors');
    assert.strictEqual(binding.key, 'ctrl+shift+k');
    assert.strictEqual(binding.mac, 'cmd+shift+k');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('extension.ts should register copyCoAuthors webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyCoAuthors'"),
      'extension.ts should register copyCoAuthors webview action');
  });

  // ─── Documentation ─────────────────────────────────────────────────────────

  test('CLAUDE.md should document Copy Co-Authors feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy Co-Authors'),
      'CLAUDE.md should document Copy Co-Authors feature');
    assert.ok(source.includes('handleCopyCoAuthors'),
      'CLAUDE.md should reference handleCopyCoAuthors');
  });

  test('CLAUDE.md should document Ctrl+Shift+K / Cmd+Shift+K keyboard shortcut', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Ctrl+Shift+K') || source.includes('Cmd+Shift+K'),
      'CLAUDE.md should document Copy Co-Authors keyboard shortcut');
  });

  test('CLAUDE.md should document copyCoAuthors message type', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('copyCoAuthors'),
      'CLAUDE.md should document copyCoAuthors message type');
  });

  test('README.md should document Copy Co-Authors feature', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('Co-Authors') || source.includes('Ctrl+Shift+K'),
      'README.md should document copy co-authors feature or keyboard shortcut');
  });

  test('README.md should have 👥 icon for Copy Co-Authors', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('👥'),
      'README.md should have 👥 icon for Copy Co-Authors');
  });
});
