import * as assert from 'assert';

function parseDateFilter(query: string): { textQuery: string; dateFilters: { after?: Date; before?: Date }; authorFilter: string | null; tagFilter: string | null; branchFilter: string | null } {
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

  return { textQuery: textQuery.trim(), dateFilters, authorFilter, tagFilter, branchFilter };
}

suite('Branch Filter Tests', () => {
  test('parseDateFilter should extract branch filter from query', () => {
    const result = parseDateFilter('branch:main feature');
    assert.strictEqual(result.branchFilter, 'main');
    assert.strictEqual(result.textQuery, 'feature');
  });

  test('parseDateFilter should extract branch filter case-insensitively', () => {
    const result = parseDateFilter('BRANCH:feature/login bug fix');
    assert.strictEqual(result.branchFilter, 'feature/login');
    assert.strictEqual(result.textQuery, 'bug fix');
  });

  test('parseDateFilter should handle branch filter with special characters', () => {
    const result = parseDateFilter('branch:feature/login');
    assert.strictEqual(result.branchFilter, 'feature/login');
  });

  test('parseDateFilter should handle branch filter only', () => {
    const result = parseDateFilter('branch:main');
    assert.strictEqual(result.branchFilter, 'main');
    assert.strictEqual(result.textQuery, '');
  });

  test('parseDateFilter should handle branch combined with author filter', () => {
    const result = parseDateFilter('branch:main author:John');
    assert.strictEqual(result.branchFilter, 'main');
    assert.strictEqual(result.authorFilter, 'john');
  });

  test('parseDateFilter should handle branch combined with tag filter', () => {
    const result = parseDateFilter('branch:main tag:v1.0');
    assert.strictEqual(result.branchFilter, 'main');
    assert.strictEqual(result.tagFilter, 'v1.0');
  });

  test('parseDateFilter should handle branch combined with date filter', () => {
    const result = parseDateFilter('branch:main after:2024-01-01');
    assert.strictEqual(result.branchFilter, 'main');
    assert.ok(result.dateFilters.after);
  });

  test('parseDateFilter should handle branch combined with all filters', () => {
    const result = parseDateFilter('branch:main author:John tag:v1.0 after:2024-01-01 fix bug');
    assert.strictEqual(result.branchFilter, 'main');
    assert.strictEqual(result.authorFilter, 'john');
    assert.strictEqual(result.tagFilter, 'v1.0');
    assert.ok(result.dateFilters.after);
    assert.strictEqual(result.textQuery, 'fix bug');
  });

  test('parseDateFilter should return null for branch filter when not present', () => {
    const result = parseDateFilter('author:John tag:v1.0');
    assert.strictEqual(result.branchFilter, null);
  });
});
