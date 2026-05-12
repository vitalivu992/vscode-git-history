import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Commit Mention Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');

  test('types.ts should have copyCommitMention message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copyCommitMention'"),
      'types.ts should have copyCommitMention message type');
  });

  test('types.ts should have copyCommitMention in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);/);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyCommitMention'"),
      'WebviewAction should include copyCommitMention');
  });

  test('types.ts should have copyCommitMention in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);/);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copyCommitMention'"),
      'WebviewToExtMessage should include copyCommitMention');
  });

  test('messageHandler.ts should handle copyCommitMention case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitMention':"),
      'messageHandler.ts should handle copyCommitMention case');
  });

  test('messageHandler.ts should have handleCopyCommitMention function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyCommitMention'),
      'messageHandler.ts should have handleCopyCommitMention function');
  });

  test('handleCopyCommitMention should use parseRemoteUrl for platform detection', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitMention');
    assert.ok(fnStart >= 0, 'handleCopyCommitMention function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('parseRemoteUrl'),
      'handleCopyCommitMention should call parseRemoteUrl');
  });

  test('handleCopyCommitMention should format mention as owner/repo@hash', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitMention');
    assert.ok(fnStart >= 0, 'handleCopyCommitMention function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('remoteInfo.owner') && fnBody.includes('remoteInfo.repo'),
      'handleCopyCommitMention should use owner and repo from remote info');
    assert.ok(fnBody.includes('shortHash'),
      'handleCopyCommitMention should use short hash');
  });

  test('handleCopyCommitMention should write mention to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitMention');
    assert.ok(fnStart >= 0, 'handleCopyCommitMention function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyCommitMention should write to clipboard');
    assert.ok(fnBody.includes('Copied:'),
      'handleCopyCommitMention should show confirmation message');
  });

  test('handleCopyCommitMention should handle no remote case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitMention');
    assert.ok(fnStart >= 0, 'handleCopyCommitMention function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('No git remote configured'),
      'handleCopyCommitMention should handle no remote case');
  });

  test('handleCopyCommitMention should handle unknown platform case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitMention');
    assert.ok(fnStart >= 0, 'handleCopyCommitMention function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Unable to detect git platform'),
      'handleCopyCommitMention should handle unknown platform case');
  });

  test('main.js should have handleCopyMention function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyMention'),
      'main.js should have handleCopyMention function');
  });

  test('main.js should send copyCommitMention message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copyCommitMention'"),
      'main.js should send copyCommitMention message');
  });

  test('main.js triggerAction should dispatch copyCommitMention', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitMention': handleCopyMention()"),
      'main.js triggerAction should dispatch copyCommitMention');
  });

  test('main.js handleKeyDown should have Ctrl+Shift+@ shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("e.key === '@'") && source.includes('handleCopyMention'),
      'main.js handleKeyDown should handle Ctrl+Shift+@ shortcut');
  });

  test('package.json should register copyCommitMention command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copyCommitMention'),
      'package.json should register gitHistory.copyCommitMention command');
  });

  test('package.json should have Copy as Platform Mention command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Copy as Platform Mention'),
      'package.json should have Copy as Platform Mention command title');
  });

  test('package.json should register Ctrl+Shift+@ keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyCommitMention'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyCommitMention');
    assert.strictEqual(binding.key, 'ctrl+shift+@');
    assert.strictEqual(binding.mac, 'cmd+shift+@');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('extension.ts should register copyCommitMention webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyCommitMention'"),
      'extension.ts should register copyCommitMention webview action');
  });

  test('context menu should have copy-mention item', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('data-action="copy-mention"'),
      'Context menu should include copy-mention');
    assert.ok(source.includes('Copy as platform mention'),
      'Context menu should have label Copy as platform mention');
  });

  test('context menu click handler should handle copy-mention action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'copy-mention'"),
      'Context menu click handler should handle copy-mention action');
    const handlerIdx = source.indexOf("action === 'copy-mention'");
    const nearby = source.substring(handlerIdx, handlerIdx + 200);
    assert.ok(nearby.includes('copyCommitMention'),
      'copy-mention handler should send copyCommitMention message');
  });

  test('handleCopyMention should prioritize focused row', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyMention');
    assert.ok(fnStart >= 0, 'handleCopyMention function should exist');
    const fnEnd = source.indexOf('}\nfunction', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('focusedIndex'),
      'handleCopyMention should check focusedIndex');
  });

  test('handleCopyMention should fall back to selected commit', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyMention');
    assert.ok(fnStart >= 0, 'handleCopyMention function should exist');
    const fnEnd = source.indexOf('}\nfunction', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('selectedCommits'),
      'handleCopyMention should fall back to selectedCommits');
  });

  test('handleCopyMention should show error when no commit selected', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyMention');
    assert.ok(fnStart >= 0, 'handleCopyMention function should exist');
    const fnEnd = source.indexOf('}\nfunction', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('showError') && fnBody.includes('Select a commit'),
      'handleCopyMention should show error when no commit selected');
  });

  test('CLAUDE.md should document Copy as Platform Mention feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy as Platform Mention'),
      'CLAUDE.md should document Copy as Platform Mention feature');
    assert.ok(source.includes('handleCopyCommitMention'),
      'CLAUDE.md should reference handleCopyCommitMention');
  });

  test('CLAUDE.md should document keyboard shortcut Ctrl+Shift+@', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Ctrl+Shift+@') || source.includes('Cmd+Shift+@'),
      'CLAUDE.md should document Ctrl+Shift+@ / Cmd+Shift+@ keyboard shortcut');
  });
});
