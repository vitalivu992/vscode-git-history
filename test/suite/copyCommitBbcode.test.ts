import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Commit BBCode Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  test('types.ts should have copyCommitBbcode message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copyCommitBbcode'"),
      'types.ts should have copyCommitBbcode message type');
  });

  test('types.ts should have copyCommitBbcode in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);/);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyCommitBbcode'"),
      'WebviewAction should include copyCommitBbcode');
  });

  test('types.ts should have copyCommitBbcode in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);/);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copyCommitBbcode'"),
      'WebviewToExtMessage should include copyCommitBbcode');
  });

  test('messageHandler.ts should have formatCommitAsBbcode function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function formatCommitAsBbcode'),
      'messageHandler.ts should have formatCommitAsBbcode function');
  });

  test('formatCommitAsBbcode should use [b] tags for headers', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function formatCommitAsBbcode');
    assert.ok(fnStart >= 0, 'formatCommitAsBbcode function should exist');
    const fnEnd = source.indexOf('}\n', fnStart) + 2;
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('[b]Commit:[/b]'),
      'formatCommitAsBbcode should use [b]Commit:[/b] header');
    assert.ok(fnBody.includes('[b]Author:[/b]'),
      'formatCommitAsBbcode should use [b]Author:[/b] header');
    assert.ok(fnBody.includes('[b]Date:[/b]'),
      'formatCommitAsBbcode should use [b]Date:[/b] header');
  });

  test('formatCommitAsBbcode should include commit hash and subject', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function formatCommitAsBbcode');
    assert.ok(fnStart >= 0, 'formatCommitAsBbcode function should exist');
    const fnEnd = source.indexOf('}\n', fnStart) + 2;
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('commit.shortHash') && fnBody.includes('commit.message'),
      'formatCommitAsBbcode should include shortHash and message');
  });

  test('formatCommitAsBbcode should format author as Name <email>', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function formatCommitAsBbcode');
    assert.ok(fnStart >= 0, 'formatCommitAsBbcode function should exist');
    const fnEnd = source.indexOf('}\n', fnStart) + 2;
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('commit.author') && fnBody.includes('commit.email'),
      'formatCommitAsBbcode should include author and email');
    assert.ok(fnBody.includes('<') && fnBody.includes('>'),
      'formatCommitAsBbcode should wrap email in angle brackets');
  });

  test('formatCommitAsBbcode should format date with toLocaleString', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function formatCommitAsBbcode');
    assert.ok(fnStart >= 0, 'formatCommitAsBbcode function should exist');
    const fnEnd = source.indexOf('}\n', fnStart) + 2;
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('toLocaleString'),
      'formatCommitAsBbcode should format date with toLocaleString');
  });

  test('formatCommitAsBbcode should include stats with singular/plural forms', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function formatCommitAsBbcode');
    assert.ok(fnStart >= 0, 'formatCommitAsBbcode function should exist');
    const fnEnd = source.indexOf('}\n', fnStart) + 2;
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('[b]Statistics:[/b]'),
      'formatCommitAsBbcode should include Statistics header');
    assert.ok(fnBody.includes("filesChanged === 1 ? 'file' : 'files'"),
      'formatCommitAsBbcode should handle singular/plural for file count');
    assert.ok(fnBody.includes('insertions') && fnBody.includes('deletions'),
      'formatCommitAsBbcode should include insertions and deletions');
  });

  test('formatCommitAsBbcode should include tags comma-separated', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function formatCommitAsBbcode');
    assert.ok(fnStart >= 0, 'formatCommitAsBbcode function should exist');
    const fnEnd = source.indexOf('}\n', fnStart) + 2;
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('[b]Tags:[/b]'),
      'formatCommitAsBbcode should include Tags header');
    assert.ok(fnBody.includes("commit.tags.join(', ')"),
      'formatCommitAsBbcode should comma-separated tags');
  });

  test('formatCommitAsBbcode should include body when different from subject', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function formatCommitAsBbcode');
    assert.ok(fnStart >= 0, 'formatCommitAsBbcode function should exist');
    const fnEnd = source.indexOf('}\n', fnStart) + 2;
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('[b]Body:[/b]'),
      'formatCommitAsBbcode should include Body header');
    assert.ok(fnBody.includes('fullMessage') && fnBody.includes('replace'),
      'formatCommitAsBbcode should handle body extraction');
  });

  test('messageHandler.ts should handle copyCommitBbcode case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitBbcode':"),
      'messageHandler.ts should handle copyCommitBbcode case');
  });

  test('messageHandler.ts should have handleCopyCommitBbcode function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyCommitBbcode'),
      'messageHandler.ts should have handleCopyCommitBbcode function');
  });

  test('handleCopyCommitBbcode should call formatCommitAsBbcode', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitBbcode');
    assert.ok(fnStart >= 0, 'handleCopyCommitBbcode function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('formatCommitAsBbcode(commit)'),
      'handleCopyCommitBbcode should call formatCommitAsBbcode');
  });

  test('handleCopyCommitBbcode should write to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitBbcode');
    assert.ok(fnStart >= 0, 'handleCopyCommitBbcode function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyCommitBbcode should write to clipboard');
    assert.ok(fnBody.includes('Copied as BBCode'),
      'handleCopyCommitBbcode should show confirmation');
  });

  test('handleCopyCommitBbcode should handle commit not found', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyCommitBbcode');
    assert.ok(fnStart >= 0, 'handleCopyCommitBbcode function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'handleCopyCommitBbcode should handle commit not found');
  });

  test('main.js should have handleCopyBbcode function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyBbcode'),
      'main.js should have handleCopyBbcode function');
  });

  test('main.js should send copyCommitBbcode message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copyCommitBbcode'"),
      'main.js should send copyCommitBbcode message');
  });

  test('main.js should handle Ctrl+Alt+Shift+B keyboard shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("e.key === 'B'") &&
      source.includes('handleCopyBbcode') &&
      source.includes('ctrlKey') &&
      source.includes('altKey') &&
      source.includes('shiftKey'),
      'main.js should handle Ctrl+Alt+Shift+B and call handleCopyBbcode');
  });

  test('main.js triggerAction should dispatch copyCommitBbcode', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitBbcode': handleCopyBbcode()"),
      'main.js triggerAction should dispatch copyCommitBbcode');
  });

  test('main.js should have context menu item for copy-bbcode', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('copy-bbcode'),
      'main.js should have context menu item for copy-bbcode');
  });

  test('main.js context menu should handle copy-bbcode action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'copy-bbcode'"),
      'main.js should handle copy-bbcode action');
  });

  test('main.js should show BBCode icon in context menu', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('Copy as BBCode'),
      'main.js should show "Copy as BBCode" label');
  });

  test('package.json should register copyCommitBbcode command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copyCommitBbcode'),
      'package.json should register gitHistory.copyCommitBbcode command');
  });

  test('package.json should register Ctrl+Alt+Shift+B keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyCommitBbcode'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyCommitBbcode');
    assert.strictEqual(binding.key, 'ctrl+alt+shift+b');
    assert.strictEqual(binding.mac, 'cmd+alt+shift+b');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('extension.ts should register copyCommitBbcode webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyCommitBbcode'"),
      'extension.ts should register copyCommitBbcode webview action');
  });

  test('CLAUDE.md should document Copy as BBCode feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy as BBCode') || source.includes('BBCode'),
      'CLAUDE.md should document Copy as BBCode feature');
    assert.ok(source.includes('Ctrl+Alt+Shift+B') || source.includes('Cmd+Alt+Shift+B'),
      'CLAUDE.md should document BBCode keyboard shortcut');
  });

  test('README.md should document Copy as BBCode feature', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('BBCode') || source.includes('Ctrl+Alt+Shift+B'),
      'README.md should document BBCode feature or keyboard shortcut');
  });

  test('main.js keyboard help should include BBCode entry', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("'B'") && source.includes("'Shift', 'B'") && source.includes('BBCode'),
      'main.js keyboard help should include BBCode with B key');
  });
});
