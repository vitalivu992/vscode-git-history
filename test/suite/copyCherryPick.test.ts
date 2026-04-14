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

// Simulates the cherry-pick command generation logic
function generateCherryPickCommand(commit: TestCommit): string {
  return `git cherry-pick ${commit.hash}`;
}

// Simulates resolving the target commit for cherry-pick (from main.js logic)
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

suite('Copy Cherry-Pick Command Tests', () => {
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

  test('generateCherryPickCommand should format command correctly', () => {
    const commit = commits[0];
    const command = generateCherryPickCommand(commit);
    assert.strictEqual(command, 'git cherry-pick aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  test('generateCherryPickCommand should use full hash', () => {
    const commit = commits[1];
    const command = generateCherryPickCommand(commit);
    assert.ok(command.includes(commit.hash));
    // The command should be: git cherry-pick <full-hash>
    assert.strictEqual(command, `git cherry-pick ${commit.hash}`);
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

  test('cherry-pick command format is correct', () => {
    const commit = commits[2];
    const command = generateCherryPickCommand(commit);
    // Verify format: git cherry-pick <hash>
    const expectedPattern = /^git cherry-pick [a-f0-9]{40}$/;
    assert.ok(expectedPattern.test(command), `Command "${command}" should match expected pattern`);
  });

  test('cherry-pick command for first commit', () => {
    const command = generateCherryPickCommand(commits[0]);
    assert.strictEqual(command, 'git cherry-pick aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  test('cherry-pick command for last commit', () => {
    const command = generateCherryPickCommand(commits[commits.length - 1]);
    assert.strictEqual(command, 'git cherry-pick cccccccccccccccccccccccccccccccccccccccc');
  });
});

suite('Cherry-Pick Source Verification', () => {
  test('types.ts should have copyCherryPickCommand message type', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("'copyCherryPickCommand'"),
      'types.ts should have copyCherryPickCommand message type');
  });

  test('main.js should have handleCopyCherryPick function', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleCopyCherryPick'),
      'main.js should have handleCopyCherryPick function');
  });

  test('main.js should send copyCherryPickCommand message', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("type: 'copyCherryPickCommand'"),
      'main.js should send copyCherryPickCommand message');
  });

  test('main.js should handle Ctrl+Shift+P keyboard shortcut', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("e.key === 'p'") && source.includes('e.shiftKey'),
      'main.js should handle Ctrl+Shift+P keyboard shortcut');
  });

  test('messageHandler.ts should handle copyCherryPickCommand case', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes("case 'copyCherryPickCommand':"),
      'messageHandler.ts should handle copyCherryPickCommand case');
  });

  test('messageHandler.ts should have handleCopyCherryPickCommand function', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyCherryPickCommand'),
      'messageHandler.ts should have handleCopyCherryPickCommand function');
  });

  test('main.js should have showCommitContextMenu function', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function showCommitContextMenu'),
      'main.js should have showCommitContextMenu function');
  });

  test('main.js should add contextmenu listener to commit rows', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("'contextmenu'") && source.includes('showCommitContextMenu'),
      'main.js should add contextmenu listener to commit rows');
  });

  test('styles.css should have context-menu-divider styling', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.context-menu-divider'),
      'styles.css should have context-menu-divider styling');
  });

  test('CLAUDE.md should document copyCherryPickCommand feature', () => {
    const fs = require('fs');
    const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
    const source = fs.readFileSync(claudePath, 'utf-8');

    assert.ok(source.includes('Copy Cherry-Pick Command'),
      'CLAUDE.md should document Copy Cherry-Pick Command feature');
  });

  test('README.md should document cherry-pick keyboard shortcut', () => {
    const fs = require('fs');
    const readmePath = path.resolve(__dirname, '../../../README.md');
    const source = fs.readFileSync(readmePath, 'utf-8');

    assert.ok(source.includes('Copy Cherry-Pick Command') || source.includes('cherry-pick'),
      'README.md should document cherry-pick feature');
  });
});
