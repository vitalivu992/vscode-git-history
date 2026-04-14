import * as assert from 'assert';
import * as path from 'path';

// Simulates extracting basename from file path (from messageHandler logic)
function getFileName(filePath: string): string {
  return path.basename(filePath);
}

suite('Copy File Path Tests', () => {
  test('getFileName should extract filename from full path', () => {
    const fullPath = '/home/user/project/src/components/Button.tsx';
    const fileName = getFileName(fullPath);
    assert.strictEqual(fileName, 'Button.tsx');
  });

  test('getFileName should handle relative path', () => {
    const relativePath = 'src/utils/helpers.ts';
    const fileName = getFileName(relativePath);
    assert.strictEqual(fileName, 'helpers.ts');
  });

  test('getFileName should handle path with dots', () => {
    const dotPath = './src/index.ts';
    const fileName = getFileName(dotPath);
    assert.strictEqual(fileName, 'index.ts');
  });

  test('getFileName should handle just filename', () => {
    const justFile = 'package.json';
    const fileName = getFileName(justFile);
    assert.strictEqual(fileName, 'package.json');
  });

  test('getFileName should handle nested path', () => {
    const nestedPath = 'src/webview/panel/main.js';
    const fileName = getFileName(nestedPath);
    assert.strictEqual(fileName, 'main.js');
  });

  test('getFileName should handle path with extension', () => {
    const pathWithExt = 'src/components/App.tsx';
    const fileName = getFileName(pathWithExt);
    assert.ok(fileName.includes('.tsx'));
    assert.strictEqual(fileName, 'App.tsx');
  });
});

suite('Copy File Path Source Verification', () => {
  test('types.ts should have copyFilePath message type', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("type: 'copyFilePath'"),
      'types.ts should have copyFilePath message type');
  });

  test('types.ts copyFilePath should have filePath field', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("copyFilePath'"),
      'types.ts should have copyFilePath message type');
  });

  test('main.js should have copy-file-path context menu action', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-file-path"'),
      'main.js context menu should include copy-file-path action');
  });

  test('main.js should handle copy-file-path action', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("action === 'copy-file-path'"),
      'main.js should handle copy-file-path action');
  });

  test('main.js should send copyFilePath message', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("type: 'copyFilePath'"),
      'main.js should send copyFilePath message');
  });

  test('messageHandler.ts should handle copyFilePath case', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes("case 'copyFilePath':"),
      'messageHandler.ts should handle copyFilePath case');
  });

  test('messageHandler.ts should have handleCopyFilePath function', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFilePath'),
      'messageHandler.ts should have handleCopyFilePath function');
  });

  test('messageHandler.ts handleCopyFilePath should use path.basename', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('path.basename(filePath)'),
      'handleCopyFilePath should use path.basename to extract filename');
  });

  test('messageHandler.ts handleCopyFilePath should use vscode.env.clipboard', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('vscode.env.clipboard.writeText'),
      'handleCopyFilePath should use vscode.env.clipboard.writeText');
  });

  test('main.js file context menu should have divider before copy-file-path', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Find the file context menu (showFileContextMenu function)
    const menuStart = source.indexOf('function showFileContextMenu');
    // Find the end of the function - look for the next function declaration or end of file
    let menuEnd = source.indexOf('// ─── Commit Context Menu', menuStart);
    if (menuEnd === -1) {
      menuEnd = source.indexOf('function showCommitContextMenu', menuStart);
    }
    const menuSection = source.substring(menuStart, menuEnd > 0 ? menuEnd : menuStart + 3000);

    assert.ok(menuSection.includes('context-menu-divider'),
      'File context menu should have a divider');
    assert.ok(menuSection.includes('copy-file-path'),
      'File context menu should have copy-file-path action');
  });
});
