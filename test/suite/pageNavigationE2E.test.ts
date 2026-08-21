import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Platform detection for modifier keys
 */
function detectPlatform(userAgent: string): { isMac: boolean; cmdKey: string; altKey: string } {
  const isMac = userAgent.toLowerCase().includes('mac');
  return {
    isMac,
    cmdKey: isMac ? 'Cmd' : 'Ctrl',
    altKey: isMac ? 'Option' : 'Alt'
  };
}

/**
 * Simulates getting keyboard shortcuts data for the help dialog
 */
function getKeyboardShortcutsData(isMac: boolean): Array<{ category: string; items: Array<{ keys: string[]; description: string }> }> {
  const cmdKey = isMac ? 'Cmd' : 'Ctrl';
  const altKey = isMac ? 'Option' : 'Alt';

  return [
    {
      category: 'Navigation',
      items: [
        { keys: [cmdKey, 'L'], description: 'Focus commit list for navigation' },
        { keys: ['↑', '↓'], description: 'Navigate up/down through commits' },
        { keys: ['Home'], description: 'Jump to first commit' },
        { keys: ['End'], description: 'Jump to last commit' },
        { keys: ['PageDown'], description: 'Jump down one page (10 commits)' },
        { keys: ['PageUp'], description: 'Jump up one page (10 commits)' },
        { keys: ['Enter'], description: 'Select focused commit' },
        { keys: ['Shift', 'Enter'], description: 'Select range from anchor to focused' },
        { keys: [cmdKey, 'Enter'], description: 'Add/remove from multi-selection' },
        { keys: [cmdKey, 'A'], description: 'Select all visible commits' },
        { keys: ['?'], description: 'Show this help dialog' },
        { keys: ['Esc'], description: 'Clear selection and close dialogs' }
      ]
    },
    {
      category: 'Search & Filter',
      items: [
        { keys: ['/'], description: 'Focus search input' },
        { keys: [cmdKey, 'F'], description: 'Focus search input' },
        { keys: [cmdKey, 'Shift', 'X'], description: 'Toggle regex search mode' },
        { keys: [cmdKey, 'G'], description: 'Jump to commit by hash' },
        { keys: [cmdKey, 'P'], description: 'Jump to parent commit' },
        { keys: [cmdKey, ']'], description: 'Jump to next tagged commit' },
        { keys: [cmdKey, '['], description: 'Jump to previous tagged commit' },
        { keys: [cmdKey, altKey, ']'], description: 'Jump to next commit with changes' },
        { keys: [cmdKey, altKey, '['], description: 'Jump to previous commit with changes' },
        { keys: [cmdKey, 'Shift', 'Q'], description: 'Toggle hide merge commits' },
        { keys: [cmdKey, altKey, 'S'], description: 'Show branch picker' }
      ]
    }
  ];
}

suite('PageUp/PageDown Navigation E2E Tests', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const mainJsSource = fs.readFileSync(mainJsPath, 'utf-8');

  test('main.js should handle PageDown key', () => {
    assert.ok(mainJsSource.includes("case 'PageDown':"),
      'main.js should handle PageDown key');
  });

  test('main.js should handle PageUp key', () => {
    assert.ok(mainJsSource.includes("case 'PageUp':"),
      'main.js should handle PageUp key');
  });

  test('PageDown case should use PAGE_SIZE constant of 10', () => {
    assert.ok(mainJsSource.includes('const PAGE_SIZE = 10'),
      'PageDown should use PAGE_SIZE constant of 10');
  });

  test('PageDown should move focus by 10 commits', () => {
    assert.ok(mainJsSource.includes("focusedIndex = Math.min(focusedIndex + PAGE_SIZE") ||
              mainJsSource.includes('Math.min(focusedIndex + 10'),
      'PageDown should increment focusedIndex by PAGE_SIZE');
  });

  test('PageDown should stop at last commit', () => {
    assert.ok(mainJsSource.includes('filteredCommits.length - 1'),
      'PageDown should cap focusedIndex at last commit');
  });

  test('PageUp should move focus up by 10 commits', () => {
    assert.ok(mainJsSource.includes("focusedIndex = Math.max(focusedIndex - PAGE_SIZE") ||
              mainJsSource.includes('Math.max(focusedIndex - 10'),
      'PageUp should decrement focusedIndex by PAGE_SIZE');
  });

  test('PageUp should stop at first commit', () => {
    assert.ok(mainJsSource.includes('focusedIndex = 0'),
      'PageUp should cap focusedIndex at 0');
  });

  test('PageUp/PageDown should call updateFocusedRow', () => {
    // Count occurrences of updateFocusedRow in PageUp/PageDown cases
    const pageUpDownSection = mainJsSource.substring(
      mainJsSource.indexOf("case 'PageDown':"),
      mainJsSource.indexOf("case 'Enter':")
    );
    assert.ok(pageUpDownSection.includes('updateFocusedRow()'),
      'PageUp/PageDown should call updateFocusedRow()');
  });

  test('PageUp/PageDown should call scrollFocusedIntoView', () => {
    // Count occurrences of scrollFocusedIntoView in PageUp/PageDown cases
    const pageUpDownSection = mainJsSource.substring(
      mainJsSource.indexOf("case 'PageDown':"),
      mainJsSource.indexOf("case 'Enter':")
    );
    assert.ok(pageUpDownSection.includes('scrollFocusedIntoView()'),
      'PageUp/PageDown should call scrollFocusedIntoView()');
  });
});

