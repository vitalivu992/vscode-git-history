import * as assert from 'assert';
import { FilterQueryState } from '../../src/types';

suite('Copy Filter Query Tests', () => {
  test('FilterQueryState interface exists', () => {
    const state: FilterQueryState = {
      query: 'author:alice',
      hideMergeCommits: false,
      sortOldestFirst: false,
      showMyCommitsOnly: false
    };
    assert.ok(state.query);
    assert.strictEqual(state.hideMergeCommits, false);
    assert.strictEqual(state.sortOldestFirst, false);
    assert.strictEqual(state.showMyCommitsOnly, false);
  });

  test('FilterQueryState with all filters active', () => {
    const state: FilterQueryState = {
      query: 'author:alice after:2024-01-01 tag:v1.0',
      hideMergeCommits: true,
      sortOldestFirst: true,
      showMyCommitsOnly: true
    };
    assert.strictEqual(state.query, 'author:alice after:2024-01-01 tag:v1.0');
    assert.strictEqual(state.hideMergeCommits, true);
    assert.strictEqual(state.sortOldestFirst, true);
    assert.strictEqual(state.showMyCommitsOnly, true);
  });

  test('FilterQueryState can be stringified to JSON', () => {
    const state: FilterQueryState = {
      query: 'fix bug',
      hideMergeCommits: false,
      sortOldestFirst: false,
      showMyCommitsOnly: false
    };
    const json = JSON.stringify(state);
    assert.strictEqual(json, '{"query":"fix bug","hideMergeCommits":false,"sortOldestFirst":false,"showMyCommitsOnly":false}');
  });

  test('FilterQueryState with empty query', () => {
    const state: FilterQueryState = {
      query: '',
      hideMergeCommits: true,
      sortOldestFirst: true,
      showMyCommitsOnly: false
    };
    const json = JSON.stringify(state);
    assert.strictEqual(json, '{"query":"","hideMergeCommits":true,"sortOldestFirst":true,"showMyCommitsOnly":false}');
  });
});