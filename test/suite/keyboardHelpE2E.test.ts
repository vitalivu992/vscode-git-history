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
        { keys: [cmdKey, altKey, 'Shift', 'K'], description: 'Copy cherry-pick commands (selected)' },
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
        { keys: [cmdKey, altKey, 'Shift', 'M'], description: 'Copy subject with author' },
        { keys: [cmdKey, 'Shift', 'T'], description: 'Copy commit date' },
        { keys: [cmdKey, 'Shift', 'K'], description: 'Copy co-authors' },
        { keys: [cmdKey, 'Shift', ';'], description: 'Copy selected hashes' },
        { keys: [cmdKey, 'Shift', 'G'], description: 'Copy tags' },
        { keys: [cmdKey, 'Shift', 'Alt', 'G'], description: 'Copy signature info' },
        { keys: [cmdKey, 'Shift', 'Y'], description: 'Copy as oneline' },
        { keys: [cmdKey, 'Shift', 'Z'], description: 'Copy commit body' },
        { keys: [cmdKey, 'Shift', '9'], description: 'Copy diff stat summary' },
        { keys: ['F4'], description: 'Copy files changed count' },
        { keys: [cmdKey, 'Shift', '5'], description: 'Copy filter query' },
        { keys: [cmdKey, 'Shift', '.'], description: 'Copy file path' },
        { keys: [cmdKey, 'Shift', ','], description: 'Copy file name' },
        { keys: [cmdKey, altKey, 'Shift', 'U'], description: 'Copy file permalink' },
        { keys: [cmdKey, altKey, 'Shift', 'B'], description: 'Copy file path with hash' }
      ]
    },
    {
      category: 'Actions',
      items: [
        { keys: [cmdKey, 'Shift', 'R'], description: 'Refresh history' },
        { keys: [cmdKey, 'Shift', 'O'], description: 'Export filtered commits' },
        { keys: ['F2'], description: 'Rename filter preset (when dropdown is open)' }
      ]
    },
    {
      category: 'Global Editor Shortcuts',
      items: [
        { keys: [cmdKey, 'Shift', 'B'], description: 'Toggle blame annotations (works in editor)' },
        { keys: [cmdKey, altKey, 'H'], description: 'Show file history (works in editor)' },
        { keys: [cmdKey, altKey, 'Shift', 'H'], description: 'Show selection history (works in editor)' }
      ]
    }
  ];
}

/**
 * Simulates the modal creation HTML structure
 */
