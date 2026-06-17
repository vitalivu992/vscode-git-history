import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Remote URL Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const gitServicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');

  test('gitService.ts should have getRemoteUrl function', () => {
    const source = fs.readFileSync(gitServicePath, 'utf-8');
    assert.ok(source.includes('export async function getRemoteUrl'),
      'gitService.ts should export getRemoteUrl function');
  });

  test('types.ts should have copyRemoteUrl message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copyRemoteUrl'"),
      'types.ts should have copyRemoteUrl message type');
  });

  test('types.ts should have copyRemoteUrl in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyRemoteUrl'"),
      'WebviewAction should include copyRemoteUrl');
  });

  test('types.ts should have copyRemoteUrl in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copyRemoteUrl'"),
      'WebviewToExtMessage should include copyRemoteUrl');
  });

  test('messageHandler.ts should handle copyRemoteUrl case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyRemoteUrl':"),
      'messageHandler.ts should handle copyRemoteUrl case');
  });

  test('messageHandler.ts should have handleCopyRemoteUrl function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyRemoteUrl'),
      'messageHandler.ts should have handleCopyRemoteUrl function');
  });

  test('handleCopyRemoteUrl should use getRemoteUrl', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyRemoteUrl');
    assert.ok(fnStart >= 0, 'handleCopyRemoteUrl function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('getRemoteUrl'),
      'handleCopyRemoteUrl should call getRemoteUrl');
  });

  test('handleCopyRemoteUrl should write URL to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyRemoteUrl');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyRemoteUrl should write to clipboard');
    assert.ok(fnBody.includes('Remote URL copied'),
      'handleCopyRemoteUrl should show confirmation message');
  });

  test('handleCopyRemoteUrl should handle no remote case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyRemoteUrl');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('No git remote configured'),
      'handleCopyRemoteUrl should handle no remote case');
  });

  test('main.js should have handleCopyRemoteUrl function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyRemoteUrl'),
      'main.js should have handleCopyRemoteUrl function');
  });

  test('main.js should send copyRemoteUrl message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copyRemoteUrl'"),
      'main.js should send copyRemoteUrl message');
  });

  test('main.js triggerAction should dispatch copyRemoteUrl', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyRemoteUrl': handleCopyRemoteUrl()"),
      'main.js triggerAction should dispatch copyRemoteUrl');
  });

  test('package.json should register copyRemoteUrl command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copyRemoteUrl'),
      'package.json should register gitHistory.copyRemoteUrl command');
  });

  test('package.json should have Copy Remote URL command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Copy Remote URL'),
      'package.json should have Copy Remote URL command title');
  });

  test('package.json should register Ctrl+Alt+O keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyRemoteUrl'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyRemoteUrl');
    assert.strictEqual(binding.key, 'ctrl+alt+o');
    assert.strictEqual(binding.mac, 'cmd+alt+o');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('extension.ts should register copyRemoteUrl webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyRemoteUrl'"),
      'extension.ts should register copyRemoteUrl webview action');
  });

  test('context menu should have copy-remote-url item', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('data-action="copy-remote-url"'),
      'Context menu should include copy-remote-url');
    assert.ok(source.includes('Copy remote URL'),
      'Context menu should have label Copy remote URL');
  });

  test('context menu click handler should handle copy-remote-url action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'copy-remote-url'"),
      'Context menu click handler should handle copy-remote-url action');
    const handlerIdx = source.indexOf("action === 'copy-remote-url'");
    const nearby = source.substring(handlerIdx, handlerIdx + 200);
    assert.ok(nearby.includes('handleCopyRemoteUrl'),
      'copy-remote-url handler should call handleCopyRemoteUrl');
  });

  test('CLAUDE.md should document Copy Remote URL feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy Remote URL'),
      'CLAUDE.md should document Copy Remote URL feature');
    assert.ok(source.includes('handleCopyRemoteUrl'),
      'CLAUDE.md should reference handleCopyRemoteUrl');
  });

  test('main.js handleKeyDown should have Ctrl+Alt+O shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("e.key === 'o'") && source.includes('handleCopyRemoteUrl'),
      'main.js handleKeyDown should handle Ctrl+Alt+O shortcut');
  });

  test('main.js handleKeyDown should use correct modifiers for Ctrl+Alt+O', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    // Find the Ctrl+Alt+O shortcut handler - look for the specific pattern
    const oKeyMatches = [...source.matchAll(/e\.key\s*===\s*['"]o['"]/g)];
    assert.ok(oKeyMatches.length > 0, 'Should have handlers for key o');

    // Find the one with alt modifier that calls handleCopyRemoteUrl
    let found = false;
    for (const match of oKeyMatches) {
      const idx = match.index || 0;
      const nearby = source.substring(Math.max(0, idx - 150), idx + 150);
      if (nearby.includes('e.altKey') && nearby.includes('handleCopyRemoteUrl')) {
        found = true;
        break;
      }
    }
    assert.ok(found, 'Ctrl+Alt+O shortcut should use alt modifier and call handleCopyRemoteUrl');
  });
});
