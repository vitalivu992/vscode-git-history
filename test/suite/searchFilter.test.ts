import * as assert from 'assert';

interface TestCommit {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  message: string;
  fullMessage: string;
  tags?: string[];
}

function filterCommits(commits: TestCommit[], query: string | null | undefined): TestCommit[] {
  if (!query) return commits;
  const q = query.toLowerCase();
  return commits.filter((commit: TestCommit) =>
    commit.hash.toLowerCase().includes(q) ||
    commit.shortHash.toLowerCase().includes(q) ||
    commit.author.toLowerCase().includes(q) ||
    commit.email.toLowerCase().includes(q) ||
    commit.fullMessage.toLowerCase().includes(q) ||
    (commit.tags && commit.tags.some((t: string) => t.toLowerCase().includes(q)))
  );
}

suite('Commit Search Filter Tests', () => {
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
      author: 'Bob Marley',
      email: 'bob@company.org',
      message: 'Add feature X',
      fullMessage: 'Add feature X\n\nThis adds the new authentication module\nwith OAuth2 support. Resolves #42.',
      tags: ['v2.0.0', 'release-2']
    },
    {
      hash: 'cccccccccccccccccccccccccccccccccccccccc',
      shortHash: 'ccccccc',
      author: 'Charlie Day',
      email: 'charlie@example.com',
      message: 'Fix bug in parser',
      fullMessage: 'Fix bug in parser\n\nThe parser was incorrectly handling\nnested brackets. Fixes #99.',
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

  test('empty query returns all commits', () => {
    assert.strictEqual(filterCommits(commits, '').length, 4);
    assert.strictEqual(filterCommits(commits, undefined).length, 4);
    assert.strictEqual(filterCommits(commits, null).length, 4);
  });

  test('filter by full hash', () => {
    const result = filterCommits(commits, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].shortHash, 'aaaaaaa');
  });

  test('filter by short hash', () => {
    const result = filterCommits(commits, 'bbbbbbb');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].author, 'Bob Marley');
  });

  test('filter by partial hash (case-insensitive)', () => {
    const result = filterCommits(commits, 'AAAAAA');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].shortHash, 'aaaaaaa');
  });

  test('filter by author name', () => {
    const result = filterCommits(commits, 'Bob');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].author, 'Bob Marley');
  });

  test('filter by author name (case-insensitive)', () => {
    const result = filterCommits(commits, 'alice');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].author, 'Alice Cooper');
  });

  test('filter by email', () => {
    const result = filterCommits(commits, 'bob@company.org');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].email, 'bob@company.org');
  });

  test('filter by email partial match', () => {
    const result = filterCommits(commits, '@company.org');
    assert.strictEqual(result.length, 2);
    assert.ok(result.some((c: TestCommit) => c.author === 'Bob Marley'));
    assert.ok(result.some((c: TestCommit) => c.author === 'Diana Prince'));
  });

  test('filter by email domain (case-insensitive)', () => {
    const result = filterCommits(commits, '@EXAMPLE.COM');
    assert.strictEqual(result.length, 2);
    assert.ok(result.some((c: TestCommit) => c.author === 'Alice Cooper'));
    assert.ok(result.some((c: TestCommit) => c.author === 'Charlie Day'));
  });

  test('filter by message', () => {
    const result = filterCommits(commits, 'bug');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].message, 'Fix bug in parser');
  });

  test('filter by tag name', () => {
    const result = filterCommits(commits, 'v1.0.0');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].shortHash, 'aaaaaaa');
  });

  test('filter by tag name (partial match)', () => {
    const result = filterCommits(commits, 'v2');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].shortHash, 'bbbbbbb');
  });

  test('filter by tag name matches any tag in list', () => {
    const result = filterCommits(commits, 'release-2');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].shortHash, 'bbbbbbb');
  });

  test('filter by tag name (case-insensitive)', () => {
    const result = filterCommits(commits, 'V1.0.0');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].shortHash, 'aaaaaaa');
  });

  test('commits without tags are not matched by tag search', () => {
    const result = filterCommits(commits, 'nonexistent-tag');
    assert.strictEqual(result.length, 0);
  });

  test('commits with empty tags array are not matched by tag search', () => {
    const result = filterCommits(commits, 'sometag');
    assert.strictEqual(result.length, 0);
  });

  test('no results for non-matching query', () => {
    const result = filterCommits(commits, 'zzzzzzzzz');
    assert.strictEqual(result.length, 0);
  });

  test('filter by partial message word', () => {
    const result = filterCommits(commits, 'document');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].message, 'Update documentation');
  });

  test('multiple results for common substring', () => {
    const result = filterCommits(commits, 'example.com');
    assert.strictEqual(result.length, 2);
  });

  test('filter by text in commit body only', () => {
    const result = filterCommits(commits, 'OAuth2');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].shortHash, 'bbbbbbb');
  });

  test('filter by issue reference in commit body', () => {
    const result = filterCommits(commits, '#42');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].shortHash, 'bbbbbbb');
  });

  test('filter by text in another commit body', () => {
    const result = filterCommits(commits, 'nested brackets');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].shortHash, 'ccccccc');
  });

  test('subject match still works via fullMessage', () => {
    const result = filterCommits(commits, 'Initial commit');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].shortHash, 'aaaaaaa');
  });
});

