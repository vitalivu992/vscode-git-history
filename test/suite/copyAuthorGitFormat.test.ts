import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Author Git Format Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  test('types.ts should have copyAuthorGitFormat message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copyAuthorGitFormat'"),
      'types.ts should have copyAuthorGitFormat message type');
  });

  test('types.ts should have copyAuthorGitFormat in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);/);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyAuthorGitFormat'"),
      'WebviewAction should include copyAuthorGitFormat');
  });

  test('types.ts should have copyAuthorGitFormat in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);/);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copyAuthorGitFormat'"),
      'WebviewToExtMessage should include copyAuthorGitFormat');
  });

  test('messageHandler.ts should handle copyAuthorGitFormat case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyAuthorGitFormat':"),
      'messageHandler.ts should handle copyAuthorGitFormat case');
  });

  test('messageHandler.ts should have handleCopyAuthorGitFormat function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyAuthorGitFormat'),
      'messageHandler.ts should have handleCopyAuthorGitFormat function');
  });

  test('handleCopyAuthorGitFormat should format author as git format', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyAuthorGitFormat');
    assert.ok(fnStart >= 0, 'handleCopyAuthorGitFormat function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('commit.author') && fnBody.includes('commit.email'),
      'handleCopyAuthorGitFormat should read commit.author and commit.email');
    assert.ok(fnBody.includes('<') && fnBody.includes('>'),
      'handleCopyAuthorGitFormat should format as Name <email>');
  });

  test('handleCopyAuthorGitFormat should write to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyAuthorGitFormat');
    assert.ok(fnStart >= 0, 'handleCopyAuthorGitFormat function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyAuthorGitFormat should write to clipboard');
    assert.ok(fnBody.includes('Copied author'),
      'handleCopyAuthorGitFormat should show confirmation');
  });

  test('handleCopyAuthorGitFormat should handle commit not found', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyAuthorGitFormat');
    assert.ok(fnStart >= 0, 'handleCopyAuthorGitFormat function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'handleCopyAuthorGitFormat should handle commit not found');
  });

  test('main.js should have handleCopyAuthorGitFormat function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyAuthorGitFormat'),
      'main.js should have handleCopyAuthorGitFormat function');
  });

  test('main.js should send copyAuthorGitFormat message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copyAuthorGitFormat'"),
      'main.js should send copyAuthorGitFormat message');
  });

  test('main.js triggerAction should dispatch copyAuthorGitFormat', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyAuthorGitFormat': handleCopyAuthorGitFormat()"),
      'main.js triggerAction should dispatch copyAuthorGitFormat');
  });

  test('main.js should have context menu item for copy-author-git-format', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('copy-author-git-format'),
      'main.js should have context menu item for copy-author-git-format');
  });

  test('main.js context menu should handle copy-author-git-format action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'copy-author-git-format'"),
      'main.js should handle copy-author-git-format action');
  });

  test('main.js keyboard help should include copyAuthorGitFormat', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('Copy author (git format)'),
      'main.js keyboard help should include copy author git format');
  });

  test('package.json should register copyAuthorGitFormat command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copyAuthorGitFormat'),
      'package.json should register gitHistory.copyAuthorGitFormat command');
  });

  test('package.json should have Copy Author in Git Format command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Copy Author in Git Format'),
      'package.json should have Copy Author in Git Format command title');
  });

  test('package.json should register Ctrl+Alt+Shift+A keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyAuthorGitFormat'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyAuthorGitFormat');
    assert.strictEqual(binding.key, 'ctrl+alt+shift+a');
    assert.strictEqual(binding.mac, 'cmd+alt+shift+a');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('extension.ts should register copyAuthorGitFormat webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyAuthorGitFormat'"),
      'extension.ts should register copyAuthorGitFormat webview action');
  });

  test('CLAUDE.md should document Copy Author in Git Format feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy Author in Git Format'),
      'CLAUDE.md should document Copy Author in Git Format feature');
    assert.ok(source.includes('handleCopyAuthorGitFormat'),
      'CLAUDE.md should reference handleCopyAuthorGitFormat');
  });

  test('README.md should document Copy Author in Git Format feature', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('Copy author (git format)') || source.includes('Ctrl+Alt+Shift+A'),
      'README.md should document copy author git format feature or keyboard shortcut');
  });
});
