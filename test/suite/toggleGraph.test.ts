import * as assert from 'assert';
import * as path from 'path';

suite('Toggle Graph Unit Tests', () => {
  test('main.js should have showGraph state variable', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('let showGraph'), 'main.js should have showGraph state');
  });

  test('main.js should initialize showGraph as true', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('let showGraph = true'), 'main.js should initialize showGraph as true');
  });

  test('main.js should have handleToggleGraph function', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleToggleGraph'), 'main.js should have handleToggleGraph function');
  });

  test('main.js should toggle showGraph state in handleToggleGraph', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleToggleGraph');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes('showGraph = !showGraph'), 'handleToggleGraph should toggle showGraph');
  });

  test('main.js should toggle active class on graph button', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleToggleGraph');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes("graphToggleBtn.classList.add('active')"), 'handleToggleGraph should add active class to button');
    assert.ok(toggleFn.includes("graphToggleBtn.classList.remove('active')"), 'handleToggleGraph should remove active class from button');
  });

  test('main.js handleToggleGraph should call renderCommits', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleToggleGraph');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes('renderCommits()'), 'handleToggleGraph should call renderCommits');
  });

  test('main.js handleToggleGraph should send saveSettings message', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleToggleGraph');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes('saveSettings'), 'handleToggleGraph should persist setting');
    assert.ok(toggleFn.includes('showGraph'), 'handleToggleGraph should include showGraph in settings');
  });

  test('index.html should have graph-toggle-btn button', () => {
    const fs = require('fs');
    const htmlPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
    const source = fs.readFileSync(htmlPath, 'utf-8');

    assert.ok(source.includes('id="graph-toggle-btn"'), 'index.html should have graph-toggle-btn button');
  });

  test('index.html graph-toggle-btn should have Graph text', () => {
    const fs = require('fs');
    const htmlPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
    const source = fs.readFileSync(htmlPath, 'utf-8');

    assert.ok(source.includes('>Graph</button>') || source.includes('>Graph</'), 'index.html should have Graph text on button');
  });

  test('styles.css should have .graph-toggle-btn styling', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.graph-toggle-btn'), 'styles.css should have .graph-toggle-btn styling');
  });

  test('styles.css should have .graph-toggle-btn.active styling', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.graph-toggle-btn.active'), 'styles.css should have .graph-toggle-btn.active styling');
  });

  test('settingsTypes.ts should have showGraph in DEFAULT_SETTINGS', () => {
    const fs = require('fs');
    const settingsPath = path.resolve(__dirname, '../../../src/settings/settingsTypes.ts');
    const source = fs.readFileSync(settingsPath, 'utf-8');

    assert.ok(source.includes('showGraph: true'), 'settingsTypes.ts should have showGraph: true in DEFAULT_SETTINGS');
  });

  test('settingsTypes.ts should have showGraph in UserSettings interface', () => {
    const fs = require('fs');
    const settingsPath = path.resolve(__dirname, '../../../src/settings/settingsTypes.ts');
    const source = fs.readFileSync(settingsPath, 'utf-8');

    assert.ok(source.includes('showGraph: boolean'), 'settingsTypes.ts should have showGraph in UserSettings interface');
  });

  test('main.js should get graphToggleBtn element by id', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("getElementById('graph-toggle-btn')"), 'main.js should get graph-toggle-btn element');
  });

  test('main.js should add click listener to graphToggleBtn in init', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const initStart = source.indexOf('function init()');
    const initEnd = source.indexOf('\n// ───', initStart);
    const initFn = source.substring(initStart, initEnd > initStart ? initEnd : undefined);

    assert.ok(initFn.includes('graphToggleBtn') && initFn.includes('addEventListener'), 'init should add click listener to graphToggleBtn');
  });

  test('webviewProvider HTML should have graph-toggle-btn button', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('id="graph-toggle-btn"'), 'webviewProvider HTML should have graph-toggle-btn button');
  });

  test('webviewProvider HTML should have Graph text on button', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('>Graph</button>'), 'webviewProvider HTML should have Graph text on button');
  });

  test('webviewProvider HTML graph-toggle-btn should have graph-toggle-btn class', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('class="graph-toggle-btn"'), 'webviewProvider HTML should have graph-toggle-btn class on button');
  });

  test('main.js handleToggleGraph title should include descriptive text when enabled', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleToggleGraph');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes('Graph visible (click to hide)'), 'handleToggleGraph title should describe visible state');
    assert.ok(toggleFn.includes('Show graph'), 'handleToggleGraph title should describe hidden state');
  });

  test('main.js handleToggleGraph should hide graph column when sortMode >= 2', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleToggleGraph');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes('sortMode < 2'), 'handleToggleGraph should check sortMode when hiding graph');
  });

  test('main.js should respect showGraph setting from init message', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('message.showGraph !== false') || source.includes('showGraph = message.showGraph'), 'main.js should respect showGraph from init message');
  });

  test('main.js should update effectiveShowGraph based on sortMode', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('effectiveShowGraph = showGraph && sortMode < 2'), 'main.js should compute effectiveShowGraph based on showGraph and sortMode');
  });

  suite('README Documentation Verification', () => {
    test('README should document gitHistory.showGraph setting', () => {
      const fs = require('fs');
      const readmePath = path.resolve(__dirname, '../../../README.md');
      const source = fs.readFileSync(readmePath, 'utf-8');

      assert.ok(source.includes('gitHistory.showGraph'),
        'README should document gitHistory.showGraph setting');
      assert.ok(source.includes('commit graph'),
        'README should describe commit graph visualization');
    });
  });
});