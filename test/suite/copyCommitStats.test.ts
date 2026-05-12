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
  stats?: {
    filesChanged: number;
    insertions: number;
    deletions: number;
  };
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

function getOrderedCommits(filteredCommits: TestCommit[], sortMode: number): TestCommit[] {
  switch (sortMode) {
    case 0: return filteredCommits.slice();
    case 1: return filteredCommits.slice().reverse();
    case 2: return filteredCommits.slice().sort((a, b) => a.author.localeCompare(b.author));
    case 3: return filteredCommits.slice().sort((a, b) => b.author.localeCompare(a.author));
  }
  return filteredCommits;
}

function getCopyStatsTarget(
  commits: TestCommit[],
  focusedIndex: number,
  selectedCommits: Set<string>,
  searchQuery: string,
  sortMode: number,
  hideMergeCommits: boolean
): TestCommit | null {
  const displayCommits = getOrderedCommits(
    filterCommits(commits, searchQuery, hideMergeCommits),
    sortMode
  );
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    return displayCommits[focusedIndex];
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    return displayCommits.find(c => c.hash === hash) || null;
  }
  return null;
}

function formatStatsText(commit: TestCommit): string {
  if (!commit.stats) {
    return '';
  }
  const { stats, shortHash, message } = commit;
  const netChange = stats.insertions - stats.deletions;
  const netSign = netChange >= 0 ? '+' : '';
  const filesWord = stats.filesChanged === 1 ? 'file' : 'files';

  return `Commit ${shortHash}: ${message}
${stats.filesChanged} ${filesWord} changed
Insertions: +${stats.insertions}
Deletions: -${stats.deletions}
Net: ${netSign}${netChange}`;
}

