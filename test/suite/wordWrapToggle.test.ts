import * as assert from 'assert';
import * as path from 'path';

suite('Word Wrap Toggle Tests', () => {
  test('main.js should have wordWrapEnabled state variable', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('let wordWrapEnabled'), 'main.js should have wordWrapEnabled state');
  });

  test('main.js should initialize wordWrapEnabled as false', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('let wordWrapEnabled = false'), 'main.js should initialize wordWrapEnabled as false');
  });

  test('main.js should have handleWordWrapToggle function', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleWordWrapToggle'), 'main.js should have handleWordWrapToggle function');
  });

  test('main.js should toggle wordWrapEnabled state in handleWordWrapToggle', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleWordWrapToggle');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes('wordWrapEnabled = !wordWrapEnabled'), 'handleWordWrapToggle should toggle wordWrapEnabled');
  });

  test('main.js should toggle word-wrap class on diff-viewer', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleWordWrapToggle');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes('diffViewer.classList.add(\'word-wrap\')'), 'handleWordWrapToggle should add word-wrap class');
    assert.ok(toggleFn.includes('diffViewer.classList.remove(\'word-wrap\')'), 'handleWordWrapToggle should remove word-wrap class');
  });

  test('main.js should toggle active class on word-wrap button', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleWordWrapToggle');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes('wordWrapBtn.classList.add(\'active\')'), 'handleWordWrapToggle should add active class to button');
    assert.ok(toggleFn.includes('wordWrapBtn.classList.remove(\'active\')'), 'handleWordWrapToggle should remove active class from button');
  });

  test('main.js should handle Ctrl+Shift+W keyboard shortcut', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("e.key === 'w'") && source.includes('ctrlKey') && source.includes('shiftKey'),
      'main.js should handle Ctrl+Shift+W keyboard shortcut');
  });

  test('main.js should call handleWordWrapToggle on Ctrl+Shift+W', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const shortcutIndex = source.indexOf("e.key === 'w'");
    const context = source.substring(shortcutIndex - 100, shortcutIndex + 150);

    assert.ok(context.includes('handleWordWrapToggle'), 'Ctrl+Shift+W should call handleWordWrapToggle');
  });

  test('index.html should have word-wrap-btn button', () => {
    const fs = require('fs');
    const htmlPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
    const source = fs.readFileSync(htmlPath, 'utf-8');

    assert.ok(source.includes('id="word-wrap-btn"'), 'index.html should have word-wrap-btn button');
  });

  test('index.html word-wrap-btn should have Wrap text', () => {
    const fs = require('fs');
    const htmlPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
    const source = fs.readFileSync(htmlPath, 'utf-8');

    assert.ok(source.includes('>Wrap</button>') || source.includes('>Wrap</'), 'index.html should have Wrap text on button');
  });

  test('styles.css should have .word-wrap-btn styling', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.word-wrap-btn'), 'styles.css should have .word-wrap-btn styling');
  });

  test('styles.css should have .word-wrap-btn.active styling', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.word-wrap-btn.active'), 'styles.css should have .word-wrap-btn.active styling');
  });

  test('styles.css should have word-wrap class for diff-viewer', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('#diff-viewer.word-wrap'), 'styles.css should have #diff-viewer.word-wrap styling');
  });

  test('styles.css word-wrap should apply white-space pre-wrap', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    const wordWrapSection = source.indexOf('#diff-viewer.word-wrap');
    const endSection = source.indexOf('}', wordWrapSection);
    const section = source.substring(wordWrapSection, endSection);

    assert.ok(section.includes('white-space: pre-wrap'), 'word-wrap should apply white-space: pre-wrap');
  });

  test('styles.css word-wrap should apply word-break break-all', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    const wordWrapSection = source.indexOf('#diff-viewer.word-wrap');
    const endSection = source.indexOf('}', wordWrapSection);
    const section = source.substring(wordWrapSection, endSection);

    assert.ok(section.includes('word-break: break-all'), 'word-wrap should apply word-break: break-all');
  });

  test('main.js should get wordWrapBtn element by id', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('getElementById(\'word-wrap-btn\')'), 'main.js should get word-wrap-btn element');
  });

  test('main.js should add click listener to wordWrapBtn in init', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const initStart = source.indexOf('function init()');
    const initEnd = source.indexOf('\n// ───', initStart);
    const initFn = source.substring(initStart, initEnd > initStart ? initEnd : undefined);

    assert.ok(initFn.includes('wordWrapBtn') && initFn.includes('addEventListener'), 'init should add click listener to wordWrapBtn');
  });
});