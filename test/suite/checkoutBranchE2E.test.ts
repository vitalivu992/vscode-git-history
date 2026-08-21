import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

suite('Checkout Branch E2E', () => {
  const ext = vscode.extensions.getExtension('linhvu.vscode-git-history');
  const repoPath = path.join(__dirname, '../../test repo');

  test('checkoutBranch is exported from gitService', async () => {
    const sourcePath = path.join(__dirname, '../../../src/git/gitService.ts');
    const source = fs.readFileSync(sourcePath, 'utf-8');
    assert.ok(
      source.includes('export async function checkoutBranch'),
      'gitService.ts should export checkoutBranch function'
    );
  });

  test('checkoutBranch message type is defined in types.ts', async () => {
    const typesPath = path.join(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(
      source.includes("type: 'checkoutBranch'"),
      'types.ts should define checkoutBranch message type'
    );
  });

  test('messageHandler handles checkoutBranch', async () => {
    const handlerPath = path.join(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(
      source.includes("case 'checkoutBranch':"),
      'messageHandler should handle checkoutBranch message'
    );
    assert.ok(
      source.includes('handleCheckoutBranch'),
      'messageHandler should call handleCheckoutBranch'
    );
  });

  test('main.js includes showBranchPickerDialog', async () => {
    const mainJsPath = path.join(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(
      source.includes('function showBranchPickerDialog'),
      'main.js should have showBranchPickerDialog function'
    );
    assert.ok(
      source.includes('function showBranchContextMenu'),
      'main.js should have showBranchContextMenu function'
    );
    assert.ok(
      source.includes('function setAllBranches'),
      'main.js should have setAllBranches function'
    );
  });

  test('main.js includes keyboard handler for Ctrl+Alt+S', async () => {
    const mainJsPath = path.join(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(
      source.includes("e.key === 's'"),
      'main.js should check for s key in keyboard handler'
    );
  });

  test('main.js handles checkoutBranch triggerAction', async () => {
    const mainJsPath = path.join(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const triggerStart = source.indexOf("case 'triggerAction':");
    assert.ok(triggerStart >= 0, 'Should have triggerAction handler');

    const triggerEnd = source.indexOf('}', triggerStart + 500);
    const triggerBody = source.substring(triggerStart, triggerEnd);
    assert.ok(
      triggerBody.includes('checkoutBranch'),
      'triggerAction should handle checkoutBranch'
    );
  });

  test('checkoutBranch action is defined in types.ts WebviewAction', async () => {
    const typesPath = path.join(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(
      source.includes("| 'checkoutBranch'"),
      'types.ts should include checkoutBranch in WebviewAction type'
    );
  });

  test('checkoutBranch command is registered in package.json', async () => {
    const packageJsonPath = path.join(__dirname, '../../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const commands = packageJson.contributes.commands;
    const command = commands.find((c: any) => c.command === 'gitHistory.checkoutBranch');
    assert.ok(command, 'package.json should define gitHistory.checkoutBranch command');
    assert.strictEqual(command.title, 'Git History: Checkout Branch');
  });

  test('checkoutBranch keybinding is registered in package.json', async () => {
    const packageJsonPath = path.join(__dirname, '../../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const keybindings = packageJson.contributes.keybindings;
    const keybinding = keybindings.find((k: any) => k.command === 'gitHistory.checkoutBranch');
    assert.ok(keybinding, 'package.json should define keybinding for checkoutBranch');
    assert.strictEqual(keybinding.key, 'ctrl+alt+s');
    assert.strictEqual(keybinding.mac, 'cmd+alt+s');
  });

  test('checkoutBranch is registered in extension.ts', async () => {
    const extensionPath = path.join(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(
      source.includes("'checkoutBranch'"),
      'extension.ts should register checkoutBranch action'
    );
  });

  test('styles.css includes branch context menu styles', async () => {
    const stylesPath = path.join(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');
    assert.ok(
      source.includes('.branch-context-menu'),
      'styles.css should have branch-context-menu style'
    );
    assert.ok(
      source.includes('.branch-picker-modal'),
      'styles.css should have branch-picker-modal style'
    );
  });
});