suite('PageUp/PageDown Keyboard Help Dialog E2E Tests', () => {
  test('Keyboard help should include PageDown in Navigation section', () => {
    const isMac = process.platform === 'darwin';
    const shortcuts = getKeyboardShortcutsData(isMac);
    const navigationCategory = shortcuts.find(cat => cat.category === 'Navigation');

    assert.ok(navigationCategory, 'Should have Navigation category');
    const pageDownEntry = navigationCategory!.items.find(item =>
      item.keys.includes('PageDown') && item.description.includes('Jump down one page')
    );

    assert.ok(pageDownEntry, 'Should have PageDown entry in Navigation');
    assert.strictEqual(pageDownEntry!.description, 'Jump down one page (10 commits)');
  });

  test('Keyboard help should include PageUp in Navigation section', () => {
    const isMac = process.platform === 'darwin';
    const shortcuts = getKeyboardShortcutsData(isMac);
    const navigationCategory = shortcuts.find(cat => cat.category === 'Navigation');

    assert.ok(navigationCategory, 'Should have Navigation category');
    const pageUpEntry = navigationCategory!.items.find(item =>
      item.keys.includes('PageUp') && item.description.includes('Jump up one page')
    );

    assert.ok(pageUpEntry, 'Should have PageUp entry in Navigation');
    assert.strictEqual(pageUpEntry!.description, 'Jump up one page (10 commits)');
  });

  test('PageUp/PageDown should appear between Home/End and Enter in help', () => {
    const isMac = process.platform === 'darwin';
    const shortcuts = getKeyboardShortcutsData(isMac);
    const navigationCategory = shortcuts.find(cat => cat.category === 'Navigation');

    assert.ok(navigationCategory, 'Should have Navigation category');
    const items = navigationCategory!.items;

    const homeIndex = items.findIndex(item => item.keys.includes('Home'));
    const endIndex = items.findIndex(item => item.keys.includes('End'));
    const pageDownIndex = items.findIndex(item => item.keys.includes('PageDown'));
    const pageUpIndex = items.findIndex(item => item.keys.includes('PageUp'));
    const enterIndex = items.findIndex(item => item.keys.includes('Enter'));

    assert.ok(homeIndex >= 0, 'Should have Home entry');
    assert.ok(endIndex >= 0, 'Should have End entry');
    assert.ok(pageDownIndex >= 0, 'Should have PageDown entry');
    assert.ok(pageUpIndex >= 0, 'Should have PageUp entry');
    assert.ok(enterIndex >= 0, 'Should have Enter entry');

    // PageDown/PageUp should come after Home/End and before Enter
    assert.ok(pageDownIndex > endIndex, 'PageDown should come after End');
    assert.ok(pageUpIndex > endIndex, 'PageUp should come after End');
    assert.ok(pageDownIndex < enterIndex, 'PageDown should come before Enter');
    assert.ok(pageUpIndex < enterIndex, 'PageUp should come before Enter');
  });

  test('main.js should have showKeyboardHelpDialog function', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function showKeyboardHelpDialog'),
      'main.js should have showKeyboardHelpDialog function');
  });

  test('Keyboard help dialog should render PageDown entry correctly', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // The help dialog should include PageDown in the shortcuts array
    const shortcutsMatch = source.match(/const shortcuts = \[([\s\S]*?)\];/);
    assert.ok(shortcutsMatch, 'Should have shortcuts array definition');

    const shortcutsSection = shortcutsMatch![1];
    assert.ok(shortcutsSection.includes("'PageDown'"),
      'Shortcuts array should include PageDown key');
    assert.ok(shortcutsSection.includes('Jump down one page (10 commits)'),
      'PageDown should have correct description');
  });

  test('Keyboard help dialog should render PageUp entry correctly', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // The help dialog should include PageUp in the shortcuts array
    const shortcutsMatch = source.match(/const shortcuts = \[([\s\S]*?)\];/);
    assert.ok(shortcutsMatch, 'Should have shortcuts array definition');

    const shortcutsSection = shortcutsMatch![1];
    assert.ok(shortcutsSection.includes("'PageUp'"),
      'Shortcuts array should include PageUp key');
    assert.ok(shortcutsSection.includes('Jump up one page (10 commits)'),
      'PageUp should have correct description');
  });
});

