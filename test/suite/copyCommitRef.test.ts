import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Commit Reference Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');

  test('types.ts should have copyCommitRef message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copyCommitRef'"),
      'types.ts should have copyCommitRef message type');
  });

  test('types.ts should have copyCommitRef in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyCommitRef'"),
      'WebviewAction should include copyCommitRef');
  });

  test('types.ts should have copyCommitRef in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copyCommitRef'"),
      'WebviewToExtMessage should include copyCommitRef');
  });

  test('messageHandler.ts should handle copyCommitRef case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitRef':"),
      'messageHandler.ts should handle copyCommitRef case');
  });

  test('messageHandler.ts should have handleCopyCommitRef function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyCommitRef'),
      'messageHandler.ts should have handleCopyCommitRef function');
  });

  test('handleCopyCommitRef should format reference as refs/commit/hash', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitRef');
    assert.ok(fnStart >= 0, 'handleCopyCommitRef function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('refs/commit/'),
      'handleCopyCommitRef should format as refs/commit/<hash>');
  });

  test('handleCopyCommitRef should write reference to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitRef');
    assert.ok(fnStart >= 0, 'handleCopyCommitRef function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyCommitRef should write to clipboard');
    assert.ok(fnBody.includes('Commit reference copied'),
      'handleCopyCommitRef should show confirmation message');
  });

  test('handleCopyCommitRef should handle commit not found', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitRef');
    assert.ok(fnStart >= 0, 'handleCopyCommitRef function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'handleCopyCommitRef should handle commit not found');
  });

  test('main.js should have handleCopyRef function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyRef'),
      'main.js should have handleCopyRef function');
  });

  test('main.js should send copyCommitRef message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copyCommitRef'"),
      'main.js should send copyCommitRef message');
  });

  test('main.js triggerAction should dispatch copyCommitRef', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitRef': handleCopyRef()"),
      'main.js triggerAction should dispatch copyCommitRef');
  });

  test('main.js handleKeyDown should have Ctrl+Shift+] shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("e.key === ']'") && source.includes('handleCopyRef'),
      'main.js handleKeyDown should handle Ctrl+Shift+] shortcut');
  });

  test('package.json should register copyCommitRef command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copyCommitRef'),
      'package.json should register gitHistory.copyCommitRef command');
  });

  test('package.json should have Copy Commit Reference command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Copy Commit Reference'),
      'package.json should have Copy Commit Reference command title');
  });

  test('package.json should register Ctrl+Shift+] keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyCommitRef'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyCommitRef');
    assert.strictEqual(binding.key, 'ctrl+shift+]');
    assert.strictEqual(binding.mac, 'cmd+shift+]');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('extension.ts should register copyCommitRef webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyCommitRef'"),
      'extension.ts should register copyCommitRef webview action');
  });

  test('context menu should have copy-ref item', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('data-action="copy-ref"'),
      'Context menu should include copy-ref');
    assert.ok(source.includes('Copy commit reference'),
      'Context menu should have label Copy commit reference');
  });

  test('context menu click handler should handle copy-ref action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'copy-ref'"),
      'Context menu click handler should handle copy-ref action');
    const handlerIdx = source.indexOf("action === 'copy-ref'");
    const nearby = source.substring(handlerIdx, handlerIdx + 200);
    assert.ok(nearby.includes('copyCommitRef'),
      'copy-ref handler should send copyCommitRef message');
  });

  test('handleCopyRef should prioritize focused row', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyRef');
    assert.ok(fnStart >= 0, 'handleCopyRef function should exist');
    const fnEnd = source.indexOf('}\nfunction', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('focusedIndex'),
      'handleCopyRef should check focusedIndex');
  });

  test('handleCopyRef should fall back to selected commit', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyRef');
    assert.ok(fnStart >= 0, 'handleCopyRef function should exist');
    const fnEnd = source.indexOf('}\nfunction', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('selectedCommits'),
      'handleCopyRef should fall back to selectedCommits');
  });

  test('handleCopyRef should show error when no commit selected', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyRef');
    assert.ok(fnStart >= 0, 'handleCopyRef function should exist');
    const fnEnd = source.indexOf('}\nfunction', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('showError') && fnBody.includes('Select a commit'),
      'handleCopyRef should show error when no commit selected');
  });

  test('CLAUDE.md should document Copy Commit Reference feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy Commit Reference'),
      'CLAUDE.md should document Copy Commit Reference feature');
    assert.ok(source.includes('handleCopyCommitRef'),
      'CLAUDE.md should reference handleCopyCommitRef');
  });

  test('CLAUDE.md should document keyboard shortcut Ctrl+Shift+]', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Ctrl+Shift+]') || source.includes('Cmd+Shift+]'),
      'CLAUDE.md should document Ctrl+Shift+] / Cmd+Shift+] keyboard shortcut');
  });
});
