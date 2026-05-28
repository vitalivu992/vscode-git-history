import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Author Initials Tests', () => {
  test('package.json has copyAuthorInitials command', () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const command = packageJson.contributes.commands.find(
      (c: any) => c.command === 'gitHistory.copyAuthorInitials'
    );
    assert.ok(command, 'package.json should have copyAuthorInitials command');
  });

  test('copyAuthorInitials has correct keyboard binding', () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const keybinding = packageJson.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyAuthorInitials'
    );
    assert.ok(keybinding, 'package.json should have keybinding for copyAuthorInitials');
    assert.strictEqual(keybinding.key, 'ctrl+alt+shift+i');
    assert.strictEqual(keybinding.mac, 'cmd+alt+shift+i');
    assert.strictEqual(keybinding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('main.js has handleCopyAuthorInitials function', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const mainJs = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(
      mainJs.includes('function handleCopyAuthorInitials'),
      'main.js should have handleCopyAuthorInitials function'
    );
  });

  test('main.js has copyAuthorInitials in handleKeyDown', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const mainJs = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(
      mainJs.includes('handleCopyAuthorInitials()'),
      'main.js should call handleCopyAuthorInitials in handleKeyDown'
    );
  });

  test('keyboard help includes copy author initials', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const mainJs = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(
      mainJs.includes("Copy author initials"),
      'Keyboard help should include copy author initials'
    );
  });

  test('types.ts has copyAuthorInitials message type', () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const types = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(
      types.includes('copyAuthorInitials'),
      'types.ts should have copyAuthorInitials message type'
    );
  });

  test('messageHandler.ts has handleCopyAuthorInitials function', () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const messageHandler = fs.readFileSync(messageHandlerPath, 'utf-8');
    assert.ok(
      messageHandler.includes('handleCopyAuthorInitials'),
      'messageHandler.ts should handle copyAuthorInitials message'
    );
  });

  test('extension.ts registers copyAuthorInitials command', () => {
    const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
    const extension = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(
      extension.includes('gitHistory.copyAuthorInitials'),
      'extension.ts should register copyAuthorInitials command'
    );
  });

  test('initials extraction logic matches getAuthorInitials', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const mainJs = fs.readFileSync(mainJsPath, 'utf-8');

    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const messageHandler = fs.readFileSync(messageHandlerPath, 'utf-8');

    const mainJsHasSplit = mainJs.includes('author.trim().split(/\\s+/)');
    const handlerHasSplit = messageHandler.includes('.trim().split(/\\s+/)');

    assert.ok(mainJsHasSplit, 'main.js getAuthorInitials should split on whitespace');
    assert.ok(handlerHasSplit, 'messageHandler should use same whitespace split logic');
  });
});
