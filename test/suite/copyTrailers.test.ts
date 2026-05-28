import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Trailers Tests', () => {
  test('package.json has copyTrailers command', () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const command = packageJson.contributes.commands.find(
      (c: any) => c.command === 'gitHistory.copyTrailers'
    );
    assert.ok(command, 'package.json should have copyTrailers command');
    assert.strictEqual(command.title, 'Git History: Copy Trailers');
  });

  test('package.json has copyFixesReferences command', () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const command = packageJson.contributes.commands.find(
      (c: any) => c.command === 'gitHistory.copyFixesReferences'
    );
    assert.ok(command, 'package.json should have copyFixesReferences command');
  });

  test('package.json has copyReviewedBy command', () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const command = packageJson.contributes.commands.find(
      (c: any) => c.command === 'gitHistory.copyReviewedBy'
    );
    assert.ok(command, 'package.json should have copyReviewedBy command');
  });

  test('copyTrailers has correct keyboard binding', () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const keybinding = packageJson.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyTrailers'
    );
    assert.ok(keybinding, 'package.json should have keybinding for copyTrailers');
    assert.strictEqual(keybinding.key, 'ctrl+shift+alt+t');
    assert.strictEqual(keybinding.mac, 'cmd+shift+alt+t');
  });

  test('copyFixesReferences has correct keyboard binding', () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const keybinding = packageJson.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyFixesReferences'
    );
    assert.ok(keybinding, 'package.json should have keybinding for copyFixesReferences');
    assert.strictEqual(keybinding.key, 'ctrl+shift+alt+5');
    assert.strictEqual(keybinding.mac, 'cmd+shift+alt+5');
  });

  test('copyReviewedBy has correct keyboard binding', () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const keybinding = packageJson.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyReviewedBy'
    );
    assert.ok(keybinding, 'package.json should have keybinding for copyReviewedBy');
    assert.strictEqual(keybinding.key, 'ctrl+shift+alt+4');
    assert.strictEqual(keybinding.mac, 'cmd+shift+alt+4');
  });

  test('main.js has handleCopyTrailers function', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const mainJs = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(
      mainJs.includes('function handleCopyTrailers'),
      'main.js should have handleCopyTrailers function'
    );
  });

  test('main.js has handleCopyFixesReferences function', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const mainJs = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(
      mainJs.includes('function handleCopyFixesReferences'),
      'main.js should have handleCopyFixesReferences function'
    );
  });

  test('main.js has handleCopyReviewedBy function', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const mainJs = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(
      mainJs.includes('function handleCopyReviewedBy'),
      'main.js should have handleCopyReviewedBy function'
    );
  });

  test('main.js has copyTrailers in triggerAction handler', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const mainJs = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(
      mainJs.includes("case 'copyTrailers': handleCopyTrailers()"),
      'main.js should handle copyTrailers triggerAction'
    );
  });

  test('main.js has context menu items for trailers', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const mainJs = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(
      mainJs.includes('data-action="copy-trailers"'),
      'main.js should have copy-trailers context menu item'
    );
    assert.ok(
      mainJs.includes('data-action="copy-fixes-references"'),
      'main.js should have copy-fixes-references context menu item'
    );
    assert.ok(
      mainJs.includes('data-action="copy-reviewed-by"'),
      'main.js should have copy-reviewed-by context menu item'
    );
  });

  test('keyboard help includes trailer shortcuts', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const mainJs = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(
      mainJs.includes('Copy trailers'),
      'Keyboard help should include Copy trailers'
    );
    assert.ok(
      mainJs.includes('Copy issue references'),
      'Keyboard help should include Copy issue references'
    );
    assert.ok(
      mainJs.includes('Copy reviewers'),
      'Keyboard help should include Copy reviewers'
    );
  });

  test('types.ts has copyTrailers message type', () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const types = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(types.includes('copyTrailers'), 'types.ts should have copyTrailers');
    assert.ok(types.includes('copyFixesReferences'), 'types.ts should have copyFixesReferences');
    assert.ok(types.includes('copyReviewedBy'), 'types.ts should have copyReviewedBy');
  });

  test('messageHandler.ts has handler functions', () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const messageHandler = fs.readFileSync(messageHandlerPath, 'utf-8');
    assert.ok(
      messageHandler.includes('handleCopyTrailers'),
      'messageHandler.ts should have handleCopyTrailers'
    );
    assert.ok(
      messageHandler.includes('handleCopyFixesReferences'),
      'messageHandler.ts should have handleCopyFixesReferences'
    );
    assert.ok(
      messageHandler.includes('handleCopyReviewedBy'),
      'messageHandler.ts should have handleCopyReviewedBy'
    );
  });

  test('messageHandler.ts has extractTrailers utility', () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const messageHandler = fs.readFileSync(messageHandlerPath, 'utf-8');
    assert.ok(
      messageHandler.includes('export function extractTrailers'),
      'messageHandler.ts should export extractTrailers'
    );
  });

  test('extension.ts registers all three commands', () => {
    const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
    const extension = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(
      extension.includes('gitHistory.copyTrailers'),
      'extension.ts should register copyTrailers command'
    );
    assert.ok(
      extension.includes('gitHistory.copyFixesReferences'),
      'extension.ts should register copyFixesReferences command'
    );
    assert.ok(
      extension.includes('gitHistory.copyReviewedBy'),
      'extension.ts should register copyReviewedBy command'
    );
  });

  test('messageHandler.ts handles all three message types in switch', () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const messageHandler = fs.readFileSync(messageHandlerPath, 'utf-8');
    assert.ok(
      messageHandler.includes("case 'copyTrailers':"),
      'messageHandler.ts should handle copyTrailers case'
    );
    assert.ok(
      messageHandler.includes("case 'copyFixesReferences':"),
      'messageHandler.ts should handle copyFixesReferences case'
    );
    assert.ok(
      messageHandler.includes("case 'copyReviewedBy':"),
      'messageHandler.ts should handle copyReviewedBy case'
    );
  });
});
