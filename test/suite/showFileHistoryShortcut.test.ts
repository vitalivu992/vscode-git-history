import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('Show File History Shortcut Unit Tests', () => {
  let packageJson: any;

  suiteSetup(() => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  });

  test('showFileHistory keybinding exists in package.json', () => {
    const keybindings = packageJson.contributes?.keybindings || [];
    const kb = keybindings.find((k: any) => k.command === 'gitHistory.showFileHistory');

    assert.ok(kb, 'Keybinding for gitHistory.showFileHistory should exist');
    assert.strictEqual(kb.key, 'ctrl+alt+h', 'Should use ctrl+alt+h key');
    assert.strictEqual(kb.mac, 'cmd+alt+h', 'Should use cmd+alt+h on Mac');
    assert.strictEqual(kb.when, 'editorTextFocus', 'Should only fire when editor has focus');
  });

  test('showSelectionHistory keybinding exists in package.json', () => {
    const keybindings = packageJson.contributes?.keybindings || [];
    const kb = keybindings.find((k: any) => k.command === 'gitHistory.showSelectionHistory');

    assert.ok(kb, 'Keybinding for gitHistory.showSelectionHistory should exist');
    assert.strictEqual(kb.key, 'ctrl+alt+shift+h', 'Should use ctrl+alt+shift+h key');
    assert.strictEqual(kb.mac, 'cmd+alt+shift+h', 'Should use cmd+alt+shift+h on Mac');
    assert.strictEqual(kb.when, 'editorTextFocus && editorHasSelection', 'Should require text selection');
  });

  test('showFileHistory when clause uses editorTextFocus', () => {
    const keybindings = packageJson.contributes?.keybindings || [];
    const kb = keybindings.find((k: any) => k.command === 'gitHistory.showFileHistory');

    assert.ok(kb, 'Keybinding should exist');
    assert.ok(kb.when?.includes('editorTextFocus'),
      'When clause should include editorTextFocus');
  });

  test('showSelectionHistory when clause requires editorHasSelection', () => {
    const keybindings = packageJson.contributes?.keybindings || [];
    const kb = keybindings.find((k: any) => k.command === 'gitHistory.showSelectionHistory');

    assert.ok(kb, 'Keybinding should exist');
    assert.ok(kb.when?.includes('editorHasSelection'),
      'When clause should require editorHasSelection');
  });

  test('no duplicate keybindings for new shortcuts', () => {
    const keybindings = packageJson.contributes?.keybindings || [];

    const ctrlAltH = keybindings.filter((k: any) =>
      k.key === 'ctrl+alt+h' && k.when === 'editorTextFocus'
    );
    assert.strictEqual(ctrlAltH.length, 1,
      'Should have exactly one keybinding for ctrl+alt+h with editorTextFocus');

    const ctrlAltShiftH = keybindings.filter((k: any) =>
      k.key === 'ctrl+alt+shift+h' && k.when === 'editorTextFocus && editorHasSelection'
    );
    assert.strictEqual(ctrlAltShiftH.length, 1,
      'Should have exactly one keybinding for ctrl+alt+shift+h with selection when clause');
  });
});
