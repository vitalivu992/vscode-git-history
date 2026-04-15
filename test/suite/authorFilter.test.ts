import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

function parseDateFilter(query: string): { textQuery: string; dateFilters: { after?: Date; before?: Date }; authorFilter: string | null; tagFilter: string | null } {
  const dateFilters: { after?: Date; before?: Date } = {};
  let textQuery = query;

  const authorMatch = query.match(/author:([^\s]+)/i);
  const authorFilter = authorMatch ? authorMatch[1].toLowerCase() : null;
  if (authorMatch) {
    textQuery = textQuery.replace(authorMatch[0], '').trim();
  }

  const tagMatch = query.match(/tag:([^\s]+)/i);
  const tagFilter = tagMatch ? tagMatch[1].toLowerCase() : null;
  if (tagMatch) {
    textQuery = textQuery.replace(tagMatch[0], '').trim();
  }

  const afterMatch = query.match(/after:([^\s]+)/i);
  if (afterMatch) {
    const dateStr = afterMatch[1];
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      dateFilters.after = date;
    }
    textQuery = textQuery.replace(afterMatch[0], '').trim();
  }

  const beforeMatch = query.match(/before:([^\s]+)/i);
  if (beforeMatch) {
    const dateStr = beforeMatch[1];
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      dateFilters.before = date;
    }
    textQuery = textQuery.replace(beforeMatch[0], '').trim();
  }

  const lastMatch = query.match(/last:(\d+)\s*(day|days|week|weeks|month|months)/i);
  if (lastMatch) {
    const num = parseInt(lastMatch[1], 10);
    const unit = lastMatch[2].toLowerCase();
    const now = new Date();
    const after = new Date(now);

    if (unit === 'day' || unit === 'days') {
      after.setDate(now.getDate() - num);
    } else if (unit === 'week' || unit === 'weeks') {
      after.setDate(now.getDate() - (num * 7));
    } else if (unit === 'month' || unit === 'months') {
      after.setMonth(now.getMonth() - num);
    }

    dateFilters.after = after;
    textQuery = textQuery.replace(lastMatch[0], '').trim();
  }

  return { textQuery: textQuery.trim(), dateFilters, authorFilter, tagFilter };
}

interface TestCommit {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  date: string;
  message: string;
  tags?: string[];
  parentHashes?: string[];
  fullMessage?: string;
}

function filterCommitsWithAuthor(
  commits: TestCommit[],
  query: string
): TestCommit[] {
  const { textQuery, dateFilters, authorFilter, tagFilter } = parseDateFilter(query);

  let filtered = commits;

  if (authorFilter) {
    filtered = filtered.filter(commit =>
      commit.author.toLowerCase().includes(authorFilter) ||
      commit.email.toLowerCase().includes(authorFilter)
    );
  }

  if (tagFilter) {
    filtered = filtered.filter(commit =>
      commit.tags && commit.tags.some(t => t.toLowerCase().includes(tagFilter))
    );
  }

  if (dateFilters.after) {
    const afterMs = dateFilters.after.getTime();
    filtered = filtered.filter(commit => new Date(commit.date).getTime() >= afterMs);
  }

  if (dateFilters.before) {
    const beforeMs = dateFilters.before.getTime();
    filtered = filtered.filter(commit => new Date(commit.date).getTime() <= beforeMs);
  }

  if (textQuery) {
    const q = textQuery.toLowerCase();
    filtered = filtered.filter(commit =>
      commit.hash.toLowerCase().includes(q) ||
      commit.shortHash.toLowerCase().includes(q) ||
      commit.author.toLowerCase().includes(q) ||
      commit.email.toLowerCase().includes(q) ||
      commit.message.toLowerCase().includes(q) ||
      (commit.tags && commit.tags.some(t => t.toLowerCase().includes(q)))
    );
  }

  return filtered;
}

