import * as assert from 'assert';
import { buildGitLogCommand } from '../../src/webview/messageHandler';
import { FilterQueryState } from '../../src/types';

const defaultFilterState: FilterQueryState = {
  query: '',
  hideMergeCommits: false,
  sortMode: 0,
  showMyCommitsOnly: false,
  regexSearchEnabled: false,
  pathFilter: null
};

suite('buildGitLogCommand Unit Tests', function() {
  this.timeout(10000);

  test('should produce basic git log command with no filters', function() {
    const result = buildGitLogCommand(defaultFilterState);
    assert.ok(result.startsWith('git log'), 'Should start with git log');
    assert.ok(result.includes('--format='), 'Should include format flag');
    assert.ok(!result.includes('--grep'), 'Should not include grep for empty query');
    assert.ok(!result.includes('--no-merges'), 'Should not include no-merges when disabled');
    assert.ok(!result.includes('-- '), 'Should not include path separator when no path filter');
  });

  test('should include --grep for text search', function() {
    const state: FilterQueryState = { ...defaultFilterState, query: 'fix bug' };
    const result = buildGitLogCommand(state);
    assert.ok(result.includes('--grep="fix bug"'), 'Should include --grep with text query');
    assert.ok(!result.includes('-E'), 'Should not include -E for non-regex mode');
  });

  test('should include -E for regex mode', function() {
    const state: FilterQueryState = { ...defaultFilterState, query: 'fix(bug|patch)', regexSearchEnabled: true };
    const result = buildGitLogCommand(state);
    assert.ok(result.includes('--grep="fix(bug|patch)"'), 'Should include --grep with regex query');
    assert.ok(result.includes('-E'), 'Should include -E for regex mode');
  });

  test('should include --author for author filter', function() {
    const state: FilterQueryState = { ...defaultFilterState, query: 'author:Alice' };
    const result = buildGitLogCommand(state);
    assert.ok(result.includes('--author="Alice"'), 'Should include --author');
    assert.ok(!result.includes('--grep'), 'Should not include --grep for author-only query');
  });

  test('should include --after for after date filter', function() {
    const state: FilterQueryState = { ...defaultFilterState, query: 'after:2024-01-01' };
    const result = buildGitLogCommand(state);
    assert.ok(result.includes('--after="2024-01-01"'), 'Should include --after');
  });

  test('should include --before for before date filter', function() {
    const state: FilterQueryState = { ...defaultFilterState, query: 'before:2024-06-01' };
    const result = buildGitLogCommand(state);
    assert.ok(result.includes('--before="2024-06-01"'), 'Should include --before');
  });

  test('should include --after for last:Ndays relative date filter', function() {
    const state: FilterQueryState = { ...defaultFilterState, query: 'last:7days' };
    const result = buildGitLogCommand(state);
    assert.ok(result.includes('--after="7 days ago"'), 'Should include --after for relative date');
  });

  test('should include --after for last:2weeks relative date filter', function() {
    const state: FilterQueryState = { ...defaultFilterState, query: 'last:2weeks' };
    const result = buildGitLogCommand(state);
    assert.ok(result.includes('--after="2 weeks ago"'), 'Should include --after for weeks');
  });

  test('should include --after for last:3months relative date filter', function() {
    const state: FilterQueryState = { ...defaultFilterState, query: 'last:3months' };
    const result = buildGitLogCommand(state);
    assert.ok(result.includes('--after="3 months ago"'), 'Should include --after for months');
  });

  test('should include --no-merges for hideMergeCommits', function() {
    const state: FilterQueryState = { ...defaultFilterState, hideMergeCommits: true };
    const result = buildGitLogCommand(state);
    assert.ok(result.includes('--no-merges'), 'Should include --no-merges');
  });

  test('should include path separator for pathFilter', function() {
    const state: FilterQueryState = { ...defaultFilterState, pathFilter: 'src/main.ts' };
    const result = buildGitLogCommand(state);
    assert.ok(result.includes('-- "src/main.ts"'), 'Should include path filter');
  });

  test('should include --reverse for sortMode 1 (oldest first)', function() {
    const state: FilterQueryState = { ...defaultFilterState, sortMode: 1 };
    const result = buildGitLogCommand(state);
    assert.ok(result.includes('--reverse'), 'Should include --reverse for oldest-first sort');
  });

  test('should not include --reverse for sortMode 0 (newest first)', function() {
    const state: FilterQueryState = { ...defaultFilterState, sortMode: 0 };
    const result = buildGitLogCommand(state);
    assert.ok(!result.includes('--reverse'), 'Should not include --reverse for newest-first');
  });

  test('should combine multiple filters', function() {
    const state: FilterQueryState = {
      query: 'fix bug author:Alice after:2024-01-01',
      hideMergeCommits: true,
      sortMode: 0,
      showMyCommitsOnly: false,
      regexSearchEnabled: false,
      pathFilter: 'src/'
    };
    const result = buildGitLogCommand(state);
    assert.ok(result.includes('--grep="fix bug"'), 'Should include grep for remaining text');
    assert.ok(result.includes('--author="Alice"'), 'Should include author');
    assert.ok(result.includes('--after="2024-01-01"'), 'Should include after date');
    assert.ok(result.includes('--no-merges'), 'Should include no-merges');
    assert.ok(result.includes('-- "src/"'), 'Should include path filter');
  });

  test('should handle tag filter as comment', function() {
    const state: FilterQueryState = { ...defaultFilterState, query: 'tag:v1.0.0' };
    const result = buildGitLogCommand(state);
    assert.ok(result.includes('# tag filter'), 'Should include tag filter as comment');
  });

  test('should handle branch filter as comment', function() {
    const state: FilterQueryState = { ...defaultFilterState, query: 'branch:main' };
    const result = buildGitLogCommand(state);
    assert.ok(result.includes('# branch filter'), 'Should include branch filter as comment');
  });

  test('should handle showMyCommitsOnly without author filter', function() {
    const state: FilterQueryState = { ...defaultFilterState, showMyCommitsOnly: true };
    const result = buildGitLogCommand(state);
    assert.ok(result.includes('--author="<your-email>"'), 'Should include author placeholder');
  });

  test('should not duplicate author when showMyCommitsOnly and author filter both present', function() {
    const state: FilterQueryState = { ...defaultFilterState, query: 'author:Alice', showMyCommitsOnly: true };
    const result = buildGitLogCommand(state);
    assert.ok(result.includes('--author="Alice"'), 'Should include author from filter');
    assert.ok(!result.includes('<your-email>'), 'Should not include placeholder when author filter present');
  });

  test('should handle singular day unit', function() {
    const state: FilterQueryState = { ...defaultFilterState, query: 'last:1day' };
    const result = buildGitLogCommand(state);
    assert.ok(result.includes('--after="1 days ago"'), 'Should normalize day to days');
  });
});

