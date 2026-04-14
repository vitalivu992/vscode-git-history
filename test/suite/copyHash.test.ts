import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

interface TestCommit {
  hash: string;
  shortHash: string;
  parentHashes?: string[];
  author: string;
  email: string;
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

function getCopyHashTarget(
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

suite('Copy Commit Hash Logic Tests', () => {
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
      parentHashes: ['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'],
      author: 'Bob Marley',
      email: 'bob@company.org',
      message: 'Merge branch feature',
      fullMessage: 'Merge branch feature',
      tags: undefined
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

  test('copy hash with focusedIndex 0 returns first commit hash', () => {
    const result = getCopyHashTarget(commits, 0, new Set(), '', false, false);
    assert.strictEqual(result, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  test('copy hash with focusedIndex on last commit', () => {
    const result = getCopyHashTarget(commits, 3, new Set(), '', false, false);
    assert.strictEqual(result, 'dddddddddddddddddddddddddddddddddddddddd');
  });

  test('copy hash falls back to selected commit when focusedIndex is -1', () => {
    const selected = new Set(['cccccccccccccccccccccccccccccccccccccccc']);
    const result = getCopyHashTarget(commits, -1, selected, '', false, false);
    assert.strictEqual(result, 'cccccccccccccccccccccccccccccccccccccccc');
  });

  test('copy hash returns null when no focus and no selection', () => {
    const result = getCopyHashTarget(commits, -1, new Set(), '', false, false);
    assert.strictEqual(result, null);
  });

  test('copy hash with search filter uses displayed commit list', () => {
    const result = getCopyHashTarget(commits, 0, new Set(), 'Diana', false, false);
    assert.strictEqual(result, 'dddddddddddddddddddddddddddddddddddddddd');
  });

  test('copy hash with search filter focusedIndex 1 returns second filtered result', () => {
    const result = getCopyHashTarget(commits, 1, new Set(), 'example.com', false, false);
    assert.strictEqual(result, 'cccccccccccccccccccccccccccccccccccccccc');
  });

  test('copy hash with sort oldest first uses reversed list', () => {
    const result = getCopyHashTarget(commits, 0, new Set(), '', true, false);
    assert.strictEqual(result, 'dddddddddddddddddddddddddddddddddddddddd');
  });

  test('copy hash with sort oldest first and search filter', () => {
    const result = getCopyHashTarget(commits, 0, new Set(), 'example.com', true, false);
    const filtered = filterCommits(commits, 'example.com', false);
    const reversed = filtered.slice().reverse();
    assert.strictEqual(result, reversed[0].hash);
  });

  test('copy hash with focusedIndex out of filtered bounds falls back to selection', () => {
    const selected = new Set(['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa']);
    const result = getCopyHashTarget(commits, 5, selected, 'Bob', false, false);
    assert.strictEqual(result, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  test('copy hash with focusedIndex beyond results returns null without selection', () => {
    const result = getCopyHashTarget(commits, 10, new Set(), '', false, false);
    assert.strictEqual(result, null);
  });

  test('copy hash with empty commits list returns null', () => {
    const result = getCopyHashTarget([], 0, new Set(), '', false, false);
    assert.strictEqual(result, null);
  });

  test('copy hash with search that returns no results returns null', () => {
    const result = getCopyHashTarget(commits, 0, new Set(), 'zzzzz', false, false);
    assert.strictEqual(result, null);
  });

  test('copy hash with multi-select returns null when focusedIndex is -1', () => {
    const selected = new Set([
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'cccccccccccccccccccccccccccccccccccccccc'
    ]);
    const result = getCopyHashTarget(commits, -1, selected, '', false, false);
    assert.strictEqual(result, null);
  });

  test('copy hash with multi-select returns focused commit when focusedIndex is valid', () => {
    const selected = new Set([
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'cccccccccccccccccccccccccccccccccccccccc'
    ]);
    const result = getCopyHashTarget(commits, 2, selected, '', false, false);
    assert.strictEqual(result, 'cccccccccccccccccccccccccccccccccccccccc');
  });

  test('copy hash with hideMergeCommits skips merge commit', () => {
    const result = getCopyHashTarget(commits, 1, new Set(), '', false, true);
    assert.strictEqual(result, 'cccccccccccccccccccccccccccccccccccccccc');
  });

  test('copy hash with hideMergeCommits and focusedIndex 0 returns first non-merge', () => {
    const result = getCopyHashTarget(commits, 0, new Set(), '', false, true);
    assert.strictEqual(result, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  test('copy hash with combined search and hideMergeCommits', () => {
    const result = getCopyHashTarget(commits, 0, new Set(), 'company.org', false, true);
    assert.strictEqual(result, 'dddddddddddddddddddddddddddddddddddddddd');
  });

  test('copy hash with search filter does NOT use raw commits index', () => {
    const rawIndex = 0;
    const displayedResult = getCopyHashTarget(commits, 0, new Set(), 'Diana', false, false);
    const rawResult = commits[rawIndex].hash;
    assert.notStrictEqual(displayedResult, rawResult,
      'Copy hash should use displayed list, not raw commits array');
  });

  test('copy hash with sort does NOT use unsorted index', () => {
    const index = 3;
    const displayedResult = getCopyHashTarget(commits, index, new Set(), '', true, false);
    const rawResult = commits[index].hash;
    assert.notStrictEqual(displayedResult, rawResult,
      'Copy hash should use sorted display list, not raw commits array');
  });
});

suite('Copy Commit Hash Source Verification', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const htmlProviderPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
  const htmlPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');

  test('handleCopyHash should use getOrderedCommits(getFilteredCommits())', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyHash');
    assert.ok(fnStart >= 0, 'handleCopyHash function should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(
      fnBody.includes('getOrderedCommits(getFilteredCommits())'),
      'handleCopyHash should use getOrderedCommits(getFilteredCommits()) to resolve displayed commits'
    );
  });

  test('handleCopyHash should send copyCommitHash message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyHash');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(
      fnBody.includes("type: 'copyCommitHash'"),
      'handleCopyHash should send copyCommitHash message type'
    );
  });

  test('handleCopyHash should NOT reference raw commits array by index', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyHash');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(
      !fnBody.includes('commits[focusedIndex]') && !fnBody.includes('commits.length'),
      'handleCopyHash should not index into raw commits array'
    );
  });

  test('Ctrl+Shift+H keyboard shortcut should be handled in handleKeyDown', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const kdStart = source.indexOf('function handleKeyDown');
    const kdEnd = source.indexOf('\nfunction', kdStart + 1);
    const kdBody = source.substring(kdStart, kdEnd > kdStart ? kdEnd : undefined);

    assert.ok(
      kdBody.includes("e.key === 'h'") && kdBody.includes('handleCopyHash'),
      'handleKeyDown should handle Ctrl+Shift+H and call handleCopyHash'
    );
  });

  test('messageHandler should define handleCopyCommitHash', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyCommitHash'),
      'messageHandler.ts should define handleCopyCommitHash');
    assert.ok(source.includes("case 'copyCommitHash'"),
      'messageHandler should handle copyCommitHash case');
  });

  test('handleCopyCommitHash should copy full hash to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitHash');
    assert.ok(fnStart >= 0, 'handleCopyCommitHash function should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(
      fnBody.includes('commit.hash') && fnBody.includes('clipboard.writeText'),
      'handleCopyCommitHash should copy commit.hash to clipboard'
    );
    assert.ok(
      fnBody.includes('Commit not found'),
      'handleCopyCommitHash should handle missing commit'
    );
  });

  test('types.ts should define copyCommitHash message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("type: 'copyCommitHash'"),
      'WebviewToExtMessage should include copyCommitHash type');
  });

  test('webviewProvider copy button tooltip should mention Ctrl+Shift+H', () => {
    const source = fs.readFileSync(htmlProviderPath, 'utf-8');

    assert.ok(
      source.includes('Ctrl+Shift+H') && source.includes('Copy hash'),
      'Copy button tooltip should mention Ctrl+Shift+H for hash copy'
    );
  });

  test('index.html should include merge-toggle-btn', () => {
    const source = fs.readFileSync(htmlPath, 'utf-8');

    assert.ok(source.includes('id="merge-toggle-btn"'),
      'index.html should include merge-toggle-btn button');
  });

  test('index.html copy button tooltip should mention Ctrl+Shift+H', () => {
    const source = fs.readFileSync(htmlPath, 'utf-8');

    assert.ok(
      source.includes('Ctrl+Shift+H'),
      'index.html copy button tooltip should mention Ctrl+Shift+H'
    );
  });
});
