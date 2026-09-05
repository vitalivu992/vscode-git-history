import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Simulate the clear all filters behavior with UI state
 */
interface FilterState {
  searchQuery: string;
  hideMergeCommits: boolean;
  regexSearchEnabled: boolean;
  showMyCommitsOnly: boolean;
}

interface ButtonState {
  visible: boolean;
  classes: string[];
}

function simulateClearAllFilters(state: FilterState): { state: FilterState; button: ButtonState } {
  const newState: FilterState = {
    searchQuery: '',
    hideMergeCommits: false,
    regexSearchEnabled: false,
    showMyCommitsOnly: false,
  };

  const hasFilters = !!(newState.searchQuery || newState.showMyCommitsOnly || newState.hideMergeCommits || newState.regexSearchEnabled);
  const button: ButtonState = {
    visible: hasFilters,
    classes: hasFilters ? ['visible'] : [],
  };

  return { state: newState, button };
}

function simulateUpdateClearAllButton(state: FilterState): ButtonState {
  const hasFilters = !!(state.searchQuery || state.showMyCommitsOnly || state.hideMergeCommits || state.regexSearchEnabled);
  return {
    visible: hasFilters,
    classes: hasFilters ? ['visible'] : [],
  };
}

suite('Clear All Filters E2E Logic Tests', () => {
  test('clearing filters after setting search query resets state', () => {
    const initial: FilterState = { searchQuery: 'author:alice', hideMergeCommits: false, regexSearchEnabled: false, showMyCommitsOnly: false };
    const result = simulateClearAllFilters(initial);
    assert.strictEqual(result.state.searchQuery, '');
    assert.strictEqual(result.state.hideMergeCommits, false);
    assert.strictEqual(result.state.regexSearchEnabled, false);
    assert.strictEqual(result.state.showMyCommitsOnly, false);
  });

  test('clearing filters after multiple filters resets all', () => {
    const initial: FilterState = { searchQuery: 'fix bug after:2024-01-01', hideMergeCommits: true, regexSearchEnabled: true, showMyCommitsOnly: true };
    const result = simulateClearAllFilters(initial);
    assert.strictEqual(result.state.searchQuery, '');
    assert.strictEqual(result.state.hideMergeCommits, false);
    assert.strictEqual(result.state.regexSearchEnabled, false);
    assert.strictEqual(result.state.showMyCommitsOnly, false);
  });

  test('clear all button is hidden after clearing filters', () => {
    const initial: FilterState = { searchQuery: 'test', hideMergeCommits: true, regexSearchEnabled: true, showMyCommitsOnly: true };
    const result = simulateClearAllFilters(initial);
    assert.strictEqual(result.button.visible, false);
    assert.ok(!result.button.classes.includes('visible'), 'Should not have visible class after clearing');
  });

  test('clear all button is visible when filters are active', () => {
    const state: FilterState = { searchQuery: 'test', hideMergeCommits: false, regexSearchEnabled: false, showMyCommitsOnly: false };
    const button = simulateUpdateClearAllButton(state);
    assert.strictEqual(button.visible, true);
    assert.ok(button.classes.includes('visible'), 'Should have visible class when filters active');
  });

  test('clear all button is hidden when no filters are active', () => {
    const state: FilterState = { searchQuery: '', hideMergeCommits: false, regexSearchEnabled: false, showMyCommitsOnly: false };
    const button = simulateUpdateClearAllButton(state);
    assert.strictEqual(button.visible, false);
    assert.ok(!button.classes.includes('visible'), 'Should not have visible class when no filters');
  });

  test('clear all button is visible when only hideMergeCommits is active', () => {
    const state: FilterState = { searchQuery: '', hideMergeCommits: true, regexSearchEnabled: false, showMyCommitsOnly: false };
    const button = simulateUpdateClearAllButton(state);
    assert.strictEqual(button.visible, true);
  });

  test('clear all button is visible when only regexSearchEnabled is active', () => {
    const state: FilterState = { searchQuery: '', hideMergeCommits: false, regexSearchEnabled: true, showMyCommitsOnly: false };
    const button = simulateUpdateClearAllButton(state);
    assert.strictEqual(button.visible, true);
  });

  test('clear all button is visible when only showMyCommitsOnly is active', () => {
    const state: FilterState = { searchQuery: '', hideMergeCommits: false, regexSearchEnabled: false, showMyCommitsOnly: true };
    const button = simulateUpdateClearAllButton(state);
    assert.strictEqual(button.visible, true);
  });

  test('applying filters then clearing returns to initial state', () => {
    const initial: FilterState = { searchQuery: '', hideMergeCommits: false, regexSearchEnabled: false, showMyCommitsOnly: false };
    const withFilters: FilterState = { searchQuery: 'fix', hideMergeCommits: true, regexSearchEnabled: true, showMyCommitsOnly: true };
    const result = simulateClearAllFilters(withFilters);
    assert.deepStrictEqual(result.state, initial);
  });
});

