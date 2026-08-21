import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Keyboard shortcut definition for help dialog
 */
interface KeyboardShortcut {
  keys: string[];
  description: string;
}

interface ShortcutCategory {
  category: string;
  items: KeyboardShortcut[];
}

/**
 * Simulates the filter function from main.js showKeyboardHelpDialog
 */
function filterShortcutsBySearch(shortcuts: ShortcutCategory[], query: string): ShortcutCategory[] {
  if (!query || query.trim() === '') {
    return shortcuts;
  }
  const lowerQuery = query.toLowerCase().trim();
  return shortcuts
    .map(category => ({
      category: category.category,
      items: category.items.filter(item =>
        item.description.toLowerCase().includes(lowerQuery)
      )
    }))
    .filter(category => category.items.length > 0);
}

/**
 * Sample shortcuts data for testing filter logic
 */
function getSampleShortcuts(): ShortcutCategory[] {
  return [
    {
      category: 'Navigation',
      items: [
        { keys: ['Ctrl', 'L'], description: 'Focus commit list for navigation' },
        { keys: ['↑', '↓'], description: 'Navigate up/down through commits' },
        { keys: ['Enter'], description: 'Select focused commit' },
        { keys: ['?'], description: 'Show this help dialog' }
      ]
    },
    {
      category: 'Copy Commands',
      items: [
        { keys: ['Ctrl', 'Shift', 'C'], description: 'Copy commit message' },
        { keys: ['Ctrl', 'Shift', 'H'], description: 'Copy commit hash' },
        { keys: ['Ctrl', 'Shift', 'I'], description: 'Copy commit info' },
        { keys: ['Ctrl', 'Alt', 'B'], description: 'Copy branch name' }
      ]
    },
    {
      category: 'Actions',
      items: [
        { keys: ['F5'], description: 'Refresh history' },
        { keys: ['Ctrl', 'Shift', 'R'], description: 'Refresh history (alternative)' },
        { keys: ['Ctrl', 'Alt', 'K'], description: 'Cherry-pick commit' }
      ]
    }
  ];
}

suite('Keyboard Help Search Logic Tests', () => {
  test('empty query returns all shortcuts', () => {
    const shortcuts = getSampleShortcuts();
    const filtered = filterShortcutsBySearch(shortcuts, '');
    assert.strictEqual(filtered.length, shortcuts.length);
    for (let i = 0; i < filtered.length; i++) {
      assert.strictEqual(filtered[i].items.length, shortcuts[i].items.length);
    }
  });

  test('whitespace-only query returns all shortcuts', () => {
    const shortcuts = getSampleShortcuts();
    const filtered = filterShortcutsBySearch(shortcuts, '   ');
    assert.strictEqual(filtered.length, shortcuts.length);
  });

  test('filter by "copy" returns only Copy Commands category', () => {
    const shortcuts = getSampleShortcuts();
    const filtered = filterShortcutsBySearch(shortcuts, 'copy');
    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].category, 'Copy Commands');
    assert.strictEqual(filtered[0].items.length, 4);
  });

  test('filter is case-insensitive', () => {
    const shortcuts = getSampleShortcuts();
    const filteredLower = filterShortcutsBySearch(shortcuts, 'copy');
    const filteredUpper = filterShortcutsBySearch(shortcuts, 'COPY');
    const filteredMixed = filterShortcutsBySearch(shortcuts, 'CoPy');
    assert.strictEqual(filteredLower.length, filteredUpper.length);
    assert.strictEqual(filteredLower.length, filteredMixed.length);
  });

  test('filter by "hash" returns matching items across categories', () => {
    const shortcuts = getSampleShortcuts();
    const filtered = filterShortcutsBySearch(shortcuts, 'hash');
    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].category, 'Copy Commands');
    const hashItem = filtered[0].items.find(i => i.description.includes('hash'));
    assert.ok(hashItem, 'Should find copy hash shortcut');
  });

  test('filter by non-matching query returns empty array', () => {
    const shortcuts = getSampleShortcuts();
    const filtered = filterShortcutsBySearch(shortcuts, 'xyznonexistent');
    assert.strictEqual(filtered.length, 0);
  });

  test('categories with no matches are excluded', () => {
    const shortcuts = getSampleShortcuts();
    const filtered = filterShortcutsBySearch(shortcuts, 'cherry');
    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].category, 'Actions');
    assert.strictEqual(filtered[0].items.length, 1);
  });

  test('filter matches partial words', () => {
    const shortcuts = getSampleShortcuts();
    const filtered = filterShortcutsBySearch(shortcuts, 'nav');
    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].category, 'Navigation');
    assert.strictEqual(filtered[0].items.length, 2);
  });

  test('filter by "commit" returns multiple categories', () => {
    const shortcuts = getSampleShortcuts();
    const filtered = filterShortcutsBySearch(shortcuts, 'commit');
    assert.ok(filtered.length >= 2, 'Should match items in multiple categories');
  });
});

