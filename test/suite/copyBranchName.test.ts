import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Branch Name Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  test('types.ts should have copyBranchName message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copyBranchName'"),
      'types.ts should have copyBranchName message type');
  });

  test('types.ts should have copyBranchName in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);/);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyBranchName'"),
      'WebviewAction should include copyBranchName');
  });

  test('types.ts should have copyBranchName in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);/);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copyBranchName'"),
      'WebviewToExtMessage should include copyBranchName');
  });

  test('messageHandler.ts should handle copyBranchName case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyBranchName':"),
      'messageHandler.ts should handle copyBranchName case');
  });

  test('messageHandler.ts should have handleCopyBranchName function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyBranchName'),
      'messageHandler.ts should have handleCopyBranchName function');
  });

  test('handleCopyBranchName should read branch from panel.getBranch()', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyBranchName');
    assert.ok(fnStart >= 0, 'handleCopyBranchName function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('panel.getBranch()'),
      'handleCopyBranchName should call panel.getBranch()');
  });

  test('handleCopyBranchName should write branch to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyBranchName');
    assert.ok(fnStart >= 0, 'handleCopyBranchName function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyBranchName should write to clipboard');
    assert.ok(fnBody.includes('Branch name copied'),
      'handleCopyBranchName should show confirmation message');
  });

  test('handleCopyBranchName should handle no branch case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyBranchName');
    assert.ok(fnStart >= 0, 'handleCopyBranchName function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('No branch detected'),
      'handleCopyBranchName should handle no branch case');
  });

  test('webviewProvider.ts should have getBranch method', () => {
    const source = fs.readFileSync(providerPath, 'utf-8');
    assert.ok(source.includes('getBranch()'),
      'webviewProvider.ts should have getBranch method');
  });

  test('webviewProvider.ts should store branch in _branch field', () => {
    const source = fs.readFileSync(providerPath, 'utf-8');
    assert.ok(source.includes('_branch'),
      'webviewProvider.ts should store branch in _branch field');
  });

  test('webviewProvider.ts should set _branch in loadData', () => {
    const source = fs.readFileSync(providerPath, 'utf-8');
    assert.ok(source.includes('this._branch = branch'),
      'webviewProvider.ts should set _branch in loadData');
  });

  test('main.js should have handleCopyBranchName function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyBranchName'),
      'main.js should have handleCopyBranchName function');
  });

  test('main.js should send copyBranchName message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copyBranchName'"),
      'main.js should send copyBranchName message');
  });

  test('main.js should handle Ctrl+Shift+B keyboard shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("e.key === 'b'") && source.includes('handleCopyBranchName'),
      'main.js should handle Ctrl+Shift+B and call handleCopyBranchName');
  });

  test('main.js triggerAction should dispatch copyBranchName', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyBranchName': handleCopyBranchName()"),
      'main.js triggerAction should dispatch copyBranchName');
  });

  test('branch badge should be clickable', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function renderBranchBadge');
    assert.ok(fnStart >= 0, 'renderBranchBadge function should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('addEventListener'),
      'Branch badge should have click event listener');
    assert.ok(fnBody.includes('handleCopyBranchName'),
      'Branch badge click should call handleCopyBranchName');
  });

  test('package.json should register copyBranchName command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copyBranchName'),
      'package.json should register gitHistory.copyBranchName command');
  });

  test('package.json should have Copy Branch Name command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Copy Branch Name'),
      'package.json should have Copy Branch Name command title');
  });

  test('package.json should register Ctrl+Shift+B keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyBranchName'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyBranchName');
    assert.strictEqual(binding.key, 'ctrl+shift+b');
    assert.strictEqual(binding.mac, 'cmd+shift+b');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('extension.ts should register copyBranchName webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyBranchName'"),
      'extension.ts should register copyBranchName webview action');
  });

  test('CLAUDE.md should document Copy Branch Name feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy Branch Name'),
      'CLAUDE.md should document Copy Branch Name feature');
    assert.ok(source.includes('handleCopyBranchName'),
      'CLAUDE.md should reference handleCopyBranchName');
  });

  test('README.md should document branch name keyboard shortcut', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('Copy branch name') || source.includes('Ctrl+Shift+B'),
      'README.md should document copy branch name feature or keyboard shortcut');
  });
});
