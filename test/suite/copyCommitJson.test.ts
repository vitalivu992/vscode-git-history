import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Commit JSON Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  test('types.ts should have copyCommitJson message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copyCommitJson'"),
      'types.ts should have copyCommitJson message type');
  });

  test('types.ts should have copyCommitJson in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);/);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyCommitJson'"),
      'WebviewAction should include copyCommitJson');
  });

  test('types.ts should have copyCommitJson in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);/);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copyCommitJson'"),
      'WebviewToExtMessage should include copyCommitJson');
  });

  test('messageHandler.ts should handle copyCommitJson case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitJson':"),
      'messageHandler.ts should handle copyCommitJson case');
  });

  test('messageHandler.ts should have handleCopyCommitJson function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyCommitJson'),
      'messageHandler.ts should have handleCopyCommitJson function');
  });

  test('handleCopyCommitJson should build JSON with all required fields', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitJson');
    assert.ok(fnStart >= 0, 'handleCopyCommitJson function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('commitJson') || fnBody.includes('json'),
      'handleCopyCommitJson should build JSON object');
    assert.ok(fnBody.includes('hash') && fnBody.includes('shortHash'),
      'JSON should include hash and shortHash');
    assert.ok(fnBody.includes('author') && fnBody.includes('name') && fnBody.includes('email'),
      'JSON should include author object with name and email');
    assert.ok(fnBody.includes('date') && fnBody.includes('toISOString'),
      'JSON should include date as ISO 8601');
    assert.ok(fnBody.includes('message') && fnBody.includes('body'),
      'JSON should include message and body');
    assert.ok(fnBody.includes('parentHashes'),
      'JSON should include parentHashes array');
    assert.ok(fnBody.includes('tags'),
      'JSON should include tags array');
    assert.ok(fnBody.includes('stats'),
      'JSON should include stats or null');
  });

  test('handleCopyCommitJson should use JSON.stringify with 2-space indentation', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitJson');
    assert.ok(fnStart >= 0, 'handleCopyCommitJson function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('JSON.stringify'),
      'handleCopyCommitJson should use JSON.stringify');
    assert.ok(fnBody.includes(', null, 2') || fnBody.includes("', null, 2'"),
      'JSON.stringify should use 2-space indentation');
  });

  test('handleCopyCommitJson should extract body from fullMessage', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitJson');
    assert.ok(fnStart >= 0, 'handleCopyCommitJson function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('fullMessage') && fnBody.includes('indexOf') && fnBody.includes('\\n'),
      'handleCopyCommitJson should extract body from fullMessage by splitting on newline');
  });

  test('handleCopyCommitJson should handle null for missing body', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitJson');
    assert.ok(fnStart >= 0, 'handleCopyCommitJson function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('|| null') || fnBody.includes('? null'),
      'handleCopyCommitJson should handle null for missing body');
  });

  test('handleCopyCommitJson should handle empty arrays for parentHashes and tags', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitJson');
    assert.ok(fnStart >= 0, 'handleCopyCommitJson function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('|| []') || fnBody.includes('? []'),
      'handleCopyCommitJson should use empty arrays for missing parentHashes or tags');
  });

  test('handleCopyCommitJson should handle null for missing stats', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitJson');
    assert.ok(fnStart >= 0, 'handleCopyCommitJson function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('|| null') || fnBody.includes('? null'),
      'handleCopyCommitJson should handle null for missing stats');
  });

  test('handleCopyCommitJson should write to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitJson');
    assert.ok(fnStart >= 0, 'handleCopyCommitJson function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyCommitJson should write to clipboard');
  });

  test('handleCopyCommitJson should handle commit not found', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitJson');
    assert.ok(fnStart >= 0, 'handleCopyCommitJson function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'handleCopyCommitJson should handle commit not found');
  });

  test('handleCopyCommitJson should show confirmation message', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitJson');
    assert.ok(fnStart >= 0, 'handleCopyCommitJson function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Copied as JSON'),
      'handleCopyCommitJson should show confirmation with "Copied as JSON"');
  });

  test('main.js should have handleCopyJson function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyJson'),
      'main.js should have handleCopyJson function');
  });

  test('main.js should send copyCommitJson message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copyCommitJson'"),
      'main.js should send copyCommitJson message');
  });

  test('main.js should handle Ctrl+Alt+J keyboard shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("e.key === 'j'") &&
      source.includes('e.altKey') &&
      source.includes('handleCopyJson'),
      'main.js should handle Ctrl+Alt+J and call handleCopyJson');
  });

  test('main.js triggerAction should dispatch copyCommitJson', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitJson': handleCopyJson()"),
      'main.js triggerAction should dispatch copyCommitJson');
  });

  test('main.js should have context menu item for copy-json', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('copy-json'),
      'main.js should have context menu item for copy-json');
  });

  test('main.js context menu should handle copy-json action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'copy-json'"),
      'main.js should handle copy-json action');
  });

  test('main.js context menu should have {} icon for Copy as JSON', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('{}') && source.includes('Copy as JSON'),
      'main.js should have {} icon and Copy as JSON label');
  });

  test('main.js keyboard help should include Copy as JSON shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('Copy as JSON') || source.includes('copy-json'),
      'main.js keyboard help should include Copy as JSON');
    assert.ok(source.includes("'J'") || source.includes('"J"'),
      'main.js keyboard help should include J key');
  });

  test('package.json should register copyCommitJson command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copyCommitJson'),
      'package.json should register gitHistory.copyCommitJson command');
  });

  test('package.json should have Copy Commit as JSON command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Copy Commit as JSON'),
      'package.json should have Copy Commit as JSON command title');
  });

  test('package.json should register Ctrl+Alt+J keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyCommitJson'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyCommitJson');
    assert.strictEqual(binding.key, 'ctrl+alt+j');
    assert.strictEqual(binding.mac, 'cmd+alt+j');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('extension.ts should register copyCommitJson webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyCommitJson'"),
      'extension.ts should register copyCommitJson webview action');
  });

  test('CLAUDE.md should document Copy Commit as JSON feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy Commit as JSON'),
      'CLAUDE.md should document Copy Commit as JSON feature');
  });

  test('CLAUDE.md should reference handleCopyJson and handleCopyCommitJson', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('handleCopyJson') && source.includes('handleCopyCommitJson'),
      'CLAUDE.md should reference handleCopyJson and handleCopyCommitJson');
  });

  test('CLAUDE.md should document Ctrl+Alt+J / Cmd+Alt+J keyboard shortcut', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Ctrl+Alt+J') || source.includes('Cmd+Alt+J'),
      'CLAUDE.md should document Copy as JSON keyboard shortcut');
  });

  test('CLAUDE.md should mention JSON output format with example', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('JSON') && (source.includes('hash') || source.includes('shortHash') || source.includes('author')),
      'CLAUDE.md should mention JSON output format');
  });

  test('README.md should document Copy as JSON keyboard shortcut', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('Ctrl+Alt+J') || source.includes('Cmd+Alt+J') || source.includes('Copy as JSON'),
      'README.md should document Copy as JSON keyboard shortcut');
  });
});
