import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('focusCommitList Unit Tests', function() {

  test.skip('types.ts should have focusCommitList WebviewAction', function() {
    const typesPath = path.join(__dirname, '..', '..', '..', 'src', 'types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    // Check that focusCommitList is in WebviewAction type
    const webviewActionMatch = source.match(/WebviewAction.*?=.*?\|[^]*?'focusCommitList'/);
    assert.ok(webviewActionMatch, 'types.ts should have focusCommitList in WebviewAction');
  });

  test('types.ts should have focusCommitList message type', function() {
    const typesPath = path.join(__dirname, '..', '..', '..', 'src', 'types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    // Check that focusCommitList message type is defined
    assert.ok(source.includes("type: 'focusCommitList'"), 'types.ts should define focusCommitList message type');
  });

  test('package.json should have gitHistory.focusCommitList command', function() {
    const packagePath = path.join(__dirname, '..', '..', '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

    // Check that command is defined
    assert.ok(pkg.contributes.commands.some((c: any) => c.command === 'gitHistory.focusCommitList'),
      'package.json should have gitHistory.focusCommitList command');
  });

  test('package.json should have keybinding for focusCommitList', function() {
    const packagePath = path.join(__dirname, '..', '..', '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

    // Check that keybinding is defined
    const keybinding = pkg.contributes.keybindings.find((k: any) => k.command === 'gitHistory.focusCommitList');
    assert.ok(keybinding, 'package.json should have keybinding for gitHistory.focusCommitList');
    assert.strictEqual(keybinding.key, 'ctrl+l', 'Windows/Linux keybinding should be ctrl+l');
    assert.strictEqual(keybinding.mac, 'cmd+l', 'Mac keybinding should be cmd+l');
  });

  test('extension.ts should register gitHistory.focusCommitList command', function() {
    const extensionPath = path.join(__dirname, '..', '..', '..', 'src', 'extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    // Check that command is registered
    assert.ok(source.includes("command: 'gitHistory.focusCommitList'"), 'extension should register command');
    assert.ok(source.includes("action: 'focusCommitList'"), 'Command should map to action');
  });

  test('main.js case focusCommitList should call handler', function() {
    const mainJsPath = path.join(__dirname, '..', '..', '..', 'src', 'webview', 'panel', 'main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Check that switch case calls handler
    assert.ok(source.includes("case 'focusCommitList':"), 'Switch should have focusCommitList case');
    assert.ok(source.includes('handleFocusCommitList()'), 'Should call handleFocusCommitList function');
  });

  test('main.js should have handleFocusCommitList function', function() {
    const mainJsPath = path.join(__dirname, '..', '..', '..', 'src', 'webview', 'panel', 'main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Check that handleFocusCommitList function exists
    assert.ok(source.includes('function handleFocusCommitList'), 'main.js should have handleFocusCommitList function');
  });

  test('main.js handleFocusCommitList should set focusedIndex to 0', function() {
    const mainJsPath = path.join(__dirname, '..', '..', '..', 'src', 'webview', 'panel', 'main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Check that the function sets focusedIndex = 0
    const fnMatch = source.match(/function handleFocusCommitList\(\)[^]*}/s);
    assert.ok(fnMatch, 'Should have handleFocusCommitList function');
    assert.ok(fnMatch[0].includes('focusedIndex = 0'), 'Should set focusedIndex to 0');
  });

  test('main.js handleFocusCommitList should call updateFocusedRow', function() {
    const mainJsPath = path.join(__dirname, '..', '..', '..', 'src', 'webview', 'panel', 'main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Check that the function calls updateFocusedRow
    const fnMatch = source.match(/function handleFocusCommitList\(\)[^]*}/s);
    assert.ok(fnMatch, 'Should have handleFocusCommitList function');
    assert.ok(fnMatch[0].includes('updateFocusedRow()'), 'Should call updateFocusedRow');
  });

  test('main.js handleFocusCommitList should call scrollFocusedIntoView', function() {
    const mainJsPath = path.join(__dirname, '..', '..', '..', 'src', 'webview', 'panel', 'main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Check that the function calls scrollFocusedIntoView
    const fnMatch = source.match(/function handleFocusCommitList\(\)[^]*}/s);
    assert.ok(fnMatch, 'Should have handleFocusCommitList function');
    assert.ok(fnMatch[0].includes('scrollFocusedIntoView()'), 'Should call scrollFocusedIntoView');
  });

  test('main.js should have focusCommitList in keyboard help', function() {
    const mainJsPath = path.join(__dirname, '..', '..', '..', 'src', 'webview', 'panel', 'main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Check that keyboard help includes the shortcut
    assert.ok(source.includes("'Focus commit list for navigation'"), 'Keyboard help should include focusCommitList description');
  });
});
