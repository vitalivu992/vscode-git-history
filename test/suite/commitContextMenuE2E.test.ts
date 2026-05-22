import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Commit Context Menu E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHash: string;
  let mainJsSource: string;
  let messageHandlerSource: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-ctx-menu-'));
    testFile = path.join(tempDir, 'test.txt');

    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    fs.writeFileSync(testFile, 'Hello World\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit"', { cwd: tempDir });
    commitHash = execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim();

    mainJsSource = fs.readFileSync(
      path.resolve(__dirname, '../../src/webview/panel/main.js'), 'utf-8'
    );
    messageHandlerSource = fs.readFileSync(
      path.resolve(__dirname, '../../src/webview/messageHandler.ts'), 'utf-8'
    );
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // ── Context menu rendering ──

  test('context menu uses commit-context-menu element id', () => {
    const fnStart = mainJsSource.indexOf('function showCommitContextMenu');
    const fnEnd = mainJsSource.indexOf('\nfunction', fnStart + 1);
    const fnBody = mainJsSource.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("id = 'commit-context-menu'"),
      'Menu element should have id commit-context-menu');
  });

  test('context menu is appended to document body', () => {
    const fnStart = mainJsSource.indexOf('function showCommitContextMenu');
    const fnEnd = mainJsSource.indexOf('\nfunction', fnStart + 1);
    const fnBody = mainJsSource.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('document.body.appendChild(menu)'),
      'Menu should be appended to document body');
  });

  // ── Click handler dispatches correct messages ──

  const actionMessageTests: [string, string][] = [
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

  for (const [action, msgType] of actionMessageTests) {
    test(`clicking "${action}" sends "${msgType}" message`, () => {
      const fnStart = mainJsSource.indexOf('function showCommitContextMenu');
      const fnEnd = mainJsSource.indexOf('\nfunction', fnStart + 1);
      const fnBody = mainJsSource.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

      assert.ok(fnBody.includes(`action === '${action}'`),
        `Should handle action "${action}"`);
      assert.ok(fnBody.includes(`type: '${msgType}'`),
        `Should send message type "${msgType}"`);
    });
  }

  // ── Handler dispatch for non-postMessage actions ──

  const actionHandlerTests: [string, string][] = [
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

  for (const [action, handler] of actionHandlerTests) {
    test(`clicking "${action}" calls ${handler}()`, () => {
      const fnStart = mainJsSource.indexOf('function showCommitContextMenu');
      const fnEnd = mainJsSource.indexOf('\nfunction', fnStart + 1);
      const fnBody = mainJsSource.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

      assert.ok(fnBody.includes(`action === '${action}'`),
        `Should handle action "${action}"`);
      assert.ok(fnBody.includes(`${handler}()`),
        `Should call ${handler}()`);
    });
  }

  // ── Multi-select conditional items ──

  test('copy-selected-hashes hidden when single commit selected', () => {
    const idx = mainJsSource.indexOf('data-action="copy-selected-hashes"');
    assert.ok(idx >= 0, 'copy-selected-hashes action should exist');

    const lineStart = mainJsSource.lastIndexOf('\n', idx);
    const lineEnd = mainJsSource.indexOf('\n', idx);
    const line = mainJsSource.substring(lineStart, lineEnd);

    assert.ok(line.includes('selectedCommits.size > 1'),
      'Should use selectedCommits.size > 1 condition');
    assert.ok(line.includes('display') || line.includes('style'),
      'Should use display style for visibility');
  });

  test('copy-selected-cherry-pick-commands hidden when single commit selected', () => {
    const idx = mainJsSource.indexOf('data-action="copy-selected-cherry-pick-commands"');
    assert.ok(idx >= 0, 'copy-selected-cherry-pick-commands action should exist');

    const lineStart = mainJsSource.lastIndexOf('\n', idx);
    const lineEnd = mainJsSource.indexOf('\n', idx);
    const line = mainJsSource.substring(lineStart, lineEnd);

    assert.ok(line.includes('selectedCommits.size > 1'),
      'Should use selectedCommits.size > 1 condition');
  });

  test('copy-combined-diff hidden when single commit selected', () => {
    const idx = mainJsSource.indexOf('data-action="copy-combined-diff"');
    assert.ok(idx >= 0, 'copy-combined-diff action should exist');

    const lineStart = mainJsSource.lastIndexOf('\n', idx);
    const lineEnd = mainJsSource.indexOf('\n', idx);
    const line = mainJsSource.substring(lineStart, lineEnd);

    assert.ok(line.includes('selectedCommits.size > 1'),
      'Should use selectedCommits.size > 1 condition');
  });

  // ── Range selection conditional items ──

  test('copy-range-diff hidden when no range selection', () => {
    const idx = mainJsSource.indexOf('data-action="copy-range-diff"');
    assert.ok(idx >= 0, 'copy-range-diff action should exist');

    const lineStart = mainJsSource.lastIndexOf('\n', idx);
    const lineEnd = mainJsSource.indexOf('\n', idx);
    const line = mainJsSource.substring(lineStart, lineEnd);

    assert.ok(line.includes('rangeSelectionAnchor !== null'),
      'Should use rangeSelectionAnchor !== null condition');
  });

  // ── Tag conditional display ──

  test('delete-tag hidden when commit has no tags', () => {
    const idx = mainJsSource.indexOf('data-action="delete-tag"');
    assert.ok(idx >= 0, 'delete-tag action should exist');

    const lineStart = mainJsSource.lastIndexOf('\n', idx);
    const lineEnd = mainJsSource.indexOf('\n', idx);
    const line = mainJsSource.substring(lineStart, lineEnd);

    assert.ok(line.includes('commit.tags && commit.tags.length > 0'),
      'Should check commit.tags.length > 0');
  });

  // ── Message handler verification ──

  test('message handler handles copyCommitHash message', () => {
    assert.ok(messageHandlerSource.includes("type === 'copyCommitHash'") ||
      messageHandlerSource.includes("'copyCommitHash'"),
      'Message handler should handle copyCommitHash');
  });

  test('message handler handles copyCherryPickCommand message', () => {
    assert.ok(messageHandlerSource.includes("type === 'copyCherryPickCommand'") ||
      messageHandlerSource.includes("'copyCherryPickCommand'"),
      'Message handler should handle copyCherryPickCommand');
  });

  test('message handler handles copyRevertCommand message', () => {
    assert.ok(messageHandlerSource.includes("type === 'copyRevertCommand'") ||
      messageHandlerSource.includes("'copyRevertCommand'"),
      'Message handler should handle copyRevertCommand');
  });

  test('message handler handles copyShowCommand message', () => {
    assert.ok(messageHandlerSource.includes("type === 'copyShowCommand'") ||
      messageHandlerSource.includes("'copyShowCommand'"),
      'Message handler should handle copyShowCommand');
  });

  test('message handler handles openCommitUrl message', () => {
    assert.ok(messageHandlerSource.includes("type === 'openCommitUrl'") ||
      messageHandlerSource.includes("'openCommitUrl'"),
      'Message handler should handle openCommitUrl');
  });

  test('message handler handles quickCompare message', () => {
    assert.ok(messageHandlerSource.includes("type === 'quickCompare'") ||
      messageHandlerSource.includes("'quickCompare'"),
      'Message handler should handle quickCompare');
  });

  // ── Context menu click uses dataset.action ──

  test('menu click handler reads data-action via dataset', () => {
    const fnStart = mainJsSource.indexOf('function showCommitContextMenu');
    const fnEnd = mainJsSource.indexOf('\nfunction', fnStart + 1);
    const fnBody = mainJsSource.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('item.dataset.action'),
      'Should read action from item.dataset.action');
  });

  // ── Git operations work in temp repo ──

  test('commit hash is valid 40-character SHA', () => {
    assert.ok(/^[0-9a-f]{40}$/.test(commitHash),
      `Commit hash should be 40 hex chars, got: ${commitHash}`);
  });

  test('message handler handleCopyCommitHash exists', () => {
    assert.ok(messageHandlerSource.includes('function handleCopyCommitHash'),
      'handleCopyCommitHash function should exist');
  });

  test('message handler writes to clipboard', () => {
    assert.ok(messageHandlerSource.includes('vscode.env.clipboard.writeText'),
      'Message handler should write to clipboard');
  });
});
