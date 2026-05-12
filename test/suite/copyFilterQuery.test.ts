import * as assert from 'assert';
import { FilterQueryState } from '../../src/types';

suite('Copy Filter Query Tests', () => {
  test('FilterQueryState interface exists', () => {
    const state: FilterQueryState = {
      query: 'author:alice',
      hideMergeCommits: false,
      sortMode: 0,
      showMyCommitsOnly: false,
      regexSearchEnabled: false,
      pathFilter: null
    };
    assert.ok(state.query);
    assert.strictEqual(state.hideMergeCommits, false);
    assert.strictEqual(state.sortMode, 0);
    assert.strictEqual(state.showMyCommitsOnly, false);
    assert.strictEqual(state.regexSearchEnabled, false);
    assert.strictEqual(state.pathFilter, null);
  });

  test('FilterQueryState with all filters active', () => {
    const state: FilterQueryState = {
      query: 'author:alice after:2024-01-01 tag:v1.0',
      hideMergeCommits: true,
      sortMode: 2,
      showMyCommitsOnly: true,
      regexSearchEnabled: true,
      pathFilter: 'src/'
    };
    assert.strictEqual(state.query, 'author:alice after:2024-01-01 tag:v1.0');
    assert.strictEqual(state.hideMergeCommits, true);
    assert.strictEqual(state.sortMode, 2);
    assert.strictEqual(state.showMyCommitsOnly, true);
    assert.strictEqual(state.regexSearchEnabled, true);
    assert.strictEqual(state.pathFilter, 'src/');
  });

  test('FilterQueryState can be stringified to JSON', () => {
    const state: FilterQueryState = {
      query: 'fix bug',
      hideMergeCommits: false,
      sortMode: 0,
      showMyCommitsOnly: false,
      regexSearchEnabled: false,
      pathFilter: null
    };
    const json = JSON.stringify(state);
    assert.strictEqual(json, '{"query":"fix bug","hideMergeCommits":false,"sortMode":0,"showMyCommitsOnly":false,"regexSearchEnabled":false,"pathFilter":null}');
  });

  test('FilterQueryState with empty query', () => {
    const state: FilterQueryState = {
      query: '',
      hideMergeCommits: true,
      sortMode: 3,
      showMyCommitsOnly: false,
      regexSearchEnabled: false,
      pathFilter: null
    };
    const json = JSON.stringify(state);
    assert.strictEqual(json, '{"query":"","hideMergeCommits":true,"sortMode":3,"showMyCommitsOnly":false,"regexSearchEnabled":false,"pathFilter":null}');
  });
});
