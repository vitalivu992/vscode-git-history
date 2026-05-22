import * as assert from 'assert';
import * as path from 'path';

suite('Toggle Stats Column Unit Tests', () => {
  test('main.js should have showStats state variable', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('let showStats'), 'main.js should have showStats state');
  });

  test('main.js should initialize showStats as true', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('let showStats = true'), 'main.js should initialize showStats as true');
  });

  test('main.js should have handleToggleStats function', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleToggleStats'), 'main.js should have handleToggleStats function');
  });

  test('main.js should toggle showStats state in handleToggleStats', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleToggleStats');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes('showStats = !showStats'), 'handleToggleStats should toggle showStats');
  });

  test('main.js should toggle active class on stats button', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleToggleStats');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes("statsToggleBtn.classList.add('active')"), 'handleToggleStats should add active class to button');
    assert.ok(toggleFn.includes("statsToggleBtn.classList.remove('active')"), 'handleToggleStats should remove active class from button');
  });

  test('main.js handleToggleStats should call renderCommits', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleToggleStats');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes('renderCommits()'), 'handleToggleStats should call renderCommits');
  });

  test('main.js handleToggleStats should send saveSettings message', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleToggleStats');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes('saveSettings'), 'handleToggleStats should persist setting');
    assert.ok(toggleFn.includes('showStats'), 'handleToggleStats should include showStats in settings');
  });

  test('main.js handleToggleStats should toggle stats column header', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleToggleStats');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes('th.stats-col'), 'handleToggleStats should toggle stats column header');
  });

  test('index.html should have stats-toggle-btn button', () => {
    const fs = require('fs');
    const htmlPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
    const source = fs.readFileSync(htmlPath, 'utf-8');

    assert.ok(source.includes('id="stats-toggle-btn"'), 'index.html should have stats-toggle-btn button');
  });

  test('index.html stats-toggle-btn should have Stats text', () => {
    const fs = require('fs');
    const htmlPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
    const source = fs.readFileSync(htmlPath, 'utf-8');

    assert.ok(source.includes('>Stats</button>') || source.includes('>Stats</'), 'index.html should have Stats text on button');
  });

  test('styles.css should have .stats-toggle-btn styling', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.stats-toggle-btn'), 'styles.css should have .stats-toggle-btn styling');
  });

  test('styles.css should have .stats-toggle-btn.active styling', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.stats-toggle-btn.active'), 'styles.css should have .stats-toggle-btn.active styling');
  });

  test('settingsTypes.ts should have showStats in DEFAULT_SETTINGS', () => {
    const fs = require('fs');
    const settingsPath = path.resolve(__dirname, '../../../src/settings/settingsTypes.ts');
    const source = fs.readFileSync(settingsPath, 'utf-8');

    assert.ok(source.includes('showStats: true'), 'settingsTypes.ts should have showStats: true in DEFAULT_SETTINGS');
  });

  test('settingsTypes.ts should have showStats in UserSettings interface', () => {
    const fs = require('fs');
    const settingsPath = path.resolve(__dirname, '../../../src/settings/settingsTypes.ts');
    const source = fs.readFileSync(settingsPath, 'utf-8');

    assert.ok(source.includes('showStats: boolean'), 'settingsTypes.ts should have showStats: boolean in UserSettings interface');
  });

  test('main.js should get statsToggleBtn element by id', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("getElementById('stats-toggle-btn')"), 'main.js should get stats-toggle-btn element');
  });

  test('main.js should add click listener to statsToggleBtn in init', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const initStart = source.indexOf('function init()');
    const initEnd = source.indexOf('\n// ───', initStart);
    const initFn = source.substring(initStart, initEnd > initStart ? initEnd : undefined);

    assert.ok(initFn.includes('statsToggleBtn') && initFn.includes('addEventListener'), 'init should add click listener to statsToggleBtn');
  });

  test('main.js should have toggleStats in triggerAction cases', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'toggleStats': handleToggleStats()"), 'main.js should have toggleStats triggerAction case');
  });

  test('webviewProvider HTML should have stats-toggle-btn button', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('id="stats-toggle-btn"'), 'webviewProvider HTML should have stats-toggle-btn button');
  });

  test('webviewProvider HTML stats-toggle-btn should have Stats text', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('>Stats</button>'), 'webviewProvider HTML should have Stats text on stats button');
  });

  test('webviewProvider HTML stats-toggle-btn should have stats-toggle-btn class', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('class="stats-toggle-btn"'), 'webviewProvider HTML should have stats-toggle-btn class on button');
  });

  test('main.js should conditionally render stats column based on showStats', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('${showStats ?'), 'main.js should conditionally render stats column based on showStats');
  });

  test('main.js should include showStats in colspan calculation', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const renderStart = source.indexOf('function renderCommits');
    const renderEnd = source.indexOf('\nfunction', renderStart + 1);
    const renderFn = source.substring(renderStart, renderEnd > renderStart ? renderEnd : undefined);

    assert.ok(renderFn.includes('showStats'), 'renderCommits should include showStats in colspan calculation');
  });

  test('types.ts should have toggleStats in WebviewAction', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("'toggleStats'"), 'types.ts should have toggleStats in WebviewAction');
  });

  test('extension.ts should register gitHistory.toggleStats command', () => {
    const fs = require('fs');
    const extPath = path.resolve(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extPath, 'utf-8');

    assert.ok(source.includes("gitHistory.toggleStats"), 'extension.ts should register gitHistory.toggleStats command');
  });

  test('package.json should have gitHistory.toggleStats command definition', () => {
    const fs = require('fs');
    const pkgPath = path.resolve(__dirname, '../../../package.json');
    const source = fs.readFileSync(pkgPath, 'utf-8');

    assert.ok(source.includes('"gitHistory.toggleStats"'), 'package.json should have gitHistory.toggleStats command');
  });

  test('package.json should have toggleStats keybinding', () => {
    const fs = require('fs');
    const pkgPath = path.resolve(__dirname, '../../../package.json');
    const source = fs.readFileSync(pkgPath, 'utf-8');

    assert.ok(source.includes('ctrl+shift+alt+t'), 'package.json should have ctrl+shift+alt+t keybinding');
    assert.ok(source.includes('cmd+shift+alt+t'), 'package.json should have cmd+shift+alt+t keybinding');
  });

  test('main.js init should apply showStats from userSettings', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('settings.showStats !== undefined'), 'main.js should check settings.showStats in init');
    assert.ok(source.includes('showStats = settings.showStats'), 'main.js should apply showStats from settings in init');
  });

  test('main.js handleToggleStats title should include descriptive text when enabled', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleToggleStats');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes('Stats visible'), 'handleToggleStats title should describe visible state');
    assert.ok(toggleFn.includes('Show stats column'), 'handleToggleStats title should describe hidden state');
  });

  suite('Keyboard Help Dialog Verification', () => {
    test('showKeyboardHelpDialog should include toggle stats shortcut', () => {
      const fs = require('fs');
      const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
      const source = fs.readFileSync(mainJsPath, 'utf-8');

      const helpStart = source.indexOf('function showKeyboardHelpDialog');
      const helpEnd = source.indexOf('\nfunction', helpStart + 1);
      const helpFn = source.substring(helpStart, helpEnd > helpStart ? helpEnd : undefined);

      assert.ok(helpFn.includes('Toggle stats column'),
        'Keyboard help dialog should include "Toggle stats column" in View Options');
      assert.ok(helpFn.includes("'Alt', 'T'"),
        'Keyboard help dialog should include Alt+T key combination for toggle stats');
    });
  });
});
