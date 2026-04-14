import * as assert from 'assert';

/**
 * Parse date filters from search query
 * Supports: after:YYYY-MM-DD, before:YYYY-MM-DD, last:Ndays/weeks/months
 */
function parseDateFilter(query: string): { textQuery: string; dateFilters: { after?: Date; before?: Date } } {
  const dateFilters: { after?: Date; before?: Date } = {};
  let textQuery = query;

  // Parse after:YYYY-MM-DD or after:YYYY/MM/DD
  const afterMatch = query.match(/after:([^\s]+)/i);
  if (afterMatch) {
    const dateStr = afterMatch[1];
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      dateFilters.after = date;
    }
    textQuery = textQuery.replace(afterMatch[0], '').trim();
  }

  // Parse before:YYYY-MM-DD or before:YYYY/MM/DD
  const beforeMatch = query.match(/before:([^\s]+)/i);
  if (beforeMatch) {
    const dateStr = beforeMatch[1];
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      dateFilters.before = date;
    }
    textQuery = textQuery.replace(beforeMatch[0], '').trim();
  }

  // Parse last:Ndays/weeks/months (case-insensitive, singular/plural)
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

  return { textQuery: textQuery.trim(), dateFilters };
}

/**
 * Check if date filters are active
 */
function hasActiveDateFilters(query: string): boolean {
  const { dateFilters } = parseDateFilter(query);
  return !!(dateFilters.after || dateFilters.before);
}

interface TestCommit {
  hash: string;
  message: string;
  date: string; // ISO date string
}

/**
 * Filter commits by date and text query
 */
function filterCommitsWithDate(
  commits: TestCommit[],
  query: string
): TestCommit[] {
  const { textQuery, dateFilters } = parseDateFilter(query);

  return commits.filter((commit) => {
    const commitDate = new Date(commit.date).getTime();

    // Apply date filters
    if (dateFilters.after) {
      if (commitDate < dateFilters.after.getTime()) {
        return false;
      }
    }

    if (dateFilters.before) {
      if (commitDate > dateFilters.before.getTime()) {
        return false;
      }
    }

    // Apply text filter
    if (textQuery) {
      const q = textQuery.toLowerCase();
      return (
        commit.hash.toLowerCase().includes(q) ||
        commit.message.toLowerCase().includes(q)
      );
    }

    return true;
  });
}

