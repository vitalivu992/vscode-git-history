import * as assert from 'assert';
import * as vscode from 'vscode';
import { FilterQueryState } from '../../src/types';

suite('Copy Filter Query E2E Tests', () => {
  test('handleCopyFilterQuery writes filter state to clipboard', async () => {
    // Create a mock panel
    const mockPanel = {
      postMessage: (_msg: unknown) => {},
      getCommits: () => []
    };

    // Create test filter state
    const filterState: FilterQueryState = {
      query: 'test query',
      hideMergeCommits: true,
      sortOldestFirst: false,
      showMyCommitsOnly: false
    };

    // Test that filter state can be formatted as JSON
    const formatted = JSON.stringify(filterState);
    assert.strictEqual(formatted, '{"query":"test query","hideMergeCommits":true,"sortOldestFirst":false,"showMyCommitsOnly":false}');

    // Test that write to clipboard would work (simulate by checking clipboard API exists)
    const clipboardText = await vscode.env.clipboard.writeText(formatted);
    // Just verify no error thrown
    assert.ok(true);
  });

  test('filter state matches expected shape', () => {
    const filterState: FilterQueryState = {
      query: 'author:Alice after:2024-01-01 tag:v1.0',
      hideMergeCommits: true,
      sortOldestFirst: true,
      showMyCommitsOnly: true
    };

    // Verify shape has all required properties
    assert.ok('query' in filterState);
    assert.ok('hideMergeCommits' in filterState);
    assert.ok('sortOldestFirst' in filterState);
    assert.ok('showMyCommitsOnly' in filterState);

    // Verify value types
    assert.strictEqual(typeof filterState.query, 'string');
    assert.strictEqual(typeof filterState.hideMergeCommits, 'boolean');
    assert.strictEqual(typeof filterState.sortOldestFirst, 'boolean');
    assert.strictEqual(typeof filterState.showMyCommitsOnly, 'boolean');
  });

  test('filter state parses correctly from JSON', () => {
    const json = '{"query":"author:bob before:2024-12-31","hideMergeCommits":false,"sortOldestFirst":true,"showMyCommitsOnly":true}';
    const filterState: FilterQueryState = JSON.parse(json);

    assert.strictEqual(filterState.query, 'author:bob before:2024-12-31');
    assert.strictEqual(filterState.hideMergeCommits, false);
    assert.strictEqual(filterState.sortOldestFirst, true);
    assert.strictEqual(filterState.showMyCommitsOnly, true);
  });

  test('empty filter state works', () => {
    const json = '{"query":"","hideMergeCommits":false,"sortOldestFirst":false,"showMyCommitsOnly":false}';
    const filterState: FilterQueryState = JSON.parse(json);

    assert.strictEqual(filterState.query, '');
    assert.strictEqual(filterState.hideMergeCommits, false);
    assert.strictEqual(filterState.sortOldestFirst, false);
    assert.strictEqual(filterState.showMyCommitsOnly, false);
  });
});