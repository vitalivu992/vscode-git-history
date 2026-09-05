import * as assert from 'assert';
import * as path from 'path';

suite('Toggle Hide Merge Commits Unit Tests', () => {
  test('main.js should have hideMergeCommits state variable', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('let hideMergeCommits'), 'main.js should have hideMergeCommits state');
  });

  test('main.js should initialize hideMergeCommits as false', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('let hideMergeCommits = false'), 'main.js should initialize hideMergeCommits as false');
  });

  test('main.js should have handleMergeToggle function', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleMergeToggle'), 'main.js should have handleMergeToggle function');
  });

  test('main.js should toggle hideMergeCommits state in handleMergeToggle', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleMergeToggle');
    const toggleEnd = source.indexOf('\n}', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes('hideMergeCommits = !hideMergeCommits'), 'handleMergeToggle should toggle hideMergeCommits');
  });

  test('main.js should toggle active class on merge button', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleMergeToggle');
    const toggleEnd = source.indexOf('\n}', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes("mergeToggleBtn.classList.add('active')"), 'handleMergeToggle should add active class to button');
    assert.ok(toggleFn.includes("mergeToggleBtn.classList.remove('active')"), 'handleMergeToggle should remove active class from button');
  });

  test('main.js handleMergeToggle should call renderCommits', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleMergeToggle');
    const toggleEnd = source.indexOf('\n}', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes('renderCommits()'), 'handleMergeToggle should call renderCommits');
  });

  test('main.js handleMergeToggle should send saveSettings message', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleMergeToggle');
    const toggleEnd = source.indexOf('\n}', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes('saveSettings'), 'handleMergeToggle should persist setting');
    assert.ok(toggleFn.includes('hideMergeCommits'), 'handleMergeToggle should include hideMergeCommits in settings');
  });

  test('index.html should have merge-toggle-btn button', () => {
    const fs = require('fs');
    const htmlPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
    const source = fs.readFileSync(htmlPath, 'utf-8');

    assert.ok(source.includes('id="merge-toggle-btn"'), 'index.html should have merge-toggle-btn button');
  });

  test('index.html merge-toggle-btn should have No Merge text', () => {
    const fs = require('fs');
    const htmlPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
    const source = fs.readFileSync(htmlPath, 'utf-8');

    assert.ok(source.includes('>No Merge</button>') || source.includes('>No Merge</'), 'index.html should have No Merge text on button');
  });

  test('styles.css should have .merge-toggle-btn styling', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.merge-toggle-btn'), 'styles.css should have .merge-toggle-btn styling');
  });

  test('styles.css should have .merge-toggle-btn.active styling', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.merge-toggle-btn.active'), 'styles.css should have .merge-toggle-btn.active styling');
  });

  test('settingsTypes.ts should have hideMergeCommits in DEFAULT_SETTINGS', () => {
    const fs = require('fs');
    const settingsPath = path.resolve(__dirname, '../../../src/settings/settingsTypes.ts');
    const source = fs.readFileSync(settingsPath, 'utf-8');

    assert.ok(source.includes('hideMergeCommits: false'), 'settingsTypes.ts should have hideMergeCommits: false in DEFAULT_SETTINGS');
  });

  test('settingsTypes.ts should have hideMergeCommits in UserSettings interface', () => {
    const fs = require('fs');
    const settingsPath = path.resolve(__dirname, '../../../src/settings/settingsTypes.ts');
    const source = fs.readFileSync(settingsPath, 'utf-8');

    assert.ok(source.includes('hideMergeCommits: boolean'), 'settingsTypes.ts should have hideMergeCommits in UserSettings interface');
  });

  test('main.js should get mergeToggleBtn element by id', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("getElementById('merge-toggle-btn')"), 'main.js should get merge-toggle-btn element');
  });

  test('main.js should add click listener to mergeToggleBtn in init', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const initStart = source.indexOf('function init()');
    const initEnd = source.indexOf('\n// ───', initStart);
    const initFn = source.substring(initStart, initEnd > initStart ? initEnd : undefined);

    assert.ok(initFn.includes('mergeToggleBtn') && initFn.includes('addEventListener'), 'init should add click listener to mergeToggleBtn');
  });

  test('webviewProvider HTML should have merge-toggle-btn button', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('id="merge-toggle-btn"'), 'webviewProvider HTML should have merge-toggle-btn button');
  });

  test('webviewProvider HTML merge-toggle-btn should have No Merge text on button', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('>No Merge</button>'), 'webviewProvider HTML should have No Merge text on button');
  });

  test('webviewProvider HTML merge-toggle-btn should have merge-toggle-btn class', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('class="merge-toggle-btn"'), 'webviewProvider HTML should have merge-toggle-btn class on button');
  });

  test('main.js handleMergeToggle title should include descriptive text when enabled', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleMergeToggle');
    const toggleEnd = source.indexOf('\n}', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(source.includes('Merge commits hidden'), 'handleMergeToggle title should describe hidden state');
    assert.ok(source.includes('Hide merge commits'), 'handleMergeToggle title should describe visible state');
  });

  test('main.js should respect hideMergeCommits setting from init message', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('hideMergeCommits = settings.hideMergeCommits') || source.includes('hideMergeCommits = message.hideMergeCommits'), 'main.js should respect hideMergeCommits from init message');
  });

  test('main.js should filter out merge commits when hideMergeCommits is true', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Check that getFilteredCommits filters by parentHashes.length > 1 when hideMergeCommits is true
    const filteredStart = source.indexOf('function getFilteredCommits');
    const filteredEnd = source.indexOf('\n}', filteredStart + 1000);
    const filteredFn = source.substring(filteredStart, filteredEnd > filteredStart ? filteredEnd : undefined);

    assert.ok(filteredFn.includes('hideMergeCommits') && filteredFn.includes('parentHashes'), 'getFilteredCommits should check hideMergeCommits and parentHashes');
  });

  test('toggleHideMergeCommits action in triggerAction switch', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'toggleHideMergeCommits'"), 'main.js should have toggleHideMergeCommits case in triggerAction switch');
    assert.ok(source.includes("case 'toggleHideMergeCommits': handleMergeToggle()"), 'toggleHideMergeCommits case should call handleMergeToggle');
  });

  test('types.ts should have toggleHideMergeCommits webview action', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("'toggleHideMergeCommits'"), 'types.ts should have toggleHideMergeCommits in WebviewAction type');
  });

  test('extension.ts should register toggleHideMergeCommits command', () => {
    const fs = require('fs');
    const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes("'toggleHideMergeCommits'"), 'extension.ts should register toggleHideMergeCommits action');
  });

  test('package.json should define toggleHideMergeCommits command', () => {
    const fs = require('fs');
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const commands = packageJson.contributes.commands;
    const command = commands.find((c: any) => c.command === 'gitHistory.toggleHideMergeCommits');

    assert.ok(command, 'package.json should define gitHistory.toggleHideMergeCommits command');
    assert.strictEqual(command.title, 'Git History: Toggle Hide Merge Commits');
  });

  test('package.json should define Ctrl+Shift+Q / Cmd+Shift+Q keyboard shortcut', () => {
    const fs = require('fs');
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const keybindings = packageJson.contributes.keybindings;
    const keybinding = keybindings.find((k: any) => k.command === 'gitHistory.toggleHideMergeCommits');

    assert.ok(keybinding, 'package.json should define keybinding for toggleHideMergeCommits');
    assert.strictEqual(keybinding.key, 'ctrl+shift+q');
    assert.strictEqual(keybinding.mac, 'cmd+shift+q');
    assert.strictEqual(keybinding.when, 'activeWebviewViewId == gitHistory.webview');
  });

  suite('README Documentation Verification', () => {
    test('README should document gitHistory.hideMergeCommits setting', () => {
      const fs = require('fs');
      const readmePath = path.resolve(__dirname, '../../../README.md');
      const source = fs.readFileSync(readmePath, 'utf-8');

      assert.ok(source.includes('gitHistory.hideMergeCommits'),
        'README should document gitHistory.hideMergeCommits setting');
    });

    test('README should document Hide Merge Commits feature', () => {
      const fs = require('fs');
      const readmePath = path.resolve(__dirname, '../../../README.md');
      const source = fs.readFileSync(readmePath, 'utf-8');

      assert.ok(source.toLowerCase().includes('hide merge commits'),
        'README should describe Hide Merge Commits feature');
    });

    test('README should document No Merge button', () => {
      const fs = require('fs');
      const readmePath = path.resolve(__dirname, '../../../README.md');
      const source = fs.readFileSync(readmePath, 'utf-8');

      assert.ok(source.includes('No Merge') || source.includes('no merge'),
        'README should mention No Merge button');
    });

    test('README should document toggle hide merge commits keyboard shortcut', () => {
      const fs = require('fs');
      const readmePath = path.resolve(__dirname, '../../../README.md');
      const source = fs.readFileSync(readmePath, 'utf-8');

      assert.ok(source.includes('Ctrl+Shift+Q'), 'README should list Ctrl+Shift+Q shortcut for hide merge commits toggle');
    });
  });

  suite('Keyboard Help Dialog Verification', () => {
    test('showKeyboardHelpDialog should include toggle hide merge commits shortcut', () => {
      const fs = require('fs');
      const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
      const source = fs.readFileSync(mainJsPath, 'utf-8');

      const helpStart = source.indexOf('function showKeyboardHelpDialog');
      const helpEnd = source.indexOf('\n}', helpStart + 5000);
      const helpFn = source.substring(helpStart, helpEnd > helpStart ? helpEnd : undefined);

      assert.ok(helpFn.includes('Toggle hide merge commits') || helpFn.includes('Hide merge commits'),
        'Keyboard help dialog should include toggle hide merge commits');
      assert.ok(helpFn.includes("'Shift', 'Q'"),
        'Keyboard help dialog should include Shift+Q key combination for hide merge commits toggle');
    });
  });
});