suite('Author Filter Tests', () => {
  const commits: TestCommit[] = [
    {
      hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      shortHash: 'aaaaaaa',
      author: 'Alice Cooper',
      email: 'alice@example.com',
      date: '2024-01-15T10:00:00Z',
      message: 'Initial commit',
      tags: ['v1.0.0']
    },
    {
      hash: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      shortHash: 'bbbbbbb',
      author: 'Bob Marley',
      email: 'bob@company.org',
      date: '2024-02-20T14:30:00Z',
      message: 'Add feature X',
      tags: ['v2.0.0']
    },
    {
      hash: 'cccccccccccccccccccccccccccccccccccccccc',
      shortHash: 'ccccccc',
      author: 'Alice Cooper',
      email: 'alice@example.com',
      date: '2024-03-10T09:15:00Z',
      message: 'Fix bug in parser',
      tags: undefined
    },
    {
      hash: 'dddddddddddddddddddddddddddddddddddddddd',
      shortHash: 'ddddddd',
      author: 'Diana Prince',
      email: 'diana@company.org',
      date: '2024-04-05T16:45:00Z',
      message: 'Update documentation',
      tags: []
    }
  ];

  suite('parseDateFilter author parsing', () => {
    test('should parse author: filter', () => {
      const result = parseDateFilter('author:Alice');
      assert.strictEqual(result.authorFilter, 'alice');
    });

    test('should parse author: filter case-insensitively', () => {
      const result = parseDateFilter('AUTHOR:Bob');
      assert.strictEqual(result.authorFilter, 'bob');
    });

    test('should parse author: with email-like value', () => {
      const result = parseDateFilter('author:alice@example.com');
      assert.strictEqual(result.authorFilter, 'alice@example.com');
    });

    test('should return null authorFilter for queries without author syntax', () => {
      const result = parseDateFilter('bug fix');
      assert.strictEqual(result.authorFilter, null);
    });

    test('should return null authorFilter for empty query', () => {
      const result = parseDateFilter('');
      assert.strictEqual(result.authorFilter, null);
    });

    test('should extract author filter and leave remaining text query', () => {
      const result = parseDateFilter('author:Alice bug fix');
      assert.strictEqual(result.authorFilter, 'alice');
      assert.strictEqual(result.textQuery, 'bug fix');
    });

    test('should extract author filter and leave remaining text query with date filter', () => {
      const result = parseDateFilter('author:Bob after:2024-02-01');
      assert.strictEqual(result.authorFilter, 'bob');
      assert.ok(result.dateFilters.after);
    });
  });

  suite('filterCommitsWithAuthor', () => {
    test('should filter by author name', () => {
      const result = filterCommitsWithAuthor(commits, 'author:Alice');
      assert.strictEqual(result.length, 2);
      assert.ok(result.every(c => c.author === 'Alice Cooper'));
    });

    test('should filter by partial author name', () => {
      const result = filterCommitsWithAuthor(commits, 'author:Bob');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].author, 'Bob Marley');
    });

    test('should filter by email', () => {
      const result = filterCommitsWithAuthor(commits, 'author:alice@example.com');
      assert.strictEqual(result.length, 2);
      assert.ok(result.every(c => c.email === 'alice@example.com'));
    });

    test('should filter by partial email', () => {
      const result = filterCommitsWithAuthor(commits, 'author:@company.org');
      assert.strictEqual(result.length, 2);
      assert.ok(result.some(c => c.author === 'Bob Marley'));
      assert.ok(result.some(c => c.author === 'Diana Prince'));
    });

    test('should be case-insensitive', () => {
      const result = filterCommitsWithAuthor(commits, 'author:ALICE');
      assert.strictEqual(result.length, 2);
    });

    test('should return no results for non-matching author', () => {
      const result = filterCommitsWithAuthor(commits, 'author:NonExistent');
      assert.strictEqual(result.length, 0);
    });

    test('should return all commits for empty query', () => {
      const result = filterCommitsWithAuthor(commits, '');
      assert.strictEqual(result.length, 4);
    });

    test('should combine author filter with text search', () => {
      const result = filterCommitsWithAuthor(commits, 'author:Alice bug');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].message, 'Fix bug in parser');
    });

    test('should combine author filter with date filter', () => {
      const result = filterCommitsWithAuthor(commits, 'author:Alice after:2024-03-01');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].message, 'Fix bug in parser');
    });

    test('should combine author filter, date filter, and text search', () => {
      const result = filterCommitsWithAuthor(commits, 'author:Alice after:2024-01-01 parser');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].message, 'Fix bug in parser');
    });

    test('author filter with date filter that excludes all', () => {
      const result = filterCommitsWithAuthor(commits, 'author:Alice after:2025-01-01');
      assert.strictEqual(result.length, 0);
    });
  });
});

suite('Author Filter Source Verification Tests', () => {
  test('main.js should parse author: filter prefix', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('author:'), 'main.js should reference author: filter syntax');
    assert.ok(source.includes('authorFilter'), 'main.js should track authorFilter state');
  });

  test('main.js should apply author filter in getFilteredCommits', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('authorFilter'), 'getFilteredCommits should use authorFilter');
    const getFilteredCommitsSection = source.substring(
      source.indexOf('function getFilteredCommits'),
      source.indexOf('function getOrderedCommits')
    );
    assert.ok(
      getFilteredCommitsSection.includes('commit.author.toLowerCase().includes(authorFilter)') ||
      getFilteredCommitsSection.includes('commit.email.toLowerCase().includes(authorFilter)'),
      'getFilteredCommits should filter by author and email'
    );
  });

  test('main.js should render author filter badge', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const renderFilterBadgesSection = source.substring(
      source.indexOf('function renderFilterBadges'),
      source.indexOf('const GRAPH_COLORS')
    );
    assert.ok(
      renderFilterBadgesSection.includes('authorFilter'),
      'renderFilterBadges should check authorFilter'
    );
  });

  test('main.js should clear author filter from badge', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(
      source.includes("filterToRemove === 'author'") &&
      source.includes('/author:[^\\s]+/i'),
      'Filter badge clear handler should remove author: prefix'
    );
  });

  test('main.js should have author-filter-link click handler', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(
      source.includes("e.target.classList.contains('author-filter-link')"),
      'main.js should handle click on author-filter-link elements'
    );
  });

  test('main.js should add author-filter-link class to author names', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(
      source.includes('author-filter-link'),
      'main.js should include author-filter-link class in author name rendering'
    );
  });

  test('styles.css should have author-filter-link styling', () => {
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.author-filter-link'), 'styles.css should have author-filter-link class');
    assert.ok(source.includes('cursor: pointer'), 'author-filter-link should have cursor pointer');
  });

  test('webviewProvider search placeholder should mention author: syntax', () => {
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(
      source.includes('author:name') || source.includes('author:'),
      'Search placeholder should mention author: filter syntax'
    );
  });

  test('hasActiveFilters should check authorFilter', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('hasActiveFilters'), 'main.js should have hasActiveFilters function');
    const hasActiveSection = source.substring(
      source.indexOf('function hasActiveFilters'),
      source.indexOf('function hasActiveDateFilters')
    );
    assert.ok(
      hasActiveSection.includes('authorFilter'),
      'hasActiveFilters should check authorFilter'
    );
  });
});
