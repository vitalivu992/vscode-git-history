import * as assert from 'assert';
import * as path from 'path';

interface TestCommit {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  message: string;
  date: string;
}

// Simulates the revert command generation logic
function generateRevertCommand(commit: TestCommit): string {
  return `git revert ${commit.hash}`;
}

// Simulates resolving the target commit for revert (from main.js logic)
function resolveTargetCommit(
  commits: TestCommit[],
  focusedIndex: number,
  selectedHashes: Set<string>
): TestCommit | null {
  if (focusedIndex >= 0 && focusedIndex < commits.length) {
    return commits[focusedIndex];
  }
  if (selectedHashes.size === 1) {
    const hash = Array.from(selectedHashes)[0];
    return commits.find(c => c.hash === hash) || null;
  }
  return null;
}

suite('Copy Revert Command Tests', () => {
  const commits: TestCommit[] = [
    {
      hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      shortHash: 'aaaaaaa',
      author: 'Alice Cooper',
      email: 'alice@example.com',
      message: 'Initial commit',
      date: '2024-01-15T10:30:00Z'
    },
    {
      hash: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      shortHash: 'bbbbbbb',
      author: 'Bob Marley',
      email: 'bob@company.org',
      message: 'Add feature X',
      date: '2024-01-16T14:45:00Z'
    },
    {
      hash: 'cccccccccccccccccccccccccccccccccccccccc',
      shortHash: 'ccccccc',
      author: 'Charlie Day',
      email: 'charlie@example.com',
      message: 'Fix bug in parser',
      date: '2024-01-17T09:15:00Z'
    }
  ];

  test('generateRevertCommand should format command correctly', () => {
    const commit = commits[0];
    const command = generateRevertCommand(commit);
    assert.strictEqual(command, 'git revert aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  test('generateRevertCommand should use full hash', () => {
    const commit = commits[1];
    const command = generateRevertCommand(commit);
    // The command should be: git revert <full-hash>
    assert.strictEqual(command, `git revert ${commit.hash}`);
  });

  test('resolveTargetCommit should return focused commit when focusedIndex is valid', () => {
    const focusedIndex = 1;
    const selectedHashes = new Set<string>();
    const target = resolveTargetCommit(commits, focusedIndex, selectedHashes);
    assert.ok(target);
    assert.strictEqual(target?.hash, commits[1].hash);
    assert.strictEqual(target?.author, 'Bob Marley');
  });

  test('resolveTargetCommit should return selected commit when only one is selected', () => {
    const focusedIndex = -1;
    const selectedHashes = new Set<string>(['bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb']);
    const target = resolveTargetCommit(commits, focusedIndex, selectedHashes);
    assert.ok(target);
    assert.strictEqual(target?.hash, 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
  });

  test('resolveTargetCommit should return null when focusedIndex is out of bounds', () => {
    const focusedIndex = 10;
    const selectedHashes = new Set<string>();
    const target = resolveTargetCommit(commits, focusedIndex, selectedHashes);
    assert.strictEqual(target, null);
  });

  test('resolveTargetCommit should return null when multiple commits selected and no focus', () => {
    const focusedIndex = -1;
    const selectedHashes = new Set<string>([
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
    ]);
    const target = resolveTargetCommit(commits, focusedIndex, selectedHashes);
    assert.strictEqual(target, null);
  });

  test('resolveTargetCommit should prioritize focused commit over selection', () => {
    const focusedIndex = 0;
    const selectedHashes = new Set<string>(['bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb']);
    const target = resolveTargetCommit(commits, focusedIndex, selectedHashes);
    assert.ok(target);
    assert.strictEqual(target?.hash, commits[0].hash); // Should return focused, not selected
  });

  test('revert command format is correct', () => {
    const commit = commits[2];
    const command = generateRevertCommand(commit);
    // Verify format: git revert <hash>
    const expectedPattern = /^git revert [a-f0-9]{40}$/;
    assert.ok(expectedPattern.test(command), `Command "${command}" should match expected pattern`);
  });

  test('revert command for first commit', () => {
    const command = generateRevertCommand(commits[0]);
    assert.strictEqual(command, 'git revert aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  test('revert command for last commit', () => {
    const command = generateRevertCommand(commits[commits.length - 1]);
    assert.strictEqual(command, 'git revert cccccccccccccccccccccccccccccccccccccccc');
  });
});

suite('Revert Command Source Verification', () => {
  test('types.ts should have copyRevertCommand message type', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("'copyRevertCommand'"),
      'types.ts should have copyRevertCommand message type');
  });

  test('main.js should have handleCopyRevert function', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleCopyRevert'),
      'main.js should have handleCopyRevert function');
  });

  test('main.js should send copyRevertCommand message', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("type: 'copyRevertCommand'"),
      'main.js should send copyRevertCommand message');
  });

  test('main.js should handle Ctrl+Shift+U keyboard shortcut', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("e.key === 'u'") && source.includes('e.shiftKey'),
      'main.js should handle Ctrl+Shift+U keyboard shortcut');
  });

  test('messageHandler.ts should handle copyRevertCommand case', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes("case 'copyRevertCommand':"),
      'messageHandler.ts should handle copyRevertCommand case');
  });

  test('messageHandler.ts should have handleCopyRevertCommand function', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyRevertCommand'),
      'messageHandler.ts should have handleCopyRevertCommand function');
  });

  test('main.js should have context menu item for revert command', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("data-action=\"copy-revert\""),
      'main.js should have copy-revert context menu item');
  });

  test('CLAUDE.md should document copyRevertCommand feature', () => {
    const fs = require('fs');
    const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
    const source = fs.readFileSync(claudePath, 'utf-8');

    assert.ok(source.includes('Copy Revert Command'),
      'CLAUDE.md should document Copy Revert Command feature');
  });

  test('README.md should document revert keyboard shortcut', () => {
    const fs = require('fs');
    const readmePath = path.resolve(__dirname, '../../../README.md');
    const source = fs.readFileSync(readmePath, 'utf-8');

    assert.ok(source.includes('Copy Revert Command') || source.includes('revert'),
      'README.md should document revert feature');
  });
});
