import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

suite('Revert Commit E2E', () => {
  const ext = vscode.extensions.getExtension('linhvu.vscode-git-history');
  const repoPath = path.join(__dirname, '../../test repo');

  test('revertCommit is exported from gitService', async () => {
    const sourcePath = path.join(__dirname, '../../../src/git/gitService.ts');
    const source = fs.readFileSync(sourcePath, 'utf-8');
    assert.ok(
      source.includes('export async function revertCommit'),
      'gitService.ts should export revertCommit function'
    );
  });

  test('revertCommit message type is defined in types.ts', async () => {
    const typesPath = path.join(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(
      source.includes("type: 'revertCommit'"),
      'types.ts should define revertCommit message type'
    );
    assert.ok(
      source.includes("'revertCommit'"),
      'types.ts should include revertCommit in WebviewAction type'
    );
  });

  test('messageHandler handles revertCommit', async () => {
    const handlerPath = path.join(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(
      source.includes("case 'revertCommit':"),
      'messageHandler should handle revertCommit message'
    );
    assert.ok(
      source.includes('handleRevertCommit'),
      'messageHandler should call handleRevertCommit'
    );
  });

  test('extension.ts registers gitHistory.revertCommit command', async () => {
    const extPath = path.join(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extPath, 'utf-8');
    assert.ok(
      source.includes("gitHistory.revertCommit"),
      'extension.ts should register gitHistory.revertCommit command'
    );
  });

  test('package.json defines gitHistory.revertCommit command', async () => {
    const pkgPath = path.join(__dirname, '../../../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const command = pkg.contributes.commands.find((c: any) => c.command === 'gitHistory.revertCommit');
    assert.ok(command, 'package.json should define gitHistory.revertCommit command');
    assert.strictEqual(command.title, 'Git History: Revert Commit');
  });

  test('package.json defines keyboard shortcut for revert', async () => {
    const pkgPath = path.join(__dirname, '../../../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const keybinding = pkg.contributes.keybindings.find((k: any) => k.command === 'gitHistory.revertCommit');
    assert.ok(keybinding, 'package.json should define keybinding for revert');
    assert.strictEqual(keybinding.key, 'ctrl+alt+r');
    assert.strictEqual(keybinding.mac, 'cmd+alt+r');
  });

  test('main.js includes revert context menu item', async () => {
    const mainJsPath = path.join(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(
      source.includes('revert-commit'),
      'main.js should have revert-commit context menu item'
    );
  });

  test('main.js includes handleRevertCommit function', async () => {
    const mainJsPath = path.join(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(
      source.includes('function handleRevertCommit'),
      'main.js should have handleRevertCommit function'
    );
  });

  test('main.js handles revertCommit triggerAction', async () => {
    const mainJsPath = path.join(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const triggerStart = source.indexOf("case 'triggerAction':");
    assert.ok(triggerStart >= 0, 'Should have triggerAction handler');

    const triggerEnd = source.indexOf('}', triggerStart + 500);
    const triggerBody = source.substring(triggerStart, triggerEnd);
    assert.ok(
      triggerBody.includes('revertCommit'),
      'triggerAction should handle revertCommit'
    );
  });

  test('main.js handles revert-commit context menu action', async () => {
    const mainJsPath = path.join(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(
      source.includes("action === 'revert-commit'"),
      'main.js should handle revert-commit action'
    );
    assert.ok(
      source.includes("type: 'revertCommit'"),
      'main.js should post revertCommit message'
    );
  });

  test('main.js includes revert in keyboard help', async () => {
    const mainJsPath = path.join(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(
      source.includes("'Alt', 'R'") && source.includes("'Revert commit'"),
      'main.js should include revert in keyboard help dialog'
    );
  });
});