suite('Message/Body Scoped Search Tests', () => {
  // Mirrors the message:/body: keyword handling in parseDateFilter() and
  // getFilteredCommits() in src/webview/panel/main.js.
  const commits: TestCommit[] = [
    {
      hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      shortHash: 'aaaaaaa',
      author: 'Alice Cooper',
      email: 'alice@example.com',
      message: 'feat: add auth module',
      fullMessage: 'feat: add auth module\n\nImplements OAuth2 login\nwith refresh tokens.'
    },
    {
      hash: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      shortHash: 'bbbbbbb',
      author: 'Bob Marley',
      email: 'bob@company.org',
      message: 'chore: cleanup',
      fullMessage: 'chore: cleanup\n\nThe auth module needed\nOAuth2 fixes after review.'
    },
    {
      hash: 'cccccccccccccccccccccccccccccccccccccccc',
      shortHash: 'ccccccc',
      author: 'Charlie Day',
      email: 'charlie@example.com',
      message: 'fix: parser bug',
      fullMessage: 'fix: parser bug'
    }
  ];

  function extractScopedFilters(query: string): { messageFilter: string | null; bodyFilter: string | null; textQuery: string } {
    let textQuery = query;
    const messageMatch = query.match(/message:([^\s]+)/i);
    const messageFilter = messageMatch ? messageMatch[1].toLowerCase() : null;
    if (messageMatch) {
      textQuery = textQuery.replace(messageMatch[0], '').trim();
    }
    const bodyMatch = query.match(/body:([^\s]+)/i);
    const bodyFilter = bodyMatch ? bodyMatch[1].toLowerCase() : null;
    if (bodyMatch) {
      textQuery = textQuery.replace(bodyMatch[0], '').trim();
    }
    return { messageFilter, bodyFilter, textQuery: textQuery.trim() };
  }

  function applyScopedFilters(list: TestCommit[], messageFilter: string | null, bodyFilter: string | null): TestCommit[] {
    let filtered = list;
    if (messageFilter) {
      filtered = filtered.filter(c => c.message.toLowerCase().includes(messageFilter));
    }
    if (bodyFilter) {
      filtered = filtered.filter(c => {
        if (!c.fullMessage || !c.message) {
          return false;
        }
        const body = c.fullMessage.substring(c.message.length).trim();
        return body.toLowerCase().includes(bodyFilter);
      });
    }
    return filtered;
  }

  test('message: restricts the search to the subject', () => {
    const { messageFilter } = extractScopedFilters('message:auth');
    assert.strictEqual(messageFilter, 'auth');
    // "auth" appears in subject of commit a only (b and c have it only in body/not at all)
    const result = applyScopedFilters(commits, messageFilter, null);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].shortHash, 'aaaaaaa');
  });

  test('body: restricts the search to the commit body', () => {
    const { bodyFilter } = extractScopedFilters('body:oauth2');
    assert.strictEqual(bodyFilter, 'oauth2');
    // "OAuth2" appears in bodies of a and b, not in any subject
    const result = applyScopedFilters(commits, null, bodyFilter);
    assert.strictEqual(result.length, 2);
    assert.ok(result.some(c => c.shortHash === 'aaaaaaa'));
    assert.ok(result.some(c => c.shortHash === 'bbbbbbb'));
  });

  test('body: does not match subjects-only commits', () => {
    const { bodyFilter } = extractScopedFilters('body:parser');
    // "parser" is only in c\'s subject; c has no body, so nothing matches
    const result = applyScopedFilters(commits, null, bodyFilter);
    assert.strictEqual(result.length, 0);
  });

  test('message: and body: combine and are stripped from the text query', () => {
    const { messageFilter, bodyFilter, textQuery } = extractScopedFilters('message:auth body:refresh extra');
    assert.strictEqual(messageFilter, 'auth');
    assert.strictEqual(bodyFilter, 'refresh');
    assert.strictEqual(textQuery, 'extra');
    const result = applyScopedFilters(commits, messageFilter, bodyFilter);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].shortHash, 'aaaaaaa');
  });

  test('main.js should parse and apply message:/body: filters', () => {
    const path = require('path').resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = require('fs').readFileSync(path, 'utf-8');

    assert.ok(source.includes('/message:([^\\s]+)/i'), 'parseDateFilter should extract message:');
    assert.ok(source.includes('/body:([^\\s]+)/i'), 'parseDateFilter should extract body:');
    assert.ok(
      /Apply subject-scoped search filter \(message:\)/.test(source),
      'getFilteredCommits should apply the message: filter'
    );
    assert.ok(
      /Apply body-scoped search filter \(body:\)/.test(source),
      'getFilteredCommits should apply the body: filter'
    );
    assert.ok(
      source.includes("data-filter=\"message\"") && source.includes("data-filter=\"body\""),
      'filter badges should be clearable for message: and body:'
    );
  });
});
