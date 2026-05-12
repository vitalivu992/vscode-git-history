import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('Copy File Diff E2E Source Integration Tests', () => {
  test('types.ts should have copyFileDiff message type', () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("'copyFileDiff'") || source.includes('"copyFileDiff"'),
      'types.ts should have copyFileDiff message type');
  });

  test('types.ts copyFileDiff should have hash and filePath fields', () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    // Find the copyFileDiff message type definition
    const copyFileDiffMatch = source.match(
      /\{ type: ['"]copyFileDiff['"][^}]+\}/
    );

    assert.ok(copyFileDiffMatch, 'types.ts should have copyFileDiff message type definition');

    const messageType = copyFileDiffMatch![0];
    assert.ok(messageType.includes('hash: string'),
      'copyFileDiff should have hash field of type string');
    assert.ok(messageType.includes('filePath: string'),
      'copyFileDiff should have filePath field of type string');
  });

  test('gitService.ts should have getCommitDiff function that supports filePath parameter', () => {
    const servicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
    const source = fs.readFileSync(servicePath, 'utf-8');

    assert.ok(source.includes('export async function getCommitDiff'),
      'gitService.ts should have getCommitDiff function');

    // Find the getCommitDiff function signature
    const funcMatch = source.match(
      /export async function getCommitDiff\([^)]*\)/
    );

    assert.ok(funcMatch, 'getCommitDiff function should exist');
    assert.ok(funcMatch![0].includes('filePath'),
      'getCommitDiff should accept filePath parameter');
  });

  test('gitService.ts getCommitDiff should use git show with file path', () => {
    const servicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
    const source = fs.readFileSync(servicePath, 'utf-8');

    const funcStart = source.indexOf('export async function getCommitDiff');
    const nextFuncStart = source.indexOf('\nexport async function', funcStart + 1);
    const funcEnd = nextFuncStart !== -1 ? nextFuncStart : source.indexOf('\n}', funcStart + 500) + 2;
    const funcBody = source.substring(funcStart, funcEnd);

    assert.ok(funcBody.includes("'show'") || funcBody.includes('"show"'),
      'getCommitDiff should use git show command');
  });

  test('messageHandler.ts should handle copyFileDiff case', () => {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes("case 'copyFileDiff':") || source.includes('case "copyFileDiff":'),
      'messageHandler.ts should handle copyFileDiff case');
  });

  test('messageHandler.ts should have handleCopyFileDiff function', () => {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('async function handleCopyFileDiff'),
      'messageHandler.ts should have handleCopyFileDiff function');
  });

  test('messageHandler.ts handleCopyFileDiff should call getCommitDiff with filePath', () => {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const funcStart = source.indexOf('async function handleCopyFileDiff');
    const funcEnd = source.indexOf('\n}', funcStart + 500) + 2;
    const funcBody = source.substring(funcStart, funcEnd);

    assert.ok(funcBody.includes('getCommitDiff'),
      'handleCopyFileDiff should call getCommitDiff');

    // Check that filePath is passed to getCommitDiff
    const getCommitDiffCall = funcBody.match(/getCommitDiff\([^)]+\)/);
    assert.ok(getCommitDiffCall,
      'handleCopyFileDiff should call getCommitDiff');

    assert.ok(getCommitDiffCall![0].includes('filePath'),
      'getCommitDiff call should include filePath parameter');
  });

  test('messageHandler.ts handleCopyFileDiff should handle binary files', () => {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const funcStart = source.indexOf('async function handleCopyFileDiff');
    const funcEnd = source.indexOf('\n}', funcStart + 500) + 2;
    const funcBody = source.substring(funcStart, funcEnd);

    assert.ok(funcBody.includes('isBinary'),
      'handleCopyFileDiff should check for binary files');
    assert.ok(funcBody.includes('Cannot copy diff for binary file'),
      'handleCopyFileDiff should show message for binary files');
  });

  test('messageHandler.ts handleCopyFileDiff should write to clipboard', () => {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const funcStart = source.indexOf('async function handleCopyFileDiff');
    const funcEnd = source.indexOf('\n}', funcStart + 500) + 2;
    const funcBody = source.substring(funcStart, funcEnd);

    assert.ok(funcBody.includes('clipboard.writeText'),
      'handleCopyFileDiff should write to clipboard');
  });

  test('messageHandler.ts handleCopyFileDiff should extract filename for confirmation message', () => {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const funcStart = source.indexOf('async function handleCopyFileDiff');
    const funcEnd = source.indexOf('\n}', funcStart + 500) + 2;
    const funcBody = source.substring(funcStart, funcEnd);

    assert.ok(funcBody.includes('path.basename'),
      'handleCopyFileDiff should extract filename for message');
  });

  test('main.js should have copy-file-diff context menu item', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-file-diff"'),
      'main.js should have copy-file-diff context menu item');
  });

  test('main.js copy-file-diff menu item should have 🩹 icon', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Find the copy-file-diff menu item
    const menuItemMatch = source.match(
      /data-action="copy-file-diff"[\s\S]*?<\/div>/
    );

    assert.ok(menuItemMatch,
      'main.js should have copy-file-diff menu item definition');

    assert.ok(menuItemMatch![0].includes('🩹'),
      'copy-file-diff menu item should have 🩹 icon');
  });

  test('main.js copy-file-diff menu item should have "Copy diff for this file" label', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Find the copy-file-diff menu item
    const menuItemMatch = source.match(
      /data-action="copy-file-diff"[\s\S]*?<\/div>/
    );

    assert.ok(menuItemMatch,
      'main.js should have copy-file-diff menu item definition');

    assert.ok(menuItemMatch![0].includes('Copy diff for this file'),
      'copy-file-diff menu item should have correct label');
  });

  test('main.js should send copyFileDiff message on menu click', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Find the click handler for copy-file-diff
    const clickHandlerMatch = source.match(
      /action === 'copy-file-diff'[\s\S]*?menu\.remove\(\)/
    );

    assert.ok(clickHandlerMatch,
      'main.js should have click handler for copy-file-diff');

    const handler = clickHandlerMatch![0];
    assert.ok(handler.includes("type: 'copyFileDiff'") || handler.includes('type: "copyFileDiff"'),
      'click handler should send copyFileDiff message type');
  });

  test('main.js copyFileDiff message should include hash and filePath', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Find the click handler for copy-file-diff
    const clickHandlerMatch = source.match(
      /action === 'copy-file-diff'[\s\S]*?menu\.remove\(\)/
    );

    assert.ok(clickHandlerMatch,
      'main.js should have click handler for copy-file-diff');

    const handler = clickHandlerMatch![0];
    assert.ok(handler.includes('hash:'),
      'copyFileDiff message should include hash');
    assert.ok(handler.includes('filePath:'),
      'copyFileDiff message should include filePath');
  });

  test('extension.ts should register gitHistory.copyFileDiff command', () => {
    const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes("'gitHistory.copyFileDiff'") || source.includes('"gitHistory.copyFileDiff"'),
      'extension.ts should register copyFileDiff command');
  });

  test('package.json should have gitHistory.copyFileDiff command definition', () => {
    const packagePath = path.resolve(__dirname, '../../../package.json');
    const source = fs.readFileSync(packagePath, 'utf-8');

    assert.ok(source.includes('"gitHistory.copyFileDiff"'),
      'package.json should have copyFileDiff command definition');
  });

  test('package.json should have keybinding for copyFileDiff', () => {
    const packagePath = path.resolve(__dirname, '../../../package.json');
    const source = fs.readFileSync(packagePath, 'utf-8');

    // Find the keybinding section
    const keybindingMatch = source.match(
      /"command": "gitHistory\.copyFileDiff"[\s\S]*?"when":/
    );

    assert.ok(keybindingMatch,
      'package.json should have keybinding for copyFileDiff');

    const keybinding = keybindingMatch![0];
    assert.ok(keybinding.includes('"key":'),
      'copyFileDiff keybinding should have key property');
    assert.ok(keybinding.includes('activeWebviewPanelId == gitHistory.webview'),
      'copyFileDiff keybinding should be scoped to webview');
  });

  test('main.js triggerAction should dispatch copyFileDiff', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'copyFileDiff': handleCopyFileDiff()"),
      'main.js triggerAction should dispatch copyFileDiff');
  });

  test('main.js should have handleCopyFileDiff function', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFileDiff'),
      'main.js should have handleCopyFileDiff function');
  });
});
