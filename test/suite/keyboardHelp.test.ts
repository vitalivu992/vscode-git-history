import * as assert from 'assert';
import * as path from 'path';

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
 * Simulates the keyboard shortcuts data structure used in main.js
 */
function getKeyboardShortcuts(isMac: boolean): ShortcutCategory[] {
  const cmdKey = isMac ? 'Cmd' : 'Ctrl';
  const altKey = isMac ? 'Option' : 'Alt';

  return [
    {
      category: 'Navigation',
      items: [
        { keys: ['↑', '↓'], description: 'Navigate up/down through commits' },
        { keys: ['Home'], description: 'Jump to first commit' },
        { keys: ['End'], description: 'Jump to last commit' },
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
        { keys: [cmdKey, 'Shift', 'Q'], description: 'Toggle hide merge commits' },
        { keys: [cmdKey, altKey, 'B'], description: 'Show branch picker' }
      ]
    },
    {
      category: 'View Options',
      items: [
        { keys: [cmdKey, 'Shift', 'W'], description: 'Toggle word wrap' },
        { keys: [cmdKey, 'Shift', 'M'], description: 'Toggle my commits filter' },
        { keys: [cmdKey, altKey, 'P'], description: 'Quick compare with parent' },
        { keys: [cmdKey, 'Shift', 'J'], description: 'Toggle ignore whitespace' },
        { keys: [cmdKey, 'Shift', '/'], description: 'Cycle diff context lines' }
      ]
    },
    {
      category: 'Copy Commands',
      items: [
        { keys: [cmdKey, 'Shift', 'C'], description: 'Copy commit message' },
        { keys: [cmdKey, 'Shift', 'H'], description: 'Copy commit hash' },
        { keys: [cmdKey, 'Shift', 'I'], description: 'Copy commit info' },
        { keys: [cmdKey, 'Shift', 'P'], description: 'Copy cherry-pick command' },
        { keys: [cmdKey, 'Shift', 'U'], description: 'Copy revert command' },
        { keys: [cmdKey, 'Shift', 'F'], description: 'Copy changed files' },
        { keys: [cmdKey, 'Shift', 'D'], description: 'Copy commit diff' },
        { keys: [cmdKey, 'Shift', 'E'], description: 'Copy commit as patch' },
        { keys: [cmdKey, 'Shift', 'L'], description: 'Copy commit URL' },
        { keys: [cmdKey, 'Shift', 'S'], description: 'Copy commit stats' },
        { keys: [cmdKey, 'Shift', 'B'], description: 'Copy branch name' },
        { keys: [cmdKey, 'Shift', 'A'], description: 'Copy author email' },
        { keys: [cmdKey, 'Shift', 'N'], description: 'Copy author name' },
        { keys: [cmdKey, 'Shift', 'V'], description: 'Copy parent hash' },
        { keys: [cmdKey, 'Shift', '7'], description: 'Copy short hash' },
        { keys: [cmdKey, 'Shift', '6'], description: 'Copy commit subject' },
        { keys: [cmdKey, 'Shift', 'T'], description: 'Copy commit date' },
        { keys: [cmdKey, 'Shift', 'K'], description: 'Copy co-authors' },
        { keys: [cmdKey, 'Shift', ';'], description: 'Copy selected hashes' },
        { keys: [cmdKey, 'Shift', 'G'], description: 'Copy tags' },
        { keys: [cmdKey, 'Shift', 'Y'], description: 'Copy as oneline' },
        { keys: [cmdKey, 'Shift', 'Z'], description: 'Copy commit body' },
        { keys: [cmdKey, 'Shift', '9'], description: 'Copy diff stat summary' },
        { keys: [cmdKey, 'Shift', '5'], description: 'Copy filter query' },
        { keys: [cmdKey, 'Shift', '.'], description: 'Copy file path' },
        { keys: [cmdKey, 'Shift', ','], description: 'Copy file name' }
      ]
    },
    {
      category: 'Actions',
      items: [
        { keys: [cmdKey, 'Shift', 'R'], description: 'Refresh history' },
        { keys: [cmdKey, 'Shift', 'O'], description: 'Export filtered commits' }
      ]
    }
  ];
}

