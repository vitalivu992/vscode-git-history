import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('Readme git show command Documentation Test Suite', () => {
  const readmePath = path.resolve(__dirname, '../../../README.md');

  test('README.md should have Copy git show command in Commit Row Context Menu table', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    const contextMenuSection = source.substring(
      source.indexOf('**Commit Row Context Menu:**'),
      source.indexOf('**Changed Files Context Menu:**')
    );

    assert.ok(
      contextMenuSection.includes('**Copy git show command**'),
      'Commit Row Context Menu should include "Copy git show command"'
    );
  });

  test('README.md should document git show command keyboard shortcut', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');

    assert.ok(
      source.includes('`Ctrl+Alt+V`') || source.includes('`Cmd+Alt+V`'),
      'README should document Ctrl+Alt+V / Cmd+Alt+V keyboard shortcut for Copy git show command'
    );
  });

  test('Copy git show command context menu entry should mention git show', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    const contextMenuSection = source.substring(
      source.indexOf('**Commit Row Context Menu:**'),
      source.indexOf('**Changed Files Context Menu:**')
    );

    const entry = contextMenuSection.match(
      /\| \*\*Copy git show command\*\* \| [^|]+ \|/
    );

    assert.ok(entry, 'Copy git show command entry should exist in table');
    assert.ok(
      entry[0].includes('git show'),
      'Entry description should mention git show command'
    );
  });

  test('README.md should have Copy git show command in Changed Files Context Menu table', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    const changedFilesSection = source.substring(
      source.indexOf('**Changed Files Context Menu:**'),
      source.indexOf('#### Keyboard Navigation')
    );

    assert.ok(
      changedFilesSection.includes('**Copy git show command**'),
      'Changed Files Context Menu should include "Copy git show command"'
    );
  });

  test('Changed Files Context Menu entry should describe git show format', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    const changedFilesSection = source.substring(
      source.indexOf('**Changed Files Context Menu:**'),
      source.indexOf('#### Keyboard Navigation')
    );

    const entry = changedFilesSection.match(
      /\| \*\*Copy git show command\*\* \| [^|]+ \|/
    );

    assert.ok(entry, 'Copy git show command entry should exist in Changed Files Context Menu table');
    assert.ok(
      entry[0].includes('git show'),
      'Entry description should mention git show command format'
    );
    assert.ok(
      entry[0].includes('hash') || entry[0].includes('<hash>'),
      'Entry description should reference hash placeholder'
    );
  });
});
