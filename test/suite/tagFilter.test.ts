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

function filterCommitsWithTag(
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

suite('Tag Filter Logic Tests', () => {
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
      tags: ['v2.0.0', 'release']
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
    },
    {
      hash: 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      shortHash: 'eeeeeee',
      author: 'Eve Adams',
      email: 'eve@example.com',
      date: '2024-05-01T08:00:00Z',
      message: 'Hotfix release',
      tags: ['v2.0.1', 'hotfix']
    }
  ];

  suite('parseDateFilter tag parsing', () => {
    test('should parse tag: filter', () => {
      const result = parseDateFilter('tag:v1.0.0');
      assert.strictEqual(result.tagFilter, 'v1.0.0');
    });

    test('should parse tag: filter case-insensitively', () => {
      const result = parseDateFilter('TAG:v2.0.0');
      assert.strictEqual(result.tagFilter, 'v2.0.0');
    });

    test('should return null tagFilter for queries without tag syntax', () => {
      const result = parseDateFilter('bug fix');
      assert.strictEqual(result.tagFilter, null);
    });

    test('should return null tagFilter for empty query', () => {
      const result = parseDateFilter('');
      assert.strictEqual(result.tagFilter, null);
    });

    test('should extract tag filter and leave remaining text query', () => {
      const result = parseDateFilter('tag:v1.0.0 fix');
      assert.strictEqual(result.tagFilter, 'v1.0.0');
      assert.strictEqual(result.textQuery, 'fix');
    });

    test('should extract tag filter with date filter', () => {
      const result = parseDateFilter('tag:v2.0.0 after:2024-02-01');
      assert.strictEqual(result.tagFilter, 'v2.0.0');
      assert.ok(result.dateFilters.after);
    });

    test('should extract tag filter with author filter', () => {
      const result = parseDateFilter('tag:v1.0.0 author:Alice');
      assert.strictEqual(result.tagFilter, 'v1.0.0');
      assert.strictEqual(result.authorFilter, 'alice');
    });

    test('should lowercase the tag filter value', () => {
      const result = parseDateFilter('tag:V2.0.0');
      assert.strictEqual(result.tagFilter, 'v2.0.0');
    });
  });

  suite('filterCommitsWithTag', () => {
    test('should filter by exact tag name', () => {
      const result = filterCommitsWithTag(commits, 'tag:v1.0.0');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].hash, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    });

    test('should filter by partial tag name', () => {
      const result = filterCommitsWithTag(commits, 'tag:v2');
      assert.strictEqual(result.length, 2);
      assert.ok(result.some(c => c.hash === 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'));
      assert.ok(result.some(c => c.hash === 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'));
    });

    test('should be case-insensitive', () => {
      const result = filterCommitsWithTag(commits, 'tag:V1.0.0');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].hash, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    });

    test('should return no results for non-matching tag', () => {
      const result = filterCommitsWithTag(commits, 'tag:nonexistent');
      assert.strictEqual(result.length, 0);
    });

    test('should return all commits for empty query', () => {
      const result = filterCommitsWithTag(commits, '');
      assert.strictEqual(result.length, 5);
    });

    test('should exclude commits without tags', () => {
      const result = filterCommitsWithTag(commits, 'tag:v1');
      assert.strictEqual(result.length, 1);
      assert.ok(!result.some(c => c.tags === undefined || c.tags.length === 0));
    });

    test('should filter by tag present in multi-tag commits', () => {
      const result = filterCommitsWithTag(commits, 'tag:hotfix');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].hash, 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');
    });

    test('should filter by tag present in multi-tag commits (release)', () => {
      const result = filterCommitsWithTag(commits, 'tag:release');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].hash, 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
    });

    test('should combine tag filter with text search', () => {
      const result = filterCommitsWithTag(commits, 'tag:v2.0.0 release');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].message, 'Add feature X');
    });

    test('should combine tag filter with date filter', () => {
      const result = filterCommitsWithTag(commits, 'tag:v2.0 after:2024-04-01');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].hash, 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');
    });

    test('should combine tag filter with author filter', () => {
      const result = filterCommitsWithTag(commits, 'tag:v2.0.0 author:Bob');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].hash, 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
    });

    test('should return no results when tag and author filter conflict', () => {
      const result = filterCommitsWithTag(commits, 'tag:v1.0.0 author:Bob');
      assert.strictEqual(result.length, 0);
    });

    test('should match partial tag name across multiple tags', () => {
      const result = filterCommitsWithTag(commits, 'tag:v2.0');
      assert.strictEqual(result.length, 2);
    });

    test('tag filter with date filter that excludes all', () => {
      const result = filterCommitsWithTag(commits, 'tag:v1.0.0 after:2025-01-01');
      assert.strictEqual(result.length, 0);
    });
  });
});