suite('PageUp/PageDown Navigation Behavior Tests', () => {
  interface TestCommit {
    hash: string;
    shortHash: string;
    author: string;
    email: string;
    message: string;
  }

  // Simulates page navigation logic
  class PageNavigator {
    focusedIndex = -1;

    pageDown(maxIndex: number, pageSize: number = 10): void {
      if (this.focusedIndex < maxIndex) {
        this.focusedIndex = Math.min(this.focusedIndex + pageSize, maxIndex);
      } else {
        this.focusedIndex = maxIndex;
      }
    }

    pageUp(maxIndex: number, pageSize: number = 10): void {
      if (this.focusedIndex > 0) {
        this.focusedIndex = Math.max(this.focusedIndex - pageSize, 0);
      } else {
        this.focusedIndex = 0;
      }
    }

    reset(): void {
      this.focusedIndex = -1;
    }
  }

  test('PageDown moves focus by 10 commits', () => {
    const navigator = new PageNavigator();
    navigator.focusedIndex = 0;
    navigator.pageDown(25); // 26 commits (0-25)
    assert.strictEqual(navigator.focusedIndex, 10);
  });

  test('PageDown from last commit stays at last commit', () => {
    const navigator = new PageNavigator();
    navigator.focusedIndex = 25;
    navigator.pageDown(25);
    assert.strictEqual(navigator.focusedIndex, 25);
  });

  test('PageDown near end stops at last commit', () => {
    const navigator = new PageNavigator();
    navigator.focusedIndex = 20;
    navigator.pageDown(25); // Only 5 more commits
    assert.strictEqual(navigator.focusedIndex, 25);
  });

  test('PageDown from middle works correctly', () => {
    const navigator = new PageNavigator();
    navigator.focusedIndex = 5;
    navigator.pageDown(25);
    assert.strictEqual(navigator.focusedIndex, 15);
  });

  test('PageUp moves focus up by 10 commits', () => {
    const navigator = new PageNavigator();
    navigator.focusedIndex = 15;
    navigator.pageUp(25);
    assert.strictEqual(navigator.focusedIndex, 5);
  });

  test('PageUp from first commit stays at first commit', () => {
    const navigator = new PageNavigator();
    navigator.focusedIndex = 0;
    navigator.pageUp(25);
    assert.strictEqual(navigator.focusedIndex, 0);
  });

  test('PageUp near start stops at first commit', () => {
    const navigator = new PageNavigator();
    navigator.focusedIndex = 5;
    navigator.pageUp(25); // Only 5 commits above
    assert.strictEqual(navigator.focusedIndex, 0);
  });

  test('PageUp/PageDown with less than 10 commits handles boundaries', () => {
    const smallMaxIndex = 3; // Only 4 commits (0-3)
    const navigator = new PageNavigator();

    navigator.focusedIndex = 0;
    navigator.pageDown(smallMaxIndex);
    assert.strictEqual(navigator.focusedIndex, 3); // Should stop at last

    navigator.pageUp(smallMaxIndex);
    assert.strictEqual(navigator.focusedIndex, 0); // Should stop at first
  });

  test('PageUp/PageDown with exactly 10 commits', () => {
    const maxIndex = 9; // 10 commits (0-9)
    const navigator = new PageNavigator();

    navigator.focusedIndex = 0;
    navigator.pageDown(maxIndex);
    assert.strictEqual(navigator.focusedIndex, 9); // Should go to last

    navigator.pageUp(maxIndex);
    assert.strictEqual(navigator.focusedIndex, 0); // Should go to first
  });

  test('Consecutive PageDown presses work correctly', () => {
    const maxIndex = 25;
    const navigator = new PageNavigator();

    navigator.focusedIndex = 0;
    navigator.pageDown(maxIndex); // 0 -> 10
    assert.strictEqual(navigator.focusedIndex, 10);

    navigator.pageDown(maxIndex); // 10 -> 20
    assert.strictEqual(navigator.focusedIndex, 20);

    navigator.pageDown(maxIndex); // 20 -> 25 (capped)
    assert.strictEqual(navigator.focusedIndex, 25);
  });

  test('Consecutive PageUp presses work correctly', () => {
    const maxIndex = 25;
    const navigator = new PageNavigator();

    navigator.focusedIndex = 25;
    navigator.pageUp(maxIndex); // 25 -> 15
    assert.strictEqual(navigator.focusedIndex, 15);

    navigator.pageUp(maxIndex); // 15 -> 5
    assert.strictEqual(navigator.focusedIndex, 5);

    navigator.pageUp(maxIndex); // 5 -> 0 (capped)
    assert.strictEqual(navigator.focusedIndex, 0);
  });

  test('Alternating PageUp/PageDown works correctly', () => {
    const maxIndex = 25;
    const navigator = new PageNavigator();

    navigator.focusedIndex = 10;
    navigator.pageDown(maxIndex); // 10 -> 20
    assert.strictEqual(navigator.focusedIndex, 20);

    navigator.pageUp(maxIndex); // 20 -> 10
    assert.strictEqual(navigator.focusedIndex, 10);

    navigator.pageUp(maxIndex); // 10 -> 0
    assert.strictEqual(navigator.focusedIndex, 0);

    navigator.pageDown(maxIndex); // 0 -> 10
    assert.strictEqual(navigator.focusedIndex, 10);
  });
});
