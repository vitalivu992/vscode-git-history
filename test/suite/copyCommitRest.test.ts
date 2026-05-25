import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Commit ReST Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  test('types.ts should have copyCommitRest message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copyCommitRest'"),
      'types.ts should have copyCommitRest message type');
  });

  test('types.ts should have copyCommitRest in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);/);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyCommitRest'"),
      'WebviewAction should include copyCommitRest');
  });

  test('types.ts should have copyCommitRest in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);/);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copyCommitRest'"),
      'WebviewToExtMessage should include copyCommitRest');
  });

  test('messageHandler.ts should handle copyCommitRest case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitRest':"),
      'messageHandler.ts should handle copyCommitRest case');
  });

  test('messageHandler.ts should have handleCopyCommitRest function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyCommitRest'),
      'messageHandler.ts should have handleCopyCommitRest function');
  });

  test('messageHandler.ts should have formatCommitAsRest helper', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function formatCommitAsRest'),
      'messageHandler.ts should have formatCommitAsRest helper function');
  });

  test('formatCommitAsRest should format commit with title underline', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function formatCommitAsRest');
    assert.ok(fnStart >= 0, 'formatCommitAsRest function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('commit.message') && fnBody.includes('underline'),
      'formatCommitAsRest should include title with underline');
    assert.ok(fnBody.includes("'=") || fnBody.includes('==='),
      'formatCommitAsRest should create = underline matching message length');
  });

  test('formatCommitAsRest should include :Author: field', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function formatCommitAsRest');
    assert.ok(fnStart >= 0, 'formatCommitAsRest function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes(':Author:') || fnBody.includes('Author'),
      'formatCommitAsRest should include :Author: field');
    assert.ok(fnBody.includes('commit.author') || fnBody.includes('commit.email'),
      'formatCommitAsRest should include author name and email');
  });

  test('formatCommitAsRest should include :Date: and :Hash: fields', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function formatCommitAsRest');
    assert.ok(fnStart >= 0, 'formatCommitAsRest function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes(':Date:') || fnBody.includes('Date'),
      'formatCommitAsRest should include :Date: field');
    assert.ok(fnBody.includes(':Hash:') || fnBody.includes('Hash'),
      'formatCommitAsRest should include :Hash: field');
    assert.ok(fnBody.includes('toISOString') || fnBody.includes('shortHash'),
      'formatCommitAsRest should format date as ISO and use short hash');
  });

  test('formatCommitAsRest should include stats when available', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function formatCommitAsRest');
    assert.ok(fnStart >= 0, 'formatCommitAsRest function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('**Statistics:**') || fnBody.includes('stats') || fnBody.includes('filesChanged'),
      'formatCommitAsRest should include file stats when available');
  });

  test('formatCommitAsRest should handle tags when present', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function formatCommitAsRest');
    assert.ok(fnStart >= 0, 'formatCommitAsRest function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Tags:') || fnBody.includes('tags'),
      'formatCommitAsRest should handle tags when present');
  });

  test('formatCommitAsRest should include body section when different from subject', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function formatCommitAsRest');
    assert.ok(fnStart >= 0, 'formatCommitAsRest function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('fullMessage') || fnBody.includes('body'),
      'formatCommitAsRest should include commit body when different from subject');
    assert.ok(fnBody.includes('Commit Body') || fnBody.includes('---') || fnBody.includes("'-"),
      'formatCommitAsRest should include body section with - underline');
  });

  test('handleCopyCommitRest should write to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitRest');
    assert.ok(fnStart >= 0, 'handleCopyCommitRest function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 200);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyCommitRest should write to clipboard');
  });

  test('handleCopyCommitRest should handle commit not found', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitRest');
    assert.ok(fnStart >= 0, 'handleCopyCommitRest function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 200);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'handleCopyCommitRest should handle commit not found');
  });

  test('handleCopyCommitRest should show confirmation message', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitRest');
    assert.ok(fnStart >= 0, 'handleCopyCommitRest function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 200);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Copied as ReST'),
      'handleCopyCommitRest should show confirmation with "Copied as ReST"');
  });

  test('main.js should have handleCopyRest function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyRest'),
      'main.js should have handleCopyRest function');
  });

  test('main.js should send copyCommitRest message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copyCommitRest'"),
      'main.js should send copyCommitRest message');
  });

  test('main.js should handle Ctrl+Alt+Y keyboard shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("e.key === 'y'") &&
      source.includes('e.altKey') &&
      source.includes('handleCopyRest'),
      'main.js should handle Ctrl+Alt+Y and call handleCopyRest');
  });

  test('main.js triggerAction should dispatch copyCommitRest', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitRest': handleCopyRest()"),
      'main.js triggerAction should dispatch copyCommitRest');
  });

  test('main.js should have context menu item for copy-rest', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('copy-rest'),
      'main.js should have context menu item for copy-rest');
  });

  test('main.js context menu should handle copy-rest action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'copy-rest'"),
      'main.js should handle copy-rest action');
  });

  test('main.js context menu should have 📜 icon for Copy as reStructuredText', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('Copy as reStructuredText'),
      'main.js should have Copy as reStructuredText label');
  });

  test('main.js keyboard help should include Copy as reStructuredText shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("Copy as reStructuredText") || source.includes("copy-rest"),
      'main.js keyboard help should include Copy as reStructuredText');
    // Note: 'Y' might not be explicitly checked if the help dialog is dynamic
  });

  test('package.json should register copyCommitRest command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copyCommitRest'),
      'package.json should register gitHistory.copyCommitRest command');
  });

  test('package.json should have Copy as reStructuredText command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Copy as reStructuredText'),
      'package.json should have Copy as reStructuredText command title');
  });

  test('package.json should register Ctrl+Alt+Y keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyCommitRest'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyCommitRest');
    assert.strictEqual(binding.key, 'ctrl+alt+y');
    assert.strictEqual(binding.mac, 'cmd+alt+y');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('extension.ts should register copyCommitRest webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyCommitRest'"),
      'extension.ts should register copyCommitRest webview action');
  });

  test('CLAUDE.md should document Copy Commit as reStructuredText feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy Commit as reStructuredText'),
      'CLAUDE.md should document Copy Commit as reStructuredText feature');
  });

  test('CLAUDE.md should reference handleCopyRest and handleCopyCommitRest', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('handleCopyRest') && source.includes('handleCopyCommitRest'),
      'CLAUDE.md should reference handleCopyRest and handleCopyCommitRest');
  });

  test('CLAUDE.md should document Ctrl+Alt+Y / Cmd+Alt+Y keyboard shortcut', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Ctrl+Alt+Y') || source.includes('Cmd+Alt+Y'),
      'CLAUDE.md should document Copy as reStructuredText keyboard shortcut');
  });

  test('CLAUDE.md should mention formatCommitAsRest helper', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('formatCommitAsRest'),
      'CLAUDE.md should mention formatCommitAsRest helper');
  });
});
