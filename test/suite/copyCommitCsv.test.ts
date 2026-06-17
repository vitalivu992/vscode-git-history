import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Commit CSV Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  test('types.ts should have copyCommitCsv message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copyCommitCsv'"),
      'types.ts should have copyCommitCsv message type');
  });

  test('types.ts should have copyCommitCsv in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyCommitCsv'"),
      'WebviewAction should include copyCommitCsv');
  });

  test('types.ts should have copyCommitCsv in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copyCommitCsv'"),
      'WebviewToExtMessage should include copyCommitCsv');
  });

  test('types.ts should have copyCommitCsv message shape with hash', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("{ type: 'copyCommitCsv'; hash: string }"),
      'types.ts should define copyCommitCsv message with hash field');
  });

  test('messageHandler.ts should handle copyCommitCsv case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitCsv':"),
      'messageHandler.ts should handle copyCommitCsv case');
  });

  test('messageHandler.ts should have handleCopyCommitCsv function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyCommitCsv'),
      'messageHandler.ts should have handleCopyCommitCsv function');
  });

  test('handleCopyCommitCsv should format CSV with headers', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitCsv');
    assert.ok(fnStart >= 0, 'handleCopyCommitCsv function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes("'Hash'") || fnBody.includes('"Hash"'),
      'handleCopyCommitCsv should include Hash header');
    assert.ok(fnBody.includes("'Short Hash'") || fnBody.includes('"Short Hash"'),
      'handleCopyCommitCsv should include Short Hash header');
    assert.ok(fnBody.includes("'Author'") || fnBody.includes('"Author"'),
      'handleCopyCommitCsv should include Author header');
    assert.ok(fnBody.includes("'Message'") || fnBody.includes('"Message"'),
      'handleCopyCommitCsv should include Message header');
  });

  test('handleCopyCommitCsv should use escapeCsvField for author and message', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitCsv');
    assert.ok(fnStart >= 0, 'handleCopyCommitCsv function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('escapeCsvField(commit.author)'),
      'handleCopyCommitCsv should escape author field');
    assert.ok(fnBody.includes('escapeCsvField(commit.message)'),
      'handleCopyCommitCsv should escape message field');
  });

  test('handleCopyCommitCsv should include stats fields', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitCsv');
    assert.ok(fnStart >= 0, 'handleCopyCommitCsv function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('filesChanged'),
      'handleCopyCommitCsv should include filesChanged');
    assert.ok(fnBody.includes('insertions'),
      'handleCopyCommitCsv should include insertions');
    assert.ok(fnBody.includes('deletions'),
      'handleCopyCommitCsv should include deletions');
    assert.ok(fnBody.includes("'0'"),
      'handleCopyCommitCsv should default stats to 0');
  });

  test('handleCopyCommitCsv should join tags with semicolon', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitCsv');
    assert.ok(fnStart >= 0, 'handleCopyCommitCsv function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes("join(';')"),
      'handleCopyCommitCsv should join tags with semicolon');
  });

  test('handleCopyCommitCsv should write to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitCsv');
    assert.ok(fnStart >= 0, 'handleCopyCommitCsv function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyCommitCsv should write to clipboard');
    assert.ok(fnBody.includes('Copied as CSV'),
      'handleCopyCommitCsv should show CSV confirmation');
  });

  test('handleCopyCommitCsv should handle commit not found', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitCsv');
    assert.ok(fnStart >= 0, 'handleCopyCommitCsv function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'handleCopyCommitCsv should handle commit not found');
  });

  test('handleCopyCommitCsv should produce header + data rows', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitCsv');
    assert.ok(fnStart >= 0, 'handleCopyCommitCsv function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes("headers.join(',')"),
      'handleCopyCommitCsv should join headers with commas');
    assert.ok(fnBody.includes("'\\n'") || fnBody.includes('"\n"'),
      'handleCopyCommitCsv should separate header and data with newline');
    assert.ok(fnBody.includes("fields.join(',')"),
      'handleCopyCommitCsv should join fields with commas');
  });

  test('main.js should have handleCopyCsv function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyCsv'),
      'main.js should have handleCopyCsv function');
  });

  test('main.js should send copyCommitCsv message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copyCommitCsv'"),
      'main.js should send copyCommitCsv message');
  });

  test('main.js should handle Ctrl+Alt+Shift+C keyboard shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("e.key === 'C'") &&
      source.includes('handleCopyCsv') &&
      source.includes('ctrlKey') &&
      source.includes('altKey') &&
      source.includes('shiftKey'),
      'main.js should handle Ctrl+Alt+Shift+C and call handleCopyCsv');
  });

  test('main.js triggerAction should dispatch copyCommitCsv', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitCsv': handleCopyCsv()"),
      'main.js triggerAction should dispatch copyCommitCsv');
  });

  test('main.js should have context menu item for copy-csv', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('copy-csv'),
      'main.js should have context menu item for copy-csv');
  });

  test('main.js context menu should handle copy-csv action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'copy-csv'"),
      'main.js should handle copy-csv action');
  });

  test('main.js should show CSV icon in context menu', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('Copy as CSV'),
      'main.js should show "Copy as CSV" label');
  });

  test('package.json should register copyCommitCsv command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copyCommitCsv'),
      'package.json should register gitHistory.copyCommitCsv command');
  });

  test('package.json should register Ctrl+Alt+Shift+C keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyCommitCsv'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyCommitCsv');
    assert.strictEqual(binding.key, 'ctrl+alt+shift+c');
    assert.strictEqual(binding.mac, 'cmd+alt+shift+c');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('extension.ts should register copyCommitCsv webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyCommitCsv'"),
      'extension.ts should register copyCommitCsv webview action');
  });

  test('CLAUDE.md should document Copy as CSV feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy as CSV'),
      'CLAUDE.md should document Copy as CSV feature');
    assert.ok(source.includes('Ctrl+Alt+Shift+C') || source.includes('Cmd+Alt+Shift+C'),
      'CLAUDE.md should document CSV keyboard shortcut');
  });

  test('README.md should document Copy as CSV feature', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('Copy as CSV'),
      'README.md should document Copy as CSV feature');
  });

  test('main.js keyboard help should include CSV entry', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("'C'") && source.includes("'Shift', 'C'") && source.includes('CSV'),
      'main.js keyboard help should include CSV with C key');
  });
});
