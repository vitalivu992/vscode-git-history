import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Quick Date Filters E2E Tests', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const stylesCssPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');

  let mainJsSource: string;
  let stylesCssSource: string;

  suiteSetup(() => {
    mainJsSource = fs.readFileSync(mainJsPath, 'utf-8');
    stylesCssSource = fs.readFileSync(stylesCssPath, 'utf-8');
  });

  suite('applyQuickDateFilter function', () => {
    test('applyQuickDateFilter function exists', () => {
      assert.ok(
        mainJsSource.includes('function applyQuickDateFilter'),
        'main.js should define applyQuickDateFilter function'
      );
    });

    test('applyQuickDateFilter handles toggle behavior when same filter clicked', () => {
      assert.ok(
        mainJsSource.includes('if (lastFilter === filterValue)'),
        'applyQuickDateFilter should check if lastFilter equals filterValue for toggle'
      );
      assert.ok(
        mainJsSource.includes('searchQuery = otherParts'),
        'applyQuickDateFilter should remove filter when toggling off'
      );
    });

    test('applyQuickDateFilter appends filter when different filter selected', () => {
      assert.ok(
        mainJsSource.includes("searchQuery = filterValue + (otherParts ? ' ' + otherParts : '')"),
        'applyQuickDateFilter should append filter to search query when different'
      );
    });

    test('applyQuickDateFilter uses correct filter values', () => {
      assert.ok(
        mainJsSource.includes("'last:1day'"),
        'applyQuickDateFilter should use last:1day filter value for Today button'
      );
      assert.ok(
        mainJsSource.includes("'last:7days'"),
        'applyQuickDateFilter should use last:7days filter value for Week button'
      );
      assert.ok(
        mainJsSource.includes("'last:1month'"),
        'applyQuickDateFilter should use last:1month filter value for Month button'
      );
    });

    test('applyQuickDateFilter updates UI state', () => {
      assert.ok(
        mainJsSource.includes('updateQuickDateFilterButtons()'),
        'applyQuickDateFilter should call updateQuickDateFilterButtons to sync button states'
      );
      assert.ok(
        mainJsSource.includes('searchInput.value = searchQuery'),
        'applyQuickDateFilter should update search input value'
      );
      assert.ok(
        mainJsSource.includes('renderCommits()'),
        'applyQuickDateFilter should re-render commits with new filter'
      );
      assert.ok(
        mainJsSource.includes('updateCommitCount()'),
        'applyQuickDateFilter should update commit count display'
      );
      assert.ok(
        mainJsSource.includes('renderFilterBadges()'),
        'applyQuickDateFilter should render filter badges'
      );
      assert.ok(
        mainJsSource.includes('updateClearAllButton()'),
        'applyQuickDateFilter should update clear all button visibility'
      );
      assert.ok(
        mainJsSource.includes("type: 'saveSettings'"),
        'applyQuickDateFilter should save settings to persist filter state'
      );
    });
  });

  suite('updateQuickDateFilterButtons function', () => {
    test('updateQuickDateFilterButtons function exists', () => {
      assert.ok(
        mainJsSource.includes('function updateQuickDateFilterButtons'),
        'main.js should define updateQuickDateFilterButtons function'
      );
    });

    test('updateQuickDateFilterButtons uses parseDateFilter to get lastFilter', () => {
      assert.ok(
        mainJsSource.includes('const { lastFilter } = parseDateFilter(searchQuery)'),
        'updateQuickDateFilterButtons should extract lastFilter from parseDateFilter'
      );
    });

    test('updateQuickDateFilterButtons removes active class from all buttons', () => {
      assert.ok(
        mainJsSource.includes('[todayFilterBtn, thisWeekFilterBtn, thisMonthFilterBtn].forEach(btn =>'),
        'updateQuickDateFilterButtons should iterate over all three filter buttons'
      );
      assert.ok(
        mainJsSource.includes("btn.classList.remove('active')"),
        'updateQuickDateFilterButtons should remove active class from each button'
      );
    });

    test('updateQuickDateFilterButtons adds active class based on lastFilter value', () => {
      assert.ok(
        mainJsSource.includes("lastFilter === 'last:1day'"),
        'updateQuickDateFilterButtons should check for last:1day filter'
      );
      assert.ok(
        mainJsSource.includes("todayFilterBtn.classList.add('active')"),
        'updateQuickDateFilterButtons should add active class to today button when filter matches'
      );
      assert.ok(
        mainJsSource.includes("lastFilter === 'last:7days'"),
        'updateQuickDateFilterButtons should check for last:7days filter'
      );
      assert.ok(
        mainJsSource.includes("thisWeekFilterBtn.classList.add('active')"),
        'updateQuickDateFilterButtons should add active class to week button when filter matches'
      );
      assert.ok(
        mainJsSource.includes("lastFilter === 'last:1month'"),
        'updateQuickDateFilterButtons should check for last:1month filter'
      );
      assert.ok(
        mainJsSource.includes("thisMonthFilterBtn.classList.add('active')"),
        'updateQuickDateFilterButtons should add active class to month button when filter matches'
      );
    });
  });

  suite('Button event listeners', () => {
    test('main.js should declare todayFilterBtn element reference', () => {
      assert.ok(
        mainJsSource.includes("const todayFilterBtn = document.getElementById('today-filter-btn')"),
        'main.js should get reference to today-filter-btn element'
      );
    });

    test('main.js should declare thisWeekFilterBtn element reference', () => {
      assert.ok(
        mainJsSource.includes("const thisWeekFilterBtn = document.getElementById('this-week-filter-btn')"),
        'main.js should get reference to this-week-filter-btn element'
      );
    });

    test('main.js should declare thisMonthFilterBtn element reference', () => {
      assert.ok(
        mainJsSource.includes("const thisMonthFilterBtn = document.getElementById('this-month-filter-btn')"),
        'main.js should get reference to this-month-filter-btn element'
      );
    });

    test('today filter button has click event listener calling applyQuickDateFilter', () => {
      assert.ok(
        mainJsSource.includes("todayFilterBtn.addEventListener('click', () => applyQuickDateFilter('last:1day'))") ||
        mainJsSource.includes("todayFilterBtn.addEventListener('click',function(){applyQuickDateFilter('last:1day')})"),
        'today filter button should call applyQuickDateFilter with last:1day on click'
      );
    });

    test('week filter button has click event listener calling applyQuickDateFilter', () => {
      assert.ok(
        mainJsSource.includes("thisWeekFilterBtn.addEventListener('click', () => applyQuickDateFilter('last:7days'))") ||
        mainJsSource.includes("thisWeekFilterBtn.addEventListener('click',function(){applyQuickDateFilter('last:7days')})"),
        'week filter button should call applyQuickDateFilter with last:7days on click'
      );
    });

    test('month filter button has click event listener calling applyQuickDateFilter', () => {
      assert.ok(
        mainJsSource.includes("thisMonthFilterBtn.addEventListener('click', () => applyQuickDateFilter('last:1month'))") ||
        mainJsSource.includes("thisMonthFilterBtn.addEventListener('click',function(){applyQuickDateFilter('last:1month')})"),
        'month filter button should call applyQuickDateFilter with last:1month on click'
      );
    });
  });

  suite('parseDateFilter function', () => {
    test('parseDateFilter function exists', () => {
      assert.ok(
        mainJsSource.includes('function parseDateFilter'),
        'main.js should define parseDateFilter function'
      );
    });

    test('parseDateFilter returns lastFilter property', () => {
      assert.ok(
        mainJsSource.includes('const lastFilter = lastMatch ? lastMatch[0] : null'),
        'parseDateFilter should extract lastMatch value as lastFilter'
      );
      assert.ok(
        mainJsSource.includes('lastFilter'),
        'parseDateFilter return value should include lastFilter property'
      );
    });

    test('parseDateFilter parses last:Ndays/weeks/months pattern', () => {
      assert.ok(
        mainJsSource.includes('/last:(\\d+)\\s*(day|days|week|weeks|month|months)/i'),
        'parseDateFilter should match last:N pattern with number and time unit'
      );
      assert.ok(
        mainJsSource.includes('const num = parseInt(lastMatch[1], 10)'),
        'parseDateFilter should parse the number from last:N pattern'
      );
      assert.ok(
        mainJsSource.includes('const unit = lastMatch[2].toLowerCase()'),
        'parseDateFilter should parse the unit from last:N pattern'
      );
    });
  });

  suite('CSS active state', () => {
    test('styles.css should define .date-filter-btn base style', () => {
      assert.ok(
        stylesCssSource.includes('.date-filter-btn'),
        'styles.css should define base date-filter-btn style'
      );
    });

    test('styles.css should define .date-filter-btn.active style', () => {
      assert.ok(
        stylesCssSource.includes('.date-filter-btn.active'),
        'styles.css should define active state for date-filter-btn'
      );
    });

    test('.date-filter-btn.active should have different styling from base state', () => {
      assert.ok(
        stylesCssSource.includes('.date-filter-btn.active {'),
        'styles.css should have separate style block for active state'
      );
      assert.ok(
        stylesCssSource.includes('.date-filter-btn.active') &&
        stylesCssSource.includes('background:') &&
        stylesCssSource.includes('color:') &&
        stylesCssSource.includes('border-color:'),
        'date-filter-btn.active should override background, color, and border-color'
      );
    });

    test('.date-filter-btn should have hover state', () => {
      assert.ok(
        stylesCssSource.includes('.date-filter-btn:hover') ||
        stylesCssSource.includes('.date-filter-btn:hover {'),
        'styles.css should define hover state for date-filter-btn'
      );
    });
  });

  suite('Integration with clearAllFilters', () => {
    test('clearAllFilters function exists', () => {
      assert.ok(
        mainJsSource.includes('function clearAllFilters'),
        'main.js should define clearAllFilters function'
      );
    });

    test('clearAllFilters calls updateQuickDateFilterButtons', () => {
      assert.ok(
        mainJsSource.includes('updateQuickDateFilterButtons()'),
        'clearAllFilters should call updateQuickDateFilterButtons to reset button states'
      );
      const clearAllFiltersMatch = mainJsSource.match(/function clearAllFilters\(\)\s*{[\s\S]*?^}/m);
      assert.ok(
        clearAllFiltersMatch && clearAllFiltersMatch[0].includes('updateQuickDateFilterButtons()'),
        'clearAllFilters function body should include updateQuickDateFilterButtons() call'
      );
    });

    test('clearAllFilters resets searchQuery which affects date filters', () => {
      const clearAllFiltersMatch = mainJsSource.match(/function clearAllFilters\(\)\s*{[\s\S]*?^}/m);
      assert.ok(
        clearAllFiltersMatch && clearAllFiltersMatch[0].includes("searchQuery = ''"),
        'clearAllFilters should reset searchQuery to empty string'
      );
    });
  });

  suite('UI integration', () => {
    test('index.html should have today-filter-btn element', () => {
      const indexHtmlPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
      const indexHtmlSource = fs.readFileSync(indexHtmlPath, 'utf-8');
      assert.ok(
        indexHtmlSource.includes('id="today-filter-btn"') ||
        indexHtmlSource.includes('id="today-filter-btn"'),
        'index.html should have today-filter-btn element'
      );
    });

    test('index.html should have this-week-filter-btn element', () => {
      const indexHtmlPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
      const indexHtmlSource = fs.readFileSync(indexHtmlPath, 'utf-8');
      assert.ok(
        indexHtmlSource.includes('id="this-week-filter-btn"'),
        'index.html should have this-week-filter-btn element'
      );
    });

    test('index.html should have this-month-filter-btn element', () => {
      const indexHtmlPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
      const indexHtmlSource = fs.readFileSync(indexHtmlPath, 'utf-8');
      assert.ok(
        indexHtmlSource.includes('id="this-month-filter-btn"'),
        'index.html should have this-month-filter-btn element'
      );
    });

    test('webviewProvider.ts should have matching button elements for parity', () => {
      const webviewProviderPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
      const webviewProviderSource = fs.readFileSync(webviewProviderPath, 'utf-8');
      assert.ok(
        webviewProviderSource.includes('today-filter-btn') ||
        webviewProviderSource.includes('id="today-filter-btn"'),
        'webviewProvider.ts should have today-filter-btn for dev-mode parity'
      );
    });
  });
});
