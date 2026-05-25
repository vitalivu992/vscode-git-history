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

function getCopySelectedMessagesTarget(
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

function formatMessagesAsChecklistWithAuthor(commits: TestCommit[], hashes: string[]): string {
  const selected = commits.filter(c => hashes.includes(c.hash));
  return selected.map(c => `- [ ] ${c.author} - ${c.message}`).join('\n');
}

function formatMessagesAsNumberedListWithAuthor(commits: TestCommit[], hashes: string[]): string {
  const selected = commits.filter(c => hashes.includes(c.hash));
  return selected.map((c, index) => `${index + 1}. ${c.author} - ${c.message}`).join('\n');
}

suite('Copy Selected Messages With Author Shortcuts Logic Tests', () => {
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

  // Checklist with author tests
  test('formats single message as checklist with author', () => {
    const result = formatMessagesAsChecklistWithAuthor(commits, ['cccccccccccccccccccccccccccccccccccccccc']);
    assert.strictEqual(result, '- [ ] Charlie Day - Fix bug in parser');
  });

  test('formats multiple messages as checklist with author', () => {
    const hashes = [
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'cccccccccccccccccccccccccccccccccccccccc'
    ];
    const result = formatMessagesAsChecklistWithAuthor(commits, hashes);
    assert.strictEqual(result, '- [ ] Alice Cooper - Initial commit\n- [ ] Charlie Day - Fix bug in parser');
  });

  test('formats all commits as checklist with author', () => {
    const hashes = commits.map(c => c.hash);
    const result = formatMessagesAsChecklistWithAuthor(commits, hashes);
    assert.strictEqual(result, '- [ ] Alice Cooper - Initial commit\n- [ ] Bob Marley - Merge branch feature\n- [ ] Charlie Day - Fix bug in parser\n- [ ] Diana Prince - Update documentation');
  });

  // Numbered list with author tests
  test('formats single message as numbered list with author', () => {
    const result = formatMessagesAsNumberedListWithAuthor(commits, ['dddddddddddddddddddddddddddddddddddddddd']);
    assert.strictEqual(result, '1. Diana Prince - Update documentation');
  });

  test('formats multiple messages as numbered list with author', () => {
    const hashes = [
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      'cccccccccccccccccccccccccccccccccccccccc'
    ];
    const result = formatMessagesAsNumberedListWithAuthor(commits, hashes);
    assert.strictEqual(result, '1. Alice Cooper - Initial commit\n2. Bob Marley - Merge branch feature\n3. Charlie Day - Fix bug in parser');
  });

  // Target resolution tests
  test('0 selected with focused returns focused commit hash', () => {
    const result = getCopySelectedMessagesTarget(commits, 2, new Set(), '', 0, false);
    assert.deepStrictEqual(result, ['cccccccccccccccccccccccccccccccccccccccc']);
  });

  test('2 selected returns both hashes in display order', () => {
    const selected = new Set([
      'cccccccccccccccccccccccccccccccccccccccc',
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    ]);
    const result = getCopySelectedMessagesTarget(commits, -1, selected, '', 0, false);
    assert.strictEqual(result?.length, 2);
    assert.strictEqual(result?.[0], 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    assert.strictEqual(result?.[1], 'cccccccccccccccccccccccccccccccccccccccc');
  });
});

suite('Copy Selected Messages With Author Shortcuts Source Verification', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const packagePath = path.resolve(__dirname, '../../../package.json');

  // Checklist with author source verification
  test('handleCopySelectedMessagesChecklistWithAuthor should exist in main.js', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopySelectedMessagesChecklistWithAuthor'),
      'handleCopySelectedMessagesChecklistWithAuthor function should exist');
  });

  test('handleCopySelectedMessagesChecklistWithAuthor should send correct message type', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopySelectedMessagesChecklistWithAuthor');
    assert.ok(fnStart >= 0, 'function should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copySelectedMessagesChecklistWithAuthor'"),
      'should send copySelectedMessagesChecklistWithAuthor message');
    assert.ok(fnBody.includes('hashes:'),
      'should include hashes in message');
  });

  test('Ctrl+Alt+Shift+C keyboard shortcut should be handled in handleKeyDown', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const kdStart = source.indexOf('function handleKeyDown');
    const kdEnd = source.indexOf('\nfunction', kdStart + 1);
    const kdBody = source.substring(kdStart, kdEnd > kdStart ? kdEnd : undefined);

    assert.ok(
      kdBody.includes("e.key === 'c'") && kdBody.includes('handleCopySelectedMessagesChecklistWithAuthor'),
      'handleKeyDown should handle Ctrl+Alt+Shift+C and call handleCopySelectedMessagesChecklistWithAuthor'
    );
  });

  test('Ctrl+Alt+Shift+N keyboard shortcut should be handled in handleKeyDown', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const kdStart = source.indexOf('function handleKeyDown');
    const kdEnd = source.indexOf('\nfunction', kdStart + 1);
    const kdBody = source.substring(kdStart, kdEnd > kdStart ? kdEnd : undefined);

    assert.ok(
      kdBody.includes("e.key === 'n'") && kdBody.includes('handleCopySelectedMessagesNumberedWithAuthor'),
      'handleKeyDown should handle Ctrl+Alt+Shift+N and call handleCopySelectedMessagesNumberedWithAuthor'
    );
  });

  test('triggerAction should handle copySelectedMessagesChecklistWithAuthor', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copySelectedMessagesChecklistWithAuthor'"),
      'triggerAction should handle copySelectedMessagesChecklistWithAuthor');
  });

  test('triggerAction should handle copySelectedMessagesNumberedWithAuthor', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copySelectedMessagesNumberedWithAuthor'"),
      'triggerAction should handle copySelectedMessagesNumberedWithAuthor');
  });

  test('keyboard help should include copy messages as checklist with author', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('Copy selected messages as checklist with author'),
      'keyboard help should include copy messages as checklist with author');
  });

  test('keyboard help should include copy messages as numbered list with author', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('Copy selected messages as numbered list with author'),
      'keyboard help should include copy messages as numbered list with author');
  });

  test('messageHandler should define handleCopySelectedMessagesChecklistWithAuthor', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopySelectedMessagesChecklistWithAuthor'),
      'messageHandler.ts should define handleCopySelectedMessagesChecklistWithAuthor');
    assert.ok(source.includes("case 'copySelectedMessagesChecklistWithAuthor'"),
      'messageHandler should handle copySelectedMessagesChecklistWithAuthor case');
  });

  test('messageHandler should define handleCopySelectedMessagesNumberedWithAuthor', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopySelectedMessagesNumberedWithAuthor'),
      'messageHandler.ts should define handleCopySelectedMessagesNumberedWithAuthor');
    assert.ok(source.includes("case 'copySelectedMessagesNumberedWithAuthor'"),
      'messageHandler should handle copySelectedMessagesNumberedWithAuthor case');
  });

  test('handler should format checklist with author prefix', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopySelectedMessagesChecklistWithAuthor');
    assert.ok(fnStart >= 0, 'function should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('- [ ]'),
      'handler should format messages with markdown checklist prefix');
    assert.ok(fnBody.includes('c.author'),
      'handler should include author name');
    assert.ok(fnBody.includes('c.message'),
      'handler should use commit message');
  });

  test('handler should format numbered list with author', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopySelectedMessagesNumberedWithAuthor');
    assert.ok(fnStart >= 0, 'function should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('c.author'),
      'handler should include author name');
    assert.ok(fnBody.includes('c.message'),
      'handler should use commit message');
  });

  test('types.ts should define copySelectedMessagesChecklistWithAuthor action', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("| 'copySelectedMessagesChecklistWithAuthor'"),
      "WebviewAction should include 'copySelectedMessagesChecklistWithAuthor'");
  });

  test('types.ts should define copySelectedMessagesNumberedWithAuthor action', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("| 'copySelectedMessagesNumberedWithAuthor'"),
      "WebviewAction should include 'copySelectedMessagesNumberedWithAuthor'");
  });

  test('types.ts should define copySelectedMessagesChecklistWithAuthor message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("type: 'copySelectedMessagesChecklistWithAuthor'"),
      'WebviewToExtMessage should include copySelectedMessagesChecklistWithAuthor type');
  });

  test('types.ts should define copySelectedMessagesNumberedWithAuthor message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("type: 'copySelectedMessagesNumberedWithAuthor'"),
      'WebviewToExtMessage should include copySelectedMessagesNumberedWithAuthor type');
  });

  test('extension.ts should register both commands', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("'gitHistory.copySelectedMessagesChecklistWithAuthor'"),
      'extension.ts should register copySelectedMessagesChecklistWithAuthor command');
    assert.ok(source.includes("'gitHistory.copySelectedMessagesNumberedWithAuthor'"),
      'extension.ts should register copySelectedMessagesNumberedWithAuthor command');
  });

  test('package.json should have unique keybindings for WithAuthor commands', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('ctrl+alt+shift+c'),
      'package.json should have ctrl+alt+shift+c keybinding for checklistWithAuthor');
    assert.ok(source.includes('cmd+alt+shift+c'),
      'package.json should have cmd+alt+shift+c keybinding for checklistWithAuthor');
    assert.ok(source.includes('ctrl+alt+shift+n'),
      'package.json should have ctrl+alt+shift+n keybinding for numberedWithAuthor');
    assert.ok(source.includes('cmd+alt+shift+n'),
      'package.json should have cmd+alt+shift+n keybinding for numberedWithAuthor');
  });

  test('package.json should NOT have conflicting ctrl+alt+z for WithAuthor commands', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const checklistWithAuthorBlock = source.indexOf('gitHistory.copySelectedMessagesChecklistWithAuthor');
    assert.ok(checklistWithAuthorBlock >= 0, 'command should exist');
    const blockEnd = source.indexOf('}', checklistWithAuthorBlock);
    const block = source.substring(checklistWithAuthorBlock, blockEnd);
    assert.ok(!block.includes('ctrl+alt+z'),
      'checklistWithAuthor should NOT use ctrl+alt+z (conflicts with checklist)');
    assert.ok(!block.includes('cmd+alt+z'),
      'checklistWithAuthor should NOT use cmd+alt+z (conflicts with checklist)');
  });

  test('package.json should NOT have conflicting ctrl+alt+shift+z for WithAuthor commands', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const numberedWithAuthorBlock = source.indexOf('gitHistory.copySelectedMessagesNumberedWithAuthor');
    assert.ok(numberedWithAuthorBlock >= 0, 'command should exist');
    const blockEnd = source.indexOf('}', numberedWithAuthorBlock);
    const block = source.substring(numberedWithAuthorBlock, blockEnd);
    assert.ok(!block.includes('ctrl+alt+shift+z'),
      'numberedWithAuthor should NOT use ctrl+alt+shift+z (conflicts with numbered)');
    assert.ok(!block.includes('cmd+alt+shift+z'),
      'numberedWithAuthor should NOT use cmd+alt+shift+z (conflicts with numbered)');
  });

  test('context menu should include copy-selected-messages-checklist-with-author', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('data-action="copy-selected-messages-checklist-with-author"'),
      'context menu should include copy-selected-messages-checklist-with-author action');
  });

  test('context menu should include copy-selected-messages-numbered-with-author', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('data-action="copy-selected-messages-numbered-with-author"'),
      'context menu should include copy-selected-messages-numbered-with-author action');
  });
});
