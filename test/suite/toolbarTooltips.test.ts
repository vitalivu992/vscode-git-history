import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

// Since v1.2.2 removed the Signatures toggle and moved sort into table
// headers, the toolbar tooltips that carry shortcuts are: merge commits,
// my commits, word wrap, ignore whitespace, and regex search.
suite('Toolbar Tooltips', function () {
  test('index.html has keyboard shortcuts in button tooltips', function () {
    const htmlPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
    const html = fs.readFileSync(htmlPath, 'utf-8');

    assert.ok(html.includes('Ctrl+Shift+Q'), 'Merge toggle should mention Ctrl+Shift+Q');
    assert.ok(html.includes('Ctrl+Shift+M'), 'My commits toggle should mention Ctrl+Shift+M');
    assert.ok(html.includes('Ctrl+Shift+W'), 'Word wrap toggle should mention Ctrl+Shift+W');
    assert.ok(html.includes('Ctrl+Shift+Alt+J'), 'Ignore whitespace toggle should mention Ctrl+Shift+Alt+J');
    assert.ok(html.includes('Ctrl+Shift+X'), 'Regex toggle should mention Ctrl+Shift+X');
  });

  test('toggle functions include shortcut in title updates', function () {
    const mainPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainPath, 'utf-8');

    assert.ok(source.includes("Ctrl+Shift+Q to toggle"), 'handleMergeToggle should include Ctrl+Shift+Q');
    assert.ok(source.includes("Ctrl+Shift+W to toggle"), 'word wrap toggle should include Ctrl+Shift+W');
    assert.ok(source.includes("Ctrl+Shift+Alt+J to toggle"), 'ignore whitespace toggle should include Ctrl+Shift+Alt+J');
    assert.ok(source.includes("Ctrl+Shift+X to toggle"), 'regex toggle should include Ctrl+Shift+X');
  });

  test('webviewProvider.ts has keyboard shortcuts in button tooltips', function () {
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('Ctrl+Shift+Q'), 'webviewProvider should mention Ctrl+Shift+Q');
    assert.ok(source.includes('Ctrl+Shift+M'), 'webviewProvider should mention Ctrl+Shift+M');
    assert.ok(source.includes('Ctrl+Shift+W'), 'webviewProvider should mention Ctrl+Shift+W');
    assert.ok(source.includes('Ctrl+Shift+Alt+J'), 'webviewProvider should mention Ctrl+Shift+Alt+J');
    assert.ok(source.includes('Ctrl+Shift+X'), 'webviewProvider should mention Ctrl+Shift+X');
  });

  test('main.js active state tooltips include shortcuts', function () {
    const mainPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainPath, 'utf-8');

    assert.ok(source.includes("'Merge commits hidden (Ctrl+Shift+Q to toggle)'"), 'Active merge tooltip should include shortcut');
    assert.ok(source.includes("'Word wrap enabled (Ctrl+Shift+W to toggle)'"), 'Active word wrap tooltip should include shortcut');
    assert.ok(source.includes("'Ignore whitespace enabled (Ctrl+Shift+Alt+J to toggle)'"), 'Active ignore whitespace tooltip should include shortcut');
  });
});
