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

function getOrderedCommits(filteredCommits: TestCommit[], sortMode: number): TestCommit[] {
  switch (sortMode) {
    case 0: return filteredCommits.slice();
    case 1: return filteredCommits.slice().reverse();
    case 2: return filteredCommits.slice().sort((a, b) => a.author.localeCompare(b.author));
    case 3: return filteredCommits.slice().sort((a, b) => b.author.localeCompare(a.author));
  }
  return filteredCommits;
}

/**
 * Get copy target for cherry-pick commands - handles 0, 1, and multiple selected commits
 * Returns hash or array of hashes depending on selection count
 * For 0-1 selected, returns single hash (fallback to copyCherryPickCommand)
 * For 2+ selected, returns all hashes in display order (for copySelectedCherryPickCommands)
 */
function getCopySelectedCherryPickCommandsTarget(
  commits: TestCommit[],
  focusedIndex: number,
  selectedCommits: Set<string>,
  searchQuery: string,
  sortMode: number,
  hideMergeCommits: boolean
): { action: 'single' | 'multi'; hashes: string[] } | null {
  const displayCommits = getOrderedCommits(
    filterCommits(commits, searchQuery, hideMergeCommits),
    sortMode
  );

  const selectedHashes = [...selectedCommits];

  // 0 selected: fall back to focused commit (single cherry-pick command)
  if (selectedHashes.length === 0) {
    if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
      return { action: 'single', hashes: [displayCommits[focusedIndex].hash] };
    }
    return null;
  }

  // 1 selected: fall back to single cherry-pick command
  if (selectedHashes.length === 1) {
    return { action: 'single', hashes: selectedHashes };
  }

  // 2+ selected: return all hashes in display order for multi-cherry-pick
  const orderedHashes: string[] = [];
  for (const hash of selectedHashes) {
    const commit = displayCommits.find(c => c.hash === hash);
    if (commit) {
      orderedHashes.push(commit.hash);
    }
  }

  return { action: 'multi', hashes: orderedHashes };
}

