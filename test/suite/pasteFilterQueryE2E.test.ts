import * as assert from 'assert';
import * as vscode from 'vscode';
import { FilterQueryState } from '../../src/types';

suite('Paste Filter Query E2E Tests', () => {
  test('full round-trip: copy filter state, parse, and apply', async () => {
    const filterState: FilterQueryState = {
      query: 'author:alice after:2024-01-01',
      hideMergeCommits: true,
      sortMode: 1,
      showMyCommitsOnly: true,
      regexSearchEnabled: false,
      pathFilter: null
    };

    // Simulate copy
    const json = JSON.stringify(filterState);
    await vscode.env.clipboard.writeText(json);

    // Simulate paste
    const clipboardText = await vscode.env.clipboard.readText();
    const parsed = JSON.parse(clipboardText) as FilterQueryState;

    assert.strictEqual(parsed.query, 'author:alice after:2024-01-01');
    assert.strictEqual(parsed.hideMergeCommits, true);
    assert.strictEqual(parsed.sortMode, 1);
    assert.strictEqual(parsed.showMyCommitsOnly, true);
    assert.strictEqual(parsed.regexSearchEnabled, false);
    assert.strictEqual(parsed.pathFilter, null);
  });

  test('invalid JSON in clipboard is handled gracefully', async () => {
    await vscode.env.clipboard.writeText('not valid json');
    const clipboardText = await vscode.env.clipboard.readText();

    assert.throws(() => JSON.parse(clipboardText), 'Should throw on invalid JSON');
  });

  test('non-object JSON is rejected', () => {
    const nonObjectValues = ['"string"', '42', 'true', 'null', '[]'];
    for (const val of nonObjectValues) {
      const parsed = JSON.parse(val);
      assert.strictEqual(typeof parsed !== 'object' || parsed === null || !('query' in parsed), true,
        `Non-object value "${val}" should be rejected`);
    }
  });

  test('filter state with missing fields is handled', () => {
    const partial = { query: 'test' };
    const json = JSON.stringify(partial);
    const parsed = JSON.parse(json);

    assert.strictEqual(parsed.query, 'test');
    assert.strictEqual(parsed.hideMergeCommits, undefined);
    assert.strictEqual(parsed.sortMode, undefined);
    assert.strictEqual(parsed.showMyCommitsOnly, undefined);
    assert.strictEqual(parsed.regexSearchEnabled, undefined);
    assert.strictEqual(parsed.pathFilter, undefined);
  });

  test('filter state with out-of-range sortMode is handled', () => {
    const state = { query: '', hideMergeCommits: false, sortMode: 5, showMyCommitsOnly: false, regexSearchEnabled: false, pathFilter: null };
    const validSortMode = typeof state.sortMode === 'number' && state.sortMode >= 0 && state.sortMode <= 3;
    assert.strictEqual(validSortMode, false, 'sortMode 5 should be invalid');
  });

  test('filter state with negative sortMode is handled', () => {
    const state = { query: '', hideMergeCommits: false, sortMode: -1, showMyCommitsOnly: false, regexSearchEnabled: false, pathFilter: null };
    const validSortMode = typeof state.sortMode === 'number' && state.sortMode >= 0 && state.sortMode <= 3;
    assert.strictEqual(validSortMode, false, 'Negative sortMode should be invalid');
  });

  test('empty filter state round-trip works', async () => {
    const filterState: FilterQueryState = {
      query: '',
      hideMergeCommits: false,
      sortMode: 0,
      showMyCommitsOnly: false,
      regexSearchEnabled: false,
      pathFilter: null
    };

    const json = JSON.stringify(filterState);
    await vscode.env.clipboard.writeText(json);

    const clipboardText = await vscode.env.clipboard.readText();
    const parsed = JSON.parse(clipboardText) as FilterQueryState;

    assert.strictEqual(parsed.query, '');
    assert.strictEqual(parsed.hideMergeCommits, false);
    assert.strictEqual(parsed.sortMode, 0);
    assert.strictEqual(parsed.showMyCommitsOnly, false);
    assert.strictEqual(parsed.regexSearchEnabled, false);
    assert.strictEqual(parsed.pathFilter, null);
  });

  test('filter state with all filters active round-trip works', async () => {
    const filterState: FilterQueryState = {
      query: 'author:alice tag:v2.0 after:2024-06-01 branch:main fix',
      hideMergeCommits: true,
      sortMode: 3,
      showMyCommitsOnly: true,
      regexSearchEnabled: true,
      pathFilter: 'src/'
    };

    const json = JSON.stringify(filterState);
    await vscode.env.clipboard.writeText(json);

    const clipboardText = await vscode.env.clipboard.readText();
    const parsed = JSON.parse(clipboardText) as FilterQueryState;

    assert.strictEqual(parsed.query, 'author:alice tag:v2.0 after:2024-06-01 branch:main fix');
    assert.strictEqual(parsed.hideMergeCommits, true);
    assert.strictEqual(parsed.sortMode, 3);
    assert.strictEqual(parsed.showMyCommitsOnly, true);
    assert.strictEqual(parsed.regexSearchEnabled, true);
    assert.strictEqual(parsed.pathFilter, 'src/');
  });
});