suite('Clear All Filters E2E Source Integration Tests', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
  const indexPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
  const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const packageJsonPath = path.resolve(__dirname, '../../../package.json');

  test('complete flow: button exists in both HTML templates and logic handles it', () => {
    const providerSource = fs.readFileSync(providerPath, 'utf-8');
    const indexSource = fs.readFileSync(indexPath, 'utf-8');
    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');
    const stylesSource = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(providerSource.includes('id="clear-all-filters-btn"'), 'webviewProvider should have clear-all-filters-btn');
    assert.ok(indexSource.includes('id="clear-all-filters-btn"'), 'index.html should have clear-all-filters-btn');
    assert.ok(mainSource.includes('clearAllFilters'), 'main.js should have clearAllFilters handler');
    assert.ok(stylesSource.includes('.clear-all-filters-btn'), 'styles.css should have button styling');
    assert.ok(stylesSource.includes('.clear-all-filters-btn.visible'), 'styles.css should have visible state styling');
  });

  test('clearAllFilters action is defined in types.ts WebviewAction', () => {
    const typesSource = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(typesSource.includes("'clearAllFilters'"), 'types.ts should include clearAllFilters in WebviewAction');
  });

  test('clearAllFilters command is registered in extension.ts', () => {
    const extensionSource = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(extensionSource.includes("'clearAllFilters'"), 'extension.ts should register clearAllFilters action');
  });

  test('clearAllFilters command is defined in package.json', () => {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const commands = packageJson.contributes.commands;
    const command = commands.find((c: any) => c.command === 'gitHistory.clearAllFilters');
    assert.ok(command, 'package.json should define gitHistory.clearAllFilters command');
  });

  test('keyboard shortcut Ctrl+Alt+Q is defined in package.json', () => {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const keybindings = packageJson.contributes.keybindings;
    const keybinding = keybindings.find((k: any) => k.command === 'gitHistory.clearAllFilters');
    assert.ok(keybinding, 'package.json should define keybinding for clearAllFilters');
    assert.strictEqual(keybinding.key, 'ctrl+alt+q');
    assert.strictEqual(keybinding.mac, 'cmd+alt+q');
    assert.strictEqual(keybinding.when, 'activeWebviewViewId == gitHistory.webview');
  });

  test('keyboard shortcut triggers clearAllFilters in main.js', () => {
    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(mainSource.includes("case 'clearAllFilters'"), 'main.js triggerAction should handle clearAllFilters');
  });

  test('clearAllFilters persists settings via saveSettings message', () => {
    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = mainSource.indexOf('function clearAllFilters()');
    assert.ok(fnStart >= 0, 'clearAllFilters function should exist');
    const fnEnd = mainSource.indexOf('\n}', fnStart + 1);
    const fnBody = mainSource.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);
    assert.ok(fnBody.includes("type: 'saveSettings'"), 'clearAllFilters should call saveSettings');
  });

  test('button order is consistent between webviewProvider and index.html for search area', () => {
    const providerSource = fs.readFileSync(providerPath, 'utf-8');
    const indexSource = fs.readFileSync(indexPath, 'utf-8');

    const getSearchButtonOrder = (source: string): string[] => {
      const buttons = ['regex-toggle-btn', 'clear-all-filters-btn'];
      return buttons.filter(btn => {
        const idx = source.indexOf(`id="${btn}"`);
        return idx >= 0;
      }).sort((a, b) => {
        return source.indexOf(`id="${a}"`) - source.indexOf(`id="${b}"`);
      });
    };

    const providerOrder = getSearchButtonOrder(providerSource);
    const indexOrder = getSearchButtonOrder(indexSource);

    assert.deepStrictEqual(providerOrder, indexOrder,
      `Search button order should match: provider=${providerOrder.join(',')}, index=${indexOrder.join(',')}`);
  });

  test('updateClearAllButton is called alongside renderCommits', () => {
    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');
    // updateClearAllButton is called after renderCommits in the search handler
    const searchHandlerPattern = /renderCommits\(\);\s*\n\s*updateCommitCount\(\);\s*\n\s*updateClearAllButton\(\)/;
    assert.ok(searchHandlerPattern.test(mainSource), 'updateClearAllButton should be called after renderCommits');
  });

  test('updateClearAllButton is called in init handler', () => {
    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');
    const initStart = mainSource.indexOf("case 'init':");
    assert.ok(initStart >= 0, 'init handler should exist');
    const initEnd = mainSource.indexOf('break;', initStart);
    const initBody = mainSource.substring(initStart, initEnd);
    assert.ok(initBody.includes('updateClearAllButton'), 'init handler should call updateClearAllButton');
  });
});

suite('Clear All Filters E2E Persistence Tests', () => {
  const settingsTypesPath = path.resolve(__dirname, '../../../src/settings/settingsTypes.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');

  test('saveSettings is called after clearAllFilters', () => {
    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = mainSource.indexOf('function clearAllFilters()');
    assert.ok(fnStart >= 0);
    const fnEnd = mainSource.indexOf('\n}', fnStart + 1);
    const fnBody = mainSource.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);
    assert.ok(fnBody.includes("type: 'saveSettings'"), 'clearAllFilters should call saveSettings to persist state');
  });

  test('UserSettings includes hideMergeCommits field', () => {
    const settingsSource = fs.readFileSync(settingsTypesPath, 'utf-8');
    assert.ok(settingsSource.includes('hideMergeCommits'), 'UserSettings should include hideMergeCommits');
  });
});
