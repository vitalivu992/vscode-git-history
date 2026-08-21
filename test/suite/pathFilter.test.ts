import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

function parseDateFilter(query: string): { textQuery: string; dateFilters: { after?: Date; before?: Date }; authorFilter: string | null; tagFilter: string | null; branchFilter: string | null; pathFilter: string | null } {
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

  const branchMatch = query.match(/branch:([^\s]+)/i);
  const branchFilter = branchMatch ? branchMatch[1].toLowerCase() : null;
  if (branchMatch) {
    textQuery = textQuery.replace(branchMatch[0], '').trim();
  }

  const pathMatch = query.match(/path:([^\s]+)/i);
  const pathFilter = pathMatch ? pathMatch[1].toLowerCase() : null;
  if (pathMatch) {
    textQuery = textQuery.replace(pathMatch[0], '').trim();
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

  const lastMatch = query.match(/last:(\d+)\s*(days?|weeks?|months?)/i);
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

  return { textQuery: textQuery.trim(), dateFilters, authorFilter, tagFilter, branchFilter, pathFilter };
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

interface CommitFileChange {
  path: string;
  additions: number;
  deletions: number;
}

function filterCommitsWithPath(
  commits: TestCommit[],
  query: string,
  commitFilesMap: Map<string, CommitFileChange[]>
): TestCommit[] {
  const { textQuery, dateFilters, authorFilter, tagFilter, branchFilter, pathFilter } = parseDateFilter(query);

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

  if (pathFilter) {
    filtered = filtered.filter(commit => {
      const files = commitFilesMap.get(commit.hash);
      if (!files) return false;
      return files.some(f => f.path.toLowerCase().includes(pathFilter));
    });
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
    filtered = filtered.filter(commit =>
      commit.message.toLowerCase().includes(textQuery.toLowerCase())
    );
  }

  return filtered;
}

// Test data
const testCommits: TestCommit[] = [
  { hash: 'abc123', shortHash: 'abc123', author: 'Alice', email: 'alice@example.com', date: '2024-01-15', message: 'Add main feature', tags: ['v1.0.0'], fullMessage: 'Add main feature' },
  { hash: 'def456', shortHash: 'def456', author: 'Bob', email: 'bob@example.com', date: '2024-01-20', message: 'Fix bug in utils', fullMessage: 'Fix bug in utils' },
  { hash: 'ghi789', shortHash: 'ghi789', author: 'Alice', email: 'alice@example.com', date: '2024-02-01', message: 'Update tests', tags: ['v1.1.0'], fullMessage: 'Update tests' },
  { hash: 'jkl012', shortHash: 'jkl012', author: 'Charlie', email: 'charlie@example.com', date: '2024-02-10', message: 'Refactor core', fullMessage: 'Refactor core' },
];

const commitFilesMap = new Map<string, CommitFileChange[]>([
  ['abc123', [{ path: 'src/main.ts', additions: 100, deletions: 10 }]],
  ['def456', [{ path: 'src/utils.ts', additions: 20, deletions: 5 }]],
  ['ghi789', [{ path: 'test/main.test.ts', additions: 50, deletions: 10 }]],
  ['jkl012', [{ path: 'src/core.ts', additions: 30, deletions: 20 }]],
]);

suite('pathFilter Tests', () => {
  test('parseDateFilter should extract path: filter (case-insensitive)', () => {
    const result = parseDateFilter('path:src/utils.ts');
    assert.equal(result.pathFilter, 'src/utils.ts');
    assert.equal(result.textQuery, '');
  });

  test('parseDateFilter should extract path: filter with full path', () => {
    const result = parseDateFilter('path:src/main.ts');
    assert.equal(result.pathFilter, 'src/main.ts');
  });

  test('parseDateFilter should extract path: filter case-insensitive', () => {
    const result = parseDateFilter('PATH:src/Main.ts');
    assert.equal(result.pathFilter, 'src/main.ts');
  });

  test('parseDateFilter should handle path with other filters', () => {
    const result = parseDateFilter('author:Alice path:src/main.ts');
    assert.equal(result.authorFilter, 'alice');
    assert.equal(result.pathFilter, 'src/main.ts');
  });

  test('parseDateFilter should strip path filter from textQuery', () => {
    const result = parseDateFilter('fix path:src/utils.ts');
    assert.equal(result.textQuery, 'fix');
    assert.equal(result.pathFilter, 'src/utils.ts');
  });

  test('filterCommitsWithPath should filter by file path', () => {
    const result = filterCommitsWithPath(testCommits, 'path:src/main.ts', commitFilesMap);
    assert.equal(result.length, 1);
    assert.equal(result[0].hash, 'abc123');
  });

  test('filterCommitsWithPath should filter by partial path match', () => {
    const result = filterCommitsWithPath(testCommits, 'path:src/', commitFilesMap);
    assert.equal(result.length, 3); // abc123, def456, jkl012 all have src/ files
  });

  test('filterCommitsWithPath should return empty for non-matching path', () => {
    const result = filterCommitsWithPath(testCommits, 'path:nonexistent.ts', commitFilesMap);
    assert.equal(result.length, 0);
  });

  test('filterCommitsWithPath should combine path filter with author filter', () => {
    const result = filterCommitsWithPath(testCommits, 'author:Alice path:src/', commitFilesMap);
    assert.equal(result.length, 1);
    assert.equal(result[0].hash, 'abc123');
  });

  test('filterCommitsWithPath should handle path + text query', () => {
    const result = filterCommitsWithPath(testCommits, 'path:src/main.ts Add', commitFilesMap);
    assert.equal(result.length, 1);
    assert.equal(result[0].hash, 'abc123');
  });
});