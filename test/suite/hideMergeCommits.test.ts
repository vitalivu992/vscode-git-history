import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

interface TestCommit {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  message: string;
  parentHashes: string[];
}

/**
 * Re-implementation of getFilteredCommits from main.js for testing
 * Returns filtered commits based on hideMergeCommits flag and search query
 */
function getFilteredCommits(
  commits: TestCommit[],
  hideMergeCommits: boolean,
  searchQuery: string
): TestCommit[] {
  let filtered = commits;

  // Filter out merge commits if enabled
  if (hideMergeCommits) {
    filtered = filtered.filter(commit => !(commit.parentHashes && commit.parentHashes.length > 1));
  }

  // Apply search query filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(commit =>
      commit.hash.toLowerCase().includes(query) ||
      commit.shortHash.toLowerCase().includes(query) ||
      commit.author.toLowerCase().includes(query) ||
      commit.email.toLowerCase().includes(query) ||
      commit.message.toLowerCase().includes(query)
    );
  }

  return filtered;
}

/**
 * Check if a commit is a merge commit (has more than one parent)
 */
function isMergeCommit(commit: TestCommit): boolean {
  return commit.parentHashes && commit.parentHashes.length > 1;
}

suite('Hide Merge Commits Logic Tests', () => {
  const commits: TestCommit[] = [
    {
      hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      shortHash: 'aaaaaaa',
      author: 'Alice Cooper',
      email: 'alice@example.com',
      message: 'Initial commit',
      parentHashes: [] // Root commit
    },
    {
      hash: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      shortHash: 'bbbbbbb',
      author: 'Bob Marley',
      email: 'bob@example.com',
      message: 'Add feature X',
      parentHashes: ['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'] // Regular commit
    },
    {
      hash: 'cccccccccccccccccccccccccccccccccccccccc',
      shortHash: 'ccccccc',
      author: 'Charlie Day',
      email: 'charlie@example.com',
      message: 'Merge pull request #42',
      parentHashes: ['bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'dddddddddddddddddddddddddddddddddddddddd'] // Merge commit
    },
    {
      hash: 'dddddddddddddddddddddddddddddddddddddddd',
      shortHash: 'ddddddd',
      author: 'Diana Prince',
      email: 'diana@example.com',
      message: 'Feature branch work',
      parentHashes: ['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'] // Regular commit
    },
    {
      hash: 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      shortHash: 'eeeeeee',
      author: 'Eve Johnson',
      email: 'eve@example.com',
      message: 'Merge branch develop',
      parentHashes: ['cccccccccccccccccccccccccccccccccccccccc', 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'] // Merge commit
    }
  ];

  test('isMergeCommit correctly identifies merge commits', () => {
    assert.strictEqual(isMergeCommit(commits[0]), false, 'Root commit is not a merge commit');
    assert.strictEqual(isMergeCommit(commits[1]), false, 'Single parent commit is not a merge commit');
    assert.strictEqual(isMergeCommit(commits[2]), true, 'Two parent commit is a merge commit');
    assert.strictEqual(isMergeCommit(commits[3]), false, 'Single parent commit is not a merge commit');
    assert.strictEqual(isMergeCommit(commits[4]), true, 'Two parent commit is a merge commit');
  });

  test('with hideMergeCommits=false, returns all commits', () => {
    const result = getFilteredCommits(commits, false, '');
    assert.strictEqual(result.length, 5);
  });

  test('with hideMergeCommits=true, filters out merge commits', () => {
    const result = getFilteredCommits(commits, true, '');
    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[0].hash, commits[0].hash);
    assert.strictEqual(result[1].hash, commits[1].hash);
    assert.strictEqual(result[2].hash, commits[3].hash);
  });

  test('hideMergeCommits preserves order of non-merge commits', () => {
    const result = getFilteredCommits(commits, true, '');
    assert.strictEqual(result[0].message, 'Initial commit');
    assert.strictEqual(result[1].message, 'Add feature X');
    assert.strictEqual(result[2].message, 'Feature branch work');
  });

  test('combined filter: hideMergeCommits + search query', () => {
    // Merge commits hidden, search for 'feature' - should match commits[1] and commits[3]
    const result = getFilteredCommits(commits, true, 'feature');
    assert.strictEqual(result.length, 2);
    assert.ok(result.some(c => c.hash === commits[1].hash), 'Should include commits[1]');
    assert.ok(result.some(c => c.hash === commits[3].hash), 'Should include commits[3]');
  });

  test('combined filter: hideMergeCommits + author search', () => {
    // Merge commits hidden, search for 'Diana' - should match commits[3]
    const result = getFilteredCommits(commits, true, 'Diana');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].hash, commits[3].hash);
  });

  test('combined filter: hideMergeCommits + email domain', () => {
    // Merge commits hidden, search for '@example.com' - should match commits[0], commits[1], commits[3]
    // commits[2] and commits[4] are merge commits and should be filtered out
    const result = getFilteredCommits(commits, true, '@example.com');
    assert.strictEqual(result.length, 3);
    assert.ok(result.some(c => c.hash === commits[0].hash), 'Should include commits[0]');
    assert.ok(result.some(c => c.hash === commits[1].hash), 'Should include commits[1]');
    assert.ok(result.some(c => c.hash === commits[3].hash), 'Should include commits[3]');
  });

  test('empty commits array returns empty array', () => {
    const result = getFilteredCommits([], true, '');
    assert.strictEqual(result.length, 0);
  });

  test('all merge commits filtered results in empty array', () => {
    const allMerges: TestCommit[] = [
      {
        hash: 'cccccccccccccccccccccccccccccccccccccccc',
        shortHash: 'ccccccc',
        author: 'Charlie Day',
        email: 'charlie@example.com',
        message: 'Merge pull request',
        parentHashes: ['aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb']
      }
    ];
    const result = getFilteredCommits(allMerges, true, '');
    assert.strictEqual(result.length, 0);
  });

  test('search query with hideMergeCommits filters both conditions', () => {
    // Search for 'merge' with hideMergeCommits=true - merge commits are already hidden
    const result = getFilteredCommits(commits, true, 'merge');
    assert.strictEqual(result.length, 0, 'No non-merge commits have "merge" in their message');
  });

  test('case-insensitive search works with hideMergeCommits', () => {
    // Both commits[1] and commits[3] have 'feature' in their messages
    const result = getFilteredCommits(commits, true, 'FEATURE');
    assert.strictEqual(result.length, 2);
    assert.ok(result.some(c => c.hash === commits[1].hash), 'Should include commits[1]');
    assert.ok(result.some(c => c.hash === commits[3].hash), 'Should include commits[3]');
  });
});

