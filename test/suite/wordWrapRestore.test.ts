import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Word Wrap Settings Restoration', () => {
  test('word wrap restore should compare against wordWrapEnabled variable', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const settingsBlockStart = source.indexOf('// Apply word wrap');
    const settingsBlockEnd = source.indexOf('// Apply sort order', settingsBlockStart);
    const settingsBlock = source.substring(settingsBlockStart, settingsBlockEnd);

    assert.ok(
      settingsBlock.includes('settings.wordWrapEnabled !== wordWrapEnabled'),
      'Word wrap restore should compare settings.wordWrapEnabled against the wordWrapEnabled variable, not currentDiffType'
    );
  });

  test('word wrap restore should NOT compare against currentDiffType', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const settingsBlockStart = source.indexOf('// Apply word wrap');
    const settingsBlockEnd = source.indexOf('// Apply sort order', settingsBlockStart);
    const settingsBlock = source.substring(settingsBlockStart, settingsBlockEnd);

    assert.ok(
      !settingsBlock.includes('settings.wordWrapEnabled !== currentDiffType'),
      'Word wrap restore should NOT compare against currentDiffType'
    );
  });

  test('word wrap enabled path should add word-wrap class and active button', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const settingsBlockStart = source.indexOf('// Apply word wrap');
    const settingsBlockEnd = source.indexOf('// Apply sort order', settingsBlockStart);
    const settingsBlock = source.substring(settingsBlockStart, settingsBlockEnd);

    assert.ok(settingsBlock.includes("diffViewer.classList.add('word-wrap')"), 'Should add word-wrap class');
    assert.ok(settingsBlock.includes("wordWrapBtn.classList.add('active')"), 'Should add active class to button');
  });

  test('word wrap disabled path should remove word-wrap class and active button', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const toggleStart = source.indexOf('function handleWordWrapToggle');
    const toggleEnd = source.indexOf('\nfunction', toggleStart + 1);
    const toggleFn = source.substring(toggleStart, toggleEnd > toggleStart ? toggleEnd : undefined);

    assert.ok(toggleFn.includes("diffViewer.classList.remove('word-wrap')"), 'handleWordWrapToggle should remove word-wrap class');
    assert.ok(toggleFn.includes("wordWrapBtn.classList.remove('active')"), 'handleWordWrapToggle should remove active class from button');
  });

  test('sort order restore correctly compares against sortOldestFirst variable', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const sortBlockStart = source.indexOf('// Apply sort order');
    const nextComment = source.indexOf('// Apply', sortBlockStart + 1);
    const sortBlock = source.substring(sortBlockStart, nextComment > sortBlockStart ? nextComment : sortBlockStart + 500);

    assert.ok(
      sortBlock.includes('settings.sortOldestFirst !== sortOldestFirst'),
      'Sort order restore should compare against sortOldestFirst variable (pattern consistency check)'
    );
  });
});

suite('Word Wrap Settings Logic', () => {
  function simulateWordWrapRestore(savedSetting: boolean, currentState: boolean): { changed: boolean; newState: boolean } {
    if (savedSetting !== currentState) {
      return { changed: true, newState: savedSetting };
    }
    return { changed: false, newState: currentState };
  }

  test('no change when saved matches current state (both true)', () => {
    const result = simulateWordWrapRestore(true, true);
    assert.strictEqual(result.changed, false);
    assert.strictEqual(result.newState, true);
  });

  test('no change when saved matches current state (both false)', () => {
    const result = simulateWordWrapRestore(false, false);
    assert.strictEqual(result.changed, false);
    assert.strictEqual(result.newState, false);
  });

  test('change when saved differs from current (saved true, current false)', () => {
    const result = simulateWordWrapRestore(true, false);
    assert.strictEqual(result.changed, true);
    assert.strictEqual(result.newState, true);
  });

  test('change when saved differs from current (saved false, current true)', () => {
    const result = simulateWordWrapRestore(false, true);
    assert.strictEqual(result.changed, true);
    assert.strictEqual(result.newState, false);
  });
});
