import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

interface TestCommit {
  hash: string;
  shortHash: string;
  parentHashes?: string[];
  author: string;
  email: string;
  date: string;
  message: string;
  fullMessage: string;
  tags?: string[];
}

function filterCommits(commits: TestCommit[], query: string, hideMergeCommits: boolean): TestCommit[] {
  let filtered = commits;
  if (hideMergeCommits) {
    filtered = filtered.filter(commit => !(commit.parentHashes && commit.parentHashes.length > 1));
  }
  if (!query) return filtered;
  const q = query.toLowerCase();
  return filtered.filter(commit =>
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

function getCopyInfoTarget(
  commits: TestCommit[],
  focusedIndex: number,
  selectedCommits: Set<string>,
  searchQuery: string,
  sortOldestFirst: boolean,
  hideMergeCommits: boolean
): string | null {
  const displayCommits = getOrderedCommits(
    filterCommits(commits, searchQuery, hideMergeCommits),
    sortOldestFirst
  );
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    return displayCommits[focusedIndex].hash;
  } else if (selectedCommits.size === 1) {
    return [...selectedCommits][0];
  }
  return null;
}

suite('Copy Commit Info Logic Tests', () => {
  const commits: TestCommit[] = [
    {
      hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      shortHash: 'aaaaaaa',
      author: 'Alice Cooper',
      email: 'alice@example.com',
      date: '2024-01-15T10:30:00Z',
      message: 'Initial commit',
      fullMessage: 'Initial commit',
      tags: ['v1.0.0']
    },
    {
      hash: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      shortHash: 'bbbbbbb',
      parentHashes: ['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'],
      author: 'Bob Marley',
      email: 'bob@company.org',
      date: '2024-02-20T14:00:00Z',
      message: 'Merge branch feature',
      fullMessage: 'Merge branch feature',
      tags: undefined
    },
    {
      hash: 'cccccccccccccccccccccccccccccccccccccccc',
      shortHash: 'ccccccc',
      author: 'Charlie Day',
      email: 'charlie@example.com',
      date: '2024-03-10T09:15:00Z',
      message: 'Fix bug in parser',
      fullMessage: 'Fix bug in parser\n\nDetailed fix description',
      tags: undefined
    },
    {
      hash: 'dddddddddddddddddddddddddddddddddddddddd',
      shortHash: 'ddddddd',
      author: 'Diana Prince',
      email: 'diana@company.org',
      date: '2024-04-05T16:45:00Z',
      message: 'Update documentation',
      fullMessage: 'Update documentation',
      tags: []
    }
  ];

  test('copy info with focusedIndex 0 returns first commit hash', () => {
    const result = getCopyInfoTarget(commits, 0, new Set(), '', false, false);
    assert.strictEqual(result, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  test('copy info with focusedIndex on last commit', () => {
    const result = getCopyInfoTarget(commits, 3, new Set(), '', false, false);
    assert.strictEqual(result, 'dddddddddddddddddddddddddddddddddddddddd');
  });

  test('copy info falls back to selected commit when focusedIndex is -1', () => {
    const selected = new Set(['cccccccccccccccccccccccccccccccccccccccc']);
    const result = getCopyInfoTarget(commits, -1, selected, '', false, false);
    assert.strictEqual(result, 'cccccccccccccccccccccccccccccccccccccccc');
  });

  test('copy info returns null when no focus and no selection', () => {
    const result = getCopyInfoTarget(commits, -1, new Set(), '', false, false);
    assert.strictEqual(result, null);
  });

  test('copy info with search filter uses displayed commit list', () => {
    const result = getCopyInfoTarget(commits, 0, new Set(), 'Diana', false, false);
    assert.strictEqual(result, 'dddddddddddddddddddddddddddddddddddddddd');
  });

  test('copy info with search filter focusedIndex 1 returns second filtered result', () => {
    const result = getCopyInfoTarget(commits, 1, new Set(), 'example.com', false, false);
    assert.strictEqual(result, 'cccccccccccccccccccccccccccccccccccccccc');
  });

  test('copy info with sort oldest first uses reversed list', () => {
    const result = getCopyInfoTarget(commits, 0, new Set(), '', true, false);
    assert.strictEqual(result, 'dddddddddddddddddddddddddddddddddddddddd');
  });

  test('copy info with sort oldest first and search filter', () => {
    const result = getCopyInfoTarget(commits, 0, new Set(), 'company.org', true, false);
    const filtered = filterCommits(commits, 'company.org', false);
    const reversed = filtered.slice().reverse();
    assert.strictEqual(result, reversed[0].hash);
  });

  test('copy info with focusedIndex out of filtered bounds falls back to selection', () => {
    const selected = new Set(['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa']);
    const result = getCopyInfoTarget(commits, 5, selected, 'Bob', false, false);
    assert.strictEqual(result, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  test('copy info with focusedIndex beyond results returns null without selection', () => {
    const result = getCopyInfoTarget(commits, 10, new Set(), '', false, false);
    assert.strictEqual(result, null);
  });

  test('copy info with empty commits list returns null', () => {
    const result = getCopyInfoTarget([], 0, new Set(), '', false, false);
    assert.strictEqual(result, null);
  });

  test('copy info with search that returns no results returns null', () => {
    const result = getCopyInfoTarget(commits, 0, new Set(), 'zzzzz', false, false);
    assert.strictEqual(result, null);
  });

  test('copy info with multi-select returns null when focusedIndex is -1', () => {
    const selected = new Set([
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'cccccccccccccccccccccccccccccccccccccccc'
    ]);
    const result = getCopyInfoTarget(commits, -1, selected, '', false, false);
    assert.strictEqual(result, null);
  });

  test('copy info with multi-select returns focused commit when focusedIndex is valid', () => {
    const selected = new Set([
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'cccccccccccccccccccccccccccccccccccccccc'
    ]);
    const result = getCopyInfoTarget(commits, 2, selected, '', false, false);
    assert.strictEqual(result, 'cccccccccccccccccccccccccccccccccccccccc');
  });

  test('copy info with hideMergeCommits skips merge commit', () => {
    const result = getCopyInfoTarget(commits, 1, new Set(), '', false, true);
    assert.strictEqual(result, 'cccccccccccccccccccccccccccccccccccccccc');
  });

  test('copy info with hideMergeCommits and focusedIndex 0 returns first non-merge', () => {
    const result = getCopyInfoTarget(commits, 0, new Set(), '', false, true);
    assert.strictEqual(result, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  test('copy info with combined search and hideMergeCommits', () => {
    const result = getCopyInfoTarget(commits, 0, new Set(), 'company.org', false, true);
    assert.strictEqual(result, 'dddddddddddddddddddddddddddddddddddddddd');
  });

  test('copy info with search filter does NOT use raw commits index', () => {
    const displayedResult = getCopyInfoTarget(commits, 0, new Set(), 'Diana', false, false);
    const rawResult = commits[0].hash;
    assert.notStrictEqual(displayedResult, rawResult,
      'Copy info should use displayed list, not raw commits array');
  });

  test('copy info with sort does NOT use unsorted index', () => {
    const displayedResult = getCopyInfoTarget(commits, 3, new Set(), '', true, false);
    const rawResult = commits[3].hash;
    assert.notStrictEqual(displayedResult, rawResult,
      'Copy info should use sorted display list, not raw commits array');
  });
});

suite('Copy Commit Info Source Verification', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const htmlProviderPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
  const htmlPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');

  test('handleCopyInfo should use getOrderedCommits(getFilteredCommits())', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyInfo');
    assert.ok(fnStart >= 0, 'handleCopyInfo function should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(
      fnBody.includes('getOrderedCommits(getFilteredCommits())'),
      'handleCopyInfo should use getOrderedCommits(getFilteredCommits()) to resolve displayed commits'
    );
  });

  test('handleCopyInfo should send copyCommitInfo message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyInfo');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(
      fnBody.includes("type: 'copyCommitInfo'"),
      'handleCopyInfo should send copyCommitInfo message type'
    );
  });

  test('handleCopyInfo should NOT reference raw commits array by index', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyInfo');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(
      !fnBody.includes('commits[focusedIndex]') && !fnBody.includes('commits.length'),
      'handleCopyInfo should not index into raw commits array'
    );
  });

  test('Ctrl+Shift+I keyboard shortcut should be handled in handleKeyDown', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const kdStart = source.indexOf('function handleKeyDown');
    const kdEnd = source.indexOf('\nfunction', kdStart + 1);
    const kdBody = source.substring(kdStart, kdEnd > kdStart ? kdEnd : undefined);

    assert.ok(
      kdBody.includes("e.key === 'i'") && kdBody.includes('handleCopyInfo'),
      'handleKeyDown should handle Ctrl+Shift+I and call handleCopyInfo'
    );
  });

  test('messageHandler should define handleCopyCommitInfo', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyCommitInfo'),
      'messageHandler.ts should define handleCopyCommitInfo');
    assert.ok(source.includes("case 'copyCommitInfo'"),
      'messageHandler should handle copyCommitInfo case');
  });

  test('handleCopyCommitInfo should copy formatted commit info to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitInfo');
    assert.ok(fnStart >= 0, 'handleCopyCommitInfo function should exist');
    const fnEnd = source.indexOf('\nasync function', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(
      fnBody.includes('commit.hash') && fnBody.includes('clipboard.writeText'),
      'handleCopyCommitInfo should copy commit info to clipboard'
    );
    assert.ok(
      fnBody.includes('commit.author') && fnBody.includes('commit.email'),
      'handleCopyCommitInfo should include author and email in the copied text'
    );
    assert.ok(
      fnBody.includes('commit.date') || fnBody.includes('toLocaleString'),
      'handleCopyCommitInfo should include date in the copied text'
    );
    assert.ok(
      fnBody.includes('fullMessage') || fnBody.includes('message'),
      'handleCopyCommitInfo should include message in the copied text'
    );
    assert.ok(
      fnBody.includes('Commit not found'),
      'handleCopyCommitInfo should handle missing commit'
    );
  });

  test('types.ts should define copyCommitInfo message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("type: 'copyCommitInfo'"),
      'WebviewToExtMessage should include copyCommitInfo type');
  });

  test('index.html copy button tooltip should mention Ctrl+Shift+I', () => {
    const source = fs.readFileSync(htmlPath, 'utf-8');

    assert.ok(
      source.includes('Ctrl+Shift+I'),
      'index.html copy button tooltip should mention Ctrl+Shift+I for info copy'
    );
  });

  test('webviewProvider copy button tooltip should mention Ctrl+Shift+I', () => {
    const source = fs.readFileSync(htmlProviderPath, 'utf-8');

    assert.ok(
      source.includes('Ctrl+Shift+I'),
      'webviewProvider copy button tooltip should mention Ctrl+Shift+I for info copy'
    );
  });
});