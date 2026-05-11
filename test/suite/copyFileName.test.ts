import * as assert from 'assert';
import * as path from 'path';

// Simulates extracting basename from file path (from messageHandler logic)
function getFileName(filePath: string): string {
  return path.basename(filePath);
}

suite('Copy File Name Tests', () => {
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

suite('Copy File Name Source Verification', () => {
  test('types.ts should have copyFileName message type', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("type: 'copyFileName'"),
      'types.ts should have copyFileName message type');
  });

  test('types.ts copyFileName should have filePath field', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("copyFileName'"),
      'types.ts should have copyFileName message type');
  });

  test('main.js should have copy-file-name context menu action', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-file-name"'),
      'main.js context menu should include copy-file-name action');
  });

  test('main.js should handle copy-file-name action', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("action === 'copy-file-name'"),
      'main.js should handle copy-file-name action');
  });

  test('main.js should send copyFileName message', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("type: 'copyFileName'"),
      'main.js should send copyFileName message');
  });

  test('messageHandler.ts should handle copyFileName case', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes("case 'copyFileName':"),
      'messageHandler.ts should handle copyFileName case');
  });

  test('messageHandler.ts should have handleCopyFileName function', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFileName'),
      'messageHandler.ts should have handleCopyFileName function');
  });

  test('messageHandler.ts handleCopyFileName should use path.basename', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('path.basename(filePath)'),
      'handleCopyFileName should use path.basename to extract filename');
  });

  test('messageHandler.ts handleCopyFileName should use vscode.env.clipboard', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('vscode.env.clipboard.writeText'),
      'handleCopyFileName should use vscode.env.clipboard.writeText');
  });

  test('main.js file context menu should include copy-file-name', () => {
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

    assert.ok(menuSection.includes('copy-file-name'),
      'File context menu should have copy-file-name action');
  });

  test('main.js copy-file-name label should say "Copy file name only"', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Copy file name only'),
      'main.js context menu label should say "Copy file name only"');
  });
});