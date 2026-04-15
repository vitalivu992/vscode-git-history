import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

interface TestCommit {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  message: string;
  fullMessage: string;
  tags?: string[];
}

function filterCommits(commits: TestCommit[], query: string): TestCommit[] {
  if (!query) return commits;
  const q = query.toLowerCase();
  return commits.filter(commit =>
    commit.hash.toLowerCase().includes(q) ||
    commit.shortHash.toLowerCase().includes(q) ||
    commit.author.toLowerCase().includes(q) ||
    commit.email.toLowerCase().includes(q) ||
    commit.message.toLowerCase().includes(q) ||
    (commit.tags && commit.tags.some(t => t.toLowerCase().includes(q)))
  );
}

function getOrderedCommits(filteredCommits: TestCommit[], sortOldestFirst: boolean): TestCommit[] {
  if (sortOldestFirst) {
    return filteredCommits.slice().reverse();
  }
  return filteredCommits;
}

function getCopyDiffTargetHash(
  commits: TestCommit[],
  focusedIndex: number,
  selectedCommits: Set<string>,
  searchQuery: string,
  sortOldestFirst: boolean
): string | null {
  const displayCommits = getOrderedCommits(filterCommits(commits, searchQuery), sortOldestFirst);
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    return displayCommits[focusedIndex].hash;
  } else if (selectedCommits.size === 1) {
    return [...selectedCommits][0];
  }
  return null;
}

