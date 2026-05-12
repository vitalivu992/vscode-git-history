import * as assert from 'assert';
import * as path from 'path';

// Simulates extracting directory path from file path (from messageHandler logic)
function getFileDirectory(filePath: string): string {
  return path.dirname(filePath) + path.sep;
}

// Simulates extracting directory name from file path (for confirmation message)
function getDirectoryName(filePath: string): string {
  return path.basename(path.dirname(filePath));
}

suite('Copy File Directory Tests', () => {
  test('getFileDirectory should extract directory from full path', () => {
    const fullPath = '/home/user/project/src/components/Button.tsx';
    const dirPath = getFileDirectory(fullPath);
    assert.strictEqual(dirPath, '/home/user/project/src/components/');
  });

  test('getFileDirectory should include trailing separator', () => {
    const fullPath = '/home/user/project/src/components/Button.tsx';
    const dirPath = getFileDirectory(fullPath);
    assert.ok(dirPath.endsWith(path.sep), 'Directory path should end with separator');
  });

  test('getDirectoryName should extract directory name from full path', () => {
    const fullPath = '/home/user/project/src/components/Button.tsx';
    const dirName = getDirectoryName(fullPath);
    assert.strictEqual(dirName, 'components');
  });

  test('getFileDirectory should handle relative path', () => {
    const relativePath = 'src/utils/helpers.ts';
    const dirPath = getFileDirectory(relativePath);
    assert.strictEqual(dirPath, 'src/utils' + path.sep);
  });

  test('getFileDirectory should handle nested path', () => {
    const nestedPath = 'src/webview/panel/main.js';
    const dirPath = getFileDirectory(nestedPath);
    assert.strictEqual(dirPath, 'src/webview/panel' + path.sep);
  });

  test('getFileDirectory should handle file in root directory', () => {
    const rootFile = 'package.json';
    const dirPath = getFileDirectory(rootFile);
    assert.strictEqual(dirPath, '.' + path.sep);
  });

  test('getFileDirectory should handle file with extension', () => {
    const pathWithExt = 'src/components/App.tsx';
    const dirPath = getFileDirectory(pathWithExt);
    assert.strictEqual(dirPath, 'src/components' + path.sep);
  });

  test('getFileDirectory should handle deeply nested file', () => {
    const deepPath = '/home/user/projects/my-app/src/features/auth/components/login/LoginForm.tsx';
    const dirPath = getFileDirectory(deepPath);
    assert.strictEqual(dirPath, '/home/user/projects/my-app/src/features/auth/components/login/');
  });

  test('getFileDirectory should handle Windows-style path', () => {
    const windowsPath = 'C:\\Users\\user\\project\\src\\file.ts';
    const dirPath = getFileDirectory(windowsPath);
    assert.ok(dirPath.includes('src') || dirPath.includes('C:\\'), 'Should handle Windows path');
  });

  test('getDirectoryName should return parent directory name', () => {
    const fullPath = '/home/user/project/src/components/Button.tsx';
    const dirName = getDirectoryName(fullPath);
    assert.strictEqual(dirName, 'components');
  });

  test('getDirectoryName should handle root directory', () => {
    const rootFile = '/file.txt';
    const dirName = getDirectoryName(rootFile);
    assert.strictEqual(dirName, '');
  });

  test('getFileDirectory confirmation message format', () => {
    const fullPath = '/home/user/project/src/components/Button.tsx';
    const dirName = getDirectoryName(fullPath);
    const confirmationMessage = `Copied directory: ${dirName}${path.sep}`;
    assert.strictEqual(confirmationMessage, 'Copied directory: components/');
  });
});