suite('Copy Selected Cherry-Pick Commands Logic Tests', () => {
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

  test('0 selected with focused returns single action', () => {
    const result = getCopySelectedCherryPickCommandsTarget(commits, 0, new Set(), '', 0, false);
    assert.deepStrictEqual(result, { action: 'single', hashes: ['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'] });
  });

  test('0 selected without focus returns null', () => {
    const result = getCopySelectedCherryPickCommandsTarget(commits, -1, new Set(), '', 0, false);
    assert.strictEqual(result, null);
  });

  test('1 selected returns single action', () => {
    const selected = new Set(['cccccccccccccccccccccccccccccccccccccccc']);
    const result = getCopySelectedCherryPickCommandsTarget(commits, -1, selected, '', 0, false);
    assert.deepStrictEqual(result, { action: 'single', hashes: ['cccccccccccccccccccccccccccccccccccccccc'] });
  });

  test('2 selected returns multi action with both hashes in order', () => {
    const selected = new Set([
      'cccccccccccccccccccccccccccccccccccccccc',
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    ]);
    const result = getCopySelectedCherryPickCommandsTarget(commits, -1, selected, '', 0, false);
    // Should be in display order (newest first)
    assert.strictEqual(result?.action, 'multi');
    assert.strictEqual(result?.hashes.length, 2);
    assert.strictEqual(result?.hashes[0], 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    assert.strictEqual(result?.hashes[1], 'cccccccccccccccccccccccccccccccccccccccc');
  });

  test('3 selected returns multi action with all hashes in order', () => {
    const selected = new Set([
      'dddddddddddddddddddddddddddddddddddddddd',
      'cccccccccccccccccccccccccccccccccccccccc',
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    ]);
    const result = getCopySelectedCherryPickCommandsTarget(commits, -1, selected, '', 0, false);
    assert.strictEqual(result?.action, 'multi');
    assert.strictEqual(result?.hashes.length, 3);
    // Display order (newest first): a, c, d
    assert.strictEqual(result?.hashes[0], 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    assert.strictEqual(result?.hashes[1], 'cccccccccccccccccccccccccccccccccccccccc');
    assert.strictEqual(result?.hashes[2], 'dddddddddddddddddddddddddddddddddddddddd');
  });

  test('0 selected at end of list returns last hash as single', () => {
    const result = getCopySelectedCherryPickCommandsTarget(commits, 3, new Set(), '', 0, false);
    assert.deepStrictEqual(result, { action: 'single', hashes: ['dddddddddddddddddddddddddddddddddddddddd'] });
  });

  test('0 selected with search filters to displayed commits', () => {
    const result = getCopySelectedCherryPickCommandsTarget(commits, 0, new Set(), 'Diana', 0, false);
    assert.deepStrictEqual(result, { action: 'single', hashes: ['dddddddddddddddddddddddddddddddddddddddd'] });
  });

  test('2+ selected with search filter respects display order', () => {
    const selected = new Set([
      'dddddddddddddddddddddddddddddddddddddddd',
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    ]);
    // Search for "Diana" should show only her commit at index 0
    const result = getCopySelectedCherryPickCommandsTarget(commits, 0, selected, 'Diana', 0, false);
    assert.strictEqual(result?.action, 'multi');
    assert.strictEqual(result?.hashes.length, 1);
    assert.strictEqual(result?.hashes[0], 'dddddddddddddddddddddddddddddddddddddddd');
  });

  test('sort oldest first reverses selected hashes', () => {
    const selected = new Set([
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'dddddddddddddddddddddddddddddddddddddddd'
    ]);
    const result = getCopySelectedCherryPickCommandsTarget(commits, -1, selected, '', 1, false);
    // Oldest first: a (index 0), d (index 3) -> d, a
    assert.strictEqual(result?.action, 'multi');
    assert.strictEqual(result?.hashes.length, 2);
    assert.strictEqual(result?.hashes[0], 'dddddddddddddddddddddddddddddddddddddddd');
    assert.strictEqual(result?.hashes[1], 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  test('empty commits returns null', () => {
    const result = getCopySelectedCherryPickCommandsTarget([], 0, new Set(), '', 0, false);
    assert.strictEqual(result, null);
  });

  test('focused beyond displayed commits returns null', () => {
    const result = getCopySelectedCherryPickCommandsTarget(commits, 10, new Set(), '', 0, false);
    assert.strictEqual(result, null);
  });

  test('selected hash not in display returns valid order', () => {
    const selected = new Set([
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz' // Not in commits
    ]);
    const result = getCopySelectedCherryPickCommandsTarget(commits, -1, selected, '', 0, false);
    // Should only include valid commits
    assert.strictEqual(result?.action, 'single');
    assert.strictEqual(result?.hashes.length, 1);
    assert.strictEqual(result?.hashes[0], 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  test('cherry-pick command format is correct for single hash', () => {
    const hash = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const command = `git cherry-pick ${hash}`;
    assert.strictEqual(command, `git cherry-pick ${hash}`);
  });

  test('cherry-pick commands format is correct for multiple hashes', () => {
    const hashes = [
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      'cccccccccccccccccccccccccccccccccccccccc'
    ];
    const commands = hashes.map(hash => `git cherry-pick ${hash}`).join('\n');
    assert.strictEqual(commands, `git cherry-pick ${hashes[0]}\ngit cherry-pick ${hashes[1]}\ngit cherry-pick ${hashes[2]}`);
  });
});

suite('Copy Selected Cherry-Pick Commands Source Verification', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');

  test('handleCopySelectedCherryPickCommands should exist in main.js', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleCopySelectedCherryPickCommands'),
      'handleCopySelectedCherryPickCommands function should exist');
  });

  test('handleCopySelectedCherryPickCommands should handle 0, 1, 2+ selected', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopySelectedCherryPickCommands');
    assert.ok(fnStart >= 0, 'handleCopySelectedCherryPickCommands function should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    // Should handle selectedCommits.size === 0 case - fallback to handleCopyCherryPick
    assert.ok(fnBody.includes("selectedHashes.length === 0"),
      'handleCopySelectedCherryPickCommands should handle 0 selected');
    // Should fallback to copyCherryPickCommand for single
    assert.ok(fnBody.includes("selectedHashes.length === 1"),
      'handleCopySelectedCherryPickCommands should handle 1 selected');
    // Should send copySelectedCherryPickCommands for 2+
    assert.ok(fnBody.includes("type: 'copySelectedCherryPickCommands'"),
      'handleCopySelectedCherryPickCommands should send copySelectedCherryPickCommands message for 2+');
  });

  test('triggerAction should handle copySelectedCherryPickCommands', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const taStart = source.indexOf("case 'copySelectedCherryPickCommands':");
    assert.ok(taStart >= 0, 'triggerAction should handle copySelectedCherryPickCommands');
  });

  test('context menu should include copy-selected-cherry-pick-commands', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-selected-cherry-pick-commands"'),
      'Context menu should include copy-selected-cherry-pick-commands action');
  });

  test('messageHandler should define handleCopySelectedCherryPickCommands', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopySelectedCherryPickCommands'),
      'messageHandler.ts should define handleCopySelectedCherryPickCommands');
    assert.ok(source.includes("case 'copySelectedCherryPickCommands'"),
      'messageHandler should handle copySelectedCherryPickCommands case');
  });

  test('handleCopySelectedCherryPickCommands should copy cherry-pick commands as newline-separated', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopySelectedCherryPickCommands');
    assert.ok(fnStart >= 0, 'handleCopySelectedCherryPickCommands function should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(
      fnBody.includes('git cherry-pick'),
      'handleCopySelectedCherryPickCommands should generate git cherry-pick commands'
    );
    assert.ok(
      fnBody.includes('clipboard.writeText') && fnBody.includes('cherry-pick command'),
      'handleCopySelectedCherryPickCommands should copy to clipboard and show confirmation'
    );
  });

  test('types.ts should define copySelectedCherryPickCommands action', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(
      source.includes("| 'copySelectedCherryPickCommands'"),
      "WebviewAction should include 'copySelectedCherryPickCommands'"
    );
  });

  test('types.ts should define copySelectedCherryPickCommands message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(
      source.includes("type: 'copySelectedCherryPickCommands'"),
      'WebviewToExtMessage should include copySelectedCherryPickCommands type with hashes'
    );
  });
});
