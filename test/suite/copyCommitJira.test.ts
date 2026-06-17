import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Commit Jira Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  test('types.ts should have copyCommitJira message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copyCommitJira'"),
      'types.ts should have copyCommitJira message type');
  });

  test('types.ts should have copyCommitJira in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyCommitJira'"),
      'WebviewAction should include copyCommitJira');
  });

  test('types.ts should have copyCommitJira in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copyCommitJira'"),
      'WebviewToExtMessage should include copyCommitJira');
  });

  test('messageHandler.ts should handle copyCommitJira case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitJira':"),
      'messageHandler.ts should handle copyCommitJira case');
  });

  test('messageHandler.ts should have handleCopyCommitJira function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyCommitJira'),
      'messageHandler.ts should have handleCopyCommitJira function');
  });

  test('messageHandler.ts should have formatCommitAsJira helper', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function formatCommitAsJira'),
      'messageHandler.ts should have formatCommitAsJira helper function');
  });

  test('formatCommitAsJira should format commit with Jira heading h4.', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function formatCommitAsJira');
    assert.ok(fnStart >= 0, 'formatCommitAsJira function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 800);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('h4.') && fnBody.includes('commit.shortHash') && fnBody.includes('commit.message'),
      'formatCommitAsJira should include h4. heading with short hash and message');
  });

  test('formatCommitAsJira should include author info table', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function formatCommitAsJira');
    assert.ok(fnStart >= 0, 'formatCommitAsJira function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 800);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('|| Author ||') || fnBody.includes('Author'),
      'formatCommitAsJira should include table header row');
    assert.ok(fnBody.includes('commit.author') && fnBody.includes('commit.email'),
      'formatCommitAsJira should include author name and email in table');
  });

  test('formatCommitAsJira should include date in table', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function formatCommitAsJira');
    assert.ok(fnStart >= 0, 'formatCommitAsJira function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 800);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('toLocaleString') || fnBody.includes('Date'),
      'formatCommitAsJira should include formatted date');
  });

  test('formatCommitAsJira should include stats when available', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function formatCommitAsJira');
    assert.ok(fnStart >= 0, 'formatCommitAsJira function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 800);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('*Stats:*') || fnBody.includes('stats') || fnBody.includes('filesChanged'),
      'formatCommitAsJira should include file stats when available');
  });

  test('formatCommitAsJira should handle tags when present', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function formatCommitAsJira');
    assert.ok(fnStart >= 0, 'formatCommitAsJira function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 800);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('*Tags:*') || fnBody.includes('tags'),
      'formatCommitAsJira should handle tags when present');
  });

  test('formatCommitAsJira should include body section when different from subject', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function formatCommitAsJira');
    assert.ok(fnStart >= 0, 'formatCommitAsJira function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 800);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('fullMessage') || fnBody.includes('body'),
      'formatCommitAsJira should include commit body when different from subject');
    assert.ok(fnBody.includes('h5.') || fnBody.includes('Commit Message'),
      'formatCommitAsJira should use h5. heading for body section');
  });

  test('handleCopyCommitJira should write to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitJira');
    assert.ok(fnStart >= 0, 'handleCopyCommitJira function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 200);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyCommitJira should write to clipboard');
  });

  test('handleCopyCommitJira should handle commit not found', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitJira');
    assert.ok(fnStart >= 0, 'handleCopyCommitJira function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 200);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'handleCopyCommitJira should handle commit not found');
  });

  test('handleCopyCommitJira should show confirmation message', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitJira');
    assert.ok(fnStart >= 0, 'handleCopyCommitJira function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 200);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Copied as Jira'),
      'handleCopyCommitJira should show confirmation with "Copied as Jira"');
  });

  test('main.js should have handleCopyJira function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyJira'),
      'main.js should have handleCopyJira function');
  });

  test('main.js should send copyCommitJira message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copyCommitJira'"),
      'main.js should send copyCommitJira message');
  });

  test('main.js should handle Ctrl+Alt+Shift+J keyboard shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("e.key === 'J'") &&
      source.includes('e.shiftKey') &&
      source.includes('e.altKey') &&
      source.includes('handleCopyJira'),
      'main.js should handle Ctrl+Alt+Shift+J and call handleCopyJira');
  });

  test('main.js triggerAction should dispatch copyCommitJira', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitJira': handleCopyJira()"),
      'main.js triggerAction should dispatch copyCommitJira');
  });

  test('main.js should have context menu item for copy-jira', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('copy-jira'),
      'main.js should have context menu item for copy-jira');
  });

  test('main.js context menu should handle copy-jira action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'copy-jira'"),
      'main.js should handle copy-jira action');
  });

  test('main.js context menu should have Copy as Jira Format label', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('Copy as Jira Format'),
      'main.js should have Copy as Jira Format label');
  });

  test('main.js keyboard help should include Copy as Jira Format shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('Copy as Jira Format') || source.includes('Jira'),
      'main.js keyboard help should include Copy as Jira Format');
  });

  test('package.json should register copyCommitJira command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copyCommitJira'),
      'package.json should register gitHistory.copyCommitJira command');
  });

  test('package.json should have Copy as Jira Format command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Copy Commit as Jira Format'),
      'package.json should have Copy Commit as Jira Format command title');
  });

  test('package.json should register Ctrl+Alt+Shift+J keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyCommitJira'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyCommitJira');
    assert.strictEqual(binding.key, 'ctrl+alt+shift+j');
    assert.strictEqual(binding.mac, 'cmd+alt+shift+j');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('extension.ts should register copyCommitJira webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyCommitJira'"),
      'extension.ts should register copyCommitJira webview action');
  });

  test('CLAUDE.md should document Copy Commit as Jira Format feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy Commit as Jira Format') || source.includes('Jira Format'),
      'CLAUDE.md should document Copy Commit as Jira Format feature');
  });

  test('CLAUDE.md should reference handleCopyJira and handleCopyCommitJira', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('handleCopyJira') && source.includes('handleCopyCommitJira'),
      'CLAUDE.md should reference handleCopyJira and handleCopyCommitJira');
  });

  test('CLAUDE.md should document Ctrl+Alt+Shift+J / Cmd+Alt+Shift+J keyboard shortcut', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Ctrl+Alt+Shift+J') || source.includes('Cmd+Alt+Shift+J'),
      'CLAUDE.md should document Copy as Jira Format keyboard shortcut');
  });

  test('CLAUDE.md should mention formatCommitAsJira helper', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('formatCommitAsJira'),
      'CLAUDE.md should mention formatCommitAsJira helper');
  });

  test('README.md should document Copy as Jira Format feature', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('Jira Format') || source.includes('Jira'),
      'README.md should document Copy as Jira Format feature');
  });
});