suite('Tag Filter Source Verification Tests', () => {
  test('main.js should render tag badges with tag-filter-link class', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(
      source.includes("tag-filter-link") && source.includes('data-tag='),
      'main.js should render tag badges with tag-filter-link class and data-tag attribute'
    );
  });

  test('main.js should have click handler for tag-filter-link', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(
      source.includes("e.target.classList.contains('tag-filter-link')"),
      'main.js should handle click on tag-filter-link elements'
    );
  });

  test('main.js tag filter handler should set search to tag: syntax', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const tagHandlerSection = source.substring(
      source.indexOf("e.target.classList.contains('tag-filter-link')"),
      source.indexOf("e.target.classList.contains('tag-filter-link')") + 500
    );
    assert.ok(
      tagHandlerSection.includes('searchInput.value = `tag:${tag}`'),
      'Tag filter click should set search input to tag: syntax'
    );
  });

  test('styles.css should have tag-filter-link styling', () => {
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.tag-filter-link'), 'styles.css should have tag-filter-link class');
    assert.ok(source.includes('cursor: pointer'), 'tag-filter-link should have cursor pointer');
    assert.ok(source.includes('text-decoration: underline'), 'tag-filter-link hover should have underline');
  });

  test('main.js should stop propagation on tag filter click', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const tagHandlerSection = source.substring(
      source.indexOf("e.target.classList.contains('tag-filter-link')"),
      source.indexOf("e.target.classList.contains('tag-filter-link')") + 500
    );
    assert.ok(
      tagHandlerSection.includes('e.stopPropagation()'),
      'Tag filter handler should call e.stopPropagation()'
    );
  });

  test('main.js should re-render commits after tag filter click', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const tagHandlerSection = source.substring(
      source.indexOf("e.target.classList.contains('tag-filter-link')"),
      source.indexOf("e.target.classList.contains('tag-filter-link')") + 500
    );
    assert.ok(
      tagHandlerSection.includes('renderCommits()') &&
      tagHandlerSection.includes('updateCommitCount()') &&
      tagHandlerSection.includes('renderFilterBadges()'),
      'Tag filter handler should call renderCommits, updateCommitCount, and renderFilterBadges'
    );
  });

  test('main.js tag filter should reset focusedIndex to -1', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const tagHandlerSection = source.substring(
      source.indexOf("e.target.classList.contains('tag-filter-link')"),
      source.indexOf("e.target.classList.contains('tag-filter-link')") + 500
    );
    assert.ok(
      tagHandlerSection.includes('focusedIndex = -1'),
      'Tag filter handler should reset focusedIndex to -1'
    );
  });

  test('main.js tag badges should use data-tag attribute with escaped tag name', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(
      source.includes('data-tag="${escapeHtml(t)}"'),
      'Tag badge should use data-tag attribute with escaped tag name'
    );
  });

  test('main.js parseDateFilter should parse tag: prefix and return tagFilter', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const parseDateFilterSection = source.substring(
      source.indexOf('function parseDateFilter'),
      source.indexOf('function hasActiveFilters')
    );
    assert.ok(
      parseDateFilterSection.includes('tag:'),
      'parseDateFilter should reference tag: syntax'
    );
    assert.ok(
      parseDateFilterSection.includes('tagFilter'),
      'parseDateFilter should track tagFilter state'
    );
    assert.ok(
      parseDateFilterSection.includes('tagMatch'),
      'parseDateFilter should use tagMatch regex'
    );
  });

  test('main.js getFilteredCommits should apply tagFilter against commit tags', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const getFilteredCommitsSection = source.substring(
      source.indexOf('function getFilteredCommits'),
      source.indexOf('function getOrderedCommits')
    );
    assert.ok(
      getFilteredCommitsSection.includes('tagFilter'),
      'getFilteredCommits should use tagFilter'
    );
    assert.ok(
      getFilteredCommitsSection.includes("commit.tags && commit.tags.some(t => t.toLowerCase().includes(tagFilter))"),
      'getFilteredCommits should filter by tag name matching tagFilter'
    );
  });

  test('main.js hasActiveFilters should check tagFilter', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const hasActiveSection = source.substring(
      source.indexOf('function hasActiveFilters'),
      source.indexOf('function hasActiveDateFilters')
    );
    assert.ok(
      hasActiveSection.includes('tagFilter'),
      'hasActiveFilters should check tagFilter'
    );
  });

  test('main.js renderFilterBadges should render tag filter badge', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const renderFilterBadgesSection = source.substring(
      source.indexOf('function renderFilterBadges'),
      source.indexOf('const GRAPH_COLORS')
    );
    assert.ok(
      renderFilterBadgesSection.includes('tagFilter'),
      'renderFilterBadges should check tagFilter'
    );
    assert.ok(
      renderFilterBadgesSection.includes('filter-badge-clear') &&
      renderFilterBadgesSection.includes('data-filter="tag"'),
      'renderFilterBadges should render tag filter badge with clear button'
    );
  });

  test('main.js badge clear handler should support tag filter removal', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(
      source.includes("filterToRemove === 'tag'") &&
      source.includes('/tag:[^\\s]+/i'),
      'Filter badge clear handler should remove tag: prefix'
    );
  });

  test('main.js parseDateFilter should strip tag: from textQuery', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const parseDateFilterSection = source.substring(
      source.indexOf('function parseDateFilter'),
      source.indexOf('function hasActiveFilters')
    );
    const tagMatchBlock = parseDateFilterSection.substring(
      parseDateFilterSection.indexOf('tagMatch'),
      parseDateFilterSection.indexOf('tagMatch') + 200
    );
    assert.ok(
      tagMatchBlock.includes('textQuery.replace(tagMatch[0]'),
      'parseDateFilter should strip tag: prefix from textQuery'
    );
  });

  test('index.html search placeholder should mention tag: syntax', () => {
    const indexPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
    const source = fs.readFileSync(indexPath, 'utf-8');

    assert.ok(
      source.includes('tag:name') || source.includes('tag:'),
      'Search placeholder should mention tag: filter syntax'
    );
  });

  test('webviewProvider search placeholder should mention tag: syntax', () => {
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(
      source.includes('tag:name') || source.includes('tag:'),
      'Search placeholder should mention tag: filter syntax'
    );
  });
});