function createKeyboardHelpModalHtml(isMac: boolean): string {
  const shortcuts = getKeyboardShortcutsData(isMac);

  let sectionsHtml = '';
  for (const section of shortcuts) {
    let itemsHtml = '';
    for (const item of section.items) {
      const keysHtml = item.keys.map((k, i) => {
        const isModifier = k === 'Cmd' || k === 'Ctrl' || k === 'Shift' || k === 'Alt' || k === 'Option';
        const keyClass = isModifier ? 'keyboard-help-key modifier' : 'keyboard-help-key';
        const plusHtml = i < item.keys.length - 1 ? '<span class="keyboard-help-plus">+</span>' : '';
        return `<span class="${keyClass}">${k}</span>${plusHtml}`;
      }).join('');

      itemsHtml += `
        <div class="keyboard-help-row">
          <span class="keyboard-help-description">${item.description}</span>
          <span class="keyboard-help-keys">${keysHtml}</span>
        </div>
      `;
    }

    sectionsHtml += `
      <div class="keyboard-help-section">
        <div class="keyboard-help-section-title">${section.category}</div>
        ${itemsHtml}
      </div>
    `;
  }

  return `
    <div id="keyboard-help-modal">
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <div class="modal-header">
          <span class="modal-title">⌨️ Keyboard Shortcuts</span>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          ${sectionsHtml}
          <div class="keyboard-help-footer">
            Tip: Right-click on commits and files for additional options
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Simulates checking if help dialog should close on key press
 */
function shouldCloseHelpDialog(key: string, isEscape: boolean): boolean {
  return key === 'Escape' || isEscape;
}

/**
 * Simulates checking if help dialog should open on key press
 */
function shouldOpenHelpDialog(key: string, ctrlKey: boolean, metaKey: boolean, altKey: boolean): boolean {
  return key === '?' && !ctrlKey && !metaKey && !altKey;
}

suite('Keyboard Help E2E Tests', () => {
  test('should detect Mac platform correctly', () => {
    const macAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Mozilla/5.0 (Mac OS X 10.14; rv:68.0) Gecko/20100101 Firefox/68.0'
    ];

    for (const agent of macAgents) {
      const platform = detectPlatform(agent);
      assert.strictEqual(platform.isMac, true);
      assert.strictEqual(platform.cmdKey, 'Cmd');
      assert.strictEqual(platform.altKey, 'Option');
    }
  });

  test('should detect Windows/Linux platform correctly', () => {
    const nonMacAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0'
    ];

    for (const agent of nonMacAgents) {
      const platform = detectPlatform(agent);
      assert.strictEqual(platform.isMac, false);
      assert.strictEqual(platform.cmdKey, 'Ctrl');
      assert.strictEqual(platform.altKey, 'Alt');
    }
  });

  test('should return correct keyboard shortcuts for Mac', () => {
    const shortcuts = getKeyboardShortcutsData(true);

    // Check first copy command uses Cmd
    const copyCategory = shortcuts.find(s => s.category === 'Copy Commands');
    assert.ok(copyCategory, 'Should have Copy Commands category');
    assert.ok(copyCategory!.items[0].keys.includes('Cmd'), 'Mac copy shortcuts should use Cmd');
  });

  test('should return correct keyboard shortcuts for Windows', () => {
    const shortcuts = getKeyboardShortcutsData(false);

    // Check first copy command uses Ctrl
    const copyCategory = shortcuts.find(s => s.category === 'Copy Commands');
    assert.ok(copyCategory, 'Should have Copy Commands category');
    assert.ok(copyCategory!.items[0].keys.includes('Ctrl'), 'Windows copy shortcuts should use Ctrl');
  });

  test('should have all 6 shortcut categories', () => {
    const shortcuts = getKeyboardShortcutsData(true);
    assert.strictEqual(shortcuts.length, 6);

    const categories = shortcuts.map(s => s.category);
    assert.ok(categories.includes('Navigation'));
    assert.ok(categories.includes('Search & Filter'));
    assert.ok(categories.includes('View Options'));
    assert.ok(categories.includes('Copy Commands'));
    assert.ok(categories.includes('Actions'));
    assert.ok(categories.includes('Global Editor Shortcuts'));
  });

  test('Navigation category should have 9 shortcuts', () => {
    const shortcuts = getKeyboardShortcutsData(true);
    const navCategory = shortcuts.find(s => s.category === 'Navigation');
    assert.strictEqual(navCategory!.items.length, 9);
  });

  test('Copy Commands category should have 30 shortcuts', () => {
    const shortcuts = getKeyboardShortcutsData(true);
    const copyCategory = shortcuts.find(s => s.category === 'Copy Commands');
    assert.strictEqual(copyCategory!.items.length, 30);
  });

  test('Search & Filter category should have 6 shortcuts', () => {
    const shortcuts = getKeyboardShortcutsData(true);
    const searchCategory = shortcuts.find(s => s.category === 'Search & Filter');
    assert.strictEqual(searchCategory!.items.length, 6);
  });

  test('View Options category should have 5 shortcuts', () => {
    const shortcuts = getKeyboardShortcutsData(true);
    const viewCategory = shortcuts.find(s => s.category === 'View Options');
    assert.strictEqual(viewCategory!.items.length, 5);
  });

  test('Actions category should have 3 shortcuts', () => {
    const shortcuts = getKeyboardShortcutsData(true);
    const actionsCategory = shortcuts.find(s => s.category === 'Actions');
    assert.strictEqual(actionsCategory!.items.length, 3);
  });

  test('help dialog should open on ? key without modifiers', () => {
    assert.strictEqual(shouldOpenHelpDialog('?', false, false, false), true);
  });

  test('help dialog should not open on ? with modifiers', () => {
    assert.strictEqual(shouldOpenHelpDialog('?', true, false, false), false); // Ctrl+?
    assert.strictEqual(shouldOpenHelpDialog('?', false, true, false), false); // Cmd+?
    assert.strictEqual(shouldOpenHelpDialog('?', false, false, true), false); // Alt+?
  });

  test('help dialog should close on Escape key', () => {
    assert.strictEqual(shouldCloseHelpDialog('Escape', true), true);
  });

  test('help dialog should not close on other keys', () => {
    assert.strictEqual(shouldCloseHelpDialog('Enter', false), false);
    assert.strictEqual(shouldCloseHelpDialog('a', false), false);
    assert.strictEqual(shouldCloseHelpDialog('1', false), false);
  });

  test('generated HTML should contain modal structure', () => {
    const html = createKeyboardHelpModalHtml(true);

    assert.ok(html.includes('keyboard-help-modal'), 'Should have keyboard-help-modal id');
    assert.ok(html.includes('modal-overlay'), 'Should have modal-overlay class');
    assert.ok(html.includes('modal-content'), 'Should have modal-content class');
    assert.ok(html.includes('modal-header'), 'Should have modal-header class');
    assert.ok(html.includes('modal-body'), 'Should have modal-body class');
  });

  test('generated HTML should contain all categories', () => {
    const html = createKeyboardHelpModalHtml(true);

    assert.ok(html.includes('Navigation'), 'Should have Navigation section');
    assert.ok(html.includes('Search & Filter'), 'Should have Search & Filter section');
    assert.ok(html.includes('View Options'), 'Should have View Options section');
    assert.ok(html.includes('Copy Commands'), 'Should have Copy Commands section');
    assert.ok(html.includes('Actions'), 'Should have Actions section');
    assert.ok(html.includes('Global Editor Shortcuts'), 'Should have Global Editor Shortcuts section');
  });

  test('generated HTML should contain keyboard-help-key elements', () => {
    const html = createKeyboardHelpModalHtml(true);

    assert.ok(html.includes('keyboard-help-key'), 'Should have keyboard-help-key class');
    assert.ok(html.includes('keyboard-help-plus'), 'Should have keyboard-help-plus class');
  });

  test('generated HTML should contain footer tip', () => {
    const html = createKeyboardHelpModalHtml(true);

    assert.ok(html.includes('keyboard-help-footer'), 'Should have keyboard-help-footer class');
    assert.ok(html.includes('Right-click on commits'), 'Should contain context menu tip');
  });

  test('generated Mac HTML should use Cmd keys', () => {
    const html = createKeyboardHelpModalHtml(true);

    // Count Cmd occurrences - should be more than Ctrl
    const cmdCount = (html.match(/Cmd/g) || []).length;
    const ctrlCount = (html.match(/Ctrl/g) || []).length;

    assert.ok(cmdCount > ctrlCount, 'Mac HTML should have more Cmd than Ctrl references');
  });

  test('generated Windows HTML should use Ctrl keys', () => {
    const html = createKeyboardHelpModalHtml(false);

    // Count Ctrl occurrences - should be more than Cmd
    const cmdCount = (html.match(/Cmd/g) || []).length;
    const ctrlCount = (html.match(/>Ctrl</g) || []).length;

    assert.strictEqual(cmdCount, 0, 'Windows HTML should not have Cmd references');
    assert.ok(ctrlCount > 0, 'Windows HTML should have Ctrl references');
  });

  test('help shortcut should appear in Navigation category', () => {
    const shortcuts = getKeyboardShortcutsData(true);
    const navCategory = shortcuts.find(s => s.category === 'Navigation');
    const helpItem = navCategory!.items.find(item => item.keys.includes('?'));

    assert.ok(helpItem, 'Help shortcut should exist');
    assert.strictEqual(helpItem!.description, 'Show this help dialog');
  });

  test('all shortcuts should have non-empty keys and descriptions', () => {
    const shortcuts = getKeyboardShortcutsData(true);

    for (const category of shortcuts) {
      for (const item of category.items) {
        assert.ok(item.keys.length > 0, `Shortcut in ${category.category} should have keys`);
        assert.ok(item.description.length > 0, `Shortcut in ${category.category} should have description`);
      }
    }
  });

  test('copy commands should match documented shortcuts', () => {
    const shortcuts = getKeyboardShortcutsData(true);
    const copyCategory = shortcuts.find(s => s.category === 'Copy Commands');

    const descriptions = copyCategory!.items.map(item => item.description);

    // Verify all copy commands are present
    assert.ok(descriptions.includes('Copy commit message'));
    assert.ok(descriptions.includes('Copy commit hash'));
    assert.ok(descriptions.includes('Copy commit info'));
    assert.ok(descriptions.includes('Copy cherry-pick command'));
    assert.ok(descriptions.includes('Copy revert command'));
    assert.ok(descriptions.includes('Copy changed files'));
    assert.ok(descriptions.includes('Copy commit diff'));
    assert.ok(descriptions.includes('Copy commit as patch'));
    assert.ok(descriptions.includes('Copy commit URL'));
    assert.ok(descriptions.includes('Copy commit stats'));
    assert.ok(descriptions.includes('Copy branch name'));
    assert.ok(descriptions.includes('Copy author email'));
    assert.ok(descriptions.includes('Copy author name'));
    assert.ok(descriptions.includes('Copy parent hash'));
    assert.ok(descriptions.includes('Copy short hash'));
    assert.ok(descriptions.includes('Copy commit subject'));
    assert.ok(descriptions.includes('Copy commit date'));
    assert.ok(descriptions.includes('Copy co-authors'));
    assert.ok(descriptions.includes('Copy selected hashes'));
    assert.ok(descriptions.includes('Copy tags'));
    assert.ok(descriptions.includes('Copy as oneline'));
    assert.ok(descriptions.includes('Copy commit body'));
    assert.ok(descriptions.includes('Copy diff stat summary'));
    assert.ok(descriptions.includes('Copy filter query'));
    assert.ok(descriptions.includes('Copy file path'));
    assert.ok(descriptions.includes('Copy file name'));
  });

  test('Search & Filter should include Toggle hide merge commits', () => {
    const shortcuts = getKeyboardShortcutsData(true);
    const searchCategory = shortcuts.find(s => s.category === 'Search & Filter');
    const toggleMerge = searchCategory!.items.find(item => item.description === 'Toggle hide merge commits');
    assert.ok(toggleMerge, 'Toggle hide merge commits shortcut should exist');
  });

  test('Search & Filter should include Show branch picker', () => {
    const shortcuts = getKeyboardShortcutsData(true);
    const searchCategory = shortcuts.find(s => s.category === 'Search & Filter');
    const branchPicker = searchCategory!.items.find(item => item.description === 'Show branch picker');
    assert.ok(branchPicker, 'Show branch picker shortcut should exist');
  });

  test('View Options should include Toggle ignore whitespace', () => {
    const shortcuts = getKeyboardShortcutsData(true);
    const viewCategory = shortcuts.find(s => s.category === 'View Options');
    const toggleIgnoreWs = viewCategory!.items.find(item => item.description === 'Toggle ignore whitespace');
    assert.ok(toggleIgnoreWs, 'Toggle ignore whitespace shortcut should exist');
  });

  test('Copy Commands should include Copy tags', () => {
    const shortcuts = getKeyboardShortcutsData(true);
    const copyCategory = shortcuts.find(s => s.category === 'Copy Commands');
    const copyTags = copyCategory!.items.find(item => item.description === 'Copy tags');
    assert.ok(copyTags, 'Copy tags shortcut should exist');
  });

  test('Copy Commands should include Copy as oneline', () => {
    const shortcuts = getKeyboardShortcutsData(true);
    const copyCategory = shortcuts.find(s => s.category === 'Copy Commands');
    const copyOneline = copyCategory!.items.find(item => item.description === 'Copy as oneline');
    assert.ok(copyOneline, 'Copy as oneline shortcut should exist');
  });

  test('View Options should include Cycle diff context lines', () => {
    const shortcuts = getKeyboardShortcutsData(true);
    const viewCategory = shortcuts.find(s => s.category === 'View Options');
    const cycleContext = viewCategory!.items.find(item => item.description === 'Cycle diff context lines');
    assert.ok(cycleContext, 'Cycle diff context lines shortcut should exist');
  });

  test('Copy Commands should include Copy diff stat summary', () => {
    const shortcuts = getKeyboardShortcutsData(true);
    const copyCategory = shortcuts.find(s => s.category === 'Copy Commands');
    const copyStatSummary = copyCategory!.items.find(item => item.description === 'Copy diff stat summary');
    assert.ok(copyStatSummary, 'Copy diff stat summary shortcut should exist');
  });

  test('Copy Commands should include Copy filter query', () => {
    const shortcuts = getKeyboardShortcutsData(true);
    const copyCategory = shortcuts.find(s => s.category === 'Copy Commands');
    const copyFilterQuery = copyCategory!.items.find(item => item.description === 'Copy filter query');
    assert.ok(copyFilterQuery, 'Copy filter query shortcut should exist');
  });

  test('Copy Commands should include Copy file path', () => {
    const shortcuts = getKeyboardShortcutsData(true);
    const copyCategory = shortcuts.find(s => s.category === 'Copy Commands');
    const copyFilePath = copyCategory!.items.find(item => item.description === 'Copy file path');
    assert.ok(copyFilePath, 'Copy file path shortcut should exist');
  });

  test('Copy Commands should include Copy file name', () => {
    const shortcuts = getKeyboardShortcutsData(true);
    const copyCategory = shortcuts.find(s => s.category === 'Copy Commands');
    const copyFileName = copyCategory!.items.find(item => item.description === 'Copy file name');
    assert.ok(copyFileName, 'Copy file name shortcut should exist');
  });

  test('Copy Commands should include Copy files changed count', () => {
    const shortcuts = getKeyboardShortcutsData(true);
    const copyCategory = shortcuts.find(s => s.category === 'Copy Commands');
    const copyFilesChangedCount = copyCategory!.items.find(item => item.description === 'Copy files changed count');
    assert.ok(copyFilesChangedCount, 'Copy files changed count shortcut should exist');
    assert.deepStrictEqual(copyFilesChangedCount!.keys, ['F4'], 'Should use F4 key');
  });

  test('Copy Commands should include Copy signature info', () => {
    const shortcuts = getKeyboardShortcutsData(true);
    const copyCategory = shortcuts.find(s => s.category === 'Copy Commands');
    const copySignatureInfo = copyCategory!.items.find(item => item.description === 'Copy signature info');
    assert.ok(copySignatureInfo, 'Copy signature info shortcut should exist');
    assert.deepStrictEqual(copySignatureInfo!.keys, ['Cmd', 'Shift', 'Alt', 'G'], 'Should use Cmd+Shift+Alt+G on Mac');
  });

  test('Copy Commands should include Copy subject with author', () => {
    const shortcuts = getKeyboardShortcutsData(true);
    const copyCategory = shortcuts.find(s => s.category === 'Copy Commands');
    const copySubjectWithAuthor = copyCategory!.items.find(item => item.description === 'Copy subject with author');
    assert.ok(copySubjectWithAuthor, 'Copy subject with author shortcut should exist');
    assert.deepStrictEqual(copySubjectWithAuthor!.keys, ['Cmd', 'Option', 'Shift', 'M'], 'Should use Cmd+Option+Shift+M on Mac');
  });

  test('Copy Commands should include Copy cherry-pick commands (selected)', () => {
    const shortcuts = getKeyboardShortcutsData(true);
    const copyCategory = shortcuts.find(s => s.category === 'Copy Commands');
    const copyCherryPickCommands = copyCategory!.items.find(item => item.description === 'Copy cherry-pick commands (selected)');
    assert.ok(copyCherryPickCommands, 'Copy cherry-pick commands (selected) shortcut should exist');
    assert.deepStrictEqual(copyCherryPickCommands!.keys, ['Cmd', 'Option', 'Shift', 'K'], 'Should use Cmd+Option+Shift+K on Mac');
  });

  test('Copy Commands should include Copy file path with hash', () => {
    const shortcuts = getKeyboardShortcutsData(true);
    const copyCategory = shortcuts.find(s => s.category === 'Copy Commands');
    const copyFilePathWithHash = copyCategory!.items.find(item => item.description === 'Copy file path with hash');
    assert.ok(copyFilePathWithHash, 'Copy file path with hash shortcut should exist');
    assert.deepStrictEqual(copyFilePathWithHash!.keys, ['Cmd', 'Option', 'Shift', 'B'], 'Should use Cmd+Option+Shift+B on Mac');
  });
});

suite('Keyboard Help Source Verification', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
  const readmePath = path.resolve(__dirname, '../../../README.md');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');

  test('main.js should define showKeyboardHelpDialog function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function showKeyboardHelpDialog'),
      'main.js should define showKeyboardHelpDialog function');
  });

  test('main.js should handle ? key press', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("e.key === '?'"),
      'main.js should check for ? key');
    assert.ok(source.includes('showKeyboardHelpDialog'),
      'main.js should call showKeyboardHelpDialog');
  });

  test('main.js should check navigator.platform for Mac detection', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('navigator.platform'),
      'main.js should use navigator.platform');
    assert.ok(source.includes('includes') && source.includes('mac'),
      'main.js should detect Mac platform');
  });

  test('main.js should have keyboard shortcuts data structure', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('const shortcuts ='),
      'main.js should define shortcuts constant');
    assert.ok(source.includes('category:') && source.includes('items:'),
      'main.js should have category and items properties');
  });

  test('main.js should have all shortcut categories', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("category: 'Navigation'"),
      'main.js should have Navigation category');
    assert.ok(source.includes("category: 'Search & Filter'"),
      'main.js should have Search & Filter category');
    assert.ok(source.includes("category: 'View Options'"),
      'main.js should have View Options category');
    assert.ok(source.includes("category: 'Copy Commands'"),
      'main.js should have Copy Commands category');
    assert.ok(source.includes("category: 'Actions'"),
      'main.js should have Actions category');
    assert.ok(source.includes("category: 'Global Editor Shortcuts'"),
      'main.js should have Global Editor Shortcuts category');
  });

  test('main.js should create keyboard-help-modal element', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("keyboard-help-modal"),
      'main.js should create keyboard-help-modal element');
  });

  test('main.js should close dialog on Escape key', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("e.key === 'Escape'"),
      'main.js should handle Escape to close dialog');
  });

  test('main.js should close dialog on overlay click', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('modal-overlay'),
      'main.js should have modal overlay');
    assert.ok(source.includes("addEventListener('click')") || source.includes('click'),
      'main.js should handle click events');
  });

  test('main.js should use escapeHtml for safety', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('escapeHtml'),
      'main.js should use escapeHtml function');
  });

  test('styles.css should have #keyboard-help-modal styles', () => {
    const source = fs.readFileSync(stylesPath, 'utf-8');
    assert.ok(source.includes('#keyboard-help-modal'),
      'styles.css should have #keyboard-help-modal styles');
  });

  test('styles.css should have keyboard-help-section styles', () => {
    const source = fs.readFileSync(stylesPath, 'utf-8');
    assert.ok(source.includes('.keyboard-help-section'),
      'styles.css should have .keyboard-help-section styles');
  });

  test('styles.css should have keyboard-help-key styles', () => {
    const source = fs.readFileSync(stylesPath, 'utf-8');
    assert.ok(source.includes('.keyboard-help-key'),
      'styles.css should have .keyboard-help-key styles');
  });

  test('styles.css should have keyboard-help-row styles', () => {
    const source = fs.readFileSync(stylesPath, 'utf-8');
    assert.ok(source.includes('.keyboard-help-row'),
      'styles.css should have .keyboard-help-row styles');
  });

  test('styles.css should have keyboard-help-section-title with uppercase', () => {
    const source = fs.readFileSync(stylesPath, 'utf-8');
    assert.ok(source.includes('.keyboard-help-section-title'),
      'styles.css should have .keyboard-help-section-title');
    assert.ok(source.includes('text-transform: uppercase') && source.includes('keyboard-help'),
      'styles.css should have uppercase styling for section titles');
  });

  test('styles.css should have modal overlay with semi-transparent background', () => {
    const source = fs.readFileSync(stylesPath, 'utf-8');
    assert.ok(source.includes('.modal-overlay'),
      'styles.css should have .modal-overlay');
    assert.ok(source.includes('rgba(0, 0, 0'),
      'modal overlay should use rgba for transparency');
  });

  test('README.md should document keyboard help feature', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('Keyboard Help') || source.includes('?'),
      'README.md should mention keyboard help feature');
  });

  test('README.md should document ? key in keyboard shortcuts table', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes("`?`") || source.includes("'?'") || source.includes('question mark'),
      'README.md should document ? key shortcut');
  });

  test('CLAUDE.md should document keyboard help implementation', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Keyboard Help') || source.includes('showKeyboardHelpDialog'),
      'CLAUDE.md should document keyboard help implementation');
  });

  test('main.js should include Copy subject with author in help dialog', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('Copy subject with author'),
      'main.js should include Copy subject with author in keyboard help dialog');
  });

  test('main.js should include Copy cherry-pick commands (selected) in help dialog', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('Copy cherry-pick commands (selected)'),
      'main.js should include Copy cherry-pick commands (selected) in keyboard help dialog');
  });

  test('main.js should include Copy file path with hash in help dialog', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('Copy file path with hash'),
      'main.js should include Copy file path with hash in keyboard help dialog');
  });

  test('Actions should include Rename filter preset (F2) shortcut', () => {
    const shortcuts = getKeyboardShortcutsData(true);
    const actionsCategory = shortcuts.find(s => s.category === 'Actions');
    assert.ok(actionsCategory, 'Actions category should exist');

    const renamePreset = actionsCategory!.items.find(item => item.description === 'Rename filter preset (when dropdown is open)');
    assert.ok(renamePreset, 'Rename filter preset shortcut should exist');
    assert.deepStrictEqual(renamePreset!.keys, ['F2'], 'Should use F2 key');
  });

  test('main.js should include Rename filter preset (F2) in help dialog', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('Rename filter preset'),
      'main.js should include Rename filter preset in keyboard help dialog');
  });

  test('Global Editor Shortcuts category should have 3 shortcuts', () => {
    const shortcuts = getKeyboardShortcutsData(true);
    const globalCategory = shortcuts.find(s => s.category === 'Global Editor Shortcuts');
    assert.strictEqual(globalCategory!.items.length, 3);
  });

  test('Global Editor Shortcuts should include Toggle blame annotations', () => {
    const shortcuts = getKeyboardShortcutsData(true);
    const globalCategory = shortcuts.find(s => s.category === 'Global Editor Shortcuts');
    const toggleBlame = globalCategory!.items.find(item => item.description === 'Toggle blame annotations (works in editor)');
    assert.ok(toggleBlame, 'Toggle blame annotations shortcut should exist');
    assert.deepStrictEqual(toggleBlame!.keys, ['Cmd', 'Shift', 'B'], 'Should use Cmd+Shift+B on Mac');
  });

  test('Global Editor Shortcuts should include Show file history', () => {
    const shortcuts = getKeyboardShortcutsData(true);
    const globalCategory = shortcuts.find(s => s.category === 'Global Editor Shortcuts');
    const showHistory = globalCategory!.items.find(item => item.description === 'Show file history (works in editor)');
    assert.ok(showHistory, 'Show file history shortcut should exist');
    assert.deepStrictEqual(showHistory!.keys, ['Cmd', 'Option', 'H'], 'Should use Cmd+Option+H on Mac');
  });

  test('Global Editor Shortcuts should include Show selection history', () => {
    const shortcuts = getKeyboardShortcutsData(true);
    const globalCategory = shortcuts.find(s => s.category === 'Global Editor Shortcuts');
    const showHistory = globalCategory!.items.find(item => item.description === 'Show selection history (works in editor)');
    assert.ok(showHistory, 'Show selection history shortcut should exist');
    assert.deepStrictEqual(showHistory!.keys, ['Cmd', 'Option', 'Shift', 'H'], 'Should use Cmd+Option+Shift+H on Mac');
  });

  test('Global Editor Shortcuts should use Ctrl on Windows', () => {
    const shortcuts = getKeyboardShortcutsData(false);
    const globalCategory = shortcuts.find(s => s.category === 'Global Editor Shortcuts');
    const toggleBlame = globalCategory!.items.find(item => item.description === 'Toggle blame annotations (works in editor)');
    assert.ok(toggleBlame, 'Toggle blame annotations shortcut should exist');
    assert.ok(toggleBlame!.keys.includes('Ctrl'), 'Should use Ctrl on Windows');
  });

  test('generated HTML should contain Global Editor Shortcuts section', () => {
    const html = createKeyboardHelpModalHtml(true);
    assert.ok(html.includes('Global Editor Shortcuts'), 'Should have Global Editor Shortcuts section');
  });

  test('main.js should include Global Editor Shortcuts category', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('Global Editor Shortcuts'),
      'main.js should include Global Editor Shortcuts category in help dialog');
  });

  test('main.js should include Toggle blame annotations (works in editor)', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('Toggle blame annotations (works in editor)'),
      'main.js should include Toggle blame annotations in Global Editor Shortcuts');
  });

  test('main.js should include Show file history (works in editor)', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('Show file history (works in editor)'),
      'main.js should include Show file history in Global Editor Shortcuts');
  });

  test('main.js should include Show selection history (works in editor)', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('Show selection history (works in editor)'),
      'main.js should include Show selection history in Global Editor Shortcuts');
  });
});
