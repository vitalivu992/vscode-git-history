import * as assert from 'assert';

interface TestCommit {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  message: string;
  tags?: string[];
}

/**
 * Check if text matches the regex pattern
 * (mirroring the logic in main.js)
 */
function isRegexMatch(text: string, pattern: string, regexEnabled: boolean): boolean {
  if (!pattern) return true;
  if (!regexEnabled) {
    return text.toLowerCase().includes(pattern.toLowerCase());
  }
  try {
    const regex = new RegExp(pattern, 'i');
    return regex.test(text);
  } catch (e) {
    // Invalid regex - fallback to simple includes
    return text.toLowerCase().includes(pattern.toLowerCase());
  }
}

/**
 * Check if the regex pattern is valid
 */
function isValidRegex(pattern: string, regexEnabled: boolean): boolean {
  if (!regexEnabled || !pattern) return true;
  try {
    new RegExp(pattern);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Filter commits using regex or substring matching
 */
function filterCommits(
  commits: TestCommit[],
  query: string,
  regexEnabled: boolean
): TestCommit[] {
  if (!query) return commits;

  return commits.filter(commit =>
    isRegexMatch(commit.hash, query, regexEnabled) ||
    isRegexMatch(commit.shortHash, query, regexEnabled) ||
    isRegexMatch(commit.author, query, regexEnabled) ||
    isRegexMatch(commit.email, query, regexEnabled) ||
    isRegexMatch(commit.message, query, regexEnabled) ||
    (commit.tags && commit.tags.some(t => isRegexMatch(t, query, regexEnabled)))
  );
}

suite('Regex Search Mode Tests', () => {
  const commits: TestCommit[] = [
    {
      hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      shortHash: 'aaaaaaa',
      author: 'Alice Cooper',
      email: 'alice@example.com',
      message: 'feat: add new authentication feature',
      tags: ['v1.0.0']
    },
    {
      hash: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      shortHash: 'bbbbbbb',
      author: 'Bob Marley',
      email: 'bob@company.org',
      message: 'fix: resolve memory leak in parser',
      tags: ['v2.0.0', 'release-2']
    },
    {
      hash: 'cccccccccccccccccccccccccccccccccccccccc',
      shortHash: 'ccccccc',
      author: 'Charlie Day',
      email: 'charlie@example.com',
      message: 'bugfix: handle edge case in validator',
      tags: undefined
    },
    {
      hash: 'dddddddddddddddddddddddddddddddddddddddd',
      shortHash: 'ddddddd',
      author: 'Diana Prince',
      email: 'diana@company.org',
      message: 'docs: update API documentation',
      tags: []
    },
    {
      hash: 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      shortHash: 'eeeeeee',
      author: 'Eve Johnson',
      email: 'eve@startup.io',
      message: 'refactor: simplify data processing pipeline',
      tags: ['v3.0.0-beta']
    }
  ];

  suite('isRegexMatch function', () => {
    test('should perform case-insensitive substring match when regex disabled', () => {
      assert.strictEqual(isRegexMatch('Hello World', 'hello', false), true);
      assert.strictEqual(isRegexMatch('Hello World', 'WORLD', false), true);
      assert.strictEqual(isRegexMatch('Hello World', 'foo', false), false);
    });

    test('should perform regex match when regex enabled', () => {
      assert.strictEqual(isRegexMatch('Hello World', 'Hello.*', true), true);
      assert.strictEqual(isRegexMatch('Hello World', '^Hello', true), true);
      assert.strictEqual(isRegexMatch('Hello World', 'World$', true), true);
      assert.strictEqual(isRegexMatch('Hello World', '^World', true), false);
    });

    test('should be case-insensitive in regex mode', () => {
      assert.strictEqual(isRegexMatch('Hello World', 'hello', true), true);
      assert.strictEqual(isRegexMatch('Hello World', 'WORLD', true), true);
    });

    test('should handle special regex characters in regex mode', () => {
      assert.strictEqual(isRegexMatch('file.txt', 'file\\.txt', true), true);
      assert.strictEqual(isRegexMatch('file.txt', 'file.txt', true), true); // . matches any char
      assert.strictEqual(isRegexMatch('file-txt', 'file.txt', true), true); // . matches -
    });

    test('should fallback to substring match for invalid regex', () => {
      // Invalid regex pattern should fallback to substring match
      assert.strictEqual(isRegexMatch('Hello World', '[invalid', true), false);
      assert.strictEqual(isRegexMatch('Hello World', '(unclosed', true), false);
    });

    test('should return true for empty pattern', () => {
      assert.strictEqual(isRegexMatch('Hello World', '', true), true);
      assert.strictEqual(isRegexMatch('Hello World', '', false), true);
    });
  });

  suite('isValidRegex function', () => {
    test('should return true when regex mode disabled', () => {
      assert.strictEqual(isValidRegex('anything', false), true);
      assert.strictEqual(isValidRegex('[invalid', false), true);
    });

    test('should return true for empty pattern', () => {
      assert.strictEqual(isValidRegex('', true), true);
    });

    test('should return true for valid regex patterns', () => {
      assert.strictEqual(isValidRegex('hello', true), true);
      assert.strictEqual(isValidRegex('^feat:', true), true);
      assert.strictEqual(isValidRegex('bug|fix', true), true);
      assert.strictEqual(isValidRegex('[a-z]+', true), true);
      assert.strictEqual(isValidRegex('\\d{4}', true), true);
    });

    test('should return false for invalid regex patterns', () => {
      assert.strictEqual(isValidRegex('[invalid', true), false);
      assert.strictEqual(isValidRegex('(unclosed', true), false);
      assert.strictEqual(isValidRegex(')unexpected', true), false);
      assert.strictEqual(isValidRegex('(?<invalid)', true), false);
    });
  });

  suite('filterCommits with regex disabled', () => {
    test('should filter by message substring', () => {
      const result = filterCommits(commits, 'fix', false);
      assert.strictEqual(result.length, 2);
      assert.ok(result.some(c => c.message.includes('fix')));
      assert.ok(result.some(c => c.message.includes('bugfix')));
    });

    test('should filter by author', () => {
      const result = filterCommits(commits, 'Alice', false);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].author, 'Alice Cooper');
    });

    test('should filter by hash', () => {
      const result = filterCommits(commits, 'aaaaaaa', false);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].shortHash, 'aaaaaaa');
    });

    test('should filter by tag', () => {
      const result = filterCommits(commits, 'v2.0.0', false);
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].shortHash, 'bbbbbbb');
    });
  });

  suite('filterCommits with regex enabled', () => {
    test('should use regex alternation to match multiple patterns', () => {
      const result = filterCommits(commits, 'feat:|fix:', true);
      // Matches: Alice (feat:), Bob (fix:), Charlie (bugfix: contains fix:)
      assert.strictEqual(result.length, 3);
      assert.ok(result.some(c => c.message.includes('feat:')));
      assert.ok(result.some(c => c.message.includes('fix:')));
    });

    test('should use regex anchors to match beginning', () => {
      const result = filterCommits(commits, '^feat:', true);
      assert.strictEqual(result.length, 1);
      assert.ok(result[0].message.includes('feat:'));
    });

    test('should use regex character classes', () => {
      const result = filterCommits(commits, 'v\\d\\.\\d', true);
      // Should match v1.0.0, v2.0.0, v3.0.0-beta
      assert.strictEqual(result.length, 3);
    });

    test('should use regex word boundaries', () => {
      const result = filterCommits(commits, '\\bfix\\b', true);
      assert.strictEqual(result.length, 1); // Only the fix: commit, not bugfix
      assert.ok(result[0].message.includes('fix:'));
    });

    test('should handle regex groups', () => {
      const result = filterCommits(commits, '(feat|fix|docs):', true);
      // Matches: Alice (feat:), Bob (fix:), Charlie (bugfix: contains fix:), Diana (docs:)
      // Note: fix: matches within bugfix: because "fix:" is a substring
      assert.strictEqual(result.length, 4);
    });

    test('should fallback to substring for invalid regex', () => {
      // Invalid regex should still find matches via substring fallback
      const result = filterCommits(commits, '[invalid', true);
      assert.strictEqual(result.length, 0); // No matches for '[invalid' as substring
    });

    test('should return all commits for empty query', () => {
      const result = filterCommits(commits, '', true);
      assert.strictEqual(result.length, 5);
    });
  });

  suite('Complex regex patterns', () => {
    test('should match email domain with regex', () => {
      const result = filterCommits(commits, '@example\\.com$', true);
      assert.strictEqual(result.length, 2);
      assert.ok(result.some(c => c.author === 'Alice Cooper'));
      assert.ok(result.some(c => c.author === 'Charlie Day'));
    });

    test('should match semantic version tags', () => {
      const result = filterCommits(commits, 'v\\d+\\.\\d+\\.\\d+', true);
      // Matches: v1.0.0 (Alice), v2.0.0 (Bob), v3.0.0 from v3.0.0-beta (Eve)
      // The pattern matches the numeric version part even with suffix
      assert.strictEqual(result.length, 3);
    });

    test('should match commit type prefixes', () => {
      const result = filterCommits(commits, '^(feat|fix|docs|refactor|bugfix):', true);
      assert.strictEqual(result.length, 5);
    });
  });
});

