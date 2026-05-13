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

function getCopyCommitWithStatsTarget(
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
  } else if (displayCommits.length > 0) {
    // Fall back to first commit
    return displayCommits[0];
  }
  return null;
}

function formatCommitWithStatsText(commit: TestCommit): string {
  let copyText = commit.message;

  // Add body if present
  if (commit.fullMessage) {
    const body = commit.fullMessage.split('\n').slice(1).join('\n').trim();
    if (body) {
      copyText += '\n\n' + body;
    }
  }

  // Add stats if available
  if (commit.stats) {
    const filesWord = commit.stats.filesChanged === 1 ? 'file' : 'files';
    const insertionsWord = commit.stats.insertions === 1 ? 'insertion' : 'insertions';
    const deletionsWord = commit.stats.deletions === 1 ? 'deletion' : 'deletions';
    copyText += '\n\n' + `${commit.stats.filesChanged} ${filesWord} changed, ${commit.stats.insertions} ${insertionsWord}(+), ${commit.stats.deletions} ${deletionsWord}(-)`;
  }

  return copyText;
}

suite('Copy Commit Message with Stats Logic Tests', () => {
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

  test('copy commit with stats with focusedIndex 0 returns first commit', () => {
    const result = getCopyCommitWithStatsTarget(commits, 0, new Set(), '', 0, false);
    assert.strictEqual(result?.hash, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  test('copy commit with stats with focusedIndex on last commit', () => {
    const result = getCopyCommitWithStatsTarget(commits, 4, new Set(), '', 0, false);
    assert.strictEqual(result?.hash, 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');
  });

  test('copy commit with stats falls back to selected commit when focusedIndex is -1', () => {
    const selected = new Set(['cccccccccccccccccccccccccccccccccccccccc']);
    const result = getCopyCommitWithStatsTarget(commits, -1, selected, '', 0, false);
    assert.strictEqual(result?.hash, 'cccccccccccccccccccccccccccccccccccccccc');
  });

  test('copy commit with stats returns first commit when no focus and no selection but commits exist', () => {
    const result = getCopyCommitWithStatsTarget(commits, -1, new Set(), '', 0, false);
    assert.strictEqual(result?.hash, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  test('copy commit with stats returns null when no commits visible', () => {
    const result = getCopyCommitWithStatsTarget([], 0, new Set(), '', 0, false);
    assert.strictEqual(result, null);
  });

  test('copy commit with stats with search filter uses displayed commit list', () => {
    const result = getCopyCommitWithStatsTarget(commits, 0, new Set(), 'Diana', 0, false);
    assert.strictEqual(result?.hash, 'dddddddddddddddddddddddddddddddddddddddd');
  });

  test('copy commit with stats with sort oldest first uses reversed list', () => {
    const result = getCopyCommitWithStatsTarget(commits, 0, new Set(), '', 1, false);
    assert.strictEqual(result?.hash, 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');
  });

  test('copy commit with stats with hideMergeCommits skips merge commit', () => {
    const result = getCopyCommitWithStatsTarget(commits, 1, new Set(), '', 0, true);
    assert.strictEqual(result?.hash, 'cccccccccccccccccccccccccccccccccccccccc');
  });

  test('format commit with stats text includes subject', () => {
    const commit = commits[0];
    const text = formatCommitWithStatsText(commit);
    assert.ok(text.includes('Initial commit'), 'Should include commit subject');
  });

  test('format commit with stats text includes body when present', () => {
    const commit = commits[2];
    const text = formatCommitWithStatsText(commit);
    assert.ok(text.includes('Fix bug in parser'), 'Should include subject');
    assert.ok(text.includes('Detailed fix description'), 'Should include body');
  });

  test('format commit with stats text does not add extra newlines when body is empty', () => {
    const commit = commits[0];
    const text = formatCommitWithStatsText(commit);
    assert.ok(!text.includes('Initial commit\n\n\n'), 'Should not have extra newlines');
  });

  test('format commit with stats text includes stats when present', () => {
    const commit = commits[0];
    const text = formatCommitWithStatsText(commit);
    assert.ok(text.includes('5 files changed'), 'Should include files changed');
    assert.ok(text.includes('100 insertions(+)'), 'Should include insertions');
    assert.ok(text.includes('0 deletions(-)'), 'Should include deletions');
  });

  test('format commit with stats text uses singular when count is 1', () => {
    const commit = commits[2];
    const text = formatCommitWithStatsText(commit);
    assert.ok(text.includes('1 file changed'), 'Should use singular file');
    assert.ok(text.includes('1 insertion(+)'), 'Should use singular insertion');
    assert.ok(text.includes('5 deletions(-)'), 'Should handle plural deletions');
  });

  test('format commit with stats text works without stats', () => {
    const commit = commits[4];
    const text = formatCommitWithStatsText(commit);
    assert.ok(text.includes('No stats commit'), 'Should include subject');
    assert.ok(text.includes('No stats available'), 'Should include body');
    // Should not have stats line
    assert.ok(!text.includes('files changed'), 'Should not include file stats');
  });

  test('format commit with stats text formats correctly with full commit', () => {
    const commit = commits[2];
    const text = formatCommitWithStatsText(commit);
    const expected = 'Fix bug in parser\n\nDetailed fix description\n\n1 file changed, 10 insertions(+), 5 deletions(-)';
    assert.strictEqual(text, expected);
  });
});

suite('Copy Commit Message with Stats Source Verification', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const packageJsonPath = path.resolve(__dirname, '../../../package.json');

  test('handleCopyCommitWithStats should exist in main.js', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitWithStats');
    assert.ok(fnStart >= 0, 'handleCopyCommitWithStats function should exist in main.js');
  });

  test('handleCopyCommitWithStats should use getOrderedCommits(getFilteredCommits())', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitWithStats');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(
      fnBody.includes('getOrderedCommits(getFilteredCommits())'),
      'handleCopyCommitWithStats should use getOrderedCommits(getFilteredCommits()) to resolve displayed commits'
    );
  });

  test('handleCopyCommitWithStats should send copyCommitWithStats message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitWithStats');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(
      fnBody.includes("type: 'copyCommitWithStats'"),
      'handleCopyCommitWithStats should send copyCommitWithStats message type'
    );
  });

  test('handleCopyCommitWithStats should fall back to first commit', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitWithStats');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(
      fnBody.includes('displayCommits.length > 0') || fnBody.includes('fall back to first commit'),
      'handleCopyCommitWithStats should fall back to first commit when no focus or selection'
    );
  });

  test('handleCopyCommitWithStats should show error when no commits visible', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitWithStats');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(
      fnBody.includes('No commits visible'),
      'handleCopyCommitWithStats should show error when no commits visible'
    );
  });

  test('triggerAction should dispatch copyCommitWithStats', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(
      source.includes("case 'copyCommitWithStats': handleCopyCommitWithStats()"),
      'main.js triggerAction should dispatch copyCommitWithStats'
    );
  });

  test('messageHandler.ts should define handleCopyCommitWithStats', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyCommitWithStats'),
      'messageHandler.ts should define handleCopyCommitWithStats');
    assert.ok(source.includes("case 'copyCommitWithStats'"),
      'messageHandler should handle copyCommitWithStats case');
  });

  test('handleCopyCommitWithStats should handle fullMessage/body correctly', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitWithStats');
    assert.ok(fnStart >= 0, 'handleCopyCommitWithStats function should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(
      fnBody.includes('fullMessage'),
      'handleCopyCommitWithStats should use fullMessage'
    );
    assert.ok(
      fnBody.includes('.split') || fnBody.includes('slice(1)'),
      'handleCopyCommitWithStats should extract body from fullMessage'
    );
  });

  test('handleCopyCommitWithStats should include stats in output', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitWithStats');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(
      fnBody.includes('stats'),
      'handleCopyCommitWithStats should include stats in output'
    );
    assert.ok(
      fnBody.includes('filesWord') || fnBody.includes("'file'"),
      'handleCopyCommitWithStats should use singular/plural for file'
    );
  });

  test('handleCopyCommitWithStats should copy to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitWithStats');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(
      fnBody.includes('clipboard.writeText'),
      'handleCopyCommitWithStats should copy to clipboard'
    );
  });

  test('handleCopyCommitWithStats should handle missing commit', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitWithStats');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(
      fnBody.includes('Commit not found'),
      'handleCopyCommitWithStats should handle missing commit'
    );
  });

  test('handleCopyCommitWithStats should show confirmation with short hash', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitWithStats');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(
      fnBody.includes('shortHash'),
      'handleCopyCommitWithStats should show confirmation with short hash'
    );
  });

  test('types.ts should define copyCommitWithStats webview action', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("'copyCommitWithStats'"),
      'WebviewAction should include copyCommitWithStats action');
  });

  test('types.ts should define copyCommitWithStats message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("type: 'copyCommitWithStats'"),
      'WebviewToExtMessage should include copyCommitWithStats type');
    assert.ok(source.includes("hash: string"),
      'copyCommitWithStats message should have hash field');
  });

  test('extension.ts should register gitHistory.copyCommitWithStats command', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes('gitHistory.copyCommitWithStats'),
      'extension.ts should register gitHistory.copyCommitWithStats command');
    assert.ok(source.includes("action: 'copyCommitWithStats'"),
      'extension.ts should map command to copyCommitWithStats action');
  });

  test('package.json should define gitHistory.copyCommitWithStats command', () => {
    const source = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(source.includes('"command": "gitHistory.copyCommitWithStats"'),
      'package.json should define gitHistory.copyCommitWithStats command');
  });

  test('package.json should define Ctrl+Alt+W keyboard shortcut', () => {
    const source = fs.readFileSync(packageJsonPath, 'utf-8');

    const cmdStart = source.indexOf('gitHistory.copyCommitWithStats');
    const keySection = source.substring(cmdStart - 200, cmdStart + 300);

    assert.ok(
      keySection.includes('"key": "ctrl+alt+w"') || keySection.includes('"key": "ctrl+alt+W"'),
      'package.json should define Ctrl+Alt+W keyboard shortcut'
    );
    assert.ok(
      keySection.includes('"mac": "cmd+alt+w"') || keySection.includes('"mac": "cmd+alt+W"'),
      'package.json should define Cmd+Alt+W for Mac'
    );
  });

  test('main.js should have copy-commit-with-stats context menu item', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('copy-commit-with-stats'),
      'main.js should have copy-commit-with-stats context menu item');
  });

  test('main.js should handle copy-commit-with-stats action click', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("action === 'copy-commit-with-stats'"),
      'main.js should handle copy-commit-with-stats context menu action');
    assert.ok(source.includes("type: 'copyCommitWithStats'"),
      'main.js should send copyCommitWithStats message on copy-commit-with-stats action');
  });

  test('keyboard help should include copy commit message with stats shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(
      source.includes('Copy commit message with stats'),
      'keyboard help should include copy commit message with stats description'
    );
    assert.ok(
      source.includes("Alt', 'W'"),
      'keyboard help should include Alt+W shortcut'
    );
  });

  suite('README Documentation Verification', () => {
    const readmePath = path.resolve(__dirname, '../../../README.md');

    test('README should document Copy message with stats in Commit Row Context Menu', () => {
      const source = fs.readFileSync(readmePath, 'utf-8');
      assert.ok(source.includes('Copy message with stats') || source.includes('Copy commit message with stats'),
        'README should document Copy message with stats in Commit Row Context Menu table');
    });

    test('README should document Ctrl+Alt+W keyboard shortcut for Copy message with stats', () => {
      const source = fs.readFileSync(readmePath, 'utf-8');
      assert.ok(source.includes('Ctrl+Alt+W') || source.includes('Cmd+Alt+W'),
        'README should document Ctrl+Alt+W / Cmd+Alt+W keyboard shortcut for Copy message with stats');
    });
  });
});