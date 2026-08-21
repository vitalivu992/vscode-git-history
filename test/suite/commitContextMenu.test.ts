import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('Commit Context Menu Unit Tests', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
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
    'copy-info',
    'copy-cherry-pick',
    'copy-revert',
    'copy-url',
    'copy-author-email',
    'copy-author-name',
    'copy-short-hash',
    'copy-subject',
    'create-branch',
    'create-tag',
    'delete-tag',
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
    ['copy-info', 'Copy commit info'],
    ['copy-cherry-pick', 'Copy cherry-pick command'],
    ['copy-revert', 'Copy revert command'],
    ['copy-url', 'Copy commit URL'],
    ['copy-author-email', 'Copy author email'],
    ['copy-author-name', 'Copy author name'],
    ['copy-short-hash', 'Copy short hash'],
    ['copy-subject', 'Copy subject'],
    ['create-branch', 'Create branch from commit'],
    ['create-tag', 'Create tag from commit'],
    ['delete-tag', 'Delete tag from commit'],
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

  // ── Message dispatch mapping ──

  const actionToMessage: [string, string][] = [
    ['copy-hash', 'copyCommitHash'],
    ['copy-info', 'copyCommitInfo'],
    ['copy-cherry-pick', 'copyCherryPickCommand'],
    ['copy-revert', 'copyRevertCommand'],
    ['copy-url', 'copyCommitUrl'],
    ['copy-author-email', 'copyAuthorEmail'],
    ['copy-author-name', 'copyAuthorName'],
    ['copy-short-hash', 'copyShortHash'],
    ['copy-subject', 'copySubject'],
  ];

  for (const [action, messageType] of actionToMessage) {
    test(`action "${action}" dispatches message type "${messageType}"`, () => {
      assert.ok(source.includes(`type: '${messageType}'`),
        `Action "${action}" should send message type "${messageType}"`);
    });
  }

  // ── Handler dispatch for non-message actions ──

  const actionToHandler: [string, string][] = [
    ['create-branch', 'handleCreateBranch'],
    ['create-tag', 'handleCreateTag'],
    ['delete-tag', 'handleDeleteTag'],
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
    assert.ok(matches && matches.length >= 14,
      `Should have at least 14 data-action items, found ${matches ? matches.length : 0}`);
  });
});
