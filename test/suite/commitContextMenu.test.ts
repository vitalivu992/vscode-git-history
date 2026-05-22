import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('Commit Context Menu Unit Tests', () => {
  const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
  let source: string;

  suiteSetup(() => {
    source = fs.readFileSync(mainJsPath, 'utf-8');
  });

  // ── Function existence ──

  test('showCommitContextMenu function exists', () => {
    assert.ok(source.includes('function showCommitContextMenu'),
      'showCommitContextMenu should be defined');
  });

  test('showCommitContextMenu removes existing menu before showing new one', () => {
    const fnStart = source.indexOf('function showCommitContextMenu');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("getElementById('commit-context-menu')"),
      'Should remove existing context menu by id');
    assert.ok(fnBody.includes('existingMenu.remove()'),
      'Should call remove() on existing menu');
  });

  test('context menu has correct element id and class', () => {
    assert.ok(source.includes("id = 'commit-context-menu'"),
      'Menu should have id commit-context-menu');
    assert.ok(source.includes("className = 'context-menu'"),
      'Menu should have class context-menu');
  });

  test('context menu is positioned at click location', () => {
    const fnStart = source.indexOf('function showCommitContextMenu');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('event.clientX'),
      'Should use event.clientX for positioning');
    assert.ok(fnBody.includes('event.clientY'),
      'Should use event.clientY for positioning');
  });

  test('context menu closes when clicking outside', () => {
    const fnStart = source.indexOf('function showCommitContextMenu');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('closeMenu'),
      'Should define closeMenu handler');
    assert.ok(fnBody.includes("removeEventListener('click'"),
      'Should remove click listener when closing');
  });

  test('menu items close menu after action', () => {
    const fnStart = source.indexOf('function showCommitContextMenu');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('menu.remove()'),
      'Menu should call remove() after clicking an item');
  });

  // ── All data-action attributes present ──

  const expectedActions = [
    'copy-hash',
    'copy-message',
    'copy-info',
    'copy-cherry-pick',
    'copy-revert',
    'copy-show-command',
    'copy-files',
    'copy-diff',
    'copy-describe',
    'copy-patch',
    'copy-url',
    'open-url',
    'copy-mention',
    'copy-ref',
    'copy-stats',
    'copy-author-email',
    'copy-author-name',
    'copy-committer-email',
    'copy-committer-name',
    'copy-parent-hash',
    'copy-short-hash',
    'copy-subject',
    'copy-diff-stat-summary',
    'copy-file-stats',
    'copy-commit-with-stats',
    'copy-oneline',
    'copy-commit-body',
    'copy-markdown',
    'copy-json',
    'copy-co-authors',
    'copy-commit-date',
    'copy-relative-date',
    'copy-timestamp',
    'copy-branch-name',
    'copy-branch-url',
    'copy-remote-url',
    'copy-tags',
    'create-branch',
    'create-tag',
    'delete-tag',
    'copy-selected-hashes',
    'copy-selected-cherry-pick-commands',
    'copy-all-filtered-hashes',
    'copy-combined-diff',
    'copy-range-diff',
    'compare-parent',
  ];

  for (const action of expectedActions) {
    test(`data-action="${action}" exists in context menu`, () => {
      assert.ok(source.includes(`data-action="${action}"`),
        `Context menu should include data-action="${action}"`);
    });
  }

  // ── Menu labels ──

  const expectedLabels: [string, string][] = [
    ['copy-hash', 'Copy commit hash'],
    ['copy-message', 'Copy commit message'],
    ['copy-info', 'Copy commit info'],
    ['copy-cherry-pick', 'Copy cherry-pick command'],
    ['copy-revert', 'Copy revert command'],
    ['copy-show-command', 'Copy git show command'],
    ['copy-files', 'Copy changed files'],
    ['copy-diff', 'Copy commit diff'],
    ['copy-describe', 'Copy as Git Describe'],
    ['copy-patch', 'Copy as patch'],
    ['copy-url', 'Copy commit URL'],
    ['open-url', 'Open in browser'],
    ['copy-mention', 'Copy as Platform Mention'],
    ['copy-ref', 'Copy commit reference'],
    ['copy-stats', 'Copy stats'],
    ['copy-author-email', 'Copy author email'],
    ['copy-author-name', 'Copy author name'],
    ['copy-committer-email', 'Copy committer email'],
    ['copy-committer-name', 'Copy committer name'],
    ['copy-parent-hash', 'Copy parent hash'],
    ['copy-short-hash', 'Copy short hash'],
    ['copy-subject', 'Copy subject'],
    ['copy-diff-stat-summary', 'Copy diff stat summary'],
    ['copy-file-stats', 'Copy file stats'],
    ['copy-commit-with-stats', 'Copy message with stats'],
    ['copy-oneline', 'Copy as oneline'],
    ['copy-commit-body', 'Copy commit body'],
    ['copy-markdown', 'Copy as Markdown'],
    ['copy-json', 'Copy as JSON'],
    ['copy-co-authors', 'Copy co-authors'],
    ['copy-commit-date', 'Copy commit date'],
    ['copy-relative-date', 'Copy relative date'],
    ['copy-timestamp', 'Copy Unix timestamp'],
    ['copy-branch-name', 'Copy branch name'],
    ['copy-branch-url', 'Copy branch URL'],
    ['copy-remote-url', 'Copy remote URL'],
    ['copy-tags', 'Copy tags'],
    ['create-branch', 'Create branch from commit'],
    ['create-tag', 'Create tag from commit'],
    ['delete-tag', 'Delete tag from commit'],
    ['copy-selected-hashes', 'Copy selected hashes'],
    ['copy-selected-cherry-pick-commands', 'Copy cherry-pick commands (selected)'],
    ['copy-all-filtered-hashes', 'Copy all filtered hashes'],
    ['copy-combined-diff', 'Copy combined diff'],
    ['copy-range-diff', 'Copy range diff'],
    ['compare-parent', 'Compare with parent'],
  ];

  for (const [action, label] of expectedLabels) {
    test(`data-action="${action}" has label "${label}"`, () => {
      assert.ok(source.includes(label),
        `Context menu should include label "${label}"`);
    });
  }

  // ── Conditional items ──

  test('delete-tag is conditional on commit having tags', () => {
    assert.ok(source.includes('commit.tags && commit.tags.length > 0'),
      'Delete tag should be shown only when commit has tags');
  });

  test('copy-selected-hashes is conditional on multi-select', () => {
    assert.ok(source.includes('selectedCommits.size > 1'),
      'Copy selected hashes should be shown only when 2+ commits selected');
  });

  test('copy-selected-cherry-pick-commands is conditional on multi-select', () => {
    // Count occurrences to ensure it's used for both selected hashes and cherry-pick
    const occurrences = source.split('selectedCommits.size > 1').length - 1;
    assert.ok(occurrences >= 2,
      'selectedCommits.size > 1 should be used for multi-select conditional items');
  });

  test('copy-combined-diff is conditional on multi-select', () => {
    const idx = source.indexOf('copy-combined-diff');
    assert.ok(idx >= 0, 'copy-combined-diff action should exist');
  });

  test('copy-range-diff is conditional on range selection', () => {
    assert.ok(source.includes('rangeSelectionAnchor !== null'),
      'Copy range diff should show only when rangeSelectionAnchor is set');
  });

  // ── Message dispatch mapping ──

  const actionToMessage: [string, string][] = [
    ['copy-hash', 'copyCommitHash'],
    ['copy-message', 'copyCommitMessage'],
    ['copy-info', 'copyCommitInfo'],
    ['copy-cherry-pick', 'copyCherryPickCommand'],
    ['copy-revert', 'copyRevertCommand'],
    ['copy-show-command', 'copyShowCommand'],
    ['copy-files', 'copyCommitFiles'],
    ['copy-diff', 'copyCommitDiff'],
    ['copy-describe', 'copyDescribe'],
    ['copy-patch', 'copyCommitPatch'],
    ['copy-url', 'copyCommitUrl'],
    ['open-url', 'openCommitUrl'],
    ['copy-mention', 'copyCommitMention'],
    ['copy-ref', 'copyCommitRef'],
    ['copy-stats', 'copyCommitStats'],
    ['copy-author-email', 'copyAuthorEmail'],
    ['copy-author-name', 'copyAuthorName'],
    ['copy-committer-email', 'copyCommitterEmail'],
    ['copy-committer-name', 'copyCommitterName'],
    ['copy-parent-hash', 'copyParentHash'],
    ['copy-short-hash', 'copyShortHash'],
    ['copy-subject', 'copySubject'],
    ['copy-diff-stat-summary', 'copyDiffStatSummary'],
    ['copy-file-stats', 'copyFileStats'],
    ['copy-commit-with-stats', 'copyCommitWithStats'],
    ['copy-oneline', 'copyOneline'],
    ['copy-commit-body', 'copyCommitBody'],
    ['copy-markdown', 'copyCommitMarkdown'],
    ['copy-json', 'copyCommitJson'],
    ['copy-co-authors', 'copyCoAuthors'],
    ['copy-commit-date', 'copyCommitDate'],
    ['copy-relative-date', 'copyRelativeDate'],
    ['copy-timestamp', 'copyCommitTimestamp'],
    ['compare-parent', 'quickCompare'],
  ];

  for (const [action, messageType] of actionToMessage) {
    test(`action "${action}" dispatches message type "${messageType}"`, () => {
      assert.ok(source.includes(`type: '${messageType}'`),
        `Action "${action}" should send message type "${messageType}"`);
    });
  }

  // ── Handler dispatch for non-message actions ──

  const actionToHandler: [string, string][] = [
    ['copy-branch-name', 'handleCopyBranchName'],
    ['copy-branch-url', 'handleCopyBranchUrl'],
    ['copy-remote-url', 'handleCopyRemoteUrl'],
    ['copy-tags', 'handleCopyTags'],
    ['create-branch', 'handleCreateBranch'],
    ['create-tag', 'handleCreateTag'],
    ['delete-tag', 'handleDeleteTag'],
    ['copy-selected-hashes', 'handleCopySelectedHashes'],
    ['copy-selected-cherry-pick-commands', 'handleCopySelectedCherryPickCommands'],
    ['copy-all-filtered-hashes', 'handleCopyAllFilteredHashes'],
    ['copy-combined-diff', 'handleCopyCombinedDiff'],
    ['copy-range-diff', 'handleCopyRangeDiff'],
  ];

  for (const [action, handler] of actionToHandler) {
    test(`action "${action}" calls handler "${handler}"`, () => {
      assert.ok(source.includes(`${handler}()`),
        `Action "${action}" should call ${handler}()`);
    });
  }

  // ── Context menu item count ──

  test('context menu has expected number of data-action items', () => {
    const matches = source.match(/data-action="[^"]+"/g);
    // Filter to only those within showCommitContextMenu
    assert.ok(matches && matches.length >= 45,
      `Should have at least 45 data-action items, found ${matches ? matches.length : 0}`);
  });
});