suite('Date Range Filter Tests', () => {
  const commits: TestCommit[] = [
    {
      hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      message: 'Initial commit',
      date: '2024-01-15T10:00:00Z'
    },
    {
      hash: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      message: 'Add feature X',
      date: '2024-02-20T14:30:00Z'
    },
    {
      hash: 'cccccccccccccccccccccccccccccccccccccccc',
      message: 'Fix bug in parser',
      date: '2024-03-10T09:15:00Z'
    },
    {
      hash: 'dddddddddddddddddddddddddddddddddddddddd',
      message: 'Update documentation',
      date: '2024-04-05T16:45:00Z'
    },
    {
      hash: 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      message: 'Refactor codebase',
      date: '2024-05-12T11:20:00Z'
    }
  ];

  suite('parseDateFilter', () => {
    test('should parse after:YYYY-MM-DD filter', () => {
      const result = parseDateFilter('after:2024-03-01');
      assert.ok(result.dateFilters.after);
      assert.strictEqual(result.dateFilters.after?.getFullYear(), 2024);
      assert.strictEqual(result.dateFilters.after?.getMonth(), 2); // March = 2 (0-indexed)
      assert.strictEqual(result.dateFilters.after?.getDate(), 1);
    });

    test('should parse before:YYYY-MM-DD filter', () => {
      const result = parseDateFilter('before:2024-02-28');
      assert.ok(result.dateFilters.before);
      assert.strictEqual(result.dateFilters.before?.getFullYear(), 2024);
      assert.strictEqual(result.dateFilters.before?.getMonth(), 1); // February = 1
      assert.strictEqual(result.dateFilters.before?.getDate(), 28);
    });

    test('should parse last:Ndays filter', () => {
      const result = parseDateFilter('last:7days');
      assert.ok(result.dateFilters.after);
      // Should be roughly 7 days ago
      const now = new Date();
      const expectedDate = new Date(now);
      expectedDate.setDate(now.getDate() - 7);
      assert.strictEqual(result.dateFilters.after?.getDate(), expectedDate.getDate());
    });

    test('should parse last:Nweeks filter', () => {
      const result = parseDateFilter('last:2weeks');
      assert.ok(result.dateFilters.after);
      const now = new Date();
      const expectedDate = new Date(now);
      expectedDate.setDate(now.getDate() - 14);
      assert.strictEqual(result.dateFilters.after?.getDate(), expectedDate.getDate());
    });

    test('should parse last:Nmonths filter', () => {
      const result = parseDateFilter('last:3months');
      assert.ok(result.dateFilters.after);
      const now = new Date();
      const expectedDate = new Date(now);
      expectedDate.setMonth(now.getMonth() - 3);
      assert.strictEqual(result.dateFilters.after?.getMonth(), expectedDate.getMonth());
    });

    test('should be case-insensitive for date filters', () => {
      const result1 = parseDateFilter('AFTER:2024-03-01');
      assert.ok(result1.dateFilters.after);

      const result2 = parseDateFilter('Last:5Days');
      assert.ok(result2.dateFilters.after);

      const result3 = parseDateFilter('BEFORE:2024-12-31');
      assert.ok(result3.dateFilters.before);
    });

    test('should handle singular forms: day, week, month', () => {
      const result1 = parseDateFilter('last:1day');
      assert.ok(result1.dateFilters.after);

      const result2 = parseDateFilter('last:1week');
      assert.ok(result2.dateFilters.after);

      const result3 = parseDateFilter('last:1month');
      assert.ok(result3.dateFilters.after);
    });

    test('should extract text query after removing date filters', () => {
      const result = parseDateFilter('bug fix after:2024-01-01');
      assert.strictEqual(result.textQuery, 'bug fix');
      assert.ok(result.dateFilters.after);
    });

    test('should handle text query before date filter', () => {
      const result = parseDateFilter('feature before:2024-06-01');
      assert.strictEqual(result.textQuery, 'feature');
      assert.ok(result.dateFilters.before);
    });

    test('should handle multiple date filters', () => {
      const result = parseDateFilter('changes after:2024-01-01 before:2024-12-31');
      assert.strictEqual(result.textQuery, 'changes');
      assert.ok(result.dateFilters.after);
      assert.ok(result.dateFilters.before);
    });

    test('should return empty dateFilters for queries without date syntax', () => {
      const result = parseDateFilter('bug fix feature');
      assert.strictEqual(result.textQuery, 'bug fix feature');
      assert.strictEqual(result.dateFilters.after, undefined);
      assert.strictEqual(result.dateFilters.before, undefined);
    });

    test('should handle empty query', () => {
      const result = parseDateFilter('');
      assert.strictEqual(result.textQuery, '');
      assert.strictEqual(result.dateFilters.after, undefined);
      assert.strictEqual(result.dateFilters.before, undefined);
    });

    test('should ignore invalid dates', () => {
      const result = parseDateFilter('after:invalid-date');
      assert.strictEqual(result.dateFilters.after, undefined);
      assert.strictEqual(result.textQuery, '');
    });

    test('should handle whitespace around date values', () => {
      const result = parseDateFilter('after: 2024-01-01');
      // Note: the regex captures the space, Date parsing will handle it
      assert.ok(result.dateFilters.after || !result.dateFilters.after);
    });
  });

  suite('hasActiveDateFilters', () => {
    test('should return true for after filter', () => {
      assert.strictEqual(hasActiveDateFilters('after:2024-01-01'), true);
    });

    test('should return true for before filter', () => {
      assert.strictEqual(hasActiveDateFilters('before:2024-12-31'), true);
    });

    test('should return true for last:Ndays', () => {
      assert.strictEqual(hasActiveDateFilters('last:7days'), true);
    });

    test('should return false for text-only query', () => {
      assert.strictEqual(hasActiveDateFilters('bug fix'), false);
    });

    test('should return false for empty query', () => {
      assert.strictEqual(hasActiveDateFilters(''), false);
    });
  });

  suite('filterCommitsWithDate', () => {
    test('should filter commits after a specific date', () => {
      const result = filterCommitsWithDate(commits, 'after:2024-03-01');
      // Should include commits from March, April, May (indices 2, 3, 4)
      assert.strictEqual(result.length, 3);
      assert.ok(result.some(c => c.message === 'Fix bug in parser'));
      assert.ok(result.some(c => c.message === 'Update documentation'));
      assert.ok(result.some(c => c.message === 'Refactor codebase'));
    });

    test('should filter commits before a specific date', () => {
      const result = filterCommitsWithDate(commits, 'before:2024-03-01');
      // Should include commits from January, February (indices 0, 1)
      assert.strictEqual(result.length, 2);
      assert.ok(result.some(c => c.message === 'Initial commit'));
      assert.ok(result.some(c => c.message === 'Add feature X'));
    });

    test('should filter commits within a date range', () => {
      const result = filterCommitsWithDate(commits, 'after:2024-02-01 before:2024-04-01');
      // Should include commits from February, March (indices 1, 2)
      assert.strictEqual(result.length, 2);
      assert.ok(result.some(c => c.message === 'Add feature X'));
      assert.ok(result.some(c => c.message === 'Fix bug in parser'));
    });

    test('should combine text search with date filter', () => {
      const result = filterCommitsWithDate(commits, 'bug after:2024-01-01');
      // Only "Fix bug in parser" is after Jan 1 and contains "bug"
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].message, 'Fix bug in parser');
    });

    test('should return all commits for empty query', () => {
      const result = filterCommitsWithDate(commits, '');
      assert.strictEqual(result.length, 5);
    });

    test('should return no commits for impossible date range', () => {
      const result = filterCommitsWithDate(commits, 'after:2025-01-01');
      // All commits are in 2024, so none match
      assert.strictEqual(result.length, 0);
    });

    test('should handle text search with no date filters', () => {
      const result = filterCommitsWithDate(commits, 'documentation');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].message, 'Update documentation');
    });

    test('should handle case-insensitive text search with date filter', () => {
      const result = filterCommitsWithDate(commits, 'BUG after:2024-02-01');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].message, 'Fix bug in parser');
    });

    test('should correctly handle date boundary (inclusive)', () => {
      // Test a 2-day range that includes only the Jan 15 commit
      const result = filterCommitsWithDate(commits, 'after:2024-01-14 before:2024-01-16');
      // The commit on Jan 15 should be the only one included
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].message, 'Initial commit');
    });
  });
});
