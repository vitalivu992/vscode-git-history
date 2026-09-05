import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Commit URL Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const gitServicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');

  test('gitService.ts should have getCommitUrl function', () => {
    const source = fs.readFileSync(gitServicePath, 'utf-8');
    assert.ok(source.includes('export async function getCommitUrl'),
      'gitService.ts should export getCommitUrl function');
  });

  test('getCommitUrl should generate GitHub URL', () => {
    const source = fs.readFileSync(gitServicePath, 'utf-8');
    const fnStart = source.indexOf('export async function getCommitUrl');
    assert.ok(fnStart >= 0, 'getCommitUrl function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('/commit/'), 'Should use /commit/ path for GitHub');
    assert.ok(fnBody.includes('gitlab') || fnBody.includes('bitbucket'),
      'Should handle multiple platforms');
  });

  test('getCommitUrl should use short hash (7 characters)', () => {
    const source = fs.readFileSync(gitServicePath, 'utf-8');
    const fnStart = source.indexOf('export async function getCommitUrl');
    assert.ok(fnStart >= 0, 'getCommitUrl function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('substring(0, 7)'), 'Should use short hash (7 characters)');
  });

  test('getCommitUrl should return null for no remote', () => {
    const source = fs.readFileSync(gitServicePath, 'utf-8');
    const fnStart = source.indexOf('export async function getCommitUrl');
    assert.ok(fnStart >= 0, 'getCommitUrl function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('return null'), 'Should return null when remote unavailable');
  });

  test('getCommitUrl should handle GitHub platform', () => {
    const source = fs.readFileSync(gitServicePath, 'utf-8');
    const fnStart = source.indexOf('export async function getCommitUrl');
    assert.ok(fnStart >= 0, 'getCommitUrl function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes("'github'"), 'Should handle GitHub platform');
    assert.ok(fnBody.includes('/commit/'), 'Should use /commit/ path for GitHub');
  });

  test('getCommitUrl should handle GitLab platform', () => {
    const source = fs.readFileSync(gitServicePath, 'utf-8');
    const fnStart = source.indexOf('export async function getCommitUrl');
    assert.ok(fnStart >= 0, 'getCommitUrl function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes("'gitlab'"), 'Should handle GitLab platform');
    assert.ok(fnBody.includes('/-/commit/'), 'Should use /-/commit/ path for GitLab');
  });

  test('getCommitUrl should handle Bitbucket platform', () => {
    const source = fs.readFileSync(gitServicePath, 'utf-8');
    const fnStart = source.indexOf('export async function getCommitUrl');
    assert.ok(fnStart >= 0, 'getCommitUrl function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes("'bitbucket'"), 'Should handle Bitbucket platform');
    assert.ok(fnBody.includes('/commits/'), 'Should use /commits/ path for Bitbucket');
  });

  test('types.ts should have copyCommitUrl message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copyCommitUrl'"),
      'types.ts should have copyCommitUrl message type');
  });

  test('types.ts should have copyCommitUrl in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyCommitUrl'"),
      'WebviewAction should include copyCommitUrl');
  });

  test('types.ts should have copyCommitUrl in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copyCommitUrl'"),
      'WebviewToExtMessage should include copyCommitUrl');
  });

  test('messageHandler.ts should handle copyCommitUrl case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitUrl':"),
      'messageHandler.ts should handle copyCommitUrl case');
  });

  test('messageHandler.ts should have handleCopyCommitUrl function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyCommitUrl'),
      'messageHandler.ts should have handleCopyCommitUrl function');
  });

  test('handleCopyCommitUrl should use getCommitUrl to generate URL', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitUrl');
    assert.ok(fnStart >= 0, 'handleCopyCommitUrl function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('getCommitUrl'),
      'handleCopyCommitUrl should call getCommitUrl');
  });

  test('handleCopyCommitUrl should write URL to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitUrl');
    assert.ok(fnStart >= 0, 'handleCopyCommitUrl function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyCommitUrl should write to clipboard');
    assert.ok(fnBody.includes('Commit URL copied'),
      'handleCopyCommitUrl should show confirmation message');
  });

  test('handleCopyCommitUrl should handle no remote case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitUrl');
    assert.ok(fnStart >= 0, 'handleCopyCommitUrl function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('No git remote configured'),
      'handleCopyCommitUrl should handle no remote case');
  });

  test('handleCopyCommitUrl should handle unknown platform case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitUrl');
    assert.ok(fnStart >= 0, 'handleCopyCommitUrl function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Unable to detect git platform'),
      'handleCopyCommitUrl should handle unknown platform case');
  });

  test('handleCopyCommitUrl should handle URL generation failure', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitUrl');
    assert.ok(fnStart >= 0, 'handleCopyCommitUrl function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Failed to generate commit URL'),
      'handleCopyCommitUrl should handle URL generation failure');
  });

  test('handleCopyCommitUrl should include short hash in confirmation', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitUrl');
    assert.ok(fnStart >= 0, 'handleCopyCommitUrl function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('substring(0, 7)'),
      'handleCopyCommitUrl should extract short hash for confirmation');
  });

  test('main.js should have handleCopyUrl function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyUrl'),
      'main.js should have handleCopyUrl function');
  });

  test('main.js should send copyCommitUrl message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copyCommitUrl'"),
      'main.js should send copyCommitUrl message');
  });

  test('main.js triggerAction should dispatch copyCommitUrl', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitUrl': handleCopyUrl()"),
      'main.js triggerAction should dispatch copyCommitUrl');
  });

  test('main.js handleKeyDown should have Ctrl+Shift+L shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("e.key === 'l'") && source.includes('handleCopyUrl'),
      'main.js handleKeyDown should handle Ctrl+Shift+L shortcut');
  });

  test('main.js handleKeyDown should use correct modifiers for Ctrl+Shift+L', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    // Find the Ctrl+Shift+L shortcut handler
    const lShortcutIndex = source.indexOf("e.key === 'l'");
    assert.ok(lShortcutIndex >= 0, 'Should have a handler for key l');
    const nearby = source.substring(Math.max(0, lShortcutIndex - 100), lShortcutIndex + 100);
    assert.ok(nearby.includes('e.ctrlKey || e.metaKey') && nearby.includes('e.shiftKey'),
      'Ctrl+Shift+L shortcut should use ctrl/meta and shift modifiers');
  });

  test('package.json should register copyCommitUrl command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copyCommitUrl'),
      'package.json should register gitHistory.copyCommitUrl command');
  });

  test('package.json should have Copy Commit URL command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Copy Commit URL'),
      'package.json should have Copy Commit URL command title');
  });

  test('package.json should register Ctrl+Shift+L keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyCommitUrl'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyCommitUrl');
    assert.strictEqual(binding.key, 'ctrl+shift+l');
    assert.strictEqual(binding.mac, 'cmd+shift+l');
    assert.strictEqual(binding.when, 'activeWebviewViewId == gitHistory.webview');
  });

  test('extension.ts should register copyCommitUrl webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyCommitUrl'"),
      'extension.ts should register copyCommitUrl webview action');
  });

  test('context menu should have copy-url item', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('data-action="copy-url"'),
      'Context menu should include copy-url');
    assert.ok(source.includes('Copy commit URL'),
      'Context menu should have label Copy commit URL');
  });

  test('context menu click handler should handle copy-url action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'copy-url'"),
      'Context menu click handler should handle copy-url action');
    const handlerIdx = source.indexOf("action === 'copy-url'");
    const nearby = source.substring(handlerIdx, handlerIdx + 200);
    assert.ok(nearby.includes('copyCommitUrl'),
      'copy-url handler should send copyCommitUrl message');
  });

  test('handleCopyUrl should prioritize focused row', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyUrl');
    assert.ok(fnStart >= 0, 'handleCopyUrl function should exist');
    const fnEnd = source.indexOf('}\nfunction', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('focusedIndex'),
      'handleCopyUrl should check focusedIndex');
  });

  test('handleCopyUrl should fall back to selected commit', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyUrl');
    assert.ok(fnStart >= 0, 'handleCopyUrl function should exist');
    const fnEnd = source.indexOf('}\nfunction', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('selectedCommits'),
      'handleCopyUrl should fall back to selectedCommits');
  });

  test('handleCopyUrl should show error when no commit selected', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyUrl');
    assert.ok(fnStart >= 0, 'handleCopyUrl function should exist');
    const fnEnd = source.indexOf('}\nfunction', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('showError') && fnBody.includes('Select a commit'),
      'handleCopyUrl should show error when no commit selected');
  });

  test('CLAUDE.md should document Copy Commit URL feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy Commit URL'),
      'CLAUDE.md should document Copy Commit URL feature');
    assert.ok(source.includes('handleCopyCommitUrl'),
      'CLAUDE.md should reference handleCopyCommitUrl');
  });

  test('CLAUDE.md should document keyboard shortcut Ctrl+Shift+L', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Ctrl+Shift+L') || source.includes('Cmd+Shift+L'),
      'CLAUDE.md should document Ctrl+Shift+L / Cmd+Shift+L keyboard shortcut');
  });

  test('CLAUDE.md should mention platform support', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    const copyUrlSection = source.substring(source.indexOf('Copy Commit URL'), Math.min(source.length, source.indexOf('Copy Commit URL') + 1000));
    assert.ok(copyUrlSection.includes('GitHub') || copyUrlSection.includes('GitLab') || copyUrlSection.includes('Bitbucket'),
      'CLAUDE.md should mention platform support (GitHub, GitLab, Bitbucket)');
  });
});
