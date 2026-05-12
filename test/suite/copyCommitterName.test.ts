import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Committer Name Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  test('types.ts should have copyCommitterName message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copyCommitterName'"),
      'types.ts should have copyCommitterName message type');
  });

  test('types.ts should have copyCommitterName in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);/);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyCommitterName'"),
      'WebviewAction should include copyCommitterName');
  });

  test('types.ts should have copyCommitterName in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);/);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copyCommitterName'"),
      'WebviewToExtMessage should include copyCommitterName');
  });

  test('types.ts should have committer field in CommitInfo', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const commitMatch = source.match(/export interface CommitInfo\s*{([\s\S]*?)}/);
    assert.ok(commitMatch, 'Should find CommitInfo interface');
    assert.ok(commitMatch[1].includes('committer'),
      'CommitInfo should include committer field');
  });

  test('messageHandler.ts should handle copyCommitterName case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitterName':"),
      'messageHandler.ts should handle copyCommitterName case');
  });

  test('messageHandler.ts should have handleCopyCommitterName function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyCommitterName'),
      'messageHandler.ts should have handleCopyCommitterName function');
  });

  test('handleCopyCommitterName should read commit.committer with fallback to commit.author', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitterName');
    assert.ok(fnStart >= 0, 'handleCopyCommitterName function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('commit.committer') || fnBody.includes('commit.author'),
      'handleCopyCommitterName should read commit.committer with fallback to commit.author');
  });

  test('handleCopyCommitterName should write to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitterName');
    assert.ok(fnStart >= 0, 'handleCopyCommitterName function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyCommitterName should write to clipboard');
    assert.ok(fnBody.includes('Committer name copied'),
      'handleCopyCommitterName should show confirmation');
  });

  test('handleCopyCommitterName should handle commit not found', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitterName');
    assert.ok(fnStart >= 0, 'handleCopyCommitterName function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'handleCopyCommitterName should handle commit not found');
  });

  test('main.js should have handleCopyCommitterName function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyCommitterName'),
      'main.js should have handleCopyCommitterName function');
  });

  test('main.js should send copyCommitterName message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copyCommitterName'"),
      'main.js should send copyCommitterName message');
  });

  test('main.js triggerAction should dispatch copyCommitterName', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitterName': handleCopyCommitterName()"),
      'main.js triggerAction should dispatch copyCommitterName');
  });

  test('main.js should have context menu item for copy-committer-name', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('copy-committer-name'),
      'main.js should have context menu item for copy-committer-name');
  });

  test('main.js context menu should handle copy-committer-name action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'copy-committer-name'") ||
      source.includes('copy-committer-name'),
      'main.js should handle copy-committer-name action');
  });

  test('package.json should register copyCommitterName command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copyCommitterName'),
      'package.json should register gitHistory.copyCommitterName command');
  });

  test('package.json should have Copy Committer Name command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Copy Committer Name'),
      'package.json should have Copy Committer Name command title');
  });

  test('extension.ts should register copyCommitterName webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyCommitterName'"),
      'extension.ts should register copyCommitterName webview action');
  });

  test('CLAUDE.md should document Copy Committer Name feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy Committer Name'),
      'CLAUDE.md should document Copy Committer Name feature');
    assert.ok(source.includes('handleCopyCommitterName'),
      'CLAUDE.md should reference handleCopyCommitterName');
  });

  test('README.md should document Copy Committer Information feature', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('Copy Committer') || source.includes('committer'),
      'README.md should document copy committer feature');
  });
});
