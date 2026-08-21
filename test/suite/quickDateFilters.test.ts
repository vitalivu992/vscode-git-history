import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

function parseDateFilter(query: string): { textQuery: string; dateFilters: { after?: Date; before?: Date }; lastFilter: string | null } {
  const dateFilters: { after?: Date; before?: Date } = {};
  let textQuery = query;

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

  return { textQuery: textQuery.trim(), dateFilters, lastFilter: lastMatch ? lastMatch[0] : null };
}

interface QuickDateFilterState {
  searchQuery: string;
  activeButton: string | null;
}

function applyQuickDateFilter(state: QuickDateFilterState, filterValue: string): QuickDateFilterState {
  const { lastFilter, textQuery } = parseDateFilter(state.searchQuery);
  const otherParts = textQuery || '';

  if (lastFilter === filterValue) {
    return { searchQuery: otherParts, activeButton: null };
  } else {
    return {
      searchQuery: filterValue + (otherParts ? ' ' + otherParts : ''),
      activeButton: filterValue
    };
  }
}

suite('Quick Date Range Filter Tests', () => {
  suite('applyQuickDateFilter', () => {
    test('applies last:1day filter when no filter active', () => {
      const result = applyQuickDateFilter({ searchQuery: '', activeButton: null }, 'last:1day');
      assert.strictEqual(result.searchQuery, 'last:1day');
      assert.strictEqual(result.activeButton, 'last:1day');
    });

    test('applies last:7days filter when no filter active', () => {
      const result = applyQuickDateFilter({ searchQuery: '', activeButton: null }, 'last:7days');
      assert.strictEqual(result.searchQuery, 'last:7days');
      assert.strictEqual(result.activeButton, 'last:7days');
    });

    test('applies last:1month filter when no filter active', () => {
      const result = applyQuickDateFilter({ searchQuery: '', activeButton: null }, 'last:1month');
      assert.strictEqual(result.searchQuery, 'last:1month');
      assert.strictEqual(result.activeButton, 'last:1month');
    });

    test('removes filter when clicking same button twice (toggle off)', () => {
      const result = applyQuickDateFilter({ searchQuery: 'last:1day', activeButton: 'last:1day' }, 'last:1day');
      assert.strictEqual(result.searchQuery, '');
      assert.strictEqual(result.activeButton, null);
    });

    test('removes last:7days filter when toggling off', () => {
      const result = applyQuickDateFilter({ searchQuery: 'last:7days', activeButton: 'last:7days' }, 'last:7days');
      assert.strictEqual(result.searchQuery, '');
      assert.strictEqual(result.activeButton, null);
    });

    test('switches filter when clicking different button', () => {
      const result = applyQuickDateFilter({ searchQuery: 'last:1day', activeButton: 'last:1day' }, 'last:7days');
      assert.strictEqual(result.searchQuery, 'last:7days');
      assert.strictEqual(result.activeButton, 'last:7days');
    });

    test('preserves text query when applying filter', () => {
      const result = applyQuickDateFilter({ searchQuery: 'bug fix', activeButton: null }, 'last:7days');
      assert.strictEqual(result.searchQuery, 'last:7days bug fix');
      assert.strictEqual(result.activeButton, 'last:7days');
    });

    test('preserves text query when toggling off', () => {
      const result = applyQuickDateFilter({ searchQuery: 'last:7days bug fix', activeButton: 'last:7days' }, 'last:7days');
      assert.strictEqual(result.searchQuery, 'bug fix');
      assert.strictEqual(result.activeButton, null);
    });

    test('switches filter while preserving text query', () => {
      const result = applyQuickDateFilter({ searchQuery: 'last:1day bug fix', activeButton: 'last:1day' }, 'last:7days');
      assert.strictEqual(result.searchQuery, 'last:7days bug fix');
      assert.strictEqual(result.activeButton, 'last:7days');
    });
  });

  suite('parseDateFilter with lastFilter', () => {
    test('returns lastFilter for last:1day', () => {
      const result = parseDateFilter('last:1day');
      assert.strictEqual(result.lastFilter, 'last:1day');
      assert.strictEqual(result.textQuery, '');
    });

    test('returns lastFilter for last:7days', () => {
      const result = parseDateFilter('last:7days');
      assert.strictEqual(result.lastFilter, 'last:7days');
      assert.strictEqual(result.textQuery, '');
    });

    test('returns lastFilter for last:1month', () => {
      const result = parseDateFilter('last:1month');
      assert.strictEqual(result.lastFilter, 'last:1month');
      assert.strictEqual(result.textQuery, '');
    });

    test('returns null lastFilter for text-only query', () => {
      const result = parseDateFilter('bug fix');
      assert.strictEqual(result.lastFilter, null);
      assert.strictEqual(result.textQuery, 'bug fix');
    });

    test('returns lastFilter with remaining text query', () => {
      const result = parseDateFilter('last:7days bug fix');
      assert.strictEqual(result.lastFilter, 'last:7days');
      assert.strictEqual(result.textQuery, 'bug fix');
    });

    test('returns null lastFilter for after: filter', () => {
      const result = parseDateFilter('after:2024-01-01');
      assert.strictEqual(result.lastFilter, null);
    });
  });

  suite('Quick Date Filter Combinations', () => {
    test('quick date filter works with author filter', () => {
      const result = applyQuickDateFilter({ searchQuery: 'author:alice', activeButton: null }, 'last:7days');
      assert.ok(result.searchQuery.includes('last:7days'));
      assert.strictEqual(result.activeButton, 'last:7days');
    });

    test('toggling off preserves author filter text', () => {
      const result = applyQuickDateFilter({ searchQuery: 'last:7days author:alice', activeButton: 'last:7days' }, 'last:7days');
      assert.strictEqual(result.searchQuery, 'author:alice');
      assert.strictEqual(result.activeButton, null);
    });

    test('switching from month to week preserves text query', () => {
      const result = applyQuickDateFilter({ searchQuery: 'last:1month fix', activeButton: 'last:1month' }, 'last:7days');
      assert.strictEqual(result.searchQuery, 'last:7days fix');
      assert.strictEqual(result.activeButton, 'last:7days');
    });
  });
});