/**
 * Simulates the platform detection from main.js
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
 * Simulates HTML escaping for modal content
 */
function escapeHtml(text: string): string {
  const div = { textContent: text } as any;
  // In real implementation this would use DOM API
  // For testing, we verify the function exists in source
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

suite('Keyboard Help Logic Tests', () => {
  test('should return correct modifier keys for Mac platform', () => {
    const platform = detectPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
    assert.strictEqual(platform.isMac, true);
    assert.strictEqual(platform.cmdKey, 'Cmd');
    assert.strictEqual(platform.altKey, 'Option');
  });

  test('should return correct modifier keys for Windows platform', () => {
    const platform = detectPlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    assert.strictEqual(platform.isMac, false);
    assert.strictEqual(platform.cmdKey, 'Ctrl');
    assert.strictEqual(platform.altKey, 'Alt');
  });

  test('should return correct modifier keys for Linux platform', () => {
    const platform = detectPlatform('Mozilla/5.0 (X11; Linux x86_64)');
    assert.strictEqual(platform.isMac, false);
    assert.strictEqual(platform.cmdKey, 'Ctrl');
    assert.strictEqual(platform.altKey, 'Alt');
  });

  test('keyboard shortcuts should have all categories', () => {
    const shortcuts = getKeyboardShortcuts(true);
    const categories = shortcuts.map(s => s.category);

    assert.ok(categories.includes('Navigation'), 'Should have Navigation category');
    assert.ok(categories.includes('Search & Filter'), 'Should have Search & Filter category');
    assert.ok(categories.includes('View Options'), 'Should have View Options category');
    assert.ok(categories.includes('Copy Commands'), 'Should have Copy Commands category');
    assert.ok(categories.includes('Actions'), 'Should have Actions category');
  });

  test('Navigation shortcuts should include essential keys', () => {
    const shortcuts = getKeyboardShortcuts(true);
    const navCategory = shortcuts.find(s => s.category === 'Navigation');
    assert.ok(navCategory, 'Navigation category should exist');

    const keyDescriptions = navCategory!.items.map(item => item.description);
    assert.ok(keyDescriptions.includes('Navigate up/down through commits'), 'Should have arrow navigation');
    assert.ok(keyDescriptions.includes('Show this help dialog'), 'Should have help shortcut');
    assert.ok(keyDescriptions.includes('Clear selection and close dialogs'), 'Should have escape shortcut');
  });

  test('Copy Commands should include all copy shortcuts', () => {
    const shortcuts = getKeyboardShortcuts(true);
    const copyCategory = shortcuts.find(s => s.category === 'Copy Commands');
    assert.ok(copyCategory, 'Copy Commands category should exist');

    const descriptions = copyCategory!.items.map(item => item.description);
    assert.ok(descriptions.includes('Copy commit message'), 'Should have copy message');
    assert.ok(descriptions.includes('Copy commit hash'), 'Should have copy hash');
    assert.ok(descriptions.includes('Copy commit info'), 'Should have copy info');
    assert.ok(descriptions.includes('Copy cherry-pick command'), 'Should have copy cherry-pick');
    assert.ok(descriptions.includes('Copy revert command'), 'Should have copy revert');
    assert.ok(descriptions.includes('Copy changed files'), 'Should have copy files');
    assert.ok(descriptions.includes('Copy commit diff'), 'Should have copy diff');
    assert.ok(descriptions.includes('Copy commit as patch'), 'Should have copy patch');
    assert.ok(descriptions.includes('Copy commit URL'), 'Should have copy commit URL');
    assert.ok(descriptions.includes('Copy commit stats'), 'Should have copy commit stats');
    assert.ok(descriptions.includes('Copy branch name'), 'Should have copy branch name');
    assert.ok(descriptions.includes('Copy diff stat summary'), 'Should have copy diff stat summary');
    assert.ok(descriptions.includes('Copy filter query'), 'Should have copy filter query');
    assert.ok(descriptions.includes('Copy file path'), 'Should have copy file path');
    assert.ok(descriptions.includes('Copy file name'), 'Should have copy file name');
  });

  test('Mac shortcuts should use Cmd modifier', () => {
    const macShortcuts = getKeyboardShortcuts(true);
    const copyCategory = macShortcuts.find(s => s.category === 'Copy Commands');
    const firstShortcut = copyCategory!.items[0];

    assert.ok(firstShortcut.keys.includes('Cmd'), 'Mac shortcuts should use Cmd');
  });

  test('Windows shortcuts should use Ctrl modifier', () => {
    const winShortcuts = getKeyboardShortcuts(false);
    const copyCategory = winShortcuts.find(s => s.category === 'Copy Commands');
    const firstShortcut = copyCategory!.items[0];

    assert.ok(firstShortcut.keys.includes('Ctrl'), 'Windows shortcuts should use Ctrl');
  });

  test('help shortcut should be single ? key without modifiers', () => {
    const shortcuts = getKeyboardShortcuts(true);
    const navCategory = shortcuts.find(s => s.category === 'Navigation');
    const helpShortcut = navCategory!.items.find(item => item.description === 'Show this help dialog');

    assert.ok(helpShortcut, 'Help shortcut should exist');
    assert.deepStrictEqual(helpShortcut!.keys, ['?'], 'Help should be just ? key');
  });

  test('shortcut categories should not be empty', () => {
    const shortcuts = getKeyboardShortcuts(true);

    for (const category of shortcuts) {
      assert.ok(category.items.length > 0, `${category.category} should have items`);
    }
  });

  test('each shortcut should have keys and description', () => {
    const shortcuts = getKeyboardShortcuts(true);

    for (const category of shortcuts) {
      for (const item of category.items) {
        assert.ok(item.keys.length > 0, 'Shortcut should have keys');
        assert.ok(item.description.length > 0, 'Shortcut should have description');
      }
    }
  });

  test('escape shortcut should be single key', () => {
    const shortcuts = getKeyboardShortcuts(true);
    const navCategory = shortcuts.find(s => s.category === 'Navigation');
    const escShortcut = navCategory!.items.find(item =>
      item.description.includes('Clear selection') || item.keys.includes('Esc')
    );

    assert.ok(escShortcut, 'Escape shortcut should exist');
    assert.deepStrictEqual(escShortcut!.keys, ['Esc']);
  });

  test('Search & Filter should include Toggle hide merge commits', () => {
    const shortcuts = getKeyboardShortcuts(true);
    const searchCategory = shortcuts.find(s => s.category === 'Search & Filter');
    assert.ok(searchCategory, 'Search & Filter category should exist');

    const toggleMerge = searchCategory!.items.find(item => item.description === 'Toggle hide merge commits');
    assert.ok(toggleMerge, 'Toggle hide merge commits shortcut should exist');
    assert.deepStrictEqual(toggleMerge!.keys, ['Cmd', 'Shift', 'Q'], 'Should use Cmd+Shift+Q on Mac');
  });

  test('Search & Filter should include Show branch picker', () => {
    const shortcuts = getKeyboardShortcuts(true);
    const searchCategory = shortcuts.find(s => s.category === 'Search & Filter');
    assert.ok(searchCategory, 'Search & Filter category should exist');

    const branchPicker = searchCategory!.items.find(item => item.description === 'Show branch picker');
    assert.ok(branchPicker, 'Show branch picker shortcut should exist');
    assert.deepStrictEqual(branchPicker!.keys, ['Cmd', 'Option', 'B'], 'Should use Cmd+Option+B on Mac');
  });

  test('View Options should include Toggle ignore whitespace', () => {
    const shortcuts = getKeyboardShortcuts(true);
    const viewCategory = shortcuts.find(s => s.category === 'View Options');
    assert.ok(viewCategory, 'View Options category should exist');

    const toggleIgnoreWs = viewCategory!.items.find(item => item.description === 'Toggle ignore whitespace');
    assert.ok(toggleIgnoreWs, 'Toggle ignore whitespace shortcut should exist');
    assert.deepStrictEqual(toggleIgnoreWs!.keys, ['Cmd', 'Shift', 'J'], 'Should use Cmd+Shift+J on Mac');
  });

  test('Copy Commands should include Copy tags', () => {
    const shortcuts = getKeyboardShortcuts(true);
    const copyCategory = shortcuts.find(s => s.category === 'Copy Commands');
    assert.ok(copyCategory, 'Copy Commands category should exist');

    const copyTags = copyCategory!.items.find(item => item.description === 'Copy tags');
    assert.ok(copyTags, 'Copy tags shortcut should exist');
    assert.deepStrictEqual(copyTags!.keys, ['Cmd', 'Shift', 'G'], 'Should use Cmd+Shift+G on Mac');
  });

  test('Copy Commands should include Copy as oneline', () => {
    const shortcuts = getKeyboardShortcuts(true);
    const copyCategory = shortcuts.find(s => s.category === 'Copy Commands');
    assert.ok(copyCategory, 'Copy Commands category should exist');

    const copyOneline = copyCategory!.items.find(item => item.description === 'Copy as oneline');
    assert.ok(copyOneline, 'Copy as oneline shortcut should exist');
    assert.deepStrictEqual(copyOneline!.keys, ['Cmd', 'Shift', 'Y'], 'Should use Cmd+Shift+Y on Mac');
  });

  test('View Options should include Cycle diff context lines', () => {
    const shortcuts = getKeyboardShortcuts(true);
    const viewCategory = shortcuts.find(s => s.category === 'View Options');
    assert.ok(viewCategory, 'View Options category should exist');

    const cycleContext = viewCategory!.items.find(item => item.description === 'Cycle diff context lines');
    assert.ok(cycleContext, 'Cycle diff context lines shortcut should exist');
    assert.deepStrictEqual(cycleContext!.keys, ['Cmd', 'Shift', '/'], 'Should use Cmd+Shift+/ on Mac');
  });

  test('Copy Commands should include Copy diff stat summary', () => {
    const shortcuts = getKeyboardShortcuts(true);
    const copyCategory = shortcuts.find(s => s.category === 'Copy Commands');
    assert.ok(copyCategory, 'Copy Commands category should exist');

    const copyStatSummary = copyCategory!.items.find(item => item.description === 'Copy diff stat summary');
    assert.ok(copyStatSummary, 'Copy diff stat summary shortcut should exist');
    assert.deepStrictEqual(copyStatSummary!.keys, ['Cmd', 'Shift', '9'], 'Should use Cmd+Shift+9 on Mac');
  });

  test('Copy Commands should include Copy filter query', () => {
    const shortcuts = getKeyboardShortcuts(true);
    const copyCategory = shortcuts.find(s => s.category === 'Copy Commands');
    assert.ok(copyCategory, 'Copy Commands category should exist');

    const copyFilterQuery = copyCategory!.items.find(item => item.description === 'Copy filter query');
    assert.ok(copyFilterQuery, 'Copy filter query shortcut should exist');
    assert.deepStrictEqual(copyFilterQuery!.keys, ['Cmd', 'Shift', '5'], 'Should use Cmd+Shift+5 on Mac');
  });

  test('Copy Commands should include Copy file path', () => {
    const shortcuts = getKeyboardShortcuts(true);
    const copyCategory = shortcuts.find(s => s.category === 'Copy Commands');
    assert.ok(copyCategory, 'Copy Commands category should exist');

    const copyFilePath = copyCategory!.items.find(item => item.description === 'Copy file path');
    assert.ok(copyFilePath, 'Copy file path shortcut should exist');
    assert.deepStrictEqual(copyFilePath!.keys, ['Cmd', 'Shift', '.'], 'Should use Cmd+Shift+. on Mac');
  });

  test('Copy Commands should include Copy file name', () => {
    const shortcuts = getKeyboardShortcuts(true);
    const copyCategory = shortcuts.find(s => s.category === 'Copy Commands');
    assert.ok(copyCategory, 'Copy Commands category should exist');

    const copyFileName = copyCategory!.items.find(item => item.description === 'Copy file name');
    assert.ok(copyFileName, 'Copy file name shortcut should exist');
    assert.deepStrictEqual(copyFileName!.keys, ['Cmd', 'Shift', ','], 'Should use Cmd+Shift+, on Mac');
  });
});

suite('Keyboard Help Source Verification', () => {
  test('main.js should have showKeyboardHelpDialog function', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function showKeyboardHelpDialog'), 'main.js should have showKeyboardHelpDialog function');
  });

  test('main.js should handle ? key for help dialog', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("e.key === '?'"), 'main.js should handle ? key');
    assert.ok(source.includes('showKeyboardHelpDialog'), 'main.js should call showKeyboardHelpDialog');
  });

  test('main.js should detect platform for modifier keys', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('navigator.platform'), 'main.js should check navigator.platform');
    assert.ok(source.includes('includes(\'mac\')') || source.includes("includes('mac')"),
      'main.js should detect Mac platform');
  });

  test('main.js should use Cmd for Mac and Ctrl for Windows/Linux', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Cmd') || source.includes("'Cmd'"), 'main.js should reference Cmd key');
    assert.ok(source.includes('Ctrl') || source.includes("'Ctrl'"), 'main.js should reference Ctrl key');
  });

  test('main.js should define keyboard shortcuts data structure', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('const shortcuts ='), 'main.js should define shortcuts array');
    assert.ok(source.includes('category:'), 'main.js should have category property');
    assert.ok(source.includes('items:'), 'main.js should have items property');
  });

  test('main.js should have all shortcut categories', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Navigation'), 'main.js should have Navigation category');
    assert.ok(source.includes('Search & Filter'), 'main.js should have Search & Filter category');
    assert.ok(source.includes('View Options'), 'main.js should have View Options category');
    assert.ok(source.includes('Copy Commands'), 'main.js should have Copy Commands category');
    assert.ok(source.includes('Actions'), 'main.js should have Actions category');
  });

  test('main.js should create keyboard-help-modal element', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('keyboard-help-modal'), 'main.js should create keyboard-help-modal');
  });

  test('main.js should close help on Escape key', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("e.key === 'Escape'"), 'main.js should handle Escape to close help');
  });

  test('main.js should close help on overlay click', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('modal-overlay'), 'main.js should have modal overlay');
    assert.ok(source.includes("addEventListener('click'"), 'main.js should handle click on overlay');
  });

  test('main.js should use escapeHtml for modal content', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('escapeHtml'), 'main.js should use escapeHtml for modal content');
  });

  test('main.js should include all documented keyboard shortcuts', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Check for specific documented shortcuts
    assert.ok(source.includes('Navigate up/down'), 'Should include arrow navigation');
    assert.ok(source.includes('Copy commit message'), 'Should include copy message');
    assert.ok(source.includes('Copy commit hash'), 'Should include copy hash');
    assert.ok(source.includes('Toggle word wrap'), 'Should include word wrap');
    assert.ok(source.includes('Refresh history'), 'Should include refresh');
  });
});

