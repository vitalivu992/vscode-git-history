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
      'Commit Row Context Menu should include "Copy cherry-pick command"'
    );
  });
});