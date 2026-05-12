import * as assert from 'assert';
import * as path from 'path';

suite('Toggle Signatures Unit Tests', () => {
  test('main.js should have showSignatures state variable', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('let showSignatures'), 'main.js should have showSignatures state');
  });

  test('main.js should initialize showSignatures as true', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('let showSignatures = true'), 'main.js should initialize showSignatures as true');
  });

  test('main.js should have handleToggleSignatures function', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleToggleSignatures'), 'main.js should have handleToggleSignatures function');
  });

  test('main.js should toggle showSignatures state in handleToggleSignatures', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleToggleSignatures');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes('showSignatures = !showSignatures'), 'handleToggleSignatures should toggle showSignatures');
  });

  test('main.js should toggle active class on signatures button', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleToggleSignatures');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes("signaturesToggleBtn.classList.add('active')"), 'handleToggleSignatures should add active class to button');
    assert.ok(toggleFn.includes("signaturesToggleBtn.classList.remove('active')"), 'handleToggleSignatures should remove active class from button');
  });

  test('main.js handleToggleSignatures should call renderCommits', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleToggleSignatures');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes('renderCommits()'), 'handleToggleSignatures should call renderCommits');
  });

  test('main.js handleToggleSignatures should send saveSettings message', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleToggleSignatures');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes('saveSettings'), 'handleToggleSignatures should persist setting');
    assert.ok(toggleFn.includes('showSignatures'), 'handleToggleSignatures should include showSignatures in settings');
  });

  test('index.html should have signatures-toggle-btn button', () => {
    const fs = require('fs');
    const htmlPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
    const source = fs.readFileSync(htmlPath, 'utf-8');

    assert.ok(source.includes('id="signatures-toggle-btn"'), 'index.html should have signatures-toggle-btn button');
  });

  test('index.html signatures-toggle-btn should have Signatures text', () => {
    const fs = require('fs');
    const htmlPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
    const source = fs.readFileSync(htmlPath, 'utf-8');

    assert.ok(source.includes('>Signatures</button>') || source.includes('>Signatures</'), 'index.html should have Signatures text on button');
  });

  test('styles.css should have .signatures-toggle-btn styling', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.signatures-toggle-btn'), 'styles.css should have .signatures-toggle-btn styling');
  });

  test('styles.css should have .signatures-toggle-btn.active styling', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.signatures-toggle-btn.active'), 'styles.css should have .signatures-toggle-btn.active styling');
  });

  test('styles.css should have .signature-badge styling', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.signature-badge'), 'styles.css should have .signature-badge styling');
  });

  test('styles.css should have .signature-badge.verified styling', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.signature-badge.verified'), 'styles.css should have .signature-badge.verified styling');
  });

  test('styles.css should have .signature-badge.unverified styling', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.signature-badge.unverified'), 'styles.css should have .signature-badge.unverified styling');
  });

  test('settingsTypes.ts should have showSignatures in DEFAULT_SETTINGS', () => {
    const fs = require('fs');
    const settingsPath = path.resolve(__dirname, '../../../src/settings/settingsTypes.ts');
    const source = fs.readFileSync(settingsPath, 'utf-8');

    assert.ok(source.includes('showSignatures: true'), 'settingsTypes.ts should have showSignatures: true in DEFAULT_SETTINGS');
  });

  test('main.js should render signature badge based on commit.signature and showSignatures', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('commit.signature && showSignatures'), 'main.js should check both commit.signature and showSignatures for badge rendering');
  });

  test('main.js should render verified badge with ✓ character', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('✓'), 'main.js should render verified badge with ✓ character');
  });

  test('main.js should render unverified badge with ✗ character', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('✗'), 'main.js should render unverified badge with ✗ character');
  });

  test('main.js should get signaturesToggleBtn element by id', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("getElementById('signatures-toggle-btn')"), 'main.js should get signatures-toggle-btn element');
  });

  test('main.js should add click listener to signaturesToggleBtn in init', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const initStart = source.indexOf('function init()');
    const initEnd = source.indexOf('\n// ───', initStart);
    const initFn = source.substring(initStart, initEnd > initStart ? initEnd : undefined);

    assert.ok(initFn.includes('signaturesToggleBtn') && initFn.includes('addEventListener'), 'init should add click listener to signaturesToggleBtn');
  });

  test('webviewProvider HTML should have signatures-toggle-btn button', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('id="signatures-toggle-btn"'), 'webviewProvider HTML should have signatures-toggle-btn button');
  });

  test('webviewProvider HTML signatures-toggle-btn should have Signatures text', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('>Signatures</button>'), 'webviewProvider HTML should have Signatures text on signatures button');
  });

  test('webviewProvider HTML signatures-toggle-btn should have signatures-toggle-btn class', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('class="signatures-toggle-btn"'), 'webviewProvider HTML should have signatures-toggle-btn class on button');
  });

  test('main.js handleToggleSignatures title should include descriptive text when enabled', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleToggleSignatures');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes('GPG signatures visible'), 'handleToggleSignatures title should describe visible state');
    assert.ok(toggleFn.includes('Show GPG signatures'), 'handleToggleSignatures title should describe hidden state');
  });
});
