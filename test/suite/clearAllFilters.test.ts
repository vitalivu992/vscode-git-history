import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Simulate hasActiveFilters logic from main.js
 */
function hasActiveFilters(state: {
  searchQuery: string;
  hideMergeCommits: boolean;
  regexSearchEnabled: boolean;
  showMyCommitsOnly: boolean;
}): boolean {
  return !!(state.searchQuery || state.showMyCommitsOnly || state.hideMergeCommits || state.regexSearchEnabled);
}

/**
 * Simulate clearAllFilters logic from main.js
 */
function clearAllFilters(state: {
  searchQuery: string;
  hideMergeCommits: boolean;
  regexSearchEnabled: boolean;
  showMyCommitsOnly: boolean;
}): {
  searchQuery: string;
  hideMergeCommits: boolean;
  regexSearchEnabled: boolean;
  showMyCommitsOnly: boolean;
} {
  return {
    searchQuery: '',
    hideMergeCommits: false,
    regexSearchEnabled: false,
    showMyCommitsOnly: false,
  };
}

suite('Clear All Filters Logic Tests', () => {
  test('clearAllFilters resets search query', () => {
    const state = clearAllFilters({ searchQuery: 'author:alice', hideMergeCommits: false, regexSearchEnabled: false, showMyCommitsOnly: false });
    assert.strictEqual(state.searchQuery, '');
  });

  test('clearAllFilters resets hideMergeCommits', () => {
    const state = clearAllFilters({ searchQuery: '', hideMergeCommits: true, regexSearchEnabled: false, showMyCommitsOnly: false });
    assert.strictEqual(state.hideMergeCommits, false);
  });

  test('clearAllFilters resets regexSearchEnabled', () => {
    const state = clearAllFilters({ searchQuery: '', hideMergeCommits: false, regexSearchEnabled: true, showMyCommitsOnly: false });
    assert.strictEqual(state.regexSearchEnabled, false);
  });

  test('clearAllFilters resets showMyCommitsOnly', () => {
    const state = clearAllFilters({ searchQuery: '', hideMergeCommits: false, regexSearchEnabled: false, showMyCommitsOnly: true });
    assert.strictEqual(state.showMyCommitsOnly, false);
  });

  test('clearAllFilters resets all filters at once', () => {
    const state = clearAllFilters({ searchQuery: 'fix bug', hideMergeCommits: true, regexSearchEnabled: true, showMyCommitsOnly: true });
    assert.strictEqual(state.searchQuery, '');
    assert.strictEqual(state.hideMergeCommits, false);
    assert.strictEqual(state.regexSearchEnabled, false);
    assert.strictEqual(state.showMyCommitsOnly, false);
  });

  test('hasActiveFilters returns true when search query is set', () => {
    assert.strictEqual(hasActiveFilters({ searchQuery: 'test', hideMergeCommits: false, regexSearchEnabled: false, showMyCommitsOnly: false }), true);
  });

  test('hasActiveFilters returns true when hideMergeCommits is on', () => {
    assert.strictEqual(hasActiveFilters({ searchQuery: '', hideMergeCommits: true, regexSearchEnabled: false, showMyCommitsOnly: false }), true);
  });

  test('hasActiveFilters returns true when regex is enabled', () => {
    assert.strictEqual(hasActiveFilters({ searchQuery: '', hideMergeCommits: false, regexSearchEnabled: true, showMyCommitsOnly: false }), true);
  });

  test('hasActiveFilters returns true when showMyCommitsOnly is on', () => {
    assert.strictEqual(hasActiveFilters({ searchQuery: '', hideMergeCommits: false, regexSearchEnabled: false, showMyCommitsOnly: true }), true);
  });

  test('hasActiveFilters returns false when no filters are active', () => {
    assert.strictEqual(hasActiveFilters({ searchQuery: '', hideMergeCommits: false, regexSearchEnabled: false, showMyCommitsOnly: false }), false);
  });

  test('hasActiveFilters returns false after clearAllFilters', () => {
    const cleared = clearAllFilters({ searchQuery: 'fix', hideMergeCommits: true, regexSearchEnabled: true, showMyCommitsOnly: true });
    assert.strictEqual(hasActiveFilters(cleared), false);
  });
});

