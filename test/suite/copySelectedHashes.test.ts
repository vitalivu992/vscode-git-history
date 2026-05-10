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

/**
 * Get copy target - handles 0, 1, and multiple selected commits
 * Returns hash or array of hashes depending on selection count
 */
function getCopySelectedHashesTarget(
  commits: TestCommit[],
  focusedIndex: number,
  selectedCommits: Set<string>,
  searchQuery: string,
  sortOldestFirst: boolean,
  hideMergeCommits: boolean
): string[] | null {
  const displayCommits = getOrderedCommits(
    filterCommits(commits, searchQuery, hideMergeCommits),
    sortOldestFirst
  );

  const selectedHashes = [...selectedCommits];

  // 0 selected: fall back to focused commit (single hash)
  if (selectedHashes.length === 0) {
    if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
      return [displayCommits[focusedIndex].hash];
    }
    return null;
  }

  // 1 selected: fall back to single hash copy
  if (selectedHashes.length === 1) {
    return selectedHashes;
  }

  // 2+ selected: return all hashes in display order
  const orderedHashes: string[] = [];
  for (const hash of selectedHashes) {
    const commit = displayCommits.find(c => c.hash === hash);
    if (commit) {
      orderedHashes.push(commit.hash);
    }
  }

  return orderedHashes;
}

