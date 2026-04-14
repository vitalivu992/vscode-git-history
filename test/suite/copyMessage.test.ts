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

function getCopyTargetHash(
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

suite('Copy Commit Message Logic Tests', () => {
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

  test('copy with focusedIndex 0 returns first commit hash', () => {
    const result = getCopyTargetHash(commits, 0, new Set(), '', false);
    assert.strictEqual(result, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  test('copy with focusedIndex on last commit', () => {
    const result = getCopyTargetHash(commits, 3, new Set(), '', false);
    assert.strictEqual(result, 'dddddddddddddddddddddddddddddddddddddddd');
  });

  test('copy falls back to selected commit when focusedIndex is -1', () => {
    const selected = new Set(['bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb']);
    const result = getCopyTargetHash(commits, -1, selected, '', false);
    assert.strictEqual(result, 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
  });

  test('copy returns null when no focus and no selection', () => {
    const result = getCopyTargetHash(commits, -1, new Set(), '', false);
    assert.strictEqual(result, null);
  });

  test('copy with search filter uses displayed commit list', () => {
    const result = getCopyTargetHash(commits, 0, new Set(), 'Bob', false);
    assert.strictEqual(result, 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
  });

  test('copy with search filter focusedIndex 1 returns second filtered result', () => {
    const result = getCopyTargetHash(commits, 1, new Set(), 'example.com', false);
    assert.strictEqual(result, 'cccccccccccccccccccccccccccccccccccccccc');
  });

  test('copy with sort oldest first uses reversed list', () => {
    const result = getCopyTargetHash(commits, 0, new Set(), '', true);
    assert.strictEqual(result, 'dddddddddddddddddddddddddddddddddddddddd');
  });

  test('copy with sort oldest first and search filter', () => {
    const result = getCopyTargetHash(commits, 0, new Set(), 'example.com', true);
    const filtered = filterCommits(commits, 'example.com');
    const reversed = filtered.slice().reverse();
    assert.strictEqual(result, reversed[0].hash);
  });

  test('copy with focusedIndex out of filtered bounds falls back to selection', () => {
    const selected = new Set(['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa']);
    const result = getCopyTargetHash(commits, 5, selected, 'Bob', false);
    assert.strictEqual(result, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  test('copy with focusedIndex beyond filtered results returns null without selection', () => {
    const result = getCopyTargetHash(commits, 10, new Set(), '', false);
    assert.strictEqual(result, null);
  });

  test('copy with empty commits list returns null', () => {
    const result = getCopyTargetHash([], 0, new Set(), '', false);
    assert.strictEqual(result, null);
  });

  test('copy with search that returns no results returns null', () => {
    const result = getCopyTargetHash(commits, 0, new Set(), 'zzzzz', false);
    assert.strictEqual(result, null);
  });

  test('copy with multi-select returns single selected when focusedIndex is -1', () => {
    const selected = new Set([
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
    ]);
    const result = getCopyTargetHash(commits, -1, selected, '', false);
    assert.strictEqual(result, null);
  });

  test('copy with search filter does NOT use raw commits index', () => {
    const rawIndex = 0;
    const displayedResult = getCopyTargetHash(commits, 0, new Set(), 'Bob', false);
    const rawResult = commits[rawIndex].hash;
    assert.notStrictEqual(displayedResult, rawResult,
      'Copy should use displayed list, not raw commits array');
  });

  test('copy with sort does NOT use unsorted index', () => {
    const index = 3;
    const displayedResult = getCopyTargetHash(commits, index, new Set(), '', true);
    const rawResult = commits[index].hash;
    assert.notStrictEqual(displayedResult, rawResult,
      'Copy should use sorted display list, not raw commits array');
  });
});

suite('Copy Commit Message Source Verification', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');

  test('handleCopyMessage should use getOrderedCommits(getFilteredCommits())', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyMessage');
    assert.ok(fnStart >= 0, 'handleCopyMessage function should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(
      fnBody.includes('getOrderedCommits(getFilteredCommits())'),
      'handleCopyMessage should use getOrderedCommits(getFilteredCommits()) to resolve displayed commits'
    );
  });

  test('handleCopyMessage should NOT reference raw commits array by index', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyMessage');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(
      !fnBody.includes('commits[focusedIndex]') && !fnBody.includes('commits.length'),
      'handleCopyMessage should not index into raw commits array'
    );
  });

  test('messageHandler should define handleCopyCommitMessage', () => {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyCommitMessage'),
      'messageHandler.ts should define handleCopyCommitMessage');
    assert.ok(source.includes("case 'copyCommitMessage'"),
      'messageHandler should handle copyCommitMessage case');
  });

  test('types.ts should define copyCommitMessage message type', () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("type: 'copyCommitMessage'"),
      'WebviewToExtMessage should include copyCommitMessage type');
  });

  test('index.html should include copy button', () => {
    const htmlPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
    const source = fs.readFileSync(htmlPath, 'utf-8');

    assert.ok(source.includes('id="copy-btn"'),
      'index.html should include copy button');
  });

  test('index.html should include sort button', () => {
    const htmlPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
    const source = fs.readFileSync(htmlPath, 'utf-8');

    assert.ok(source.includes('id="sort-btn"'),
      'index.html should include sort button');
  });

  test('index.html should include commit-count element', () => {
    const htmlPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
    const source = fs.readFileSync(htmlPath, 'utf-8');

    assert.ok(source.includes('id="commit-count"'),
      'index.html should include commit-count element');
  });

  test('index.html search placeholder should mention email and tag', () => {
    const htmlPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
    const source = fs.readFileSync(htmlPath, 'utf-8');

    assert.ok(
      source.includes('email') && source.includes('tag'),
      'index.html search placeholder should mention email and tag'
    );
  });
});
