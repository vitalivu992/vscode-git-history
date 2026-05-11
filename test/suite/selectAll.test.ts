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
 * Simulate handleSelectAll behavior
 * Returns the selected hashes after selecting all visible commits
 */
function handleSelectAll(
  commits: TestCommit[],
  selectedCommits: Set<string>,
  searchQuery: string,
  sortMode: number,
  hideMergeCommits: boolean
): string[] {
  const displayCommits = getOrderedCommits(
    filterCommits(commits, searchQuery, hideMergeCommits),
    sortMode
  );

  if (displayCommits.length === 0) {
    return []; // No-op if no commits visible
  }

  // Add all visible commits to selection
  displayCommits.forEach(commit => selectedCommits.add(commit.hash));

  return Array.from(selectedCommits);
}

suite('Select All Logic Tests', () => {
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

  test('select all with no visible commits should be no-op', () => {
    const selected = new Set<string>();
    const result = handleSelectAll([], selected, '', 0, false);
    assert.deepStrictEqual(result, []);
    assert.strictEqual(selected.size, 0);
  });

  test('select all with multiple visible commits should select all', () => {
    const selected = new Set<string>();
    const result = handleSelectAll(commits, selected, '', 0, false);
    assert.strictEqual(result.length, 4);
    assert.ok(result.includes('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'));
    assert.ok(result.includes('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'));
    assert.ok(result.includes('cccccccccccccccccccccccccccccccccccccccc'));
    assert.ok(result.includes('dddddddddddddddddddddddddddddddddddddddd'));
    assert.strictEqual(selected.size, 4);
  });

  test('select all preserves existing selection', () => {
    const selected = new Set(['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa']);
    const result = handleSelectAll(commits, selected, '', 0, false);
    assert.strictEqual(result.length, 4);
    assert.ok(selected.has('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'));
  });

  test('select all with single visible commit selects that commit', () => {
    const singleCommit = [commits[0]];
    const selected = new Set<string>();
    const result = handleSelectAll(singleCommit, selected, '', 0, false);
    assert.deepStrictEqual(result, ['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa']);
    assert.strictEqual(selected.size, 1);
  });

  test('select all with filtered view selects only filtered commits', () => {
    const selected = new Set<string>();
    const result = handleSelectAll(commits, selected, 'Diana', 0, false);
    assert.strictEqual(result.length, 1);
    assert.ok(result.includes('dddddddddddddddddddddddddddddddddddddddd'));
  });

  test('select all with hide merge commits excludes merge commits', () => {
    const selected = new Set<string>();
    const result = handleSelectAll(commits, selected, '', 0, true);
    assert.strictEqual(result.length, 3);
    assert.ok(!result.includes('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'));
  });

  test('select all with search and hide merge commits', () => {
    const selected = new Set<string>();
    const result = handleSelectAll(commits, selected, 'commit', 0, true);
    assert.strictEqual(result.length, 2);
    assert.ok(result.includes('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'));
    assert.ok(result.includes('dddddddddddddddddddddddddddddddddddddddd'));
  });

  test('select all with sort oldest first maintains selection', () => {
    const selected = new Set<string>();
    const result = handleSelectAll(commits, selected, '', 1, false);
    assert.strictEqual(result.length, 4);
    assert.strictEqual(selected.size, 4);
  });
});

suite('Select All Source Verification', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');

  test('handleSelectAll should exist in main.js', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleSelectAll'),
      'handleSelectAll function should exist');
  });

  test('handleSelectAll should select all visible commits', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleSelectAll');
    assert.ok(fnStart >= 0, 'handleSelectAll function should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    // Should get display commits
    assert.ok(fnBody.includes('getOrderedCommits'),
      'handleSelectAll should get ordered commits');
    assert.ok(fnBody.includes('getFilteredCommits'),
      'handleSelectAll should get filtered commits');

    // Should check for empty
    assert.ok(fnBody.includes('.length === 0') || fnBody.includes('length === 0'),
      'handleSelectAll should check for empty commits');

    // Should add to selectedCommits
    assert.ok(fnBody.includes('selectedCommits.add'),
      'handleSelectAll should add commits to selection');

    // Should call updateSelectedRows
    assert.ok(fnBody.includes('updateSelectedRows'),
      'handleSelectAll should update selected rows');

    // Should request combined diff
    assert.ok(fnBody.includes('requestCombinedDiff'),
      'handleSelectAll should request combined diff');
  });

  test('Ctrl+A keyboard shortcut should be handled', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const kdStart = source.indexOf('function handleKeyDown');
    const kdEnd = source.indexOf('\nfunction', kdStart + 1);
    const kdBody = source.substring(kdStart, kdEnd > kdStart ? kdEnd : undefined);

    assert.ok(
      kdBody.includes("e.key === 'a'") && kdBody.includes('handleSelectAll'),
      'handleKeyDown should handle Ctrl+A and call handleSelectAll'
    );

    // Should check for !e.shiftKey to avoid conflict with Ctrl+Shift+A
    assert.ok(
      kdBody.includes('!e.shiftKey') || kdBody.includes('!e.shiftKey'),
      'handleKeyDown should check !e.shiftKey for Ctrl+A'
    );
  });

  test('keyboard help includes select all', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const helpStart = source.indexOf('function showKeyboardHelpDialog');
    const helpEnd = source.indexOf('\nfunction', helpStart + 1);
    const helpBody = source.substring(helpStart, helpEnd > helpStart ? helpEnd : undefined);

    // Should have select all entry
    assert.ok(
      helpBody.includes('Select all visible commits'),
      'keyboard help should include select all entry'
    );
  });

  test('Ctrl+A handler should be before input field check', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const kdStart = source.indexOf('function handleKeyDown');
    const kdEnd = source.indexOf('\nfunction', kdStart + 1);
    const kdBody = source.substring(kdStart, kdEnd > kdStart ? kdEnd : undefined);

    const ctrlAPos = kdBody.indexOf("e.key === 'a'");
    const inputCheckPos = kdBody.indexOf('Only handle arrow keys');

    assert.ok(ctrlAPos >= 0, 'Ctrl+A handler should exist');
    assert.ok(inputCheckPos >= 0, 'Input field check should exist');
    assert.ok(ctrlAPos < inputCheckPos, 'Ctrl+A should be handled before input field check');
  });

  test('Ctrl+A should not trigger when shift is pressed', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const kdStart = source.indexOf('function handleKeyDown');
    const kdEnd = source.indexOf('\nfunction', kdStart + 1);
    const kdBody = source.substring(kdStart, kdEnd > kdStart ? kdEnd : undefined);

    // Find the Ctrl+A handler block
    const ctrlAStart = kdBody.indexOf("e.key === 'a'");
    assert.ok(ctrlAStart >= 0, 'Ctrl+A handler should exist');

    // Extract the handler block (from "if" to next "if" or end)
    const nextIf = kdBody.indexOf('\n  //', ctrlAStart + 1);
    const handlerBlock = kdBody.substring(ctrlAStart, nextIf > ctrlAStart ? nextIf : ctrlAStart + 200);

    // Should check for !e.shiftKey
    assert.ok(
      handlerBlock.includes('!e.shiftKey') || handlerBlock.includes('!e.shiftKey'),
      'Ctrl+A handler should check !e.shiftKey'
    );
  });
});
