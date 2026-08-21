import * as assert from 'assert';
import * as path from 'path';

suite('First Run Tip E2E Tests', () => {
  test('First run tip banner should be defined in webview', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('showFirstRunTipBanner'), 'main.js should have showFirstRunTipBanner function');
    assert.ok(source.includes('dismissFirstRunTip'), 'main.js should have dismissFirstRunTip function');
  });

  test('firstRunTipVisible state variable should be defined', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('let firstRunTipVisible'), 'main.js should have firstRunTipVisible state variable');
  });

  test('showFirstRunTipBanner should create banner element', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const showStart = source.indexOf('function showFirstRunTipBanner()');
    const showEnd = source.indexOf('\n}', source.indexOf('const banner', showStart)) + 2;
    const showFn = source.substring(showStart, showEnd);

    assert.ok(showFn.includes('first-run-tip-banner'), 'showFirstRunTipBanner should create banner with id first-run-tip-banner');
    assert.ok(showFn.includes('first-run-tip-content'), 'Banner should have content container');
    assert.ok(showFn.includes('Got it'), 'Banner should have Got it button');
  });

  test('showFirstRunTipBanner should set firstRunTipVisible to true', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const showStart = source.indexOf('function showFirstRunTipBanner()');
    const showEnd = source.indexOf('\n}', source.indexOf('const banner', showStart)) + 2;
    const showFn = source.substring(showStart, showEnd);

    assert.ok(showFn.includes('firstRunTipVisible = true'), 'showFirstRunTipBanner should set firstRunTipVisible to true');
  });

  test('dismissFirstRunTip should remove banner element', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const dismissStart = source.indexOf('function dismissFirstRunTip()');
    const dismissEnd = source.indexOf('\n}', dismissStart) + 2;
    const dismissFn = source.substring(dismissStart, dismissEnd);

    assert.ok(dismissFn.includes('.remove()'), 'dismissFirstRunTip should remove banner element');
  });

  test('dismissFirstRunTip should send dismissFirstRunTip message', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const dismissStart = source.indexOf('function dismissFirstRunTip()');
    const dismissEnd = source.indexOf('\n}', dismissStart) + 2;
    const dismissFn = source.substring(dismissStart, dismissEnd);

    assert.ok(dismissFn.includes("type: 'dismissFirstRunTip'"), 'dismissFirstRunTip should send dismissFirstRunTip message to extension');
  });

  test('dismissFirstRunTip should set firstRunTipVisible to false', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const dismissStart = source.indexOf('function dismissFirstRunTip()');
    const dismissEnd = source.indexOf('\n}', dismissStart) + 2;
    const dismissFn = source.substring(dismissStart, dismissEnd);

    assert.ok(dismissFn.includes('firstRunTipVisible = false'), 'dismissFirstRunTip should set firstRunTipVisible to false');
  });

  test('Webview should handle showFirstRunTip message', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const handleStart = source.indexOf("case 'showFirstRunTip':");
    const handleEnd = source.indexOf('break;', handleStart);
    const handleCase = source.substring(handleStart, handleEnd);

    assert.ok(handleCase.includes('showFirstRunTipBanner'), 'showFirstRunTip case should call showFirstRunTipBanner');
  });

  test('Banner should attach click handler to dismiss button', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const showStart = source.indexOf('function showFirstRunTipBanner()');
    const showEnd = source.indexOf('\n}', source.indexOf('const banner', showStart)) + 2;
    const showFn = source.substring(showStart, showEnd);

    assert.ok(showFn.includes('addEventListener'), 'Banner should attach event listener to dismiss button');
    assert.ok(showFn.includes('click'), 'Event listener should be for click event');
  });

  test('Banner styles should be defined', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.first-run-tip-banner'), 'styles.css should have .first-run-tip-banner class');
    assert.ok(source.includes('.first-run-tip-content'), 'styles.css should have .first-run-tip-content class');
    assert.ok(source.includes('.first-run-tip-icon'), 'styles.css should have .first-run-tip-icon class');
    assert.ok(source.includes('.first-run-tip-text'), 'styles.css should have .first-run-tip-text class');
    assert.ok(source.includes('.first-run-tip-title'), 'styles.css should have .first-run-tip-title class');
    assert.ok(source.includes('.first-run-tip-message'), 'styles.css should have .first-run-tip-message class');
    assert.ok(source.includes('.first-run-tip-dismiss'), 'styles.css should have .first-run-tip-dismiss class');
  });

  test('Banner should have slideDown animation', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('@keyframes slideDown'), 'styles.css should have slideDown animation');
    });

  test('Banner should use VS Code theme variables', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    const bannerStart = source.indexOf('.first-run-tip-banner');
    const bannerEnd = source.indexOf('}', bannerStart);
    const bannerStyle = source.substring(bannerStart, bannerEnd);

    assert.ok(bannerStyle.includes('var(--vscode-'), 'Banner should use VS Code CSS variables');
  });

  test('Banner dismiss button should have hover state', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.first-run-tip-dismiss:hover'), 'styles.css should have hover state for dismiss button');
  });

  test('Banner should have lightbulb emoji icon', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const showStart = source.indexOf('function showFirstRunTipBanner()');
    const showEnd = source.indexOf('\n}', source.indexOf('const banner', showStart)) + 2;
    const showFn = source.substring(showStart, showEnd);

    assert.ok(showFn.includes('💡'), 'Banner should have lightbulb emoji');
  });

  test('Banner should mention keyboard shortcuts', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const showStart = source.indexOf('function showFirstRunTipBanner()');
    const showEnd = source.indexOf('\n}', source.indexOf('const banner', showStart)) + 2;
    const showFn = source.substring(showStart, showEnd);

    assert.ok(showFn.includes('keyboard shortcuts'), 'Banner should mention keyboard shortcuts');
    assert.ok(showFn.includes('?'), 'Banner should mention ? key for help');
  });
});