suite('Clear All Filters Source Verification Tests', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const webviewProviderPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const packageJsonPath = path.resolve(__dirname, '../../../package.json');
  const cssPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
  const indexPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');

  test('main.js defines clearAllFilters function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function clearAllFilters()'), 'main.js should define clearAllFilters function');
  });

  test('main.js defines updateClearAllButton function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function updateClearAllButton()'), 'main.js should define updateClearAllButton function');
  });

  test('main.js defines hasActiveFilters function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function hasActiveFilters()'), 'main.js should define hasActiveFilters function');
  });

  test('clearAllFilters resets searchQuery in main.js', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function clearAllFilters()');
    assert.ok(fnStart >= 0, 'clearAllFilters function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);
    assert.ok(fnBody.includes("searchQuery = ''"), 'clearAllFilters should reset searchQuery');
  });

  test('clearAllFilters resets hideMergeCommits in main.js', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function clearAllFilters()');
    const fnEnd = source.indexOf('\n}', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);
    assert.ok(fnBody.includes('hideMergeCommits = false'), 'clearAllFilters should reset hideMergeCommits');
  });

  test('clearAllFilters resets regexSearchEnabled in main.js', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function clearAllFilters()');
    const fnEnd = source.indexOf('\n}', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);
    assert.ok(fnBody.includes('regexSearchEnabled = false'), 'clearAllFilters should reset regexSearchEnabled');
  });

  test('clearAllFilters resets showMyCommitsOnly in main.js', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function clearAllFilters()');
    const fnEnd = source.indexOf('\n}', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);
    assert.ok(fnBody.includes('showMyCommitsOnly = false'), 'clearAllFilters should reset showMyCommitsOnly');
  });

  test('clearAllFilters calls renderCommits in main.js', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function clearAllFilters()');
    const fnEnd = source.indexOf('\n}', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);
    assert.ok(fnBody.includes('renderCommits()'), 'clearAllFilters should call renderCommits');
  });

  test('clearAllFilters calls saveSettings in main.js', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function clearAllFilters()');
    const fnEnd = source.indexOf('\n}', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);
    assert.ok(fnBody.includes("type: 'saveSettings'"), 'clearAllFilters should call saveSettings');
  });

  test('clearAllFilters calls updateClearAllButton in main.js', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function clearAllFilters()');
    const fnEnd = source.indexOf('\n}', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);
    assert.ok(fnBody.includes('updateClearAllButton()'), 'clearAllFilters should call updateClearAllButton');
  });

  test('clearAllFilters calls renderFilterBadges in main.js', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function clearAllFilters()');
    const fnEnd = source.indexOf('\n}', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);
    assert.ok(fnBody.includes('renderFilterBadges()'), 'clearAllFilters should call renderFilterBadges');
  });

  test('types.ts includes clearAllFilters in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'clearAllFilters'"), 'types.ts should include clearAllFilters in WebviewAction');
  });


  test('webviewProvider.ts includes clear-all-filters-btn button', () => {
    const source = fs.readFileSync(webviewProviderPath, 'utf-8');
    assert.ok(source.includes('id="clear-all-filters-btn"'), 'webviewProvider.ts should include clear-all-filters-btn button');
  });

  test('index.html includes clear-all-filters-btn button', () => {
    const source = fs.readFileSync(indexPath, 'utf-8');
    assert.ok(source.includes('id="clear-all-filters-btn"'), 'index.html should include clear-all-filters-btn button');
  });

  test('styles.css defines clear-all-filters-btn styling', () => {
    const source = fs.readFileSync(cssPath, 'utf-8');
    assert.ok(source.includes('.clear-all-filters-btn'), 'styles.css should define clear-all-filters-btn class');
  });

  test('styles.css defines clear-all-filters-btn.visible state', () => {
    const source = fs.readFileSync(cssPath, 'utf-8');
    assert.ok(source.includes('.clear-all-filters-btn.visible'), 'styles.css should define visible state');
  });

  test('extension.ts registers clearAllFilters command', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("'clearAllFilters'"), 'extension.ts should register clearAllFilters action');
  });

  test('package.json defines gitHistory.clearAllFilters command', () => {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const commands = packageJson.contributes.commands;
    const command = commands.find((c: any) => c.command === 'gitHistory.clearAllFilters');
    assert.ok(command, 'package.json should define gitHistory.clearAllFilters command');
  });

  test('package.json defines clearAllFilters keybinding', () => {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const keybindings = packageJson.contributes.keybindings;
    const keybinding = keybindings.find((k: any) => k.command === 'gitHistory.clearAllFilters');
    assert.ok(keybinding, 'package.json should define keybinding for clearAllFilters');
    assert.strictEqual(keybinding.key, 'ctrl+alt+q');
    assert.strictEqual(keybinding.mac, 'cmd+alt+q');
    assert.strictEqual(keybinding.when, 'activeWebviewViewId == gitHistory.webview');
  });

  test('main.js binds click event on clear-all-filters-btn', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("clearAllFiltersBtn"), 'main.js should reference clearAllFiltersBtn');
    assert.ok(source.includes("clearAllFiltersBtn.addEventListener"), 'main.js should bind event on clearAllFiltersBtn');
  });

  test('main.js handles clearAllFilters triggerAction', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'clearAllFilters'"), 'main.js should handle clearAllFilters action');
    assert.ok(source.includes("clearAllFilters()"), 'clearAllFilters action should call clearAllFilters()');
  });
});
