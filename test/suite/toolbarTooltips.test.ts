import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('Toolbar Tooltips', function () {
  test('index.html has keyboard shortcuts in button tooltips', function () {
    const htmlPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
    const html = fs.readFileSync(htmlPath, 'utf-8');

    assert.ok(html.includes('Ctrl+Shift+Alt+S'), 'Signatures toggle should mention Ctrl+Shift+Alt+S');
    assert.ok(html.includes('Ctrl+Shift+Q'), 'Merge toggle should mention Ctrl+Shift+Q');
    assert.ok(html.includes('Ctrl+Shift+3'), 'Sort button should mention Ctrl+Shift+3');
  });

  test('toggle functions include shortcut in title updates', function () {
    const mainPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainPath, 'utf-8');

    assert.ok(source.includes("Ctrl+Shift+Alt+S to toggle"), 'handleToggleSignatures should include Ctrl+Shift+Alt+S');
    assert.ok(source.includes("Ctrl+Shift+Q to toggle"), 'handleMergeToggle should include Ctrl+Shift+Q');
    assert.ok(source.includes("Ctrl+Shift+3 to cycle"), 'updateSortButton should include Ctrl+Shift+3');
  });

  test('webviewProvider.ts has keyboard shortcuts in button tooltips', function () {
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('Ctrl+Shift+Alt+S'), 'webviewProvider should mention Ctrl+Shift+Alt+S');
    assert.ok(source.includes('Ctrl+Shift+Q'), 'webviewProvider should mention Ctrl+Shift+Q');
    assert.ok(source.includes('Ctrl+Shift+3'), 'webviewProvider should mention Ctrl+Shift+3');
  });

  test('main.js hidden state tooltips include shortcuts', function () {
    const mainPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainPath, 'utf-8');

    assert.ok(source.includes("'Show GPG signatures (Ctrl+Shift+Alt+S)'"), 'Hidden signatures tooltip should include shortcut');
    assert.ok(source.includes("'Hide merge commits (Ctrl+Shift+Q)'"), 'Inactive merge tooltip should include shortcut');
  });
});