suite('Keyboard Help Search Source Verification', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');

  test('main.js should have filterShortcutsBySearch function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('filterShortcutsBySearch'),
      'main.js should define filterShortcutsBySearch function');
  });

  test('main.js should have renderKeyboardHelpShortcuts function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('renderKeyboardHelpShortcuts'),
      'main.js should define renderKeyboardHelpShortcuts function');
  });

  test('main.js should have search input in modal HTML', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('keyboard-help-search-input'),
      'main.js should have keyboard-help-search-input element');
    assert.ok(source.includes('Filter shortcuts'),
      'main.js should have Filter shortcuts placeholder');
  });

  test('main.js should have search clear button', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('keyboard-help-search-clear'),
      'main.js should have keyboard-help-search-clear element');
  });

  test('main.js should have shortcuts container', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('keyboard-help-shortcuts-container'),
      'main.js should have keyboard-help-shortcuts-container element');
  });

  test('main.js should have no results message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('No shortcuts match your search'),
      'main.js should have no results message');
  });

  test('main.js should handle search input event', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("addEventListener('input'") && source.includes('keyboard-help-search'),
      'main.js should handle input event on search');
  });

  test('main.js should focus search input on open', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const dialogSection = source.substring(
      source.indexOf('function showKeyboardHelpDialog'),
      source.indexOf('function showFirstRunTipBanner')
    );
    assert.ok(dialogSection.includes('searchInput.focus()'),
      'main.js should focus search input when dialog opens');
  });

  test('main.js should handle Escape in search input', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('keyboard-help-search-input'),
      'main.js should have search input');
    const dialogSection = source.substring(
      source.indexOf('function showKeyboardHelpDialog'),
      source.indexOf('function showFirstRunTipBanner')
    );
    assert.ok(dialogSection.includes('searchInput') && dialogSection.includes('Escape'),
      'main.js should handle Escape in search input');
  });

  test('styles.css should have keyboard-help-search-container styles', () => {
    const source = fs.readFileSync(stylesPath, 'utf-8');
    assert.ok(source.includes('.keyboard-help-search-container'),
      'styles.css should have .keyboard-help-search-container');
  });

  test('styles.css should have keyboard-help-search-input styles', () => {
    const source = fs.readFileSync(stylesPath, 'utf-8');
    assert.ok(source.includes('.keyboard-help-search-input'),
      'styles.css should have .keyboard-help-search-input');
  });

  test('styles.css should have keyboard-help-search-clear styles', () => {
    const source = fs.readFileSync(stylesPath, 'utf-8');
    assert.ok(source.includes('.keyboard-help-search-clear'),
      'styles.css should have .keyboard-help-search-clear');
  });

  test('styles.css should have keyboard-help-no-results styles', () => {
    const source = fs.readFileSync(stylesPath, 'utf-8');
    assert.ok(source.includes('.keyboard-help-no-results'),
      'styles.css should have .keyboard-help-no-results');
  });
});