suite('Copy Selected Hashes Logic Tests', () => {
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

  test('0 selected with focused returns single hash', () => {
    const result = getCopySelectedHashesTarget(commits, 0, new Set(), '', false, false);
    assert.deepStrictEqual(result, ['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa']);
  });

  test('0 selected without focus returns null', () => {
    const result = getCopySelectedHashesTarget(commits, -1, new Set(), '', false, false);
    assert.strictEqual(result, null);
  });

  test('1 selected returns single hash', () => {
    const selected = new Set(['cccccccccccccccccccccccccccccccccccccccc']);
    const result = getCopySelectedHashesTarget(commits, -1, selected, '', false, false);
    assert.deepStrictEqual(result, ['cccccccccccccccccccccccccccccccccccccccc']);
  });

  test('2 selected returns both hashes in order', () => {
    const selected = new Set([
      'cccccccccccccccccccccccccccccccccccccccc',
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    ]);
    const result = getCopySelectedHashesTarget(commits, -1, selected, '', false, false);
    // Should be in display order (newest first)
    assert.strictEqual(result?.length, 2);
    assert.strictEqual(result?.[0], 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    assert.strictEqual(result?.[1], 'cccccccccccccccccccccccccccccccccccccccc');
  });

  test('3 selected returns all hashes in order', () => {
    const selected = new Set([
      'dddddddddddddddddddddddddddddddddddddddd',
      'cccccccccccccccccccccccccccccccccccccccc',
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    ]);
    const result = getCopySelectedHashesTarget(commits, -1, selected, '', false, false);
    assert.strictEqual(result?.length, 3);
    // Display order (newest first): a, c, d
    assert.strictEqual(result?.[0], 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    assert.strictEqual(result?.[1], 'cccccccccccccccccccccccccccccccccccccccc');
    assert.strictEqual(result?.[2], 'dddddddddddddddddddddddddddddddddddddddd');
  });

  test('0 selected at end of list returns last hash', () => {
    const result = getCopySelectedHashesTarget(commits, 3, new Set(), '', false, false);
    assert.deepStrictEqual(result, ['dddddddddddddddddddddddddddddddddddddddd']);
  });

  test('0 selected with search filters to displayed commits', () => {
    const result = getCopySelectedHashesTarget(commits, 0, new Set(), 'Diana', false, false);
    assert.deepStrictEqual(result, ['dddddddddddddddddddddddddddddddddddddddd']);
  });

  test('2+ selected with search filter respects display order', () => {
    const selected = new Set([
      'dddddddddddddddddddddddddddddddddddddddd',
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    ]);
    // Search for "Diana" should show only her commit at index 0
    const result = getCopySelectedHashesTarget(commits, 0, selected, 'Diana', false, false);
    assert.strictEqual(result?.length, 1);
    assert.strictEqual(result?.[0], 'dddddddddddddddddddddddddddddddddddddddd');
  });

  test('sort oldest first reverses selected hashes', () => {
    const selected = new Set([
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'dddddddddddddddddddddddddddddddddddddddd'
    ]);
    const result = getCopySelectedHashesTarget(commits, -1, selected, '', true, false);
    // Oldest first: a (index 0), d (index 3) -> d, a
    assert.strictEqual(result?.length, 2);
    assert.strictEqual(result?.[0], 'dddddddddddddddddddddddddddddddddddddddd');
    assert.strictEqual(result?.[1], 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  test('empty commits returns null', () => {
    const result = getCopySelectedHashesTarget([], 0, new Set(), '', false, false);
    assert.strictEqual(result, null);
  });

  test('focused beyond displayed commits returns null', () => {
    const result = getCopySelectedHashesTarget(commits, 10, new Set(), '', false, false);
    assert.strictEqual(result, null);
  });

  test('selected hash not in display returns valid order', () => {
    const selected = new Set([
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz' // Not in commits
    ]);
    const result = getCopySelectedHashesTarget(commits, -1, selected, '', false, false);
    // Should only include valid commits
    assert.strictEqual(result?.length, 1);
    assert.strictEqual(result?.[0], 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });
});

suite('Copy Selected Hashes Source Verification', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');

  test('handleCopySelectedHashes should exist in main.js', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleCopySelectedHashes'),
      'handleCopySelectedHashes function should exist');
  });

  test('handleCopySelectedHashes should handle 0, 1, 2+ selected', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopySelectedHashes');
    assert.ok(fnStart >= 0, 'handleCopySelectedHashes function should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    // Should handle selectedCommits.size === 0 case
    assert.ok(fnBody.includes("selectedHashes.length === 0"),
      'handleCopySelectedHashes should handle 0 selected');
    // Should fallback to copyCommitHash for single
    assert.ok(fnBody.includes("selectedHashes.length === 1"),
      'handleCopySelectedHashes should handle 1 selected');
    // Should send copySelectedHashes for 2+
    assert.ok(fnBody.includes("type: 'copySelectedHashes'"),
      'handleCopySelectedHashes should send copySelectedHashes message for 2+');
  });

  test('Ctrl+Shift+; keyboard shortcut should be handled', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const kdStart = source.indexOf('function handleKeyDown');
    const kdEnd = source.indexOf('\nfunction', kdStart + 1);
    const kdBody = source.substring(kdStart, kdEnd > kdStart ? kdEnd : undefined);

    assert.ok(
      kdBody.includes("e.key === ';'") && kdBody.includes('handleCopySelectedHashes'),
      'handleKeyDown should handle Ctrl+Shift+; and call handleCopySelectedHashes'
    );
  });

  test('triggerAction should handle copySelectedHashes', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const taStart = source.indexOf("case 'copySelectedHashes':");
    assert.ok(taStart >= 0, 'triggerAction should handle copySelectedHashes');
  });

  test('messageHandler should define handleCopySelectedHashes', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopySelectedHashes'),
      'messageHandler.ts should define handleCopySelectedHashes');
    assert.ok(source.includes("case 'copySelectedHashes'"),
      'messageHandler should handle copySelectedHashes case');
  });

  test('handleCopySelectedHashes should copy hashes as newline-separated', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopySelectedHashes');
    assert.ok(fnStart >= 0, 'handleCopySelectedHashes function should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(
      fnBody.includes("hashes.join('\\n')") || fnBody.includes('hashes.join('),
      'handleCopySelectedHashes should join hashes with newline'
    );
    assert.ok(
      fnBody.includes('clipboard.writeText') && fnBody.includes('Copied'),
      'handleCopySelectedHashes should copy to clipboard and show confirmation'
    );
  });

  test('types.ts should define copySelectedHashes action', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(
      source.includes("| 'copySelectedHashes'"),
      "WebviewAction should include 'copySelectedHashes'"
    );
  });

  test('types.ts should define copySelectedHashes message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(
      source.includes("type: 'copySelectedHashes'"),
      'WebviewToExtMessage should include copySelectedHashes type with hashes'
    );
  });
});