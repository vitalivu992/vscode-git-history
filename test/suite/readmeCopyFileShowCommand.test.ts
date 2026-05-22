import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('Readme Copy File Show Command Documentation Test Suite', () => {
  const readmePath = path.resolve(__dirname, '../../../README.md');

  test('README.md should document Copy file show command', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');

    assert.ok(
      source.includes('Copy file show command') ||
      source.includes('copy-file-show-command') ||
      source.includes('git show <hash>:'),
      'README should document Copy File Show Command feature'
    );
  });

  test('README.md should document Copy file show command keyboard shortcut', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');

    assert.ok(
      source.includes('Ctrl+Alt+Shift+V') || source.includes('Cmd+Alt+Shift+V'),
      'README should document Ctrl+Alt+Shift+V / Cmd+Alt+Shift+V keyboard shortcut for Copy file show command'
    );
  });

  test('Copy file show command should be in History Panel Navigation table', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    const keyboardSection = source.substring(
      source.indexOf('### History Panel Navigation'),
      source.indexOf('### Filter Presets')
    );

    assert.ok(
      keyboardSection.includes('Copy file show command'),
      'History Panel Navigation table should include "Copy file show command"'
    );
  });

  test('Copy file show command entry should have correct keybinding', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    const keyboardSection = source.substring(
      source.indexOf('### History Panel Navigation'),
      source.indexOf('### Filter Presets')
    );

    const entry = keyboardSection.match(
      /\| Copy file show command \| [^|]+ \||\| Copy file show command \| `[^`]+`/
    );

    assert.ok(entry, 'Copy file show command entry should exist in table');
    assert.ok(
      entry[0].includes('Ctrl+Alt+Shift+V') || entry[0].includes('Cmd+Alt+Shift+V'),
      'Entry should have Ctrl+Alt+Shift+V / Cmd+Alt+Shift+V keybinding'
    );
  });
});