suite('Quick Date Filter Source Verification Tests', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const webviewProviderPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
  const cssPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
  const indexPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');

  test('main.js defines applyQuickDateFilter function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function applyQuickDateFilter('), 'main.js should define applyQuickDateFilter function');
  });

  test('main.js defines updateQuickDateFilterButtons function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function updateQuickDateFilterButtons()'), 'main.js should define updateQuickDateFilterButtons function');
  });

  test('main.js references today-filter-btn element', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("getElementById('today-filter-btn')"), 'main.js should reference today-filter-btn');
  });

  test('main.js references this-week-filter-btn element', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("getElementById('this-week-filter-btn')"), 'main.js should reference this-week-filter-btn');
  });

  test('main.js references this-month-filter-btn element', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("getElementById('this-month-filter-btn')"), 'main.js should reference this-month-filter-btn');
  });

  test('main.js binds click event on today-filter-btn', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("todayFilterBtn.addEventListener"), 'main.js should bind event on todayFilterBtn');
  });

  test('main.js binds click event on this-week-filter-btn', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("thisWeekFilterBtn.addEventListener"), 'main.js should bind event on thisWeekFilterBtn');
  });

  test('main.js binds click event on this-month-filter-btn', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("thisMonthFilterBtn.addEventListener"), 'main.js should bind event on thisMonthFilterBtn');
  });

  test('applyQuickDateFilter uses last:1day for today', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("applyQuickDateFilter('last:1day')"), 'Today button should use last:1day');
  });

  test('applyQuickDateFilter uses last:7days for week', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("applyQuickDateFilter('last:7days')"), 'Week button should use last:7days');
  });

  test('applyQuickDateFilter uses last:1month for month', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("applyQuickDateFilter('last:1month')"), 'Month button should use last:1month');
  });

  test('clearAllFilters resets quick date filter buttons', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function clearAllFilters()');
    assert.ok(fnStart >= 0, 'clearAllFilters function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);
    assert.ok(fnBody.includes('updateQuickDateFilterButtons()'), 'clearAllFilters should call updateQuickDateFilterButtons');
  });

  test('handleSearch calls updateQuickDateFilterButtons', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function handleSearch(');
    assert.ok(fnStart >= 0, 'handleSearch function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);
    assert.ok(fnBody.includes('updateQuickDateFilterButtons()'), 'handleSearch should call updateQuickDateFilterButtons');
  });

  test('init handler calls updateQuickDateFilterButtons for saved query', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    // Check that updateQuickDateFilterButtons is called after applying saved search query
    const initSection = source.substring(
      source.indexOf('case \'init\':'),
      source.indexOf('break;', source.indexOf('case \'init\':') + 1)
    );
    assert.ok(initSection.includes('updateQuickDateFilterButtons()'), 'init handler should sync quick date filter buttons');
  });

  test('webviewProvider.ts includes today-filter-btn', () => {
    const source = fs.readFileSync(webviewProviderPath, 'utf-8');
    assert.ok(source.includes('id="today-filter-btn"'), 'webviewProvider.ts should include today-filter-btn');
  });

  test('webviewProvider.ts includes this-week-filter-btn', () => {
    const source = fs.readFileSync(webviewProviderPath, 'utf-8');
    assert.ok(source.includes('id="this-week-filter-btn"'), 'webviewProvider.ts should include this-week-filter-btn');
  });

  test('webviewProvider.ts includes this-month-filter-btn', () => {
    const source = fs.readFileSync(webviewProviderPath, 'utf-8');
    assert.ok(source.includes('id="this-month-filter-btn"'), 'webviewProvider.ts should include this-month-filter-btn');
  });

  test('webviewProvider.ts includes date-filter-buttons container', () => {
    const source = fs.readFileSync(webviewProviderPath, 'utf-8');
    assert.ok(source.includes('class="date-filter-buttons"'), 'webviewProvider.ts should include date-filter-buttons container');
  });

  test('index.html includes today-filter-btn', () => {
    const source = fs.readFileSync(indexPath, 'utf-8');
    assert.ok(source.includes('id="today-filter-btn"'), 'index.html should include today-filter-btn');
  });

  test('index.html includes this-week-filter-btn', () => {
    const source = fs.readFileSync(indexPath, 'utf-8');
    assert.ok(source.includes('id="this-week-filter-btn"'), 'index.html should include this-week-filter-btn');
  });

  test('index.html includes this-month-filter-btn', () => {
    const source = fs.readFileSync(indexPath, 'utf-8');
    assert.ok(source.includes('id="this-month-filter-btn"'), 'index.html should include this-month-filter-btn');
  });

  test('styles.css defines date-filter-btn class', () => {
    const source = fs.readFileSync(cssPath, 'utf-8');
    assert.ok(source.includes('.date-filter-btn'), 'styles.css should define date-filter-btn class');
  });

  test('styles.css defines date-filter-btn.active state', () => {
    const source = fs.readFileSync(cssPath, 'utf-8');
    assert.ok(source.includes('.date-filter-btn.active'), 'styles.css should define active state');
  });

  test('styles.css defines date-filter-buttons container', () => {
    const source = fs.readFileSync(cssPath, 'utf-8');
    assert.ok(source.includes('.date-filter-buttons'), 'styles.css should define date-filter-buttons container');
  });
});
