import * as assert from 'assert';

interface TestCommit {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  date: string;
  message: string;
  tags?: string[];
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

suite('Sort Order Logic Tests', () => {
  const commits: TestCommit[] = [
    {
      hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      shortHash: 'aaaaaaa',
      author: 'Alice',
      email: 'alice@example.com',
      date: '2024-01-03T00:00:00.000Z',
      message: 'Third commit'
    },
    {
      hash: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      shortHash: 'bbbbbbb',
      author: 'Bob',
      email: 'bob@example.com',
      date: '2024-01-02T00:00:00.000Z',
      message: 'Second commit'
    },
    {
      hash: 'cccccccccccccccccccccccccccccccccccccccc',
      shortHash: 'ccccccc',
      author: 'Charlie',
      email: 'charlie@example.com',
      date: '2024-01-01T00:00:00.000Z',
      message: 'First commit'
    }
  ];

  test('default order (newest first) preserves original order', () => {
    const result = getOrderedCommits(commits, 0);
    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[0].message, 'Third commit');
    assert.strictEqual(result[1].message, 'Second commit');
    assert.strictEqual(result[2].message, 'First commit');
  });

  test('oldest first reverses the order', () => {
    const result = getOrderedCommits(commits, 1);
    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[0].message, 'First commit');
    assert.strictEqual(result[1].message, 'Second commit');
    assert.strictEqual(result[2].message, 'Third commit');
  });

  test('reversing does not mutate original array', () => {
    const original = [...commits];
    getOrderedCommits(commits, 1);
    assert.strictEqual(commits[0].message, original[0].message);
    assert.strictEqual(commits[1].message, original[1].message);
    assert.strictEqual(commits[2].message, original[2].message);
  });

  test('reversing twice restores original order', () => {
    const once = getOrderedCommits(commits, 1);
    const twice = getOrderedCommits(once, 1);
    assert.strictEqual(twice[0].message, commits[0].message);
    assert.strictEqual(twice[1].message, commits[1].message);
    assert.strictEqual(twice[2].message, commits[2].message);
  });

  test('sort with empty commits list', () => {
    const result = getOrderedCommits([], 1);
    assert.strictEqual(result.length, 0);
  });

  test('sort with single commit', () => {
    const single = [commits[0]];
    const result = getOrderedCommits(single, 1);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].message, 'Third commit');
  });

  test('sort preserves all commit fields', () => {
    const result = getOrderedCommits(commits, 1);
    for (let i = 0; i < result.length; i++) {
      assert.ok(result[i].hash);
      assert.ok(result[i].shortHash);
      assert.ok(result[i].author);
      assert.ok(result[i].email);
      assert.ok(result[i].date);
      assert.ok(result[i].message);
    }
  });

  test('sort with filtered subset works correctly', () => {
    const filtered = commits.filter(c => c.author !== 'Bob');
    assert.strictEqual(filtered.length, 2);

    const newestFirst = getOrderedCommits(filtered, 0);
    assert.strictEqual(newestFirst[0].message, 'Third commit');
    assert.strictEqual(newestFirst[1].message, 'First commit');

    const oldestFirst = getOrderedCommits(filtered, 1);
    assert.strictEqual(oldestFirst[0].message, 'First commit');
    assert.strictEqual(oldestFirst[1].message, 'Third commit');
  });

  test('sort with tagged commits preserves tags', () => {
    const tagged: TestCommit[] = [
      { hash: 'aaa', shortHash: 'aaa', author: 'A', email: 'a@a.com', date: '2024-01-02', message: 'Tagged', tags: ['v1.0.0'] },
      { hash: 'bbb', shortHash: 'bbb', author: 'B', email: 'b@b.com', date: '2024-01-01', message: 'Untagged' }
    ];

    const result = getOrderedCommits(tagged, 1);
    assert.strictEqual(result[0].message, 'Untagged');
    assert.strictEqual(result[1].message, 'Tagged');
    assert.deepStrictEqual(result[1].tags, ['v1.0.0']);
  });

  test('sort mode 2 sorts by author A-Z', () => {
    const result = getOrderedCommits(commits, 2);
    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[0].author, 'Alice');
    assert.strictEqual(result[1].author, 'Bob');
    assert.strictEqual(result[2].author, 'Charlie');
  });

  test('sort mode 3 sorts by author Z-A', () => {
    const result = getOrderedCommits(commits, 3);
    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[0].author, 'Charlie');
    assert.strictEqual(result[1].author, 'Bob');
    assert.strictEqual(result[2].author, 'Alice');
  });
});

suite('Sort Order Source Verification', () => {
  test('main.js should have sortMode state variable', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('let sortMode'), 'main.js should have sortMode state');
  });

  test('main.js should have handleSortToggle function', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleSortToggle'), 'main.js should have handleSortToggle function');
  });

  test('main.js should have getOrderedCommits function', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function getOrderedCommits'), 'main.js should have getOrderedCommits function');
  });

  test('main.js should use getOrderedCommits in renderCommits', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('const displayCommits = getOrderedCommits('), 'renderCommits should use getOrderedCommits');
  });

  test('main.js should hide graph when sortMode is not newest-first', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('effectiveShowGraph') && source.includes('sortMode < 2'),
      'Graph visibility should consider sortMode');
  });

  test('sort toggle should reset focusedIndex', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleSortToggle');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);
    assert.ok(toggleFn.includes('focusedIndex = -1'), 'handleSortToggle should reset focusedIndex');
  });

  test('webviewProvider should include sort button in HTML', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('id="sort-btn"'), 'HTML should include sort button');
    assert.ok(source.includes('sort-btn'), 'HTML should have sort-btn class');
  });

  test('styles.css should have sort button styling', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.sort-btn'), 'styles.css should have .sort-btn styling');
    assert.ok(source.includes('.sort-active'), 'styles.css should have .sort-active styling for toggled state');
  });
});

import * as path from 'path';
