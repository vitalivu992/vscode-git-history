import * as assert from 'assert';
import * as path from 'path';

interface TestCommit {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  message: string;
  tags?: string[];
}

function getFilteredCommits(commits: TestCommit[], searchQuery: string): TestCommit[] {
  if (!searchQuery) return commits;
  const query = searchQuery.toLowerCase();
  return commits.filter(commit =>
    commit.hash.toLowerCase().includes(query) ||
    commit.shortHash.toLowerCase().includes(query) ||
    commit.author.toLowerCase().includes(query) ||
    commit.email.toLowerCase().includes(query) ||
    commit.message.toLowerCase().includes(query) ||
    (commit.tags && commit.tags.some(t => t.toLowerCase().includes(query)))
  );
}

function getOrderedCommits(commits: TestCommit[], sortOldestFirst: boolean): TestCommit[] {
  if (sortOldestFirst) {
    return commits.slice().reverse();
  }
  return commits;
}

class JumpToHashNavigator {
  focusedIndex = -1;

  findCommitByHash<T extends { hash: string; shortHash: string }>(
    commits: T[],
    hash: string
  ): number {
    const query = hash.toLowerCase();
    return commits.findIndex(c =>
      c.hash.toLowerCase().startsWith(query) ||
      c.shortHash.toLowerCase() === query
    );
  }

  jumpToCommit<T extends { hash: string; shortHash: string }>(
    commits: T[],
    hash: string
  ): { index: number; commit: T | null } {
    const index = this.findCommitByHash(commits, hash);
    if (index >= 0) {
      this.focusedIndex = index;
      return { index, commit: commits[index] };
    }
    return { index: -1, commit: null };
  }
}

suite('Jump to Hash Logic Tests', () => {
  const commits: TestCommit[] = [
    { hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', shortHash: 'aaaaaaa', author: 'Alice', email: 'alice@example.com', message: 'First commit', tags: ['v1.0.0'] },
    { hash: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', shortHash: 'bbbbbbb', author: 'Bob', email: 'bob@example.com', message: 'Second commit', tags: [] },
    { hash: 'cccccccccccccccccccccccccccccccccccccccc', shortHash: 'ccccccc', author: 'Charlie', email: 'charlie@example.com', message: 'Third commit', tags: undefined },
    { hash: 'dddddddddddddddddddddddddddddddddddddddd', shortHash: 'ddddddd', author: 'Diana', email: 'diana@example.com', message: 'Fourth commit', tags: ['v2.0.0'] }
  ];

  test('findCommitByHash should find exact full hash', () => {
    const navigator = new JumpToHashNavigator();
    const index = navigator.findCommitByHash(commits, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    assert.strictEqual(index, 0);
  });

  test('findCommitByHash should find short hash', () => {
    const navigator = new JumpToHashNavigator();
    const index = navigator.findCommitByHash(commits, 'bbbbbbb');
    assert.strictEqual(index, 1);
  });

  test('findCommitByHash should find partial hash prefix', () => {
    const navigator = new JumpToHashNavigator();
    const index = navigator.findCommitByHash(commits, 'cccc');
    assert.strictEqual(index, 2);
  });

  test('findCommitByHash should be case insensitive', () => {
    const navigator = new JumpToHashNavigator();
    const index = navigator.findCommitByHash(commits, 'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD');
    assert.strictEqual(index, 3);
  });

  test('findCommitByHash should return -1 for non-existent hash', () => {
    const navigator = new JumpToHashNavigator();
    const index = navigator.findCommitByHash(commits, 'zzzzzz');
    assert.strictEqual(index, -1);
  });

  test('jumpToCommit should update focusedIndex and return commit', () => {
    const navigator = new JumpToHashNavigator();
    const result = navigator.jumpToCommit(commits, 'bbbbbbb');
    assert.strictEqual(result.index, 1);
    assert.strictEqual(result.commit?.author, 'Bob');
    assert.strictEqual(navigator.focusedIndex, 1);
  });

  test('jumpToCommit should return null for non-existent hash', () => {
    const navigator = new JumpToHashNavigator();
    const result = navigator.jumpToCommit(commits, 'notexist');
    assert.strictEqual(result.index, -1);
    assert.strictEqual(result.commit, null);
    assert.strictEqual(navigator.focusedIndex, -1);
  });

  test('jumpToCommit should work with partial hash', () => {
    const navigator = new JumpToHashNavigator();
    const result = navigator.jumpToCommit(commits, 'cccc');
    assert.strictEqual(result.index, 2);
    assert.strictEqual(result.commit?.message, 'Third commit');
  });

  test('jumpToCommit should work on filtered commits', () => {
    const filtered = getFilteredCommits(commits, 'bob');
    const navigator = new JumpToHashNavigator();
    const result = navigator.jumpToCommit(filtered, 'bbbbbbb');
    assert.strictEqual(result.index, 0);
    assert.strictEqual(result.commit?.author, 'Bob');
  });

  test('jumpToCommit should work on sorted commits', () => {
    const sorted = getOrderedCommits(commits, true);
    const navigator = new JumpToHashNavigator();
    const result = navigator.jumpToCommit(sorted, 'aaaaaaa');
    assert.strictEqual(result.index, 3);
    assert.strictEqual(result.commit?.author, 'Alice');
  });
});

suite('Jump to Hash Source Verification', () => {
  test('main.js should have showJumpToHashDialog function', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function showJumpToHashDialog'), 'main.js should have showJumpToHashDialog function');
  });

  test('main.js should have scrollToCommitByHash function', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function scrollToCommitByHash'), 'main.js should have scrollToCommitByHash function');
  });

  test('main.js should handle Ctrl+G key combination', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("e.key === 'g'") && source.includes('ctrlKey'),
      'main.js should handle Ctrl+G key combination');
  });

  test('main.js should have jump-to-hash-modal in the dialog HTML', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('jump-to-hash-modal'),
      'main.js should create jump-to-hash-modal element');
  });

  test('main.js should filter commits by hash prefix in dialog', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('startsWith'),
      'main.js should filter commits by hash prefix');
  });

  test('main.js should call selectCommit when jumping to hash', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('selectCommit(hash)'),
      'main.js should call selectCommit when jumping to hash');
  });

  test('main.js should scroll focused commit into view', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('scrollFocusedIntoView()'),
      'main.js should call scrollFocusedIntoView after jumping to hash');
  });
});

suite('Jump to Hash CSS Verification', () => {
  test('styles.css should have #jump-to-hash-modal styles', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('#jump-to-hash-modal'),
      'styles.css should have #jump-to-hash-modal styles');
  });

  test('styles.css should have modal-overlay styles', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.modal-overlay'),
      'styles.css should have modal-overlay styles');
  });

  test('styles.css should have jump-result-item styles', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.jump-result-item'),
      'styles.css should have jump-result-item styles');
  });

  test('styles.css should have jump-to-hash-input styles', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.jump-to-hash-input'),
      'styles.css should have jump-to-hash-input styles');
  });
});