suite('Regex Search Source Verification', () => {
  test('main.js should have isRegexMatch function', () => {
    const fs = require('fs');
    const path = require('path');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function isRegexMatch'), 'main.js should have isRegexMatch function');
  });

  test('main.js should have regexSearchEnabled state variable', () => {
    const fs = require('fs');
    const path = require('path');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('regexSearchEnabled'), 'main.js should have regexSearchEnabled variable');
  });

  test('main.js should have handleRegexToggle function', () => {
    const fs = require('fs');
    const path = require('path');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleRegexToggle'), 'main.js should have handleRegexToggle function');
  });

  test('main.js should handle Ctrl+Shift+X keyboard shortcut', () => {
    const fs = require('fs');
    const path = require('path');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("e.key === 'x'") && source.includes('ctrlKey') && source.includes('shiftKey'),
      'main.js should handle Ctrl+Shift+X keyboard shortcut');
  });

  test('index.html should have regex toggle button', () => {
    const fs = require('fs');
    const path = require('path');
    const indexPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
    const source = fs.readFileSync(indexPath, 'utf-8');

    assert.ok(source.includes('regex-toggle-btn'), 'index.html should have regex-toggle-btn');
  });

  test('styles.css should have regex-toggle-btn styles', () => {
    const fs = require('fs');
    const path = require('path');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.regex-toggle-btn'), 'styles.css should have .regex-toggle-btn styles');
    assert.ok(source.includes('.regex-toggle-btn.active'), 'styles.css should have .regex-toggle-btn.active styles');
  });

  test('webviewProvider.ts should include regex toggle button', () => {
    const fs = require('fs');
    const path = require('path');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('regex-toggle-btn'), 'webviewProvider.ts should include regex-toggle-btn');
  });
});
