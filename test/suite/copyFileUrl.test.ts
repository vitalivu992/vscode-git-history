import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy File URL Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const gitServicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');

  test('gitService.ts should have getFileUrl function', () => {
    const source = fs.readFileSync(gitServicePath, 'utf-8');
    assert.ok(source.includes('export async function getFileUrl'),
      'gitService.ts should export getFileUrl function');
  });

  test('getFileUrl should generate GitHub URL', () => {
    const source = fs.readFileSync(gitServicePath, 'utf-8');
    const fnStart = source.indexOf('export async function getFileUrl');
    assert.ok(fnStart >= 0, 'getFileUrl function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('/blob/'), 'Should use /blob/ path for GitHub');
    assert.ok(fnBody.includes('gitlab') || fnBody.includes('bitbucket'),
      'Should handle multiple platforms');
  });

  test('getFileUrl should use short hash', () => {
    const source = fs.readFileSync(gitServicePath, 'utf-8');
    const fnStart = source.indexOf('export async function getFileUrl');
    assert.ok(fnStart >= 0, 'getFileUrl function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('substring(0, 7)'),
      'Should use 7-character short hash for URLs');
  });

  test('getFileUrl should normalize file path', () => {
    const source = fs.readFileSync(gitServicePath, 'utf-8');
    const fnStart = source.indexOf('export async function getFileUrl');
    assert.ok(fnStart >= 0, 'getFileUrl function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('startsWith') && fnBody.includes('slice'),
      'Should normalize file path (remove leading ./)');
  });

  test('getFileUrl should return null for unknown platforms', () => {
    const source = fs.readFileSync(gitServicePath, 'utf-8');
    const fnStart = source.indexOf('export async function getFileUrl');
    assert.ok(fnStart >= 0, 'getFileUrl function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('return null'),
      'Should return null for unknown platforms');
  });

  test('types.ts should have copyFileUrl message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copyFileUrl'"),
      'types.ts should have copyFileUrl message type');
  });

  test('types.ts should have copyFileUrl in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyFileUrl'"),
      'WebviewAction should include copyFileUrl');
  });

  test('types.ts should have copyFileUrl in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copyFileUrl'"),
      'WebviewToExtMessage should include copyFileUrl');
  });

  test('types.ts copyFileUrl message should have hash and filePath', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("{ type: 'copyFileUrl'; hash: string; filePath: string }"),
      'copyFileUrl message should have hash and filePath fields');
  });

  test('messageHandler.ts should handle copyFileUrl case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyFileUrl':"),
      'messageHandler.ts should handle copyFileUrl case');
  });

  test('messageHandler.ts should have handleCopyFileUrl function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyFileUrl'),
      'messageHandler.ts should have handleCopyFileUrl function');
  });

  test('handleCopyFileUrl should accept hash and filePath parameters', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyFileUrl');
    assert.ok(fnStart >= 0, 'handleCopyFileUrl function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('hash: string') && fnBody.includes('filePath: string'),
      'handleCopyFileUrl should accept hash and filePath parameters');
  });

  test('handleCopyFileUrl should get commit from panel.getCommits()', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyFileUrl');
    assert.ok(fnStart >= 0, 'handleCopyFileUrl function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('panel.getCommits()'),
      'handleCopyFileUrl should get commits from panel');
  });

  test('handleCopyFileUrl should use getFileUrl to generate URL', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyFileUrl');
    assert.ok(fnStart >= 0, 'handleCopyFileUrl function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('getFileUrl'),
      'handleCopyFileUrl should call getFileUrl');
  });

  test('handleCopyFileUrl should write URL to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyFileUrl');
    assert.ok(fnStart >= 0, 'handleCopyFileUrl function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyFileUrl should write to clipboard');
    assert.ok(fnBody.includes('File URL copied'),
      'handleCopyFileUrl should show confirmation message');
  });

  test('handleCopyFileUrl should handle commit not found case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyFileUrl');
    assert.ok(fnStart >= 0, 'handleCopyFileUrl function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'handleCopyFileUrl should handle commit not found case');
  });

  test('handleCopyFileUrl should handle URL generation failure', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyFileUrl');
    assert.ok(fnStart >= 0, 'handleCopyFileUrl function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Unable to generate file URL'),
      'handleCopyFileUrl should handle URL generation failure');
  });

  test('handleCopyFileUrl should get cwd from panel.getCwd()', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyFileUrl');
    assert.ok(fnStart >= 0, 'handleCopyFileUrl function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('panel.getCwd()'),
      'handleCopyFileUrl should get cwd from panel');
  });

  test('main.js should have handleCopyFileUrl function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyFileUrl'),
      'main.js should have handleCopyFileUrl function');
  });

  test('main.js should send copyFileUrl message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copyFileUrl'"),
      'main.js should send copyFileUrl message');
  });

  test('main.js handleCopyFileUrl should check selectedFile', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyFileUrl');
    assert.ok(fnStart >= 0, 'handleCopyFileUrl function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('selectedFile'),
      'handleCopyFileUrl should check selectedFile');
    assert.ok(fnBody.includes('Select a file'),
      'handleCopyFileUrl should show error if no file selected');
  });

  test('main.js handleCopyFileUrl should get target commit', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyFileUrl');
    assert.ok(fnStart >= 0, 'handleCopyFileUrl function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('getOrderedCommits'),
      'handleCopyFileUrl should get ordered commits');
    assert.ok(fnBody.includes('focusedIndex') || fnBody.includes('selectedCommits'),
      'handleCopyFileUrl should get target commit from focus or selection');
  });

  test('main.js triggerAction should dispatch copyFileUrl', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyFileUrl': handleCopyFileUrl()"),
      'main.js triggerAction should dispatch copyFileUrl');
  });

  test('main.js keyboard shortcut should use Ctrl+Alt+Shift+U', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("e.altKey && e.shiftKey") || source.includes('ctrlKey.*altKey.*shiftKey'),
      'main.js should have Ctrl+Alt+Shift+U keyboard shortcut');
    const idx = source.indexOf('ctrlKey.*altKey.*shiftKey') >= 0
      ? source.indexOf('ctrlKey.*altKey.*shiftKey')
      : source.indexOf("e.altKey && e.shiftKey");
    assert.ok(source.substring(idx - 50, idx + 50).includes("key === 'u'"),
      'Ctrl+Alt+Shift+U should trigger handleCopyFileUrl');
  });

  test('package.json should register copyFileUrl command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copyFileUrl'),
      'package.json should register gitHistory.copyFileUrl command');
  });

  test('package.json should have Copy File Permalink command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Copy File Permalink'),
      'package.json should have Copy File Permalink command title');
  });

  test('package.json should register Ctrl+Alt+Shift+U keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyFileUrl'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyFileUrl');
    assert.strictEqual(binding.key, 'ctrl+alt+shift+u');
    assert.strictEqual(binding.mac, 'cmd+alt+shift+u');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('extension.ts should register copyFileUrl webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyFileUrl'"),
      'extension.ts should register copyFileUrl webview action');
  });

  test('context menu should have copy-file-url item', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('data-action="copy-file-url"'),
      'Context menu should include copy-file-url');
    assert.ok(source.includes('Copy file permalink'),
      'Context menu should have label Copy file permalink');
  });

  test('context menu should have link icon for copy-file-url', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const menuIdx = source.indexOf('data-action="copy-file-url"');
    assert.ok(menuIdx >= 0, 'Should find copy-file-url in context menu');
    const nearby = source.substring(menuIdx - 50, menuIdx + 50);
    assert.ok(nearby.includes('🔗') || nearby.includes('context-menu-icon'),
      'copy-file-url should have an icon');
  });

  test('context menu click handler should handle copy-file-url action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'copy-file-url'"),
      'Context menu click handler should handle copy-file-url action');
    const handlerIdx = source.indexOf("action === 'copy-file-url'");
    const nearby = source.substring(handlerIdx, handlerIdx + 200);
    assert.ok(nearby.includes('copyFileUrl'),
      'copy-file-url handler should send copyFileUrl message');
  });

  test('CLAUDE.md should document Copy File Permalink feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy File Permalink'),
      'CLAUDE.md should document Copy File Permalink feature');
    assert.ok(source.includes('handleCopyFileUrl'),
      'CLAUDE.md should reference handleCopyFileUrl');
  });

  test('CLAUDE.md should document keyboard shortcut', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Ctrl+Alt+Shift+U') || source.includes('Cmd+Alt+Shift+U'),
      'CLAUDE.md should document keyboard shortcut');
  });

  test('CLAUDE.md should mention platform-specific URL formats', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    const fileUrlIdx = source.indexOf('Copy File Permalink');
    assert.ok(fileUrlIdx >= 0, 'Should find Copy File Permalink section');
    const section = source.substring(fileUrlIdx, fileUrlIdx + 500);
    assert.ok(section.includes('GitHub') || section.includes('GitLab') || section.includes('Bitbucket'),
      'CLAUDE.md should mention platform-specific URL formats');
  });

  test('messageHandler.ts should import getFileUrl', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('getFileUrl'),
      'messageHandler.ts should import getFileUrl');
  });
});