suite('Copy File Directory Source Verification', () => {
  test('types.ts should have copyFileDirectory message type', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("type: 'copyFileDirectory'"),
      'types.ts should have copyFileDirectory message type');
  });

  test('types.ts copyFileDirectory should have filePath field', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("copyFileDirectory'"),
      'types.ts should have copyFileDirectory message type');
    assert.ok(source.includes('filePath: string'),
      'copyFileDirectory message should have filePath field');
  });

  test('types.ts should have copyFileDirectory WebviewAction', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("'copyFileDirectory'"),
      'types.ts should have copyFileDirectory WebviewAction');
  });

  test('main.js should have copy-file-directory context menu action', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-file-directory"'),
      'main.js context menu should include copy-file-directory action');
  });

  test('main.js should have folder icon for copy file directory', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Copy file directory'),
      'main.js should have Copy file directory label');
    // Check that it's near a folder icon or has appropriate icon
    const menuSection = source.substring(source.indexOf('data-action="copy-file-directory"') - 50,
      source.indexOf('data-action="copy-file-directory"') + 100);
    assert.ok(menuSection.includes('context-menu-icon'),
      'Copy file directory should have an icon');
  });

  test('main.js should handle copy-file-directory action', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("action === 'copy-file-directory'"),
      'main.js should handle copy-file-directory action');
  });

  test('main.js should send copyFileDirectory message', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("type: 'copyFileDirectory'"),
      'main.js should send copyFileDirectory message');
  });

  test('main.js should have handleCopyFileDirectory function', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFileDirectory'),
      'main.js should have handleCopyFileDirectory function');
  });

  test('main.js should handle copyFileDirectory message in handleMessage', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'copyFileDirectory':"),
      'main.js handleMessage should handle copyFileDirectory case');
  });

  test('messageHandler.ts should handle copyFileDirectory case', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes("case 'copyFileDirectory':"),
      'messageHandler.ts should handle copyFileDirectory case');
  });

  test('messageHandler.ts should have handleCopyFileDirectory function', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFileDirectory'),
      'messageHandler.ts should have handleCopyFileDirectory function');
  });

  test('messageHandler.ts handleCopyFileDirectory should use path.dirname', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('path.dirname(filePath)'),
      'handleCopyFileDirectory should use path.dirname to extract directory');
  });

  test('messageHandler.ts handleCopyFileDirectory should add trailing separator', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('path.sep') || source.includes("'/'") || source.includes('"\\"'),
      'handleCopyFileDirectory should add trailing separator');
  });

  test('messageHandler.ts handleCopyFileDirectory should use vscode.env.clipboard', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('vscode.env.clipboard.writeText'),
      'handleCopyFileDirectory should use vscode.env.clipboard.writeText');
  });

  test('messageHandler.ts handleCopyFileDirectory should show confirmation message', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('showInformationMessage'),
      'handleCopyFileDirectory should show confirmation message');
    assert.ok(source.includes('Copied directory'),
      'Confirmation message should mention "Copied directory"');
  });

  test('main.js file context menu should have copy-file-directory in correct order', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Find the file context menu (showFileContextMenu function)
    const menuStart = source.indexOf('function showFileContextMenu');
    let menuEnd = source.indexOf('// ─── Commit Context Menu', menuStart);
    if (menuEnd === -1) {
      menuEnd = source.indexOf('function showCommitContextMenu', menuStart);
    }
    const menuSection = source.substring(menuStart, menuEnd > 0 ? menuEnd : menuStart + 3000);

    // Verify order: copy-file-extension should come before copy-file-directory
    const copyExtIndex = menuSection.indexOf('copy-file-extension');
    const copyDirIndex = menuSection.indexOf('copy-file-directory');
    const copyRelIndex = menuSection.indexOf('copy-relative-path');

    assert.ok(copyExtIndex < copyDirIndex,
      'copy-file-extension should come before copy-file-directory');
    assert.ok(copyDirIndex < copyRelIndex,
      'copy-file-directory should come before copy-relative-path');
  });

  test('package.json should have copyFileDirectory command', () => {
    const fs = require('fs');
    const packagePath = path.resolve(__dirname, '../../../package.json');
    const source = fs.readFileSync(packagePath, 'utf-8');

    assert.ok(source.includes('gitHistory.copyFileDirectory'),
      'package.json should have gitHistory.copyFileDirectory command');
  });

  test('package.json should have keyboard binding for copyFileDirectory', () => {
    const fs = require('fs');
    const packagePath = path.resolve(__dirname, '../../../package.json');
    const source = fs.readFileSync(packagePath, 'utf-8');

    assert.ok(source.includes('gitHistory.copyFileDirectory'),
      'package.json should have gitHistory.copyFileDirectory in keybindings');
    assert.ok(source.includes('ctrl+alt+k') || source.includes('cmd+alt+k'),
      'package.json should have keyboard binding for copyFileDirectory');
  });

  test('extension.ts should register copyFileDirectory webview action', () => {
    const fs = require('fs');
    const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes("'copyFileDirectory'"),
      'extension.ts should register copyFileDirectory webview action');
  });

  test('main.js keyboard help should have copy file directory entry', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Copy file directory'),
      'main.js keyboard help should include Copy file directory');
  });
});
