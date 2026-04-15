import * as assert from 'assert';
import * as path from 'path';

suite('Preference Persistence E2E Tests', () => {
  test('main.js should apply userSettings from init message', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const initStart = source.indexOf("case 'init':");
    const initEnd = source.indexOf('break;', initStart) + 6;
    const initCase = source.substring(initStart, initEnd);

    assert.ok(initCase.includes('message.userSettings'), 'init case should reference message.userSettings');
  });

  test('main.js should apply diffType from userSettings', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const initStart = source.indexOf("case 'init':");
    const initEnd = source.indexOf('break;', initStart) + 6;
    const initCase = source.substring(initStart, initEnd);

    assert.ok(initCase.includes('settings.diffType') && initCase.includes("setDiffType"), 'init should apply diffType from settings');
  });

  test('main.js should apply wordWrapEnabled from userSettings', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const initStart = source.indexOf("case 'init':");
    const initEnd = source.indexOf('break;', initStart) + 6;
    const initCase = source.substring(initStart, initEnd);

    assert.ok(initCase.includes('settings.wordWrapEnabled'), 'init should apply wordWrapEnabled from settings');
  });

  test('main.js should apply sortOldestFirst from userSettings', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const initStart = source.indexOf("case 'init':");
    const initEnd = source.indexOf('break;', initStart) + 6;
    const initCase = source.substring(initStart, initEnd);

    assert.ok(initCase.includes('settings.sortOldestFirst'), 'init should apply sortOldestFirst from settings');
  });

  test('main.js should apply hideMergeCommits from userSettings', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const initStart = source.indexOf("case 'init':");
    const initEnd = source.indexOf('break;', initStart) + 6;
    const initCase = source.substring(initStart, initEnd);

    assert.ok(initCase.includes('settings.hideMergeCommits'), 'init should apply hideMergeCommits from settings');
  });

  test('main.js should apply regexSearchEnabled from userSettings', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const initStart = source.indexOf("case 'init':");
    const initEnd = source.indexOf('break;', initStart) + 6;
    const initCase = source.substring(initStart, initEnd);

    assert.ok(initCase.includes('settings.regexSearchEnabled'), 'init should apply regexSearchEnabled from settings');
  });

  test('main.js handleSortToggle should save settings', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleSortToggle');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes("type: 'saveSettings'"), 'handleSortToggle should send saveSettings message');
    assert.ok(toggleFn.includes('sortOldestFirst'), 'handleSortToggle should save sortOldestFirst setting');
  });

  test('main.js handleMergeToggle should save settings', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleMergeToggle');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes("type: 'saveSettings'"), 'handleMergeToggle should send saveSettings message');
    assert.ok(toggleFn.includes('hideMergeCommits'), 'handleMergeToggle should save hideMergeCommits setting');
  });

  test('main.js handleWordWrapToggle should save settings', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleWordWrapToggle');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes("type: 'saveSettings'"), 'handleWordWrapToggle should send saveSettings message');
    assert.ok(toggleFn.includes('wordWrapEnabled'), 'handleWordWrapToggle should save wordWrapEnabled setting');
  });

  test('main.js handleRegexToggle should save settings', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleRegexToggle');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes("type: 'saveSettings'"), 'handleRegexToggle should send saveSettings message');
    assert.ok(toggleFn.includes('regexSearchEnabled'), 'handleRegexToggle should save regexSearchEnabled setting');
  });

  test('main.js setDiffType should save settings', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const setDiffStart = source.indexOf('function setDiffType');
    const setDiffEnd = source.indexOf('\nfunction', setDiffStart + 1);
    const setDiffFn = source.substring(setDiffStart, setDiffEnd > setDiffStart ? setDiffEnd : undefined);

    assert.ok(setDiffFn.includes("type: 'saveSettings'"), 'setDiffType should send saveSettings message');
    assert.ok(setDiffFn.includes('diffType'), 'setDiffType should save diffType setting');
  });

  test('All toggle functions should persist their settings', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Count occurrences of saveSettings in the main.js file
    const saveSettingsMatches = source.match(/type: 'saveSettings'/g);
    assert.ok(saveSettingsMatches && saveSettingsMatches.length >= 5, 'Should have at least 5 saveSettings calls (one per toggle)');
  });

  test('userSettings setting takes precedence over defaultDiffView config', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const initStart = source.indexOf("case 'init':");
    const initEnd = source.indexOf('break;', initStart) + 6;
    const initCase = source.substring(initStart, initEnd);

    // The user settings check should come before the defaultDiffView check
    const userSettingsIndex = initCase.indexOf('message.userSettings');
    const defaultDiffViewIndex = initCase.indexOf("message.defaultDiffView === 'side-by-side'");

    // Either userSettings is checked first, or defaultDiffView is in an else branch
    assert.ok(
      userSettingsIndex < defaultDiffViewIndex || initCase.includes('else if (message.defaultDiffView'),
      'userSettings should take precedence over defaultDiffView config'
    );
  });
});
