import * as assert from 'assert';
import * as path from 'path';

// Simulates line counting logic from messageHandler
function countFileLines(content: string): number {
  if (content.trim() === '') {
    return 0;
  }
  return content.split('\n').length;
}

function formatLineCount(lineCount: number): string {
  const lineWord = lineCount === 1 ? 'line' : 'lines';
  return `${lineCount} ${lineWord}`;
}

suite('Copy File Line Count Logic Tests', () => {
  test('countFileLines should count lines in multi-line content', () => {
    const content = 'Line 1\nLine 2\nLine 3';
    assert.strictEqual(countFileLines(content), 3);
  });

  test('countFileLines should return 0 for empty string', () => {
    assert.strictEqual(countFileLines(''), 0);
  });

  test('countFileLines should return 0 for whitespace-only string', () => {
    assert.strictEqual(countFileLines('   \n  \n  '), 0);
  });

  test('countFileLines should count single line as 1', () => {
    assert.strictEqual(countFileLines('Hello World'), 1);
  });

  test('countFileLines should count file with trailing newline', () => {
    const content = 'Line 1\nLine 2\nLine 3\n';
    assert.strictEqual(countFileLines(content), 4);
  });

  test('countFileLines should count file without trailing newline', () => {
    const content = 'Line 1\nLine 2\nLine 3';
    assert.strictEqual(countFileLines(content), 3);
  });

  test('countFileLines should handle single newline', () => {
    assert.strictEqual(countFileLines('\n'), 0);
  });

  test('countFileLines should handle large file', () => {
    const lines = Array(1000).fill('content').join('\n');
    assert.strictEqual(countFileLines(lines), 1000);
  });

  test('formatLineCount should use singular for 1 line', () => {
    assert.strictEqual(formatLineCount(1), '1 line');
  });

  test('formatLineCount should use plural for 0 lines', () => {
    assert.strictEqual(formatLineCount(0), '0 lines');
  });

  test('formatLineCount should use plural for multiple lines', () => {
    assert.strictEqual(formatLineCount(42), '42 lines');
  });

  test('formatLineCount should use plural for 2 lines', () => {
    assert.strictEqual(formatLineCount(2), '2 lines');
  });
});

suite('Copy File Line Count Source Verification', () => {
  test('types.ts should have copyFileLineCount message type', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("type: 'copyFileLineCount'"),
      'types.ts should have copyFileLineCount message type');
  });

  test('types.ts copyFileLineCount should have filePath and hash fields', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("copyFileLineCount'; hash: string; filePath: string }"),
      'types.ts copyFileLineCount should have filePath and hash fields');
  });

  test('types.ts should have copyFileLineCount in WebviewAction', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("| 'copyFileLineCount'"),
      'copyFileLineCount should be in WebviewAction union type');
  });

  test('main.js should send copyFileLineCount message', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("type: 'copyFileLineCount'"),
      'main.js should send copyFileLineCount message');
  });

  test('main.js should have case for copyFileLineCount', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'copyFileLineCount':"),
      'main.js should have case for copyFileLineCount');
  });

  test('main.js should have handleCopyFileLineCount function', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFileLineCount'),
      'main.js should have handleCopyFileLineCount function');
  });

  test('messageHandler.ts should handle copyFileLineCount case', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes("case 'copyFileLineCount':"),
      'messageHandler.ts should handle copyFileLineCount case');
  });

  test('messageHandler.ts should have handleCopyFileLineCount function', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFileLineCount'),
      'messageHandler.ts should have handleCopyFileLineCount function');
  });

  test('messageHandler.ts should use getFileContentAtCommit', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyFileLineCount');
    assert.ok(fnStart >= 0, 'handleCopyFileLineCount should exist');
    const fnEnd = source.indexOf('function handleCopyFileDirectory', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('getFileContentAtCommit'),
      'handleCopyFileLineCount should use getFileContentAtCommit');
  });

  test('messageHandler.ts should split content for line count', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyFileLineCount');
    const fnEnd = source.indexOf('function handleCopyFileDirectory', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes(".split('\\n')"),
      'handleCopyFileLineCount should split content on newlines');
  });

  test('extension.ts should register copyFileLineCount command', () => {
    const fs = require('fs');
    const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes("'gitHistory.copyFileLineCount'"),
      'extension.ts should register copyFileLineCount command');
    assert.ok(source.includes("'copyFileLineCount'"),
      'extension.ts should map to copyFileLineCount webview action');
  });

  test('package.json should have copyFileLineCount command', () => {
    const fs = require('fs');
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyFileLineCount"'),
      'package.json should register copyFileLineCount command');
    assert.ok(content.includes('"Git History: Copy File Line Count"'),
      'package.json should have command title');
  });

  test('package.json should have keyboard shortcut for copyFileLineCount', () => {
    const fs = require('fs');
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    const keybindingsSection = content.substring(
      content.indexOf('"keybindings"'),
      content.indexOf('"configuration"')
    );

    assert.ok(keybindingsSection.includes('"gitHistory.copyFileLineCount"'),
      'package.json should have keybinding for copyFileLineCount');
    assert.ok(keybindingsSection.includes('"ctrl+shift+alt+l"'),
      'package.json should bind copyFileLineCount to Ctrl+Shift+Alt+L');
    assert.ok(keybindingsSection.includes('"cmd+shift+alt+l"'),
      'package.json should bind copyFileLineCount to Cmd+Shift+Alt+L on Mac');
  });

  test('main.js context menu should include copy-file-line-count', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-file-line-count"'),
      'main.js context menu should include copy-file-line-count action');
    assert.ok(source.includes('Copy file line count'),
      'main.js context menu should have label "Copy file line count"');
  });

  test('main.js context menu click handler should handle copy-file-line-count', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("action === 'copy-file-line-count'"),
      'main.js should handle copy-file-line-count action in click handler');
  });
});
