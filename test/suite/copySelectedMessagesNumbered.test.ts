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

function getCopySelectedMessagesNumberedTarget(
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

function formatMessagesAsNumbered(commits: TestCommit[], hashes: string[]): string {
  const selected = commits.filter(c => hashes.includes(c.hash));
  return selected.map((c, index) => `${index + 1}. ${c.message}`).join('\n');
}

suite('Copy Selected Messages Numbered Logic Tests', () => {
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
    const result = getCopySelectedMessagesNumberedTarget(commits, 0, new Set(), '', 0, false);
    assert.deepStrictEqual(result, ['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa']);
  });

  test('0 selected without focus returns null', () => {
    const result = getCopySelectedMessagesNumberedTarget(commits, -1, new Set(), '', 0, false);
    assert.strictEqual(result, null);
  });

  test('1 selected returns single hash', () => {
    const selected = new Set(['cccccccccccccccccccccccccccccccccccccccc']);
    const result = getCopySelectedMessagesNumberedTarget(commits, -1, selected, '', 0, false);
    assert.deepStrictEqual(result, ['cccccccccccccccccccccccccccccccccccccccc']);
  });

  test('2 selected returns both hashes in display order', () => {
    const selected = new Set([
      'cccccccccccccccccccccccccccccccccccccccc',
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    ]);
    const result = getCopySelectedMessagesNumberedTarget(commits, -1, selected, '', 0, false);
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
    const result = getCopySelectedMessagesNumberedTarget(commits, -1, selected, '', 0, false);
    assert.strictEqual(result?.length, 3);
    assert.strictEqual(result?.[0], 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    assert.strictEqual(result?.[1], 'cccccccccccccccccccccccccccccccccccccccc');
    assert.strictEqual(result?.[2], 'dddddddddddddddddddddddddddddddddddddddd');
  });

  test('formats single message as numbered list', () => {
    const result = formatMessagesAsNumbered(commits, ['cccccccccccccccccccccccccccccccccccccccc']);
    assert.strictEqual(result, '1. Fix bug in parser');
  });

  test('formats multiple messages as numbered list', () => {
    const hashes = [
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'cccccccccccccccccccccccccccccccccccccccc'
    ];
    const result = formatMessagesAsNumbered(commits, hashes);
    assert.strictEqual(result, '1. Initial commit\n2. Fix bug in parser');
  });

  test('formats all commits as numbered list', () => {
    const hashes = commits.map(c => c.hash);
    const result = formatMessagesAsNumbered(commits, hashes);
    assert.strictEqual(result, '1. Initial commit\n2. Merge branch feature\n3. Fix bug in parser\n4. Update documentation');
  });

  test('empty commits list returns empty string', () => {
    const result = formatMessagesAsNumbered([], []);
    assert.strictEqual(result, '');
  });

  test('respects hide merge commits filter', () => {
    const selected = new Set([
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      'cccccccccccccccccccccccccccccccccccccccc'
    ]);
    const result = getCopySelectedMessagesNumberedTarget(commits, -1, selected, '', 0, true);
    assert.strictEqual(result?.length, 2);
    assert.strictEqual(result?.[0], 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    assert.strictEqual(result?.[1], 'cccccccccccccccccccccccccccccccccccccccc');
  });

  test('sort oldest first reverses order', () => {
    const selected = new Set([
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'dddddddddddddddddddddddddddddddddddddddd'
    ]);
    const result = getCopySelectedMessagesNumberedTarget(commits, -1, selected, '', 1, false);
    assert.strictEqual(result?.length, 2);
    assert.strictEqual(result?.[0], 'dddddddddddddddddddddddddddddddddddddddd');
    assert.strictEqual(result?.[1], 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  test('selected hash not in display returns valid order', () => {
    const selected = new Set([
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz'
    ]);
    const result = getCopySelectedMessagesNumberedTarget(commits, -1, selected, '', 0, false);
    assert.strictEqual(result?.length, 1);
    assert.strictEqual(result?.[0], 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });
});

suite('Copy Selected Messages Numbered Source Verification', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const packagePath = path.resolve(__dirname, '../../../package.json');

  test('handleCopySelectedMessagesNumbered should exist in main.js', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopySelectedMessagesNumbered'),
      'handleCopySelectedMessagesNumbered function should exist');
  });

  test('handleCopySelectedMessagesNumbered should send correct message type', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopySelectedMessagesNumbered');
    assert.ok(fnStart >= 0, 'function should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copySelectedMessagesNumbered'"),
      'should send copySelectedMessagesNumbered message');
    assert.ok(fnBody.includes('hashes:'),
      'should include hashes in message');
  });

  test('triggerAction should handle copySelectedMessagesNumbered', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copySelectedMessagesNumbered'"),
      'triggerAction should handle copySelectedMessagesNumbered');
  });

  test('context menu should include copy-selected-messages-numbered', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('data-action="copy-selected-messages-numbered"'),
      'context menu should include copy-selected-messages-numbered action');
    assert.ok(source.includes('Copy messages as numbered list'),
      'context menu should have label for copy messages as numbered list');
  });

  test('context menu should have multi-select visibility condition', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const menuStart = source.indexOf('copy-selected-messages-numbered');
    assert.ok(menuStart >= 0);
    const menuLine = source.substring(menuStart - 200, menuStart + 200);
    assert.ok(menuLine.includes('selectedCommits.size > 1'),
      'context menu item should have selectedCommits.size > 1 condition');
  });

  test('keyboard help should include copy messages as numbered list', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('Copy selected messages as numbered list'),
      'keyboard help should include copy messages as numbered list');
  });

  test('messageHandler should define handleCopySelectedMessagesNumbered', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopySelectedMessagesNumbered'),
      'messageHandler.ts should define handleCopySelectedMessagesNumbered');
    assert.ok(source.includes("case 'copySelectedMessagesNumbered'"),
      'messageHandler should handle copySelectedMessagesNumbered case');
  });

  test('handler should format as numbered markdown list', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopySelectedMessagesNumbered');
    assert.ok(fnStart >= 0, 'function should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('${index + 1}.') || fnBody.includes('index + 1'),
      'handler should format messages with numbered markdown prefix');
    assert.ok(fnBody.includes('c.message'),
      'handler should use commit message (subject line)');
  });

  test('handler should show singular/plural confirmation', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopySelectedMessagesNumbered');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('message') && fnBody.includes('messages'),
      'handler should show singular/plural in confirmation');
  });

  test('types.ts should define copySelectedMessagesNumbered action', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("| 'copySelectedMessagesNumbered'"),
      "WebviewAction should include 'copySelectedMessagesNumbered'");
  });

  test('types.ts should define copySelectedMessagesNumbered message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("type: 'copySelectedMessagesNumbered'"),
      'WebviewToExtMessage should include copySelectedMessagesNumbered type');
  });

  test('extension.ts should register the command', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("'gitHistory.copySelectedMessagesNumbered'"),
      'extension.ts should register copySelectedMessagesNumbered command');
  });

  test('package.json should have command definition', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.copySelectedMessagesNumbered'),
      'package.json should have command definition');
  });

  test('package.json should have keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('ctrl+alt+shift+z'),
      'package.json should have ctrl+alt+shift+z keybinding');
    assert.ok(source.includes('cmd+alt+shift+z'),
      'package.json should have cmd+alt+shift+z keybinding');
  });
});
