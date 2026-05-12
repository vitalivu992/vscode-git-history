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
 * Simulates the handleCopyAllFilteredHashes logic from main.js
 * Returns the hashes that would be sent to the extension
 */
function getCopyAllFilteredHashesTarget(
  commits: TestCommit[],
  searchQuery: string,
  sortMode: number,
  hideMergeCommits: boolean
): string[] | null {
  const displayCommits = getOrderedCommits(
    filterCommits(commits, searchQuery, hideMergeCommits),
    sortMode
  );

  if (displayCommits.length === 0) {
    return null;
  }

  return displayCommits.map(commit => commit.hash);
}

suite('Copy All Filtered Hashes Logic Tests', () => {
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

  test('returns all hashes when no filters applied', () => {
    const result = getCopyAllFilteredHashesTarget(commits, '', 0, false);
    assert.strictEqual(result?.length, 4);
    assert.strictEqual(result?.[0], 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    assert.strictEqual(result?.[1], 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
    assert.strictEqual(result?.[2], 'cccccccccccccccccccccccccccccccccccccccc');
    assert.strictEqual(result?.[3], 'dddddddddddddddddddddddddddddddddddddddd');
  });

  test('returns null for empty commits list', () => {
    const result = getCopyAllFilteredHashesTarget([], '', 0, false);
    assert.strictEqual(result, null);
  });

  test('filters by search query', () => {
    const result = getCopyAllFilteredHashesTarget(commits, 'Diana', 0, false);
    assert.strictEqual(result?.length, 1);
    assert.strictEqual(result?.[0], 'dddddddddddddddddddddddddddddddddddddddd');
  });

  test('filters by author name', () => {
    const result = getCopyAllFilteredHashesTarget(commits, 'Alice', 0, false);
    assert.strictEqual(result?.length, 1);
    assert.strictEqual(result?.[0], 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  test('filters by tag', () => {
    const result = getCopyAllFilteredHashesTarget(commits, 'v1.0.0', 0, false);
    assert.strictEqual(result?.length, 1);
    assert.strictEqual(result?.[0], 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  test('hides merge commits when enabled', () => {
    const result = getCopyAllFilteredHashesTarget(commits, '', 0, true);
    assert.strictEqual(result?.length, 3);
    assert.ok(!result?.includes('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'), 'Merge commit should be hidden');
  });

  test('returns null when all commits filtered out', () => {
    const result = getCopyAllFilteredHashesTarget(commits, 'nonexistent', 0, false);
    assert.strictEqual(result, null);
  });

  test('respects sort mode 0 (newest first)', () => {
    const result = getCopyAllFilteredHashesTarget(commits, '', 0, false);
    assert.strictEqual(result?.length, 4);
    assert.strictEqual(result?.[0], 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    assert.strictEqual(result?.[3], 'dddddddddddddddddddddddddddddddddddddddd');
  });

  test('respects sort mode 1 (oldest first)', () => {
    const result = getCopyAllFilteredHashesTarget(commits, '', 1, false);
    assert.strictEqual(result?.length, 4);
    assert.strictEqual(result?.[0], 'dddddddddddddddddddddddddddddddddddddddd');
    assert.strictEqual(result?.[3], 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  test('respects sort mode 2 (author A-Z)', () => {
    const result = getCopyAllFilteredHashesTarget(commits, '', 2, false);
    assert.strictEqual(result?.length, 4);
    assert.strictEqual(result?.[0], 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'); // Alice
    assert.strictEqual(result?.[1], 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'); // Bob
    assert.strictEqual(result?.[2], 'cccccccccccccccccccccccccccccccccccccccc'); // Charlie
    assert.strictEqual(result?.[3], 'dddddddddddddddddddddddddddddddddddddddd'); // Diana
  });

  test('respects sort mode 3 (author Z-A)', () => {
    const result = getCopyAllFilteredHashesTarget(commits, '', 3, false);
    assert.strictEqual(result?.length, 4);
    assert.strictEqual(result?.[0], 'dddddddddddddddddddddddddddddddddddddddd'); // Diana
    assert.strictEqual(result?.[3], 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'); // Alice
  });

  test('single commit returns array with one hash', () => {
    const result = getCopyAllFilteredHashesTarget(commits, 'Charlie', 0, false);
    assert.strictEqual(result?.length, 1);
    assert.strictEqual(result?.[0], 'cccccccccccccccccccccccccccccccccccccccc');
  });

  test('filter + hide merge commits combined', () => {
    const result = getCopyAllFilteredHashesTarget(commits, '', 0, true);
    assert.strictEqual(result?.length, 3);
    assert.ok(result?.includes('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'));
    assert.ok(result?.includes('cccccccccccccccccccccccccccccccccccccccc'));
    assert.ok(result?.includes('dddddddddddddddddddddddddddddddddddddddd'));
  });
});

suite('Copy All Filtered Hashes Source Verification', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const packageJsonPath = path.resolve(__dirname, '../../../package.json');

  test('handleCopyAllFilteredHashes should exist in main.js', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyAllFilteredHashes'),
      'handleCopyAllFilteredHashes function should exist');
  });

  test('handleCopyAllFilteredHashes should get all filtered commits and send hashes', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAllFilteredHashes');
    assert.ok(fnStart >= 0, 'handleCopyAllFilteredHashes function should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('getOrderedCommits(getFilteredCommits())'),
      'Should get all ordered filtered commits');
    assert.ok(fnBody.includes("type: 'copyAllFilteredHashes'"),
      'Should send copyAllFilteredHashes message');
    assert.ok(fnBody.includes('displayCommits.length === 0'),
      'Should handle empty display case');
  });

  test('Ctrl+Shift+Alt+H keyboard shortcut should be handled', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const kdStart = source.indexOf('function handleKeyDown');
    const kdEnd = source.indexOf('\nfunction', kdStart + 1);
    const kdBody = source.substring(kdStart, kdEnd > kdStart ? kdEnd : undefined);

    assert.ok(
      (kdBody.includes("e.key === 'h'") || kdBody.includes("e.key === 'H'")) &&
      kdBody.includes('e.altKey') &&
      kdBody.includes('handleCopyAllFilteredHashes'),
      'handleKeyDown should handle Ctrl+Shift+Alt+H and call handleCopyAllFilteredHashes'
    );
  });

  test('triggerAction should handle copyAllFilteredHashes', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyAllFilteredHashes':"),
      'triggerAction should handle copyAllFilteredHashes');
  });

  test('context menu should include copy-all-filtered-hashes action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('data-action="copy-all-filtered-hashes"'),
      'Context menu should include copy-all-filtered-hashes action');
  });

  test('messageHandler should define handleCopyAllFilteredHashes', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyAllFilteredHashes'),
      'messageHandler.ts should define handleCopyAllFilteredHashes');
    assert.ok(source.includes("case 'copyAllFilteredHashes'"),
      'messageHandler should handle copyAllFilteredHashes case');
  });

  test('handleCopyAllFilteredHashes should copy hashes as newline-separated', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAllFilteredHashes');
    assert.ok(fnStart >= 0, 'handleCopyAllFilteredHashes function should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(
      fnBody.includes("hashes.join('\\n')") || fnBody.includes('hashes.join('),
      'handleCopyAllFilteredHashes should join hashes with newline'
    );
    assert.ok(
      fnBody.includes('clipboard.writeText') && fnBody.includes('Copied'),
      'handleCopyAllFilteredHashes should copy to clipboard and show confirmation'
    );
    assert.ok(
      fnBody.includes("hashes.length === 0"),
      'handleCopyAllFilteredHashes should handle empty hashes case'
    );
  });

  test('types.ts should define copyAllFilteredHashes action', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(
      source.includes("| 'copyAllFilteredHashes'"),
      "WebviewAction should include 'copyAllFilteredHashes'"
    );
  });

  test('types.ts should define copyAllFilteredHashes message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(
      source.includes("type: 'copyAllFilteredHashes'"),
      'WebviewToExtMessage should include copyAllFilteredHashes type with hashes'
    );
  });

  test('extension.ts should register copyAllFilteredHashes command', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(
      source.includes("gitHistory.copyAllFilteredHashes"),
      'extension.ts should register copyAllFilteredHashes command'
    );
  });

  test('package.json should register command and keybinding', () => {
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    assert.ok(content.includes('"gitHistory.copyAllFilteredHashes"'),
      'package.json should register copyAllFilteredHashes command');
    assert.ok(content.includes('"ctrl+shift+alt+h"') || content.includes('"ctrl+shift+alt+H"'),
      'package.json should define Ctrl+Shift+Alt+H keybinding');
  });
});
