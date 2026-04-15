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
