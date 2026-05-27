import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Copy Files Changed Count Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  test('types.ts should have copyFilesChangedCount message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copyFilesChangedCount'"),
      'types.ts should have copyFilesChangedCount message type');
  });

  test('types.ts should have copyFilesChangedCount in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);/);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyFilesChangedCount'"),
      'WebviewAction should include copyFilesChangedCount');
  });

  test('types.ts should have copyFilesChangedCount in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);/);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copyFilesChangedCount'"),
      'WebviewToExtMessage should include copyFilesChangedCount');
  });

  test('types.ts should have copyFilesChangedCount with hash property', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/copyFilesChangedCount.*?hash: string/);
    assert.ok(msgMatch, 'types.ts should have copyFilesChangedCount with hash property');
  });

  test('messageHandler.ts should handle copyFilesChangedCount case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyFilesChangedCount':"),
      'messageHandler.ts should handle copyFilesChangedCount case');
  });

  test('messageHandler.ts should have handleCopyFilesChangedCount function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyFilesChangedCount'),
      'messageHandler.ts should have handleCopyFilesChangedCount function');
  });

  test('handleCopyFilesChangedCount should use commit.stats', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyFilesChangedCount');
    assert.ok(fnStart >= 0, 'handleCopyFilesChangedCount function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 300);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('commit.stats'),
      'handleCopyFilesChangedCount should use commit.stats');
    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyFilesChangedCount should write to clipboard');
  });

  test('handleCopyFilesChangedCount should format output with singular/plural', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyFilesChangedCount');
    assert.ok(fnStart >= 0, 'handleCopyFilesChangedCount function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 300);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('filesWord'),
      'handleCopyFilesChangedCount should handle singular/plural for files');
    assert.ok(fnBody.includes('=== 1 ?'),
      'handleCopyFilesChangedCount should check for singular form');
  });

  test('handleCopyFilesChangedCount should output format "X file(s)"', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyFilesChangedCount');
    assert.ok(fnStart >= 0, 'handleCopyFilesChangedCount function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 300);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('stats.filesChanged'),
      'handleCopyFilesChangedCount should use filesChanged from stats');
    assert.ok(fnBody.includes('filesWord'),
      'handleCopyFilesChangedCount should use filesWord variable');
  });

  test('handleCopyFilesChangedCount should handle commit not found', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyFilesChangedCount');
    assert.ok(fnStart >= 0, 'handleCopyFilesChangedCount function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 300);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'handleCopyFilesChangedCount should handle commit not found');
  });

  test('handleCopyFilesChangedCount should handle no statistics', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyFilesChangedCount');
    assert.ok(fnStart >= 0, 'handleCopyFilesChangedCount function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 300);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('No statistics available'),
      'handleCopyFilesChangedCount should handle no statistics');
  });

  test('handleCopyFilesChangedCount should show confirmation message', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyFilesChangedCount');
    assert.ok(fnStart >= 0, 'handleCopyFilesChangedCount function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 300);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('showInformationMessage'),
      'handleCopyFilesChangedCount should show confirmation');
    assert.ok(fnBody.includes('Files changed count copied'),
      'handleCopyFilesChangedCount should show confirmation with proper message');
  });

  test('main.js should have handleCopyFilesChangedCount function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyFilesChangedCount'),
      'main.js should have handleCopyFilesChangedCount function');
  });

  test('main.js should send copyFilesChangedCount message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'copyFilesChangedCount'"),
      'main.js should send copyFilesChangedCount message');
  });

  test('main.js triggerAction should dispatch copyFilesChangedCount', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyFilesChangedCount': handleCopyFilesChangedCount()"),
      'main.js triggerAction should dispatch copyFilesChangedCount');
  });

  test('main.js should have context menu item for copy-files-changed-count', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('copy-files-changed-count'),
      'main.js should have context menu item for copy-files-changed-count');
  });

  test('main.js context menu should have 📊 icon', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('data-action="copy-files-changed-count"'),
      'main.js should have context menu entry for copy-files-changed-count');
    assert.ok(source.includes('📊'),
      'main.js should have 📊 icon for files changed count');
  });

  test('main.js context menu should have "Copy files changed count" label', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('Copy files changed count'),
      'main.js should have "Copy files changed count" label');
  });

  test('main.js context menu should handle copy-files-changed-count action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("'copy-files-changed-count'") ||
      source.includes('copy-files-changed-count'),
      'main.js should handle copy-files-changed-count action');
  });

  test('package.json should register copyFilesChangedCount command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copyFilesChangedCount'),
      'package.json should register gitHistory.copyFilesChangedCount command');
  });

  test('package.json should have Copy Files Changed Count command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Copy Files Changed Count'),
      'package.json should have Copy Files Changed Count command title');
  });

  test('extension.ts should register copyFilesChangedCount webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyFilesChangedCount'"),
      'extension.ts should register copyFilesChangedCount webview action');
  });

  test('README.md should document Copy files changed count feature', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('Copy files changed count'),
      'README.md should document Copy files changed count feature');
  });

  test('README.md should show that the feature copies file count (e.g., "3 files")', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('3 files') || source.includes('"3 files"') || source.includes('"3 file(s)"'),
      'README.md should show output format example');
  });

  test('package.json defines keybinding for copyFilesChangedCount', () => {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    const keybindings = packageJson.contributes.keybindings || [];
    const keybinding = keybindings.find((k: any) => k.command === 'gitHistory.copyFilesChangedCount');
    assert.ok(keybinding, 'package.json should define keybinding for copyFilesChangedCount');
    assert.strictEqual(keybinding.key, 'f4', 'Keybinding should be F4');
    assert.strictEqual(keybinding.when, 'activeWebviewPanelId == gitHistory.webview', 'Keybinding should only work in Git History panel');
  });
});
