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

function getCopySelectedMessagesChecklistTarget(
  commits: TestCommit[],
  focusedIndex: number,
  selectedCommits: Set<string>,
  searchQuery: string,
  sortMode: number,
  hideMergeCommits: boolean
): string[] | null {
  const displayCommits = getOrderedCommits(
    filterCommits(commits, searchQuery, hideMergeCommits),
    sortMode
  );

  const selectedHashes = [...selectedCommits];

  if (selectedHashes.length === 0) {
    if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
      return [displayCommits[focusedIndex].hash];
    }
    return null;
  }

  const orderedHashes: string[] = [];
  for (const hash of selectedHashes) {
    const commit = displayCommits.find(c => c.hash === hash);
    if (commit) {
      orderedHashes.push(commit.hash);
    }
  }

  return orderedHashes;
}

function formatMessagesAsChecklist(commits: TestCommit[], hashes: string[]): string {
  const selected = commits.filter(c => hashes.includes(c.hash));
  return selected.map(c => `- [ ] ${c.message}`).join('\n');
}

suite('Copy Selected Messages Checklist Logic Tests', () => {
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

  test('0 selected with focused returns focused commit hash', () => {
    const result = getCopySelectedMessagesChecklistTarget(commits, 0, new Set(), '', 0, false);
    assert.deepStrictEqual(result, ['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa']);
  });

  test('0 selected without focus returns null', () => {
    const result = getCopySelectedMessagesChecklistTarget(commits, -1, new Set(), '', 0, false);
    assert.strictEqual(result, null);
  });

  test('1 selected returns single hash', () => {
    const selected = new Set(['cccccccccccccccccccccccccccccccccccccccc']);
    const result = getCopySelectedMessagesChecklistTarget(commits, -1, selected, '', 0, false);
    assert.deepStrictEqual(result, ['cccccccccccccccccccccccccccccccccccccccc']);
  });

  test('2 selected returns both hashes in display order', () => {
    const selected = new Set([
      'cccccccccccccccccccccccccccccccccccccccc',
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    ]);
    const result = getCopySelectedMessagesChecklistTarget(commits, -1, selected, '', 0, false);
    assert.strictEqual(result?.length, 2);
    assert.strictEqual(result?.[0], 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    assert.strictEqual(result?.[1], 'cccccccccccccccccccccccccccccccccccccccc');
  });

  test('3 selected returns all hashes in display order', () => {
    const selected = new Set([
      'dddddddddddddddddddddddddddddddddddddddd',
      'cccccccccccccccccccccccccccccccccccccccc',
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    ]);
    const result = getCopySelectedMessagesChecklistTarget(commits, -1, selected, '', 0, false);
    assert.strictEqual(result?.length, 3);
    assert.strictEqual(result?.[0], 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    assert.strictEqual(result?.[1], 'cccccccccccccccccccccccccccccccccccccccc');
    assert.strictEqual(result?.[2], 'dddddddddddddddddddddddddddddddddddddddd');
  });

  test('formats single message as checklist', () => {
    const result = formatMessagesAsChecklist(commits, ['cccccccccccccccccccccccccccccccccccccccc']);
    assert.strictEqual(result, '- [ ] Fix bug in parser');
  });

  test('formats multiple messages as checklist', () => {
    const hashes = [
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'cccccccccccccccccccccccccccccccccccccccc'
    ];
    const result = formatMessagesAsChecklist(commits, hashes);
    assert.strictEqual(result, '- [ ] Initial commit\n- [ ] Fix bug in parser');
  });

  test('formats all commits as checklist', () => {
    const hashes = commits.map(c => c.hash);
    const result = formatMessagesAsChecklist(commits, hashes);
    assert.strictEqual(result, '- [ ] Initial commit\n- [ ] Merge branch feature\n- [ ] Fix bug in parser\n- [ ] Update documentation');
  });

  test('empty commits list returns empty string', () => {
    const result = formatMessagesAsChecklist([], []);
    assert.strictEqual(result, '');
  });

  test('respects hide merge commits filter', () => {
    const selected = new Set([
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      'cccccccccccccccccccccccccccccccccccccccc'
    ]);
    const result = getCopySelectedMessagesChecklistTarget(commits, -1, selected, '', 0, true);
    assert.strictEqual(result?.length, 2);
    assert.strictEqual(result?.[0], 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    assert.strictEqual(result?.[1], 'cccccccccccccccccccccccccccccccccccccccc');
  });

  test('sort oldest first reverses order', () => {
    const selected = new Set([
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'dddddddddddddddddddddddddddddddddddddddd'
    ]);
    const result = getCopySelectedMessagesChecklistTarget(commits, -1, selected, '', 1, false);
    assert.strictEqual(result?.length, 2);
    assert.strictEqual(result?.[0], 'dddddddddddddddddddddddddddddddddddddddd');
    assert.strictEqual(result?.[1], 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  test('selected hash not in display returns valid order', () => {
    const selected = new Set([
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz'
    ]);
    const result = getCopySelectedMessagesChecklistTarget(commits, -1, selected, '', 0, false);
    assert.strictEqual(result?.length, 1);
    assert.strictEqual(result?.[0], 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });
});

suite('Copy Selected Messages Checklist Source Verification', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const packagePath = path.resolve(__dirname, '../../../package.json');

  test('handleCopySelectedMessagesChecklist should exist in main.js', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopySelectedMessagesChecklist'),
      'handleCopySelectedMessagesChecklist function should exist');
  });

  test('handleCopySelectedMessagesChecklist should send correct message type', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopySelectedMessagesChecklist');
    assert.ok(fnStart >= 0, 'function should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copySelectedMessagesChecklist'"),
      'should send copySelectedMessagesChecklist message');
    assert.ok(fnBody.includes('hashes:'),
      'should include hashes in message');
  });

  test('Ctrl+Alt+Z keyboard shortcut should be handled', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const kdStart = source.indexOf('function handleKeyDown');
    const kdEnd = source.indexOf('\nfunction', kdStart + 1);
    const kdBody = source.substring(kdStart, kdEnd > kdStart ? kdEnd : undefined);

    assert.ok(
      kdBody.includes("e.key === 'z'") && kdBody.includes('handleCopySelectedMessagesChecklist'),
      'handleKeyDown should handle Ctrl+Alt+Z and call handleCopySelectedMessagesChecklist'
    );
  });

  test('triggerAction should handle copySelectedMessagesChecklist', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copySelectedMessagesChecklist'"),
      'triggerAction should handle copySelectedMessagesChecklist');
  });

  test('context menu should include copy-selected-messages-checklist', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('data-action="copy-selected-messages-checklist"'),
      'context menu should include copy-selected-messages-checklist action');
    assert.ok(source.includes('Copy messages as checklist'),
      'context menu should have label for copy messages as checklist');
  });

  test('context menu should have multi-select visibility condition', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const menuStart = source.indexOf('copy-selected-messages-checklist');
    assert.ok(menuStart >= 0);
    const menuLine = source.substring(menuStart - 200, menuStart + 200);
    assert.ok(menuLine.includes('selectedCommits.size > 1'),
      'context menu item should have selectedCommits.size > 1 condition');
  });

  test('keyboard help should include copy messages as checklist', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('Copy selected messages as checklist'),
      'keyboard help should include copy messages as checklist');
  });

  test('messageHandler should define handleCopySelectedMessagesChecklist', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopySelectedMessagesChecklist'),
      'messageHandler.ts should define handleCopySelectedMessagesChecklist');
    assert.ok(source.includes("case 'copySelectedMessagesChecklist'"),
      'messageHandler should handle copySelectedMessagesChecklist case');
  });

  test('handler should format as markdown checklist', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopySelectedMessagesChecklist');
    assert.ok(fnStart >= 0, 'function should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('- [ ]'),
      'handler should format messages with markdown checklist prefix');
    assert.ok(fnBody.includes('c.message'),
      'handler should use commit message (subject line)');
  });

  test('handler should show singular/plural confirmation', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopySelectedMessagesChecklist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('message') && fnBody.includes('messages'),
      'handler should show singular/plural in confirmation');
  });

  test('types.ts should define copySelectedMessagesChecklist action', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("| 'copySelectedMessagesChecklist'"),
      "WebviewAction should include 'copySelectedMessagesChecklist'");
  });

  test('types.ts should define copySelectedMessagesChecklist message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("type: 'copySelectedMessagesChecklist'"),
      'WebviewToExtMessage should include copySelectedMessagesChecklist type');
  });

  test('extension.ts should register the command', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("'gitHistory.copySelectedMessagesChecklist'"),
      'extension.ts should register copySelectedMessagesChecklist command');
  });

  test('package.json should have command definition', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copySelectedMessagesChecklist'),
      'package.json should have command definition');
  });

  test('package.json should have keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('ctrl+alt+z'),
      'package.json should have ctrl+alt+z keybinding');
    assert.ok(source.includes('cmd+alt+z'),
      'package.json should have cmd+alt+z keybinding');
  });
});
