import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

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

suite('Branch Filter Placeholder Discoverability Tests', () => {
  const indexHtmlPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
  const webviewProviderPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');

  test('index.html search placeholder should include branch:name hint', () => {
    const source = fs.readFileSync(indexHtmlPath, 'utf-8');
    assert.ok(
      source.includes('branch:name'),
      'index.html search placeholder should contain branch:name for discoverability'
    );
  });

  test('webviewProvider.ts search placeholder should include branch:name hint', () => {
    const source = fs.readFileSync(webviewProviderPath, 'utf-8');
    assert.ok(
      source.includes('branch:name'),
      'webviewProvider.ts search placeholder should contain branch:name for discoverability'
    );
  });

  test('index.html and webviewProvider.ts should have matching search placeholders', () => {
    const indexSource = fs.readFileSync(indexHtmlPath, 'utf-8');
    const providerSource = fs.readFileSync(webviewProviderPath, 'utf-8');

    const indexPlaceholder = indexSource.match(/placeholder="([^"]+)"/)?.[1];
    const providerPlaceholder = providerSource.match(/placeholder="([^"]+)"/)?.[1];

    assert.ok(indexPlaceholder, 'index.html should have a placeholder attribute');
    assert.ok(providerPlaceholder, 'webviewProvider.ts should have a placeholder attribute');
    assert.strictEqual(indexPlaceholder, providerPlaceholder,
      'index.html and webviewProvider.ts should have identical search placeholders');
  });

  test('placeholder should list all filter types in logical order', () => {
    const source = fs.readFileSync(indexHtmlPath, 'utf-8');
    const placeholder = source.match(/placeholder="([^"]+)"/)?.[1];
    assert.ok(placeholder, 'Should have placeholder');

    const authorIdx = placeholder.indexOf('author:name');
    const tagIdx = placeholder.indexOf('tag:name');
    const branchIdx = placeholder.indexOf('branch:name');
    const afterIdx = placeholder.indexOf('after:');

    assert.ok(authorIdx > 0, 'Placeholder should mention author:name');
    assert.ok(tagIdx > 0, 'Placeholder should mention tag:name');
    assert.ok(branchIdx > 0, 'Placeholder should mention branch:name');
    assert.ok(afterIdx > 0, 'Placeholder should mention after:');
    assert.ok(authorIdx < tagIdx, 'author:name should come before tag:name');
    assert.ok(tagIdx < branchIdx, 'tag:name should come before branch:name');
    assert.ok(branchIdx < afterIdx, 'branch:name should come before after:');
  });
});

suite('HTML Parity Tests', () => {
  const indexHtmlPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
  const webviewProviderPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');

  test('index.html should have export-btn matching webviewProvider.ts', () => {
    const indexSource = fs.readFileSync(indexHtmlPath, 'utf-8');
    const providerSource = fs.readFileSync(webviewProviderPath, 'utf-8');

    assert.ok(
      indexSource.includes('id="export-btn"'),
      'index.html should have export-btn element'
    );
    assert.ok(
      providerSource.includes('id="export-btn"'),
      'webviewProvider.ts should have export-btn element'
    );
  });

  test('export-btn should be between merge-toggle-btn and refresh-btn in index.html', () => {
    const source = fs.readFileSync(indexHtmlPath, 'utf-8');

    const mergeIdx = source.indexOf('id="merge-toggle-btn"');
    const exportIdx = source.indexOf('id="export-btn"');
    const refreshIdx = source.indexOf('id="refresh-btn"');

    assert.ok(mergeIdx > 0, 'Should have merge-toggle-btn');
    assert.ok(exportIdx > 0, 'Should have export-btn');
    assert.ok(refreshIdx > 0, 'Should have refresh-btn');
    assert.ok(mergeIdx < exportIdx, 'export-btn should come after merge-toggle-btn');
    assert.ok(exportIdx < refreshIdx, 'export-btn should come before refresh-btn');
  });

  test('index.html toolbar buttons should match webviewProvider.ts toolbar buttons', () => {
    const indexSource = fs.readFileSync(indexHtmlPath, 'utf-8');
    const providerSource = fs.readFileSync(webviewProviderPath, 'utf-8');

    const toolbarButtonIds = [
      'unified-btn', 'side-by-side-btn', 'copy-btn', 'compare-parent-btn',
      'word-wrap-btn', 'sort-btn', 'merge-toggle-btn', 'export-btn', 'refresh-btn'
    ];

    for (const id of toolbarButtonIds) {
      assert.ok(
        indexSource.includes(`id="${id}"`),
        `index.html should have ${id}`
      );
      assert.ok(
        providerSource.includes(`id="${id}"`),
        `webviewProvider.ts should have ${id}`
      );
    }
  });
});
