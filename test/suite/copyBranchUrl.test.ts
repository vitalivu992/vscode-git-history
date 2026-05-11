import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Branch URL Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const gitServicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');

  test('gitService.ts should have getBranchUrl function', () => {
    const source = fs.readFileSync(gitServicePath, 'utf-8');
    assert.ok(source.includes('export async function getBranchUrl'),
      'gitService.ts should export getBranchUrl function');
  });

  test('getBranchUrl should generate GitHub URL', () => {
    const source = fs.readFileSync(gitServicePath, 'utf-8');
    const fnStart = source.indexOf('export async function getBranchUrl');
    assert.ok(fnStart >= 0, 'getBranchUrl function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('/tree/'), 'Should use /tree/ path for GitHub');
    assert.ok(fnBody.includes('gitlab') || fnBody.includes('bitbucket'),
      'Should handle multiple platforms');
  });

  test('types.ts should have copyBranchUrl message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copyBranchUrl'"),
      'types.ts should have copyBranchUrl message type');
  });

  test('types.ts should have copyBranchUrl in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);/);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyBranchUrl'"),
      'WebviewAction should include copyBranchUrl');
  });

  test('types.ts should have copyBranchUrl in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);/);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copyBranchUrl'"),
      'WebviewToExtMessage should include copyBranchUrl');
  });

  test('messageHandler.ts should handle copyBranchUrl case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyBranchUrl':"),
      'messageHandler.ts should handle copyBranchUrl case');
  });

  test('messageHandler.ts should have handleCopyBranchUrl function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyBranchUrl'),
      'messageHandler.ts should have handleCopyBranchUrl function');
  });

  test('handleCopyBranchUrl should read branch from panel.getBranch()', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyBranchUrl');
    assert.ok(fnStart >= 0, 'handleCopyBranchUrl function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('panel.getBranch()'),
      'handleCopyBranchUrl should call panel.getBranch()');
  });

  test('handleCopyBranchUrl should use getBranchUrl to generate URL', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyBranchUrl');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('getBranchUrl'),
      'handleCopyBranchUrl should call getBranchUrl');
  });

  test('handleCopyBranchUrl should write URL to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyBranchUrl');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyBranchUrl should write to clipboard');
    assert.ok(fnBody.includes('Branch URL copied'),
      'handleCopyBranchUrl should show confirmation message');
  });

  test('handleCopyBranchUrl should handle no branch case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyBranchUrl');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('No branch detected'),
      'handleCopyBranchUrl should handle no branch case');
  });

  test('handleCopyBranchUrl should handle URL generation failure', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyBranchUrl');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Unable to generate branch URL'),
      'handleCopyBranchUrl should handle URL generation failure');
  });

  test('webviewProvider.ts should have getBranch method', () => {
    const source = fs.readFileSync(providerPath, 'utf-8');
    assert.ok(source.includes('getBranch()'),
      'webviewProvider.ts should have getBranch method');
  });

  test('main.js should have handleCopyBranchUrl function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyBranchUrl'),
      'main.js should have handleCopyBranchUrl function');
  });

  test('main.js should send copyBranchUrl message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copyBranchUrl'"),
      'main.js should send copyBranchUrl message');
  });

  test('main.js triggerAction should dispatch copyBranchUrl', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyBranchUrl': handleCopyBranchUrl()"),
      'main.js triggerAction should dispatch copyBranchUrl');
  });

  test('package.json should register copyBranchUrl command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copyBranchUrl'),
      'package.json should register gitHistory.copyBranchUrl command');
  });

  test('package.json should have Copy Branch URL command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Copy Branch URL'),
      'package.json should have Copy Branch URL command title');
  });

  test('package.json should register Ctrl+Alt+U keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyBranchUrl'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyBranchUrl');
    assert.strictEqual(binding.key, 'ctrl+alt+u');
    assert.strictEqual(binding.mac, 'cmd+alt+u');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('extension.ts should register copyBranchUrl webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyBranchUrl'"),
      'extension.ts should register copyBranchUrl webview action');
  });

  test('context menu should have copy-branch-url item', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('data-action="copy-branch-url"'),
      'Context menu should include copy-branch-url');
    assert.ok(source.includes('Copy branch URL'),
      'Context menu should have label Copy branch URL');
  });

  test('context menu click handler should handle copy-branch-url action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'copy-branch-url'"),
      'Context menu click handler should handle copy-branch-url action');
    const handlerIdx = source.indexOf("action === 'copy-branch-url'");
    const nearby = source.substring(handlerIdx, handlerIdx + 200);
    assert.ok(nearby.includes('handleCopyBranchUrl'),
      'copy-branch-url handler should call handleCopyBranchUrl');
  });

  test('CLAUDE.md should document Copy Branch URL feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy Branch URL'),
      'CLAUDE.md should document Copy Branch URL feature');
    assert.ok(source.includes('handleCopyBranchUrl'),
      'CLAUDE.md should reference handleCopyBranchUrl');
  });
});