suite('Copy Commit Stats Logic Tests', () => {
  const commits: TestCommit[] = [
    {
      hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      shortHash: 'aaaaaaa',
      author: 'Alice Cooper',
      email: 'alice@example.com',
      date: '2024-01-15T10:30:00Z',
      message: 'Initial commit',
      fullMessage: 'Initial commit',
      tags: ['v1.0.0'],
      stats: { filesChanged: 5, insertions: 100, deletions: 0 }
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
      tags: undefined,
      stats: { filesChanged: 3, insertions: 45, deletions: 12 }
    },
    {
      hash: 'cccccccccccccccccccccccccccccccccccccccc',
      shortHash: 'ccccccc',
      author: 'Charlie Day',
      email: 'charlie@example.com',
      date: '2024-03-10T09:15:00Z',
      message: 'Fix bug in parser',
      fullMessage: 'Fix bug in parser\n\nDetailed fix description',
      tags: undefined,
      stats: { filesChanged: 1, insertions: 10, deletions: 5 }
    },
    {
      hash: 'dddddddddddddddddddddddddddddddddddddddd',
      shortHash: 'ddddddd',
      author: 'Diana Prince',
      email: 'diana@company.org',
      date: '2024-04-05T16:45:00Z',
      message: 'Update documentation',
      fullMessage: 'Update documentation',
      tags: [],
      stats: { filesChanged: 2, insertions: 20, deletions: 30 }
    },
    {
      hash: 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      shortHash: 'eeeeeee',
      author: 'Eve Davis',
      email: 'eve@example.com',
      date: '2024-05-01T11:20:00Z',
      message: 'No stats commit',
      fullMessage: 'No stats available',
      tags: undefined
    }
  ];

  test('copy stats with focusedIndex 0 returns first commit', () => {
    const result = getCopyStatsTarget(commits, 0, new Set(), '', 0, false);
    assert.strictEqual(result?.hash, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    assert.ok(result?.stats, 'Commit should have stats');
  });

  test('copy stats with focusedIndex on last commit', () => {
    const result = getCopyStatsTarget(commits, 4, new Set(), '', 0, false);
    assert.strictEqual(result?.hash, 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');
    assert.strictEqual(result?.stats, undefined, 'Commit should not have stats');
  });

  test('copy stats falls back to selected commit when focusedIndex is -1', () => {
    const selected = new Set(['cccccccccccccccccccccccccccccccccccccccc']);
    const result = getCopyStatsTarget(commits, -1, selected, '', 0, false);
    assert.strictEqual(result?.hash, 'cccccccccccccccccccccccccccccccccccccccc');
  });

  test('copy stats returns null when no focus and no selection', () => {
    const result = getCopyStatsTarget(commits, -1, new Set(), '', 0, false);
    assert.strictEqual(result, null);
  });

  test('copy stats with search filter uses displayed commit list', () => {
    const result = getCopyStatsTarget(commits, 0, new Set(), 'Diana', 0, false);
    assert.strictEqual(result?.hash, 'dddddddddddddddddddddddddddddddddddddddd');
  });

  test('copy stats with sort oldest first uses reversed list', () => {
    const result = getCopyStatsTarget(commits, 0, new Set(), '', 1, false);
    assert.strictEqual(result?.hash, 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');
  });

  test('copy stats with focusedIndex out of filtered bounds falls back to selection', () => {
    const selected = new Set(['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa']);
    const result = getCopyStatsTarget(commits, 5, selected, 'Bob', 0, false);
    assert.strictEqual(result?.hash, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  test('copy stats with focusedIndex beyond results returns null without selection', () => {
    const result = getCopyStatsTarget(commits, 10, new Set(), '', 0, false);
    assert.strictEqual(result, null);
  });

  test('copy stats with empty commits list returns null', () => {
    const result = getCopyStatsTarget([], 0, new Set(), '', 0, false);
    assert.strictEqual(result, null);
  });

  test('format stats text includes all required fields', () => {
    const commit = commits[0];
    const text = formatStatsText(commit);
    assert.ok(text.includes('Commit aaaaaaa: Initial commit'), 'Should include commit hash and message');
    assert.ok(text.includes('5 files changed'), 'Should include files changed count');
    assert.ok(text.includes('Insertions: +100'), 'Should include insertions');
    assert.ok(text.includes('Deletions: -0'), 'Should include deletions');
    assert.ok(text.includes('Net: +100'), 'Should include net change');
  });

  test('format stats text uses singular "file" when count is 1', () => {
    const commit = commits[2];
    const text = formatStatsText(commit);
    assert.ok(text.includes('1 file changed'), 'Should use singular "file" when count is 1');
    assert.ok(!text.includes('1 files changed'), 'Should not use plural "files" when count is 1');
  });

  test('format stats text uses plural "files" when count is not 1', () => {
    const commit = commits[0];
    const text = formatStatsText(commit);
    assert.ok(text.includes('5 files changed'), 'Should use plural "files" when count is 5');
  });

  test('format stats text shows positive net change with + sign', () => {
    const commit = commits[1];
    const text = formatStatsText(commit);
    assert.ok(text.includes('Net: +33'), 'Should show positive net change with + sign (45-12=33)');
  });

  test('format stats text shows negative net change without double sign', () => {
    const commit = commits[3];
    const text = formatStatsText(commit);
    assert.ok(text.includes('Net: -10'), 'Should show negative net change with minus sign only (20-30=-10)');
  });

  test('format stats text returns empty string when stats are undefined', () => {
    const commit = commits[4];
    const text = formatStatsText(commit);
    assert.strictEqual(text, '', 'Should return empty string when stats are undefined');
  });

  test('format stats text handles zero deletions correctly', () => {
    const commit = commits[0];
    const text = formatStatsText(commit);
    assert.ok(text.includes('Deletions: -0'), 'Should handle zero deletions');
    assert.ok(text.includes('Net: +100'), 'Should calculate net change correctly');
  });

  test('format stats text handles zero insertions correctly', () => {
    const commit = {
      ...commits[0],
      stats: { filesChanged: 1, insertions: 0, deletions: 50 }
    };
    const text = formatStatsText(commit);
    assert.ok(text.includes('Insertions: +0'), 'Should handle zero insertions');
    assert.ok(text.includes('Net: -50'), 'Should calculate net change correctly');
  });

  test('copy stats with hideMergeCommits skips merge commit', () => {
    const result = getCopyStatsTarget(commits, 1, new Set(), '', 0, true);
    assert.strictEqual(result?.hash, 'cccccccccccccccccccccccccccccccccccccccc');
  });

  test('copy stats with hideMergeCommits and focusedIndex 0 returns first non-merge', () => {
    const result = getCopyStatsTarget(commits, 0, new Set(), '', 0, true);
    assert.strictEqual(result?.hash, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  test('copy stats with combined search and hideMergeCommits', () => {
    const result = getCopyStatsTarget(commits, 0, new Set(), 'company.org', 0, true);
    assert.strictEqual(result?.hash, 'dddddddddddddddddddddddddddddddddddddddd');
  });

  test('copy stats with multi-select returns null when focusedIndex is -1', () => {
    const selected = new Set([
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'cccccccccccccccccccccccccccccccccccccccc'
    ]);
    const result = getCopyStatsTarget(commits, -1, selected, '', 0, false);
    assert.strictEqual(result, null);
  });

  test('copy stats with multi-select returns focused commit when focusedIndex is valid', () => {
    const selected = new Set([
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'cccccccccccccccccccccccccccccccccccccccc'
    ]);
    const result = getCopyStatsTarget(commits, 2, selected, '', 0, false);
    assert.strictEqual(result?.hash, 'cccccccccccccccccccccccccccccccccccccccc');
  });
});

suite('Copy Commit Stats Source Verification', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');

  test('handleCopyStats should use getOrderedCommits(getFilteredCommits())', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyStats');
    assert.ok(fnStart >= 0, 'handleCopyStats function should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(
      fnBody.includes('getOrderedCommits(getFilteredCommits())'),
      'handleCopyStats should use getOrderedCommits(getFilteredCommits()) to resolve displayed commits'
    );
  });

  test('handleCopyStats should send copyCommitStats message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyStats');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(
      fnBody.includes("type: 'copyCommitStats'"),
      'handleCopyStats should send copyCommitStats message type'
    );
  });

  test('handleCopyStats should check if targetCommit has stats', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyStats');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(
      fnBody.includes('!targetCommit.stats') || fnBody.includes('targetCommit?.stats'),
      'handleCopyStats should check if targetCommit has stats'
    );
  });

  test('handleCopyStats should show error when no stats available', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyStats');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(
      fnBody.includes('No stats available'),
      'handleCopyStats should show error when stats are not available'
    );
  });

  test('Ctrl+Shift+S keyboard shortcut should be handled in handleKeyDown', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const kdStart = source.indexOf('function handleKeyDown');
    const kdEnd = source.indexOf('\nfunction', kdStart + 1);
    const kdBody = source.substring(kdStart, kdEnd > kdStart ? kdEnd : undefined);

    assert.ok(
      kdBody.includes("e.key === 's'") && kdBody.includes('handleCopyStats'),
      'handleKeyDown should handle Ctrl+Shift+S and call handleCopyStats'
    );
  });

  test('messageHandler should define handleCopyCommitStats', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyCommitStats'),
      'messageHandler.ts should define handleCopyCommitStats');
    assert.ok(source.includes("case 'copyCommitStats'"),
      'messageHandler should handle copyCommitStats case');
  });

  test('handleCopyCommitStats should copy formatted stats to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitStats');
    assert.ok(fnStart >= 0, 'handleCopyCommitStats function should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(
      fnBody.includes('clipboard.writeText'),
      'handleCopyCommitStats should copy stats to clipboard'
    );
    assert.ok(
      fnBody.includes('stats.filesChanged') || fnBody.includes('filesChanged'),
      'handleCopyCommitStats should include files changed in the copied text'
    );
    assert.ok(
      fnBody.includes('stats.insertions') || fnBody.includes('insertions'),
      'handleCopyCommitStats should include insertions in the copied text'
    );
    assert.ok(
      fnBody.includes('stats.deletions') || fnBody.includes('deletions'),
      'handleCopyCommitStats should include deletions in the copied text'
    );
    assert.ok(
      fnBody.includes('Commit not found'),
      'handleCopyCommitStats should handle missing commit'
    );
  });

  test('handleCopyCommitStats should handle missing stats gracefully', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitStats');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(
      fnBody.includes('No statistics available'),
      'handleCopyCommitStats should show message when stats are not available'
    );
  });

  test('handleCopyCommitStats should use singular/plural for files', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitStats');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(
      fnBody.includes('filesChanged === 1') || fnBody.includes('filesChanged==1') || (fnBody.includes("'file'") && fnBody.includes("'files'")),
      'handleCopyCommitStats should use singular "file" when count is 1 and plural "files" otherwise'
    );
  });

  test('handleCopyCommitStats should calculate net change correctly', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitStats');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(
      fnBody.includes('insertions - deletions') || fnBody.includes('deletions - insertions'),
      'handleCopyCommitStats should calculate net change'
    );
    assert.ok(
      fnBody.includes('Net:'),
      'handleCopyCommitStats should include "Net:" in the copied text'
    );
  });

  test('types.ts should define copyCommitStats message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("type: 'copyCommitStats'"),
      'WebviewToExtMessage should include copyCommitStats type');
  });

  test('types.ts should define copyCommitStats webview action', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("'copyCommitStats'"),
      'WebviewAction should include copyCommitStats action');
  });

  test('extension.ts should register gitHistory.copyCommitStats command', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes('gitHistory.copyCommitStats'),
      'extension.ts should register gitHistory.copyCommitStats command');
    assert.ok(source.includes("'copyCommitStats'"),
      'extension.ts should map command to copyCommitStats action');
  });

  test('main.js should have copy-stats context menu item', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('copy-stats'),
      'main.js should have copy-stats context menu item');
  });

  test('main.js should handle copy-stats action click', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("action === 'copy-stats'"),
      'main.js should handle copy-stats context menu action');
    assert.ok(source.includes("type: 'copyCommitStats'"),
      'main.js should send copyCommitStats message on copy-stats action');
  });

  test('main.js triggerAction should dispatch copyCommitStats', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitStats': handleCopyStats()"),
      'main.js triggerAction should dispatch copyCommitStats');
  });
});
