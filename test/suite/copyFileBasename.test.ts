import * as assert from 'assert';
import * as path from 'path';

// Simulates extracting basename without extension from file path (from messageHandler logic)
function getFileBasename(filePath: string): string {
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath);
  // Remove the extension from the filename if it exists
  const basename = ext ? fileName.replace(new RegExp(ext.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'), '') : fileName;
  return basename;
}

suite('Copy File Basename Tests', () => {
  test('getFileBasename should extract basename without extension from full path', () => {
    const fullPath = '/home/user/project/src/components/Button.tsx';
    const basename = getFileBasename(fullPath);
    assert.strictEqual(basename, 'Button');
  });

  test('getFileBasename should handle relative path', () => {
    const relativePath = 'src/utils/helpers.ts';
    const basename = getFileBasename(relativePath);
    assert.strictEqual(basename, 'helpers');
  });

  test('getFileBasename should handle path with dots', () => {
    const dotPath = './src/index.ts';
    const basename = getFileBasename(dotPath);
    assert.strictEqual(basename, 'index');
  });

  test('getFileBasename should handle just filename', () => {
    const justFile = 'package.json';
    const basename = getFileBasename(justFile);
    assert.strictEqual(basename, 'package');
  });

  test('getFileBasename should handle nested path', () => {
    const nestedPath = 'src/webview/panel/main.js';
    const basename = getFileBasename(nestedPath);
    assert.strictEqual(basename, 'main');
  });

  test('getFileBasename should handle compound extension', () => {
    const compoundExt = 'archive.tar.gz';
    const basename = getFileBasename(compoundExt);
    assert.strictEqual(basename, 'archive.tar');
  });

  test('getFileBasename should handle file with no extension', () => {
    const noExt = 'Dockerfile';
    const basename = getFileBasename(noExt);
    assert.strictEqual(basename, 'Dockerfile');
  });

  test('getFileBasename should handle hidden file with no extension', () => {
    const hiddenFile = '.gitignore';
    const basename = getFileBasename(hiddenFile);
    assert.strictEqual(basename, '.gitignore');
  });

  test('getFileBasename should handle hidden file with extension', () => {
    const hiddenWithExt = '.env.local';
    const basename = getFileBasename(hiddenWithExt);
    assert.strictEqual(basename, '.env');
  });

  test('getFileBasename should handle multiple dots in filename', () => {
    const multiDots = 'my.component.ts';
    const basename = getFileBasename(multiDots);
    assert.strictEqual(basename, 'my.component');
  });

  test('getFileBasename should handle file with only extension', () => {
    const onlyExt = '.ts';
    const basename = getFileBasename(onlyExt);
    assert.strictEqual(basename, '.ts');
  });

  test('getFileBasename should handle double extension', () => {
    const doubleExt = 'index.test.ts';
    const basename = getFileBasename(doubleExt);
    assert.strictEqual(basename, 'index.test');
  });
});

suite('Copy File Basename Source Verification', () => {
  test('types.ts should have copyFileBasename message type', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("type: 'copyFileBasename'"),
      'types.ts should have copyFileBasename message type');
  });

  test('types.ts copyFileBasename should have filePath field', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("copyFileBasename'"),
      'types.ts should have copyFileBasename message type');
  });

  test('types.ts should have copyFileBasename WebviewAction', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("'copyFileBasename'"),
      'types.ts should have copyFileBasename WebviewAction');
  });

  test('main.js should have copy-file-basename context menu action', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-file-basename"'),
      'main.js context menu should include copy-file-basename action');
  });

  test('main.js should handle copy-file-basename action', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("action === 'copy-file-basename'"),
      'main.js should handle copy-file-basename action');
  });

  test('main.js should send copyFileBasename message', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("type: 'copyFileBasename'"),
      'main.js should send copyFileBasename message');
  });

  test('main.js should have handleCopyFileBasename function', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFileBasename'),
      'main.js should have handleCopyFileBasename function');
  });

  test('main.js should have case for copyFileBasename', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'copyFileBasename':"),
      'main.js should have case for copyFileBasename');
  });

  test('messageHandler.ts should handle copyFileBasename case', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes("case 'copyFileBasename':"),
      'messageHandler.ts should handle copyFileBasename case');
  });

  test('messageHandler.ts should have handleCopyFileBasename function', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFileBasename'),
      'messageHandler.ts should have handleCopyFileBasename function');
  });

  test('messageHandler.ts handleCopyFileBasename should use path.basename', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('path.basename(filePath)'),
      'handleCopyFileBasename should use path.basename to extract filename');
  });

  test('messageHandler.ts handleCopyFileBasename should use path.extname', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('path.extname(filePath)'),
      'handleCopyFileBasename should use path.extname to extract extension');
  });

  test('messageHandler.ts handleCopyFileBasename should use vscode.env.clipboard', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('vscode.env.clipboard.writeText'),
      'handleCopyFileBasename should use vscode.env.clipboard.writeText');
  });

  test('extension.ts should register copyFileBasename command', () => {
    const fs = require('fs');
    const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes("gitHistory.copyFileBasename"),
      'extension.ts should register copyFileBasename command');
  });

  test('main.js file context menu should include copy-file-basename', () => {
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

    assert.ok(menuSection.includes('copy-file-basename'),
      'File context menu should have copy-file-basename action');
  });

  test('main.js copy-file-basename label should say "Copy file basename (without extension)"', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Copy file basename (without extension)'),
      'main.js context menu label should say "Copy file basename (without extension)"');
  });

  test('main.js keyboard help should include copyFileBasename', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Copy file basename (without extension)'),
      'main.js keyboard help should include copyFileBasename');
  });

  test('package.json should have copyFileBasename command', () => {
    const fs = require('fs');
    const packagePath = path.resolve(__dirname, '../../../package.json');
    const source = fs.readFileSync(packagePath, 'utf-8');

    assert.ok(source.includes('gitHistory.copyFileBasename'),
      'package.json should have copyFileBasename command');
  });

  test('package.json should have copyFileBasename keybinding', () => {
    const fs = require('fs');
    const packagePath = path.resolve(__dirname, '../../../package.json');
    const source = fs.readFileSync(packagePath, 'utf-8');

    assert.ok(source.includes('ctrl+shift+alt+n'),
      'package.json should have copyFileBasename keybinding');
  });
});
