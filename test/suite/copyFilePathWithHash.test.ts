import * as assert from 'assert';
import * as path from 'path';

// Simulates the format: shortHash:path format
function formatFilePathWithHash(shortHash: string, filePath: string): string {
  return `${shortHash}:${filePath}`;
}

// Simulates truncation for display message (60 chars)
function truncateDisplayText(text: string, maxLength: number = 60): string {
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
}

suite('Copy File Path with Hash Tests', () => {
  test('formatFilePathWithHash should combine hash and path with colon', () => {
    const shortHash = 'a1b2c3d';
    const filePath = 'src/main.ts';
    const result = formatFilePathWithHash(shortHash, filePath);
    assert.strictEqual(result, 'a1b2c3d:src/main.ts');
  });

  test('formatFilePathWithHash should handle nested paths', () => {
    const shortHash = 'abc1234';
    const filePath = 'src/components/Button.tsx';
    const result = formatFilePathWithHash(shortHash, filePath);
    assert.strictEqual(result, 'abc1234:src/components/Button.tsx');
  });

  test('formatFilePathWithHash should handle root level files', () => {
    const shortHash = 'def5678';
    const filePath = 'package.json';
    const result = formatFilePathWithHash(shortHash, filePath);
    assert.strictEqual(result, 'def5678:package.json');
  });

  test('formatFilePathWithHash should handle paths with special characters', () => {
    const shortHash = 'ghi9012';
    const filePath = 'src/utils/date-helper.test.ts';
    const result = formatFilePathWithHash(shortHash, filePath);
    assert.strictEqual(result, 'ghi9012:src/utils/date-helper.test.ts');
  });

  test('truncateDisplayText should not truncate short strings', () => {
    const shortText = 'a1b2c3d:src/main.ts';
    const result = truncateDisplayText(shortText);
    assert.strictEqual(result, shortText);
    assert.ok(result.length <= 60);
  });

  test('truncateDisplayText should truncate long strings at 60 chars', () => {
    const longText = 'a1b2c3d:src/very/long/path/that/extends/beyond/sixty/characters/for/testing/truncation.ts';
    const result = truncateDisplayText(longText);
    assert.strictEqual(result.length, 63); // 60 chars + '...'
    assert.ok(result.endsWith('...'));
  });

  test('truncateDisplayText should truncate exactly at 60 char boundary', () => {
    const exactly60 = '012345678901234567890123456789012345678901234567890123456789';
    assert.strictEqual(exactly60.length, 60);
    const result = truncateDisplayText(exactly60);
    assert.strictEqual(result, exactly60); // No truncation needed
  });

  test('truncateDisplayText should truncate when over 60 chars', () => {
    const over60 = '012345678901234567890123456789012345678901234567890123456789X';
    assert.strictEqual(over60.length, 61);
    const result = truncateDisplayText(over60);
    assert.strictEqual(result.length, 63); // 60 + '...'
    assert.ok(result.endsWith('...'));
  });
});

suite('Copy File Path with Hash Source Verification', () => {
  test('types.ts should have copyFilePathWithHash in WebviewAction', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("'copyFilePathWithHash'"),
      'types.ts should have copyFilePathWithHash in WebviewAction union');
  });

  test('types.ts should have copyFilePathWithHash message type', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("type: 'copyFilePathWithHash'"),
      'types.ts should have copyFilePathWithHash message type');
  });

  test('types.ts copyFilePathWithHash should have hash and filePath fields', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("copyFilePathWithHash'"),
      'types.ts should have copyFilePathWithHash message type');
    // Verify it has hash and filePath fields
    assert.ok(source.includes("hash: string; filePath: string"),
      'copyFilePathWithHash should have hash and filePath fields');
  });

  test('main.js should have copy-file-path-with-hash context menu action', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-file-path-with-hash"'),
      'main.js context menu should include copy-file-path-with-hash action');
  });

  test('main.js should handle copy-file-path-with-hash action', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("action === 'copy-file-path-with-hash'"),
      'main.js should handle copy-file-path-with-hash action');
  });

  test('main.js should send copyFilePathWithHash message', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("type: 'copyFilePathWithHash'"),
      'main.js should send copyFilePathWithHash message');
  });

  test('main.js should have handleCopyFilePathWithHash function', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFilePathWithHash'),
      'main.js should have handleCopyFilePathWithHash function');
  });

  test('main.js triggerAction switch should have copyFilePathWithHash case', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'copyFilePathWithHash':"),
      'main.js triggerAction switch should have copyFilePathWithHash case');
  });

  test('messageHandler.ts should handle copyFilePathWithHash case', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes("case 'copyFilePathWithHash':"),
      'messageHandler.ts should handle copyFilePathWithHash case');
  });

  test('messageHandler.ts should have handleCopyFilePathWithHash function', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFilePathWithHash'),
      'messageHandler.ts should have handleCopyFilePathWithHash function');
  });

  test('messageHandler.ts handleCopyFilePathWithHash should use vscode.env.clipboard', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('vscode.env.clipboard.writeText'),
      'handleCopyFilePathWithHash should use vscode.env.clipboard.writeText');
  });

  test('messageHandler.ts handleCopyFilePathWithHash should format as hash:path', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('${commit.shortHash}:${filePath}'),
      'handleCopyFilePathWithHash should format as hash:path');
  });

  test('extension.ts should register copyFilePathWithHash command', () => {
    const fs = require('fs');
    const extPath = path.resolve(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extPath, 'utf-8');

    assert.ok(source.includes("'copyFilePathWithHash'"),
      'extension.ts should register copyFilePathWithHash command');
  });

  test('package.json should have copyFilePathWithHash command', () => {
    const fs = require('fs');
    const pkgPath = path.resolve(__dirname, '../../../package.json');
    const source = fs.readFileSync(pkgPath, 'utf-8');

    assert.ok(source.includes('gitHistory.copyFilePathWithHash'),
      'package.json should have copyFilePathWithHash command');
  });

  test('package.json command should have proper title', () => {
    const fs = require('fs');
    const pkgPath = path.resolve(__dirname, '../../../package.json');
    const source = fs.readFileSync(pkgPath, 'utf-8');

    assert.ok(source.includes('Git History: Copy File Path with Hash'),
      'package.json command should have proper title');
  });
});
