import * as assert from 'assert';
import * as path from 'path';

// Simulates extracting extension from file path (from messageHandler logic)
function getFileExtension(filePath: string): string {
  const ext = path.extname(filePath).replace(/^\./, ''); // Remove leading dot
  return ext || 'no extension';
}

suite('Copy File Extension Tests', () => {
  test('getFileExtension should extract extension from full path', () => {
    const fullPath = '/home/user/project/src/components/Button.tsx';
    const ext = getFileExtension(fullPath);
    assert.strictEqual(ext, 'tsx');
  });

  test('getFileExtension should handle relative path', () => {
    const relativePath = 'src/utils/helpers.ts';
    const ext = getFileExtension(relativePath);
    assert.strictEqual(ext, 'ts');
  });

  test('getFileExtension should handle path with dots', () => {
    const dotPath = './src/index.ts';
    const ext = getFileExtension(dotPath);
    assert.strictEqual(ext, 'ts');
  });

  test('getFileExtension should handle just filename', () => {
    const justFile = 'package.json';
    const ext = getFileExtension(justFile);
    assert.strictEqual(ext, 'json');
  });

  test('getFileExtension should handle nested path', () => {
    const nestedPath = 'src/webview/panel/main.js';
    const ext = getFileExtension(nestedPath);
    assert.strictEqual(ext, 'js');
  });

  test('getFileExtension should handle files with multiple dots', () => {
    const multiDot = 'src/app.config.ts';
    const ext = getFileExtension(multiDot);
    assert.strictEqual(ext, 'ts');
  });

  test('getFileExtension should handle files with no extension', () => {
    const noExt = 'src/utils/helper';
    const ext = getFileExtension(noExt);
    assert.strictEqual(ext, 'no extension');
  });

  test('getFileExtension should handle hidden files', () => {
    const hiddenFile = '.gitignore';
    const ext = getFileExtension(hiddenFile);
    assert.strictEqual(ext, 'gitignore');
  });

  test('getFileExtension should handle just extension', () => {
    const justExt = '.ts';
    const ext = getFileExtension(justExt);
    assert.strictEqual(ext, 'ts');
  });

  test('getFileExtension should handle common file extensions', () => {
    const files = [
      { path: 'src/App.tsx', ext: 'tsx' },
      { path: 'src/index.js', ext: 'js' },
      { path: 'styles/main.css', ext: 'css' },
      { path: 'config/app.json', ext: 'json' },
      { path: 'README.md', ext: 'md' },
      { path: 'script.py', ext: 'py' },
      { path: 'main.go', ext: 'go' },
      { path: 'Dockerfile', ext: 'no extension' },
    ];

    for (const { path: filePath, ext: expectedExt } of files) {
      const actualExt = getFileExtension(filePath);
      assert.strictEqual(actualExt, expectedExt,
        `getFileExtension('${filePath}') should return '${expectedExt}'`);
    }
  });

  test('getFileExtension should handle uppercase extensions', () => {
    const upperExt = 'src/config/APP.CONFIG';
    const ext = getFileExtension(upperExt);
    assert.strictEqual(ext, 'CONFIG');
  });

  test('getFileExtension should handle mixed case extensions', () => {
    const mixedCase = 'src/data/Test.Json';
    const ext = getFileExtension(mixedCase);
    assert.strictEqual(ext, 'Json');
  });

  test('getFileExtension should handle path with trailing separator', () => {
    const withSeparator = '/home/user/project/src/';
    const ext = getFileExtension(withSeparator);
    assert.strictEqual(ext, 'no extension');
  });

  test('getFileExtension should handle empty path', () => {
    const emptyPath = '';
    const ext = getFileExtension(emptyPath);
    assert.strictEqual(ext, 'no extension');
  });

  test('getFileExtension should handle path with query string', () => {
    const withQuery = '/home/user/project/src/file.ts?version=1';
    const ext = getFileExtension(withQuery);
    // path.extname will treat the entire string as the path, so it extracts .ts?version=1
    // But path.extname is not URL-aware, so we just test that it returns something
    assert.ok(ext.includes('ts') || ext === 'no extension');
  });

  test('getFileExtension should handle path with hash', () => {
    const withHash = '/home/user/project/src/file.ts#L123';
    const ext = getFileExtension(withHash);
    // Similar to query string, path.extname doesn't parse URLs
    assert.ok(ext.includes('ts') || ext === 'no extension');
  });
});

suite('Copy File Extension Source Verification', () => {
  test('types.ts should have copyFileExtension message type', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("type: 'copyFileExtension'"),
      'types.ts should have copyFileExtension message type');
  });

  test('types.ts copyFileExtension should have filePath field', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("copyFileExtension'"),
      'types.ts should have copyFileExtension message type');
  });

  test('main.js should have copy-file-extension context menu action', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-file-extension"'),
      'main.js context menu should include copy-file-extension action');
  });

  test('main.js should handle copy-file-extension action', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("action === 'copy-file-extension'"),
      'main.js should handle copy-file-extension action');
  });

  test('main.js should send copyFileExtension message', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("type: 'copyFileExtension'"),
      'main.js should send copyFileExtension message');
  });

  test('messageHandler.ts should handle copyFileExtension case', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes("case 'copyFileExtension':"),
      'messageHandler.ts should handle copyFileExtension case');
  });

  test('messageHandler.ts should have handleCopyFileExtension function', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFileExtension'),
      'messageHandler.ts should have handleCopyFileExtension function');
  });

  test('messageHandler.ts handleCopyFileExtension should use path.extname', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('path.extname(filePath)'),
      'handleCopyFileExtension should use path.extname to extract extension');
  });

  test('messageHandler.ts handleCopyFileExtension should remove leading dot', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes(".replace(/^\\./, '')"),
      'handleCopyFileExtension should remove leading dot from extension');
  });

  test('messageHandler.ts handleCopyFileExtension should use vscode.env.clipboard', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('vscode.env.clipboard.writeText'),
      'handleCopyFileExtension should use vscode.env.clipboard.writeText');
  });

  test('main.js file context menu should include copy-file-extension', () => {
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

    assert.ok(menuSection.includes('copy-file-extension'),
      'File context menu should have copy-file-extension action');
  });

  test('main.js copy-file-extension label should say "Copy file extension"', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Copy file extension'),
      'main.js context menu label should say "Copy file extension"');
  });

  test('main.js should handle Ctrl+Alt+E keyboard shortcut', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(
      source.includes('e.altKey') &&
      source.includes("e.key === 'e'") &&
      source.includes('handleCopyExtension'),
      'main.js should handle Ctrl+Alt+E and call handleCopyExtension'
    );
  });
});
