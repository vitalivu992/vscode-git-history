import * as assert from 'assert';
import * as path from 'path';

interface TestCommitFile {
  path: string;
  status: 'A' | 'M' | 'D' | 'R' | 'C';
  previousPath?: string;
}

// Simulates the copy files list logic
function generateFilesList(files: TestCommitFile[]): string {
  return files.map(file => {
    if (file.previousPath && file.status === 'R') {
      return `${file.previousPath} -> ${file.path}`;
    }
    return file.path;
  }).join('\n');
}

// Simulates resolving the target commit for copy files (from main.js logic)
function resolveTargetCommitForFiles(
  focusedIndex: number,
  selectedHashes: Set<string>
): string | null {
  if (focusedIndex >= 0) {
    return 'focused';
  }
  if (selectedHashes.size === 1) {
    return Array.from(selectedHashes)[0];
  }
  return null;
}

suite('Copy Changed Files Tests', () => {
  const files: TestCommitFile[] = [
    { path: 'src/index.ts', status: 'M' },
    { path: 'src/utils.ts', status: 'A' },
    { path: 'src/old.ts', status: 'D' },
    { path: 'src/renamed.ts', status: 'R', previousPath: 'src/old-name.ts' },
    { path: 'package.json', status: 'M' },
  ];

  test('generateFilesList should format file list correctly', () => {
    const list = generateFilesList(files);
    const lines = list.split('\n');
    assert.strictEqual(lines.length, 5);
  });

  test('generateFilesList should handle added files', () => {
    const list = generateFilesList(files);
    assert.ok(list.includes('src/utils.ts'));
  });

  test('generateFilesList should handle deleted files', () => {
    const list = generateFilesList(files);
    assert.ok(list.includes('src/old.ts'));
  });

  test('generateFilesList should handle renamed files with arrow notation', () => {
    const list = generateFilesList(files);
    assert.ok(list.includes('src/old-name.ts -> src/renamed.ts'));
  });

  test('generateFilesList should join files with newline', () => {
    const list = generateFilesList(files);
    assert.ok(list.includes('\n'));
  });

  test('generateFilesList should return empty string for empty files array', () => {
    const list = generateFilesList([]);
    assert.strictEqual(list, '');
  });

  test('generateFilesList should handle single file', () => {
    const list = generateFilesList([{ path: 'test.ts', status: 'M' }]);
    assert.strictEqual(list, 'test.ts');
  });

  test('resolveTargetCommitForFiles should return focused when focusedIndex >= 0', () => {
    const result = resolveTargetCommitForFiles(0, new Set());
    assert.strictEqual(result, 'focused');
  });

  test('resolveTargetCommitForFiles should return selected hash when no focus and single selection', () => {
    const result = resolveTargetCommitForFiles(-1, new Set(['abc123']));
    assert.strictEqual(result, 'abc123');
  });

  test('resolveTargetCommitForFiles should return null when no focus and no selection', () => {
    const result = resolveTargetCommitForFiles(-1, new Set());
    assert.strictEqual(result, null);
  });

  test('resolveTargetCommitForFiles should return null when multiple selected and no focus', () => {
    const result = resolveTargetCommitForFiles(-1, new Set(['abc', 'def']));
    assert.strictEqual(result, null);
  });

  test('files list format is useful for changelogs', () => {
    const list = generateFilesList(files);
    const lines = list.split('\n');
    assert.ok(lines.every(line => line.includes('/') || line.includes(' -> ')));
  });
});

suite('Copy Changed Files Source Verification', () => {
  test('types.ts should have copyCommitFiles message type', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("'copyCommitFiles'"),
      'types.ts should have copyCommitFiles message type');
  });

  test('main.js should have handleCopyFiles function', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFiles'),
      'main.js should have handleCopyFiles function');
  });

  test('main.js should send copyCommitFiles message', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("type: 'copyCommitFiles'"),
      'main.js should send copyCommitFiles message');
  });

  test('main.js should handle Ctrl+Shift+F keyboard shortcut', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("e.key === 'f'") && source.includes('e.shiftKey'),
      'main.js should handle Ctrl+Shift+F keyboard shortcut');
  });

  test('messageHandler.ts should handle copyCommitFiles case', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes("case 'copyCommitFiles':"),
      'messageHandler.ts should handle copyCommitFiles case');
  });

  test('messageHandler.ts should have handleCopyCommitFiles function', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyCommitFiles'),
      'messageHandler.ts should have handleCopyCommitFiles function');
  });

  test('main.js context menu should include copy-files action', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-files"'),
      'main.js context menu should include copy-files action');
  });

  test('main.js should handle copy-files context menu action', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("action === 'copy-files'"),
      'main.js should handle copy-files context menu action');
  });
});