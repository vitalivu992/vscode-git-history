import * as assert from 'assert';
import * as path from 'path';

// Simulates path construction logic from messageHandler handleRevealFileInExplorer
function buildAbsolutePath(cwd: string, filePath: string): string {
  return path.join(cwd, filePath);
}

// Simulates filename extraction from messageHandler handleRevealFileInExplorer
function getFileName(filePath: string): string {
  return path.basename(filePath);
}

suite('Reveal File In Explorer - Path Handling', () => {
  test('buildAbsolutePath should join cwd and relative path', () => {
    const result = buildAbsolutePath('/home/user/project', 'src/main.ts');
    assert.strictEqual(result, '/home/user/project/src/main.ts');
  });

  test('buildAbsolutePath should handle nested relative paths', () => {
    const result = buildAbsolutePath('/home/user/project', 'src/webview/panel/main.js');
    assert.strictEqual(result, '/home/user/project/src/webview/panel/main.js');
  });

  test('buildAbsolutePath should handle simple filename', () => {
    const result = buildAbsolutePath('/home/user/project', 'package.json');
    assert.strictEqual(result, '/home/user/project/package.json');
  });

  test('buildAbsolutePath should normalize separators', () => {
    const result = buildAbsolutePath('/home/user/project', 'src/utils/helpers.ts');
    assert.ok(result.includes('src') && result.includes('helpers.ts'));
  });

  test('buildAbsolutePath should handle path with leading dot', () => {
    const result = buildAbsolutePath('/home/user/project', './src/index.ts');
    assert.ok(result.endsWith('src/index.ts'));
  });

  test('getFileName should extract basename from full path', () => {
    const result = getFileName('/home/user/project/src/main.ts');
    assert.strictEqual(result, 'main.ts');
  });

  test('getFileName should extract basename from relative path', () => {
    const result = getFileName('src/webview/panel/main.js');
    assert.strictEqual(result, 'main.js');
  });

  test('getFileName should handle simple filename', () => {
    const result = getFileName('package.json');
    assert.strictEqual(result, 'package.json');
  });

  test('getFileName should handle hidden files', () => {
    const result = getFileName('/home/user/project/.gitignore');
    assert.strictEqual(result, '.gitignore');
  });

  test('getFileName should handle files with multiple dots', () => {
    const result = getFileName('src/app.config.ts');
    assert.strictEqual(result, 'app.config.ts');
  });

  test('getFileName should handle path with trailing separator', () => {
    const result = getFileName('/home/user/project/src/');
    assert.strictEqual(result, 'src');
  });
});

suite('Reveal File In Explorer - Source Verification', () => {
  test('types.ts has revealFileInExplorer WebviewAction type', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("'revealFileInExplorer'"),
      'types.ts should have revealFileInExplorer WebviewAction');
  });

  test('types.ts has WebviewToExtMessage with revealFileInExplorer and filePath field', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("type: 'revealFileInExplorer'"),
      'types.ts should have revealFileInExplorer message type');
    assert.ok(source.includes("filePath: string"),
      'types.ts should have filePath field for revealFileInExplorer');
  });

  test('main.js has reveal-file-explorer context menu action', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="reveal-file-explorer"'),
      'main.js context menu should include reveal-file-explorer action');
  });

  test('main.js sends revealFileInExplorer message', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("type: 'revealFileInExplorer'"),
      'main.js should send revealFileInExplorer message');
  });

  test('messageHandler.ts has handleRevealFileInExplorer function', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('function handleRevealFileInExplorer'),
      'messageHandler.ts should have handleRevealFileInExplorer function');
  });

  test('messageHandler.ts uses path.join for path construction', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('path.join(cwd, filePath)'),
      'handleRevealFileInExplorer should use path.join to construct absolute path');
  });

  test('messageHandler.ts uses vscode.env.openExternal', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('vscode.env.openExternal'),
      'handleRevealFileInExplorer should use vscode.env.openExternal');
  });

  test('messageHandler.ts uses path.basename for filename extraction', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('path.basename(filePath)'),
      'handleRevealFileInExplorer should use path.basename to extract filename');
  });

  test('main.js has folder icon in context menu', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('📂'),
      'main.js context menu should have folder icon');
  });

  test('main.js has handleRevealFileInExplorer function', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleRevealFileInExplorer()'),
      'main.js should have handleRevealFileInExplorer function');
  });

  test('main.js has triggerAction case for revealFileInExplorer', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'revealFileInExplorer':"),
      'main.js should handle revealFileInExplorer triggerAction');
  });
});