suite('Copy Commit Diff Logic Tests', () => {
  const commits: TestCommit[] = [
    {
      hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      shortHash: 'aaaaaaa',
      author: 'Alice Cooper',
      email: 'alice@example.com',
      message: 'Initial commit',
      fullMessage: 'Initial commit',
      tags: ['v1.0.0']
    },
    {
      hash: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      shortHash: 'bbbbbbb',
      author: 'Bob Marley',
      email: 'bob@company.org',
      message: 'Add feature X',
      fullMessage: 'Add feature X\n\nDetailed description of feature X',
      tags: ['v2.0.0']
    },
    {
      hash: 'cccccccccccccccccccccccccccccccccccccccc',
      shortHash: 'ccccccc',
      author: 'Charlie Day',
      email: 'charlie@example.com',
      message: 'Fix bug in parser',
      fullMessage: 'Fix bug in parser',
      tags: undefined
    },
    {
      hash: 'dddddddddddddddddddddddddddddddddddddddd',
      shortHash: 'ddddddd',
      author: 'Diana Prince',
      email: 'diana@company.org',
      message: 'Update documentation',
      fullMessage: 'Update documentation',
      tags: []
    }
  ];

  test('copy diff with focusedIndex 0 returns first commit hash', () => {
    const result = getCopyDiffTargetHash(commits, 0, new Set(), '', false);
    assert.strictEqual(result, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  test('copy diff with focusedIndex on last commit', () => {
    const result = getCopyDiffTargetHash(commits, 3, new Set(), '', false);
    assert.strictEqual(result, 'dddddddddddddddddddddddddddddddddddddddd');
  });

  test('copy diff falls back to selected commit when focusedIndex is -1', () => {
    const selected = new Set(['bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb']);
    const result = getCopyDiffTargetHash(commits, -1, selected, '', false);
    assert.strictEqual(result, 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
  });

  test('copy diff returns null when no focus and no selection', () => {
    const result = getCopyDiffTargetHash(commits, -1, new Set(), '', false);
    assert.strictEqual(result, null);
  });

  test('copy diff with search filter uses displayed commit list', () => {
    const result = getCopyDiffTargetHash(commits, 0, new Set(), 'Bob', false);
    assert.strictEqual(result, 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
  });

  test('copy diff with search filter focusedIndex 1 returns second filtered result', () => {
    const result = getCopyDiffTargetHash(commits, 1, new Set(), 'example.com', false);
    assert.strictEqual(result, 'cccccccccccccccccccccccccccccccccccccccc');
  });

  test('copy diff with sort oldest first uses reversed list', () => {
    const result = getCopyDiffTargetHash(commits, 0, new Set(), '', true);
    assert.strictEqual(result, 'dddddddddddddddddddddddddddddddddddddddd');
  });

  test('copy diff with sort oldest first and search filter', () => {
    const result = getCopyDiffTargetHash(commits, 0, new Set(), 'example.com', true);
    const filtered = filterCommits(commits, 'example.com');
    const reversed = filtered.slice().reverse();
    assert.strictEqual(result, reversed[0].hash);
  });

  test('copy diff with focusedIndex out of filtered bounds falls back to selection', () => {
    const selected = new Set(['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa']);
    const result = getCopyDiffTargetHash(commits, 5, selected, 'Bob', false);
    assert.strictEqual(result, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  test('copy diff with focusedIndex beyond filtered results returns null without selection', () => {
    const result = getCopyDiffTargetHash(commits, 10, new Set(), '', false);
    assert.strictEqual(result, null);
  });

  test('copy diff with empty commits list returns null', () => {
    const result = getCopyDiffTargetHash([], 0, new Set(), '', false);
    assert.strictEqual(result, null);
  });

  test('copy diff with search that returns no results returns null', () => {
    const result = getCopyDiffTargetHash(commits, 0, new Set(), 'zzzzz', false);
    assert.strictEqual(result, null);
  });

  test('copy diff with multi-select returns single selected when focusedIndex is -1', () => {
    const selected = new Set([
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
    ]);
    const result = getCopyDiffTargetHash(commits, -1, selected, '', false);
    assert.strictEqual(result, null);
  });

  test('copy diff with search filter does NOT use raw commits index', () => {
    const rawIndex = 0;
    const displayedResult = getCopyDiffTargetHash(commits, 0, new Set(), 'Bob', false);
    const rawResult = commits[rawIndex].hash;
    assert.notStrictEqual(displayedResult, rawResult,
      'Copy diff should use displayed list, not raw commits array');
  });

  test('copy diff with sort does NOT use unsorted index', () => {
    const index = 3;
    const displayedResult = getCopyDiffTargetHash(commits, index, new Set(), '', true);
    const rawResult = commits[index].hash;
    assert.notStrictEqual(displayedResult, rawResult,
      'Copy diff should use sorted display list, not raw commits array');
  });
});

suite('Copy Commit Diff Source Verification', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');

  test('handleCopyDiff should use getOrderedCommits(getFilteredCommits())', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyDiff');
    assert.ok(fnStart >= 0, 'handleCopyDiff function should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(
      fnBody.includes('getOrderedCommits(getFilteredCommits())'),
      'handleCopyDiff should use getOrderedCommits(getFilteredCommits()) to resolve displayed commits'
    );
  });

  test('handleCopyDiff should NOT reference raw commits array by index', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyDiff');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(
      !fnBody.includes('commits[focusedIndex]') && !fnBody.includes('commits.length'),
      'handleCopyDiff should not index into raw commits array'
    );
  });

  test('handleCopyDiff should post copyCommitDiff message type', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyDiff');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(
      fnBody.includes("type: 'copyCommitDiff'"),
      'handleCopyDiff should post copyCommitDiff message type'
    );
  });

  test('messageHandler should define handleCopyCommitDiff', () => {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyCommitDiff'),
      'messageHandler.ts should define handleCopyCommitDiff');
    assert.ok(source.includes("case 'copyCommitDiff'"),
      'messageHandler should handle copyCommitDiff case');
  });

  test('types.ts should define copyCommitDiff message type', () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("type: 'copyCommitDiff'"),
      'WebviewToExtMessage should include copyCommitDiff type');
  });

  test('main.js should include keyboard shortcut for copy diff', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(
      source.includes("e.key === 'd'") && source.includes('Ctrl+Shift+D'),
      'main.js should include Ctrl+Shift+D keyboard shortcut for copy diff'
    );
  });

  test('main.js context menu should include copy-diff action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(
      source.includes('data-action="copy-diff"'),
      'main.js context menu should include copy-diff action'
    );
    assert.ok(
      source.includes('Copy commit diff'),
      'main.js context menu should include Copy commit diff label'
    );
  });
});