suite('Hide Merge Commits Source Verification', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const webviewProviderPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const packageJsonPath = path.resolve(__dirname, '../../../package.json');
  const cssPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');

  test('main.js defines hideMergeCommits state variable', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(
      source.includes('let hideMergeCommits'),
      'main.js should define hideMergeCommits state variable'
    );
  });

  test('main.js defines handleMergeToggle function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(
      source.includes('function handleMergeToggle'),
      'main.js should define handleMergeToggle function'
    );
  });

  test('main.js getFilteredCommits includes merge commit filtering', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function getFilteredCommits');
    assert.ok(fnStart >= 0, 'getFilteredCommits function should exist');

    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(
      fnBody.includes('hideMergeCommits') && fnBody.includes('parentHashes'),
      'getFilteredCommits should check hideMergeCommits and parentHashes'
    );
  });

  test('main.js handles hideMergeCommits in init message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const initHandlerStart = source.indexOf("case 'init':");
    assert.ok(initHandlerStart >= 0, 'init message handler should exist');

    const initHandlerEnd = source.indexOf('break;', initHandlerStart);
    const initHandler = source.substring(initHandlerStart, initHandlerEnd);

    assert.ok(
      initHandler.includes('hideMergeCommits'),
      'init message handler should process hideMergeCommits'
    );
  });

  test('main.js references merge-toggle-btn element', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(
      source.includes("merge-toggle-btn"),
      'main.js should reference merge-toggle-btn element'
    );
  });

  test('webviewProvider.ts passes hideMergeCommits in init message', () => {
    const source = fs.readFileSync(webviewProviderPath, 'utf-8');
    assert.ok(
      source.includes('hideMergeCommits') && source.includes("type: 'init'"),
      'webviewProvider.ts should pass hideMergeCommits in init message'
    );
  });

  test('types.ts includes hideMergeCommits in init message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(
      source.includes('hideMergeCommits'),
      'types.ts should include hideMergeCommits in ExtToWebviewMessage'
    );
  });

  test('package.json defines gitHistory.hideMergeCommits setting', () => {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const config = packageJson.contributes.configuration.properties;
    assert.ok(
      config['gitHistory.hideMergeCommits'],
      'package.json should define gitHistory.hideMergeCommits setting'
    );
    assert.strictEqual(config['gitHistory.hideMergeCommits'].type, 'boolean');
    assert.strictEqual(config['gitHistory.hideMergeCommits'].default, false);
  });

  test('styles.css defines merge-toggle-btn styling', () => {
    const source = fs.readFileSync(cssPath, 'utf-8');
    assert.ok(
      source.includes('.merge-toggle-btn'),
      'styles.css should define merge-toggle-btn class'
    );
  });

  test('styles.css defines merge-toggle-btn.active state', () => {
    const source = fs.readFileSync(cssPath, 'utf-8');
    assert.ok(
      source.includes('.merge-toggle-btn.active'),
      'styles.css should define merge-toggle-btn.active state'
    );
  });

  test('HTML includes merge-toggle-btn in toolbar', () => {
    // The HTML is generated in webviewProvider.ts _getHtmlForWebview method
    const source = fs.readFileSync(webviewProviderPath, 'utf-8');
    assert.ok(
      source.includes('id="merge-toggle-btn"'),
      'webviewProvider.ts HTML should include merge-toggle-btn'
    );
  });
});
