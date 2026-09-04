import * as assert from 'assert';
import * as path from 'path';

suite('Ignore Whitespace Toggle Tests', () => {
  test('main.js should have ignoreWhitespace state variable', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('let ignoreWhitespace'), 'main.js should have ignoreWhitespace state');
  });

  test('main.js should initialize ignoreWhitespace as false', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('let ignoreWhitespace = false'), 'main.js should initialize ignoreWhitespace as false');
  });

  test('main.js should have handleIgnoreWhitespaceToggle function', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleIgnoreWhitespaceToggle'), 'main.js should have handleIgnoreWhitespaceToggle function');
  });

  test('main.js should toggle ignoreWhitespace state in handleIgnoreWhitespaceToggle', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleIgnoreWhitespaceToggle');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes('ignoreWhitespace = !ignoreWhitespace'), 'handleIgnoreWhitespaceToggle should toggle ignoreWhitespace');
  });

  test('main.js should toggle active class on ignore-ws button', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleIgnoreWhitespaceToggle');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes('ignoreWsBtn.classList.add(\'active\')'), 'handleIgnoreWhitespaceToggle should add active class to button');
    assert.ok(toggleFn.includes('ignoreWsBtn.classList.remove(\'active\')'), 'handleIgnoreWhitespaceToggle should remove active class from button');
  });

  test('main.js should re-fetch diff when ignore whitespace is toggled with selected commit', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleIgnoreWhitespaceToggle');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes('requestDiff'), 'handleIgnoreWhitespaceToggle should re-fetch diff');
  });

  test('main.js should persist setting via saveSettings', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleIgnoreWhitespaceToggle');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes('saveSettings'), 'handleIgnoreWhitespaceToggle should persist setting');
    assert.ok(toggleFn.includes('ignoreWhitespace'), 'saveSettings should include ignoreWhitespace');
  });

  test('main.js should handle Ctrl+Shift+Alt+J keyboard shortcut', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("e.key === 'j'") && source.includes('ctrlKey') && source.includes('shiftKey') && source.includes('altKey'),
      'main.js should handle Ctrl+Shift+Alt+J keyboard shortcut');
  });

  test('main.js should call handleIgnoreWhitespaceToggle on Ctrl+Shift+Alt+J', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const shortcutIndex = source.indexOf("e.key === 'j'");
    const context = source.substring(shortcutIndex - 100, shortcutIndex + 150);

    assert.ok(context.includes('handleIgnoreWhitespaceToggle'), 'Ctrl+Shift+Alt+J should call handleIgnoreWhitespaceToggle');
  });

  test('webviewProvider HTML should have ignore-ws-btn button', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('id="ignore-ws-btn"'), 'webviewProvider HTML should have ignore-ws-btn button');
  });

  test('webviewProvider HTML ignore-ws-btn should have W text', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('>W</button>'), 'webviewProvider HTML should have W text on ignore-ws button');
  });

  test('webviewProvider HTML ignore-ws-btn should have ignore-ws-btn class', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('class="ignore-ws-btn"'), 'webviewProvider HTML should have ignore-ws-btn class on button');
  });

  test('webviewProvider HTML ignore-ws-btn title should mention Ctrl+Shift+Alt+J', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('Toggle ignore whitespace (Ctrl+Shift+Alt+J)'), 'webviewProvider HTML should mention Ctrl+Shift+Alt+J in ignore-ws-btn title');
  });

  test('webviewProvider HTML ignore-ws-btn should be in diff-controls toolbar', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    const toolbarIdx = source.indexOf('id="diff-controls"');
    const mainContentIdx = source.indexOf('id="main-content"');
    const toolbarSection = source.substring(toolbarIdx, mainContentIdx);

    assert.ok(toolbarSection.includes('id="ignore-ws-btn"'), 'ignore-ws-btn should be inside diff-controls toolbar');
  });

  test('index.html should have ignore-ws-btn button', () => {
    const fs = require('fs');
    const htmlPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
    const source = fs.readFileSync(htmlPath, 'utf-8');

    assert.ok(source.includes('id="ignore-ws-btn"'), 'index.html should have ignore-ws-btn button');
  });

  test('index.html ignore-ws-btn should have W text', () => {
    const fs = require('fs');
    const htmlPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
    const source = fs.readFileSync(htmlPath, 'utf-8');

    assert.ok(source.includes('>W</button>') || source.includes('>W</'), 'index.html should have W text on ignore-ws button');
  });

  test('styles.css should have .ignore-ws-btn styling', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.ignore-ws-btn'), 'styles.css should have .ignore-ws-btn styling');
  });

  test('styles.css should have .ignore-ws-btn.active styling', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.ignore-ws-btn.active'), 'styles.css should have .ignore-ws-btn.active styling');
  });

  test('main.js should get ignoreWsBtn element by id', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('getElementById(\'ignore-ws-btn\')'), 'main.js should get ignore-ws-btn element');
  });

  test('main.js should add click listener to ignoreWsBtn in init', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const initStart = source.indexOf('function init()');
    const initEnd = source.indexOf('\n// ───', initStart);
    const initFn = source.substring(initStart, initEnd > initStart ? initEnd : undefined);

    assert.ok(initFn.includes('ignoreWsBtn') && initFn.includes('addEventListener'), 'init should add click listener to ignoreWsBtn');
  });

  test('main.js handleIgnoreWhitespaceToggle title should include keyboard shortcut when enabled', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleIgnoreWhitespaceToggle');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes('Ctrl+Shift+Alt+J'), 'handleIgnoreWhitespaceToggle title should mention Ctrl+Shift+Alt+J');
  });

  test('settingsTypes.ts should include ignoreWhitespace in UserSettings', () => {
    const fs = require('fs');
    const settingsPath = path.resolve(__dirname, '../../../src/settings/settingsTypes.ts');
    const source = fs.readFileSync(settingsPath, 'utf-8');

    assert.ok(source.includes('ignoreWhitespace: boolean'), 'UserSettings should include ignoreWhitespace');
  });

  test('settingsTypes.ts should have ignoreWhitespace default as false', () => {
    const fs = require('fs');
    const settingsPath = path.resolve(__dirname, '../../../src/settings/settingsTypes.ts');
    const source = fs.readFileSync(settingsPath, 'utf-8');

    assert.ok(source.includes('ignoreWhitespace: false'), 'DEFAULT_SETTINGS should have ignoreWhitespace as false');
  });

  test('gitService.ts should use -w flag when ignoreWhitespace is true', () => {
    const fs = require('fs');
    const gitServicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    const diffStart = source.indexOf('function getCommitDiff');
    const diffEnd = source.indexOf('\nasync function', diffStart + 1);
    const diffFn = source.substring(diffStart, diffEnd > diffStart ? diffEnd : undefined);

    assert.ok(diffFn.includes('ignoreWhitespace'), 'getCommitDiff should accept ignoreWhitespace parameter');
    assert.ok(diffFn.includes("args.push('-w')"), 'getCommitDiff should push -w flag when ignoreWhitespace is true');
  });

  test('webviewProvider should have getIgnoreWhitespace method', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('getIgnoreWhitespace'), 'webviewProvider should have getIgnoreWhitespace method');
  });

  test('init message handler should apply ignoreWhitespace from userSettings', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const initStart = source.indexOf("case 'init':");
    const initEnd = source.indexOf("break;", initStart);
    const initBlock = source.substring(initStart, initEnd > initStart ? initEnd : undefined);

    assert.ok(initBlock.includes('ignoreWhitespace = settings.ignoreWhitespace'), 'init should apply ignoreWhitespace from settings');
  });
});
