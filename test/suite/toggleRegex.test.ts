import * as assert from 'assert';
import * as path from 'path';

suite('Toggle Regex Unit Tests', () => {
  test('main.js should have regexSearchEnabled state variable', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('let regexSearchEnabled'), 'main.js should have regexSearchEnabled state');
  });

  test('main.js should initialize regexSearchEnabled as false', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('let regexSearchEnabled = false'), 'main.js should initialize regexSearchEnabled as false');
  });

  test('main.js should have handleRegexToggle function', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleRegexToggle'), 'main.js should have handleRegexToggle function');
  });

  test('main.js should toggle regexSearchEnabled state in handleRegexToggle', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleRegexToggle');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes('regexSearchEnabled = !regexSearchEnabled'), 'handleRegexToggle should toggle regexSearchEnabled');
  });

  test('main.js should toggle active class on regex button', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleRegexToggle');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes("regexToggleBtn.classList.add('active')"), 'handleRegexToggle should add active class to button');
    assert.ok(toggleFn.includes("regexToggleBtn.classList.remove('active')"), 'handleRegexToggle should remove active class from button');
  });

  test('main.js handleRegexToggle should call renderCommits', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleRegexToggle');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes('renderCommits()'), 'handleRegexToggle should call renderCommits');
  });

  test('main.js handleRegexToggle should send saveSettings message', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleRegexToggle');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes('saveSettings'), 'handleRegexToggle should persist setting');
    assert.ok(toggleFn.includes('regexSearchEnabled'), 'handleRegexToggle should include regexSearchEnabled in settings');
  });

  test('main.js toggleRegex action in triggerAction switch', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'toggleRegex'"), 'main.js should have toggleRegex case in triggerAction switch');
    assert.ok(source.includes("case 'toggleRegex': handleRegexToggle()"), 'toggleRegex case should call handleRegexToggle');
  });

  test('index.html should have regex-toggle-btn button', () => {
    const fs = require('fs');
    const htmlPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
    const source = fs.readFileSync(htmlPath, 'utf-8');

    assert.ok(source.includes('id="regex-toggle-btn"'), 'index.html should have regex-toggle-btn button');
  });

  test('index.html regex-toggle-btn should have .* text', () => {
    const fs = require('fs');
    const htmlPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
    const source = fs.readFileSync(htmlPath, 'utf-8');

    assert.ok(source.includes('>.*</button>'), 'index.html should have .* text on regex button');
  });

  test('styles.css should have .regex-toggle-btn styling', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.regex-toggle-btn'), 'styles.css should have .regex-toggle-btn styling');
  });

  test('styles.css should have .regex-toggle-btn.active styling', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.regex-toggle-btn.active'), 'styles.css should have .regex-toggle-btn.active styling');
  });

  test('styles.css should have .regex-toggle-btn.invalid styling', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.regex-toggle-btn.invalid'), 'styles.css should have .regex-toggle-btn.invalid styling for bad regex');
  });

  test('settingsTypes.ts should have regexSearchEnabled in DEFAULT_SETTINGS', () => {
    const fs = require('fs');
    const settingsPath = path.resolve(__dirname, '../../../src/settings/settingsTypes.ts');
    const source = fs.readFileSync(settingsPath, 'utf-8');

    assert.ok(source.includes('regexSearchEnabled: false'), 'settingsTypes.ts should have regexSearchEnabled: false in DEFAULT_SETTINGS');
  });

  test('settingsTypes.ts should have regexSearchEnabled in UserSettings interface', () => {
    const fs = require('fs');
    const settingsPath = path.resolve(__dirname, '../../../src/settings/settingsTypes.ts');
    const source = fs.readFileSync(settingsPath, 'utf-8');

    assert.ok(source.includes('regexSearchEnabled: boolean'), 'settingsTypes.ts should have regexSearchEnabled in UserSettings interface');
  });

  test('main.js should get regexToggleBtn element by id', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("getElementById('regex-toggle-btn')"), 'main.js should get regex-toggle-btn element');
  });

  test('main.js should add click listener to regexToggleBtn in init', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const initStart = source.indexOf('function init()');
    const initEnd = source.indexOf('\n// ───', initStart);
    const initFn = source.substring(initStart, initEnd > initStart ? initEnd : undefined);

    assert.ok(initFn.includes('regexToggleBtn') && initFn.includes('addEventListener'), 'init should add click listener to regexToggleBtn');
  });

  test('webviewProvider HTML should have regex-toggle-btn button', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('id="regex-toggle-btn"'), 'webviewProvider HTML should have regex-toggle-btn button');
  });

  test('webviewProvider HTML regex-toggle-btn should have .* text', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('>.*</button>'), 'webviewProvider HTML should have .* text on regex button');
  });

  test('webviewProvider HTML regex-toggle-btn should have regex-toggle-btn class', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('class="regex-toggle-btn"'), 'webviewProvider HTML should have regex-toggle-btn class on button');
  });

  test('main.js handleRegexToggle title should include descriptive text', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleRegexToggle');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(source.includes('Regex mode enabled'), 'handleRegexToggle title should describe enabled state');
    assert.ok(source.includes('Toggle regex search mode'), 'handleRegexToggle title should describe disabled state');
  });

  test('main.js should respect regexSearchEnabled setting from init message', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('regexSearchEnabled = settings.regexSearchEnabled'), 'main.js should apply regexSearchEnabled from saved settings');
  });

  test('types.ts should have toggleRegex webview action', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("'toggleRegex'"), 'types.ts should have toggleRegex in WebviewAction type');
  });

  test('main.js should use isRegexMatch when regexSearchEnabled is true', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('isRegexMatch'), 'main.js should have isRegexMatch function for regex filtering');
    assert.ok(source.includes('!regexSearchEnabled'), 'main.js should check regexSearchEnabled before applying regex match');
  });

  suite('README Documentation Verification', () => {
    test('README should document regex search mode', () => {
      const fs = require('fs');
      const readmePath = path.resolve(__dirname, '../../../README.md');
      const source = fs.readFileSync(readmePath, 'utf-8');

      assert.ok(source.includes('regex'),
        'README should document regex search mode');
    });

    test('README should document toggle regex keyboard shortcut', () => {
      const fs = require('fs');
      const readmePath = path.resolve(__dirname, '../../../README.md');
      const source = fs.readFileSync(readmePath, 'utf-8');

      assert.ok(source.includes('Ctrl+Shift+X'), 'README should list Ctrl+Shift+X shortcut for regex toggle');
    });
  });

  suite('Keyboard Help Dialog Verification', () => {
    test('showKeyboardHelpDialog should include toggle regex shortcut', () => {
      const fs = require('fs');
      const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
      const source = fs.readFileSync(mainJsPath, 'utf-8');

      const helpStart = source.indexOf('function showKeyboardHelpDialog');
      const helpEnd = source.indexOf('\nfunction', helpStart + 1);
      const helpFn = source.substring(helpStart, helpEnd > helpStart ? helpEnd : undefined);

      assert.ok(helpFn.includes('Toggle regex search mode'),
        'Keyboard help dialog should include "Toggle regex search mode"');
      assert.ok(helpFn.includes("'Shift', 'X'"),
        'Keyboard help dialog should include Shift+X key combination for regex toggle');
    });
  });
});
