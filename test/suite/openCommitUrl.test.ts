import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

const typesPath = path.resolve(__dirname, '../../../src/types.ts');
const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
const packageJsonPath = path.resolve(__dirname, '../../../package.json');
const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');

suite('Open Commit URL in Browser Tests', () => {
  test('types.ts should have openCommitUrl message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'openCommitUrl'"),
      'types.ts should have openCommitUrl message type');
  });

  test('types.ts should have openCommitUrl in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'openCommitUrl'"),
      'WebviewAction should include openCommitUrl');
  });

  test('types.ts should have openCommitUrl in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'openCommitUrl'"),
      'WebviewToExtMessage should include openCommitUrl');
  });

  test('messageHandler.ts should handle openCommitUrl case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'openCommitUrl':"),
      'messageHandler.ts should handle openCommitUrl case');
  });

  test('messageHandler.ts should have handleOpenCommitUrl function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleOpenCommitUrl'),
      'messageHandler.ts should have handleOpenCommitUrl function');
  });

  test('handleOpenCommitUrl should use getCommitUrl to generate URL', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleOpenCommitUrl');
    assert.ok(fnStart >= 0, 'handleOpenCommitUrl function should exist');
    const fnEnd = source.indexOf('\n}\n', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : fnStart + 1);

    assert.ok(fnBody.includes('getCommitUrl'),
      'handleOpenCommitUrl should call getCommitUrl');
  });

  test('handleOpenCommitUrl should use vscode.env.openExternal', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleOpenCommitUrl');
    assert.ok(fnStart >= 0, 'handleOpenCommitUrl function should exist');
    const fnEnd = source.indexOf('\n}\n', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : fnStart + 1);

    assert.ok(fnBody.includes('vscode.env.openExternal'),
      'handleOpenCommitUrl should use vscode.env.openExternal to open the URL');
    assert.ok(fnBody.includes('vscode.Uri.parse'),
      'handleOpenCommitUrl should parse the URL with vscode.Uri.parse');
  });

  test('handleOpenCommitUrl should handle no remote case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleOpenCommitUrl');
    assert.ok(fnStart >= 0, 'handleOpenCommitUrl function should exist');
    const fnEnd = source.indexOf('\n}\n', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : fnStart + 1);

    assert.ok(fnBody.includes('No git remote configured'),
      'handleOpenCommitUrl should handle missing remote');
  });

  test('handleOpenCommitUrl should handle unknown platform', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleOpenCommitUrl');
    assert.ok(fnStart >= 0, 'handleOpenCommitUrl function should exist');
    const fnEnd = source.indexOf('\n}\n', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : fnStart + 1);

    assert.ok(fnBody.includes('Unable to detect git platform'),
      'handleOpenCommitUrl should handle unknown platform');
  });

  test('main.js should have handleOpenUrl function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleOpenUrl'),
      'main.js should have handleOpenUrl function');
  });

  test('main.js handleOpenUrl should send openCommitUrl message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function handleOpenUrl');
    assert.ok(fnStart >= 0, 'handleOpenUrl function should exist');
    const fnEnd = source.indexOf('\n}\n', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : fnStart + 1);

    assert.ok(fnBody.includes("type: 'openCommitUrl'"),
      'handleOpenUrl should send openCommitUrl message type');
  });

  test('main.js triggerAction should dispatch openCommitUrl', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'openCommitUrl': handleOpenUrl()"),
      'main.js triggerAction should dispatch openCommitUrl');
  });

  test('main.js context menu should have open-url action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('data-action="open-url"'),
      'main.js context menu should have open-url action');
    assert.ok(source.includes('Open commit URL in browser'),
      'main.js context menu should have Open commit URL in browser label');
  });

  test('main.js context menu should handle open-url action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const menuStart = source.indexOf('data-action="open-url"');
    assert.ok(menuStart >= 0, 'open-url context menu item should exist');
    const nearby = source.substring(menuStart, menuStart + 500);

    assert.ok(nearby.includes('openCommitUrl'),
      'open-url handler should send openCommitUrl message');
  });

  test('package.json should register openCommitUrl command', () => {
    const source = fs.readFileSync(packageJsonPath, 'utf-8');
    assert.ok(source.includes('gitHistory.openCommitUrl'),
      'package.json should register gitHistory.openCommitUrl command');
  });

  test('package.json should have keybinding for openCommitUrl', () => {
    const source = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const bindings = source.contributes.keybindings;
    const binding = bindings.find((k: any) => k.command === 'gitHistory.openCommitUrl');
    assert.ok(binding, 'Should have keybinding for gitHistory.openCommitUrl');
    assert.ok(binding.key.includes('ctrl+shift+alt+l') || binding.key.includes('cmd+shift+alt+l'),
      'Should use ctrl+shift+alt+l / cmd+shift+alt+l shortcut');
  });

  test('extension.ts should register openCommitUrl webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'openCommitUrl'"),
      'extension.ts should register openCommitUrl webview action');
  });
});