import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

suite('Cherry-pick Commit E2E', () => {
  const ext = vscode.extensions.getExtension('linhvu.vscode-git-history');
  const repoPath = path.join(__dirname, '../../test repo');

  test('cherryPickCommit is exported from gitService', async () => {
    const sourcePath = path.join(__dirname, '../../../src/git/gitService.ts');
    const source = fs.readFileSync(sourcePath, 'utf-8');
    assert.ok(
      source.includes('export async function cherryPickCommit'),
      'gitService.ts should export cherryPickCommit function'
    );
  });

  test('cherryPickCommit message type is defined in types.ts', async () => {
    const typesPath = path.join(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(
      source.includes("type: 'cherryPickCommit'"),
      'types.ts should define cherryPickCommit message type'
    );
    assert.ok(
      source.includes("'cherryPickCommit'"),
      'types.ts should include cherryPickCommit in WebviewAction type'
    );
  });

  test('messageHandler handles cherryPickCommit', async () => {
    const handlerPath = path.join(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(
      source.includes("case 'cherryPickCommit':"),
      'messageHandler should handle cherryPickCommit message'
    );
    assert.ok(
      source.includes('handleCherryPickCommit'),
      'messageHandler should call handleCherryPickCommit'
    );
  });

  test('extension.ts registers gitHistory.cherryPickCommit command', async () => {
    const extPath = path.join(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extPath, 'utf-8');
    assert.ok(
      source.includes("gitHistory.cherryPickCommit"),
      'extension.ts should register gitHistory.cherryPickCommit command'
    );
  });

  test('package.json defines gitHistory.cherryPickCommit command', async () => {
    const pkgPath = path.join(__dirname, '../../../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const command = pkg.contributes.commands.find((c: any) => c.command === 'gitHistory.cherryPickCommit');
    assert.ok(command, 'package.json should define gitHistory.cherryPickCommit command');
    assert.strictEqual(command.title, 'Git History: Cherry-pick Commit');
  });

  test('package.json defines keyboard shortcut for cherry-pick', async () => {
    const pkgPath = path.join(__dirname, '../../../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const keybinding = pkg.contributes.keybindings.find((k: any) => k.command === 'gitHistory.cherryPickCommit');
    assert.ok(keybinding, 'package.json should define keybinding for cherry-pick');
    assert.strictEqual(keybinding.key, 'ctrl+alt+k');
    assert.strictEqual(keybinding.mac, 'cmd+alt+k');
  });

  test('main.js includes cherry-pick context menu item', async () => {
    const mainJsPath = path.join(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(
      source.includes('cherry-pick-commit'),
      'main.js should have cherry-pick-commit context menu item'
    );
  });

  test('main.js includes handleCherryPickCommit function', async () => {
    const mainJsPath = path.join(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(
      source.includes('function handleCherryPickCommit'),
      'main.js should have handleCherryPickCommit function'
    );
  });

  test('main.js handles cherryPickCommit triggerAction', async () => {
    const mainJsPath = path.join(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const triggerStart = source.indexOf("case 'triggerAction':");
    assert.ok(triggerStart >= 0, 'Should have triggerAction handler');

    const triggerEnd = source.indexOf('}', triggerStart + 500);
    const triggerBody = source.substring(triggerStart, triggerEnd);
    assert.ok(
      triggerBody.includes('cherryPickCommit'),
      'triggerAction should handle cherryPickCommit'
    );
  });

  test('main.js handles cherry-pick-commit context menu action', async () => {
    const mainJsPath = path.join(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(
      source.includes("action === 'cherry-pick-commit'"),
      'main.js should handle cherry-pick-commit action'
    );
    assert.ok(
      source.includes("type: 'cherryPickCommit'"),
      'main.js should post cherryPickCommit message'
    );
  });

  test('main.js includes cherry-pick in keyboard help', async () => {
    const mainJsPath = path.join(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(
      source.includes("'Alt', 'K'") && source.includes("'Cherry-pick commit'"),
      'main.js should include cherry-pick in keyboard help dialog'
    );
  });
});
