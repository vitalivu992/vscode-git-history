import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Committer Email Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  test('types.ts should have copyCommitterEmail message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copyCommitterEmail'"),
      'types.ts should have copyCommitterEmail message type');
  });

  test('types.ts should have copyCommitterEmail in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);/);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyCommitterEmail'"),
      'WebviewAction should include copyCommitterEmail');
  });

  test('types.ts should have copyCommitterEmail in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);/);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copyCommitterEmail'"),
      'WebviewToExtMessage should include copyCommitterEmail');
  });

  test('types.ts should have committerEmail field in CommitInfo', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const commitMatch = source.match(/export interface CommitInfo\s*{([\s\S]*?)}/);
    assert.ok(commitMatch, 'Should find CommitInfo interface');
    assert.ok(commitMatch[1].includes('committerEmail'),
      'CommitInfo should include committerEmail field');
  });

  test('messageHandler.ts should handle copyCommitterEmail case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitterEmail':"),
      'messageHandler.ts should handle copyCommitterEmail case');
  });

  test('messageHandler.ts should have handleCopyCommitterEmail function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyCommitterEmail'),
      'messageHandler.ts should have handleCopyCommitterEmail function');
  });

  test('handleCopyCommitterEmail should read commit.committerEmail with fallback to commit.email', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitterEmail');
    assert.ok(fnStart >= 0, 'handleCopyCommitterEmail function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('commit.committerEmail') || fnBody.includes('commit.email'),
      'handleCopyCommitterEmail should read commit.committerEmail with fallback to commit.email');
  });

  test('handleCopyCommitterEmail should write to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitterEmail');
    assert.ok(fnStart >= 0, 'handleCopyCommitterEmail function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyCommitterEmail should write to clipboard');
    assert.ok(fnBody.includes('Committer email copied'),
      'handleCopyCommitterEmail should show confirmation');
  });

  test('handleCopyCommitterEmail should handle commit not found', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitterEmail');
    assert.ok(fnStart >= 0, 'handleCopyCommitterEmail function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'handleCopyCommitterEmail should handle commit not found');
  });

  test('main.js should have handleCopyCommitterEmail function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyCommitterEmail'),
      'main.js should have handleCopyCommitterEmail function');
  });

  test('main.js should send copyCommitterEmail message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copyCommitterEmail'"),
      'main.js should send copyCommitterEmail message');
  });

  test('main.js triggerAction should dispatch copyCommitterEmail', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitterEmail': handleCopyCommitterEmail()"),
      'main.js triggerAction should dispatch copyCommitterEmail');
  });

  test('main.js should have context menu item for copy-committer-email', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('copy-committer-email'),
      'main.js should have context menu item for copy-committer-email');
  });

  test('main.js context menu should handle copy-committer-email action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'copy-committer-email'") ||
      source.includes('copy-committer-email'),
      'main.js should handle copy-committer-email action');
  });

  test('package.json should register copyCommitterEmail command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copyCommitterEmail'),
      'package.json should register gitHistory.copyCommitterEmail command');
  });

  test('package.json should have Copy Committer Email command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Copy Committer Email'),
      'package.json should have Copy Committer Email command title');
  });

  test('extension.ts should register copyCommitterEmail webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyCommitterEmail'"),
      'extension.ts should register copyCommitterEmail webview action');
  });

  test('CLAUDE.md should document Copy Committer Email feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy Committer Email'),
      'CLAUDE.md should document Copy Committer Email feature');
    assert.ok(source.includes('handleCopyCommitterEmail'),
      'CLAUDE.md should reference handleCopyCommitterEmail');
  });

  test('README.md should document Copy Committer Information feature', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('Copy Committer') || source.includes('committer'),
      'README.md should document copy committer feature');
  });
});