suite('copyFilterAsGitLogCommand Source Verification Tests', function() {
  this.timeout(10000);

  test('messageHandler.ts should have handleCopyFilterAsGitLogCommand function', function() {
    const fs = require('fs');
    const path = require('path');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFilterAsGitLogCommand'), 'messageHandler.ts should have handleCopyFilterAsGitLogCommand function');
    assert.ok(source.includes('export function buildGitLogCommand'), 'messageHandler.ts should export buildGitLogCommand');
  });

  test('messageHandler.ts should have copyFilterAsGitLogCommand in switch statement', function() {
    const fs = require('fs');
    const path = require('path');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes("case 'copyFilterAsGitLogCommand'"), 'Should have case for copyFilterAsGitLogCommand');
    assert.ok(source.includes('handleCopyFilterAsGitLogCommand(message.filterState'), 'Should call handleCopyFilterAsGitLogCommand with filterState');
  });

  test('types.ts should have copyFilterAsGitLogCommand in WebviewAction', function() {
    const fs = require('fs');
    const path = require('path');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("'copyFilterAsGitLogCommand'"), 'types.ts should have copyFilterAsGitLogCommand in WebviewAction');
  });

  test('types.ts should have copyFilterAsGitLogCommand in WebviewToExtMessage', function() {
    const fs = require('fs');
    const path = require('path');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("type: 'copyFilterAsGitLogCommand'"), 'types.ts should have copyFilterAsGitLogCommand message type');
  });
});
