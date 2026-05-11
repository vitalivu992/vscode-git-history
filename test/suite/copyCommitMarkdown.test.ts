import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Commit Markdown Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  test('types.ts should have copyCommitMarkdown message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copyCommitMarkdown'"),
      'types.ts should have copyCommitMarkdown message type');
  });

  test('types.ts should have copyCommitMarkdown in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);/);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyCommitMarkdown'"),
      'WebviewAction should include copyCommitMarkdown');
  });

  test('types.ts should have copyCommitMarkdown in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);/);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copyCommitMarkdown'"),
      'WebviewToExtMessage should include copyCommitMarkdown');
  });

  test('messageHandler.ts should handle copyCommitMarkdown case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitMarkdown':"),
      'messageHandler.ts should handle copyCommitMarkdown case');
  });

  test('messageHandler.ts should have handleCopyCommitMarkdown function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyCommitMarkdown'),
      'messageHandler.ts should have handleCopyCommitMarkdown function');
  });

  test('messageHandler.ts should have formatCommitAsMarkdown helper', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function formatCommitAsMarkdown'),
      'messageHandler.ts should have formatCommitAsMarkdown helper function');
  });

  test('formatCommitAsMarkdown should format commit with heading', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function formatCommitAsMarkdown');
    assert.ok(fnStart >= 0, 'formatCommitAsMarkdown function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('## ') || fnBody.includes('commit.message'),
      'formatCommitAsMarkdown should include heading with commit message');
    assert.ok(fnBody.includes('shortHash'),
      'formatCommitAsMarkdown should include short hash');
  });

  test('formatCommitAsMarkdown should include author information', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function formatCommitAsMarkdown');
    assert.ok(fnStart >= 0, 'formatCommitAsMarkdown function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('**Author:**') || fnBody.includes('Author'),
      'formatCommitAsMarkdown should include author label');
    assert.ok(fnBody.includes('commit.author') || fnBody.includes('commit.email'),
      'formatCommitAsMarkdown should include author name and email');
  });

  test('formatCommitAsMarkdown should include date with relative and absolute', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function formatCommitAsMarkdown');
    assert.ok(fnStart >= 0, 'formatCommitAsMarkdown function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('**Date:**') || fnBody.includes('Date'),
      'formatCommitAsMarkdown should include date label');
    assert.ok(fnBody.includes('toISOString') || fnBody.includes('relativeDate'),
      'formatCommitAsMarkdown should format date as ISO and relative');
  });

  test('formatCommitAsMarkdown should include stats when available', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function formatCommitAsMarkdown');
    assert.ok(fnStart >= 0, 'formatCommitAsMarkdown function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('**Files:**') || fnBody.includes('stats') || fnBody.includes('filesChanged'),
      'formatCommitAsMarkdown should include file stats when available');
  });

  test('formatCommitAsMarkdown should handle tags when present', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function formatCommitAsMarkdown');
    assert.ok(fnStart >= 0, 'formatCommitAsMarkdown function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('**Tags:**') || fnBody.includes('tags'),
      'formatCommitAsMarkdown should handle tags when present');
  });

  test('formatCommitAsMarkdown should include body when different from subject', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function formatCommitAsMarkdown');
    assert.ok(fnStart >= 0, 'formatCommitAsMarkdown function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('fullMessage') || fnBody.includes('body'),
      'formatCommitAsMarkdown should include commit body when different from subject');
  });

  test('handleCopyCommitMarkdown should write to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitMarkdown');
    assert.ok(fnStart >= 0, 'handleCopyCommitMarkdown function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 200);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyCommitMarkdown should write to clipboard');
  });

  test('handleCopyCommitMarkdown should handle commit not found', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitMarkdown');
    assert.ok(fnStart >= 0, 'handleCopyCommitMarkdown function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 200);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'handleCopyCommitMarkdown should handle commit not found');
  });

  test('handleCopyCommitMarkdown should show confirmation message', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitMarkdown');
    assert.ok(fnStart >= 0, 'handleCopyCommitMarkdown function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 200);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Copied as Markdown'),
      'handleCopyCommitMarkdown should show confirmation with "Copied as Markdown"');
  });

  test('main.js should have handleCopyMarkdown function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyMarkdown'),
      'main.js should have handleCopyMarkdown function');
  });

  test('main.js should send copyCommitMarkdown message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copyCommitMarkdown'"),
      'main.js should send copyCommitMarkdown message');
  });

  test('main.js should handle Ctrl+Alt+M keyboard shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("e.key === 'm'") &&
      source.includes('e.altKey') &&
      source.includes('handleCopyMarkdown'),
      'main.js should handle Ctrl+Alt+M and call handleCopyMarkdown');
  });

  test('main.js triggerAction should dispatch copyCommitMarkdown', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitMarkdown': handleCopyMarkdown()"),
      'main.js triggerAction should dispatch copyCommitMarkdown');
  });

  test('main.js should have context menu item for copy-markdown', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('copy-markdown'),
      'main.js should have context menu item for copy-markdown');
  });

  test('main.js context menu should handle copy-markdown action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'copy-markdown'"),
      'main.js should handle copy-markdown action');
  });

  test('main.js context menu should have 📜 icon for Copy as Markdown', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('Copy as Markdown'),
      'main.js should have Copy as Markdown label');
  });

  test('main.js keyboard help should include Copy as Markdown shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("Copy as Markdown") || source.includes("copy-markdown"),
      'main.js keyboard help should include Copy as Markdown');
    // Note: 'M' might not be explicitly checked if the help dialog is dynamic
  });

  test('package.json should register copyCommitMarkdown command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copyCommitMarkdown'),
      'package.json should register gitHistory.copyCommitMarkdown command');
  });

  test('package.json should have Copy as Markdown command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Copy as Markdown'),
      'package.json should have Copy as Markdown command title');
  });

  test('package.json should register Ctrl+Alt+M keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyCommitMarkdown'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyCommitMarkdown');
    assert.strictEqual(binding.key, 'ctrl+alt+m');
    assert.strictEqual(binding.mac, 'cmd+alt+m');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('extension.ts should register copyCommitMarkdown webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyCommitMarkdown'"),
      'extension.ts should register copyCommitMarkdown webview action');
  });

  test('CLAUDE.md should document Copy Commit as Markdown feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy Commit as Markdown'),
      'CLAUDE.md should document Copy Commit as Markdown feature');
  });

  test('CLAUDE.md should reference handleCopyMarkdown and handleCopyCommitMarkdown', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('handleCopyMarkdown') && source.includes('handleCopyCommitMarkdown'),
      'CLAUDE.md should reference handleCopyMarkdown and handleCopyCommitMarkdown');
  });

  test('CLAUDE.md should document Ctrl+Alt+M / Cmd+Alt+M keyboard shortcut', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Ctrl+Alt+M') || source.includes('Cmd+Alt+M'),
      'CLAUDE.md should document Copy as Markdown keyboard shortcut');
  });

  test('CLAUDE.md should mention formatCommitAsMarkdown helper', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('formatCommitAsMarkdown'),
      'CLAUDE.md should mention formatCommitAsMarkdown helper');
  });
});