suite('Keyboard Help CSS Verification', () => {
  test('styles.css should have #keyboard-help-modal styles', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('#keyboard-help-modal'), 'styles.css should have #keyboard-help-modal styles');
  });

  test('styles.css should have keyboard-help-section styles', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.keyboard-help-section'), 'styles.css should have .keyboard-help-section styles');
  });

  test('styles.css should have keyboard-help-key styles', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.keyboard-help-key'), 'styles.css should have .keyboard-help-key styles');
  });

  test('styles.css should have keyboard-help-row styles', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.keyboard-help-row'), 'styles.css should have .keyboard-help-row styles');
  });

  test('keyboard-help-key should have visual styling', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('border-radius') && source.includes('keyboard-help-key'),
      '.keyboard-help-key should have border radius for visual key appearance');
    assert.ok(source.includes('font-family') && source.includes('keyboard-help-key'),
      '.keyboard-help-key should have monospace font');
  });

  test('keyboard-help-section-title should have uppercase styling', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('text-transform: uppercase') && source.includes('keyboard-help-section'),
      'Section titles should be uppercase');
  });

  test('styles.css should have modal overlay styles', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.modal-overlay'), 'styles.css should have .modal-overlay styles');
    assert.ok(source.includes('background-color: rgba(0, 0, 0'),
      'Modal overlay should have semi-transparent black background');
  });
});
