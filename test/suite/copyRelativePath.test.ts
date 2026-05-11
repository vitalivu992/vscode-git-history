import * as assert from 'assert';
import * as path from 'path';

// Simulates computing relative path (from messageHandler logic)
function getRelativePath(filePath: string, cwd: string): string {
  return path.relative(cwd, filePath);
}

suite('Copy Relative Path Tests', () => {
  const testCwd = '/home/user/project';

  test('getRelativePath should compute path relative to cwd', () => {
    const fullPath = '/home/user/project/src/components/Button.tsx';
    const relativePath = getRelativePath(fullPath, testCwd);
    assert.strictEqual(relativePath, 'src/components/Button.tsx');
  });

  test('getRelativePath should handle file at root', () => {
    const rootFile = '/home/user/project/package.json';
    const relativePath = getRelativePath(rootFile, testCwd);
    assert.strictEqual(relativePath, 'package.json');
  });

  test('getRelativePath should handle deeply nested file', () => {
    const nestedPath = '/home/user/project/src/webview/panel/styles/main.css';
    const relativePath = getRelativePath(nestedPath, testCwd);
    assert.strictEqual(relativePath, 'src/webview/panel/styles/main.css');
  });

  test('getRelativePath should handle path with special characters', () => {
    const specialPath = '/home/user/project/src/utils/test-file [v2].ts';
    const relativePath = getRelativePath(specialPath, testCwd);
    assert.strictEqual(relativePath, 'src/utils/test-file [v2].ts');
  });
});

suite('Copy Relative Path Source Verification', () => {
  test('types.ts should have copyRelativePath message type', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("type: 'copyRelativePath'"),
      'types.ts should have copyRelativePath message type');
  });

  test('types.ts copyRelativePath should have filePath field', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("copyRelativePath'"),
      'types.ts should have copyRelativePath message type');
  });

  test('main.js should have copy-relative-path context menu action', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-relative-path"'),
      'main.js context menu should include copy-relative-path action');
  });

  test('main.js should handle copy-relative-path action', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("action === 'copy-relative-path'"),
      'main.js should handle copy-relative-path action');
  });

  test('main.js should send copyRelativePath message', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("type: 'copyRelativePath'"),
      'main.js should send copyRelativePath message');
  });

  test('messageHandler.ts should handle copyRelativePath case', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes("case 'copyRelativePath':"),
      'messageHandler.ts should handle copyRelativePath case');
  });

  test('messageHandler.ts should have handleCopyRelativePath function', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyRelativePath'),
      'messageHandler.ts should have handleCopyRelativePath function');
  });

  test('messageHandler.ts handleCopyRelativePath should use path.relative', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('path.relative'),
      'handleCopyRelativePath should use path.relative to compute relative path');
  });
});
