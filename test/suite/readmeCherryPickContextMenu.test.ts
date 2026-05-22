import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('Readme Cherry-Pick Context Menu Documentation Test Suite', () => {
  const readmePath = path.resolve(__dirname, '../../../README.md');

  test('README.md should have Copy cherry-pick command in context menu table', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    const contextMenuSection = source.substring(
      source.indexOf('**Commit Row Context Menu:**'),
      source.indexOf('**Changed Files Context Menu:**')
    );

    assert.ok(
      contextMenuSection.includes('**Copy cherry-pick command**'),
      'Commit Row Context Menu should include "Copy cherry-pick command" (singular)'
    );
  });

  test('README.md should have Copy cherry-pick commands (multi-select) in context menu table', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    const contextMenuSection = source.substring(
      source.indexOf('**Commit Row Context Menu:**'),
      source.indexOf('**Changed Files Context Menu:**')
    );

    assert.ok(
      contextMenuSection.includes('**Copy cherry-pick commands**'),
      'Commit Row Context Menu should include "Copy cherry-pick commands" (plural) for multi-select'
    );
  });

  test('README.md should document multi-select cherry-pick as shown when 2+ selected', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    const contextMenuSection = source.substring(
      source.indexOf('**Commit Row Context Menu:**'),
      source.indexOf('**Changed Files Context Menu:**')
    );

    // The multi-select entry should mention "2+ commits selected" or similar
    const multiSelectEntry = contextMenuSection.match(
      /\*\*Copy cherry-pick commands\*\*[\s\S]*?(?=\*\*|$)/
    );
    assert.ok(
      multiSelectEntry && multiSelectEntry[0].includes('2+'),
      'Multi-select cherry-pick should be documented as shown when 2+ commits selected'
    );
  });

  test('Single and multi-select cherry-pick entries should be adjacent in table', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    const contextMenuSection = source.substring(
      source.indexOf('**Commit Row Context Menu:**'),
      source.indexOf('**Changed Files Context Menu:**')
    );

    const singleIdx = contextMenuSection.indexOf('**Copy cherry-pick command**');
    const multiIdx = contextMenuSection.indexOf('**Copy cherry-pick commands**');

    assert.ok(
      singleIdx < multiIdx,
      'Single "Copy cherry-pick command" should appear before "Copy cherry-pick commands" in table'
    );
  });

  test('Both cherry-pick entries should have distinct descriptions', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    const contextMenuSection = source.substring(
      source.indexOf('**Commit Row Context Menu:**'),
      source.indexOf('**Changed Files Context Menu:**')
    );

    const singleEntry = contextMenuSection.match(
      /\| \*\*Copy cherry-pick command\*\* \| [^|]+ \|/
    );
    const multiEntry = contextMenuSection.match(
      /\| \*\*Copy cherry-pick commands\*\* \| [^|]+ \|/
    );

    assert.ok(singleEntry, 'Single cherry-pick entry should exist in table');
    assert.ok(multiEntry, 'Multi-select cherry-pick entry should exist in table');
    assert.notStrictEqual(
      singleEntry[0],
      multiEntry[0],
      'Single and multi-select entries should have different descriptions'
    );
  });
});