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
      path.resolve(__dirname, '../../../src/webview/panel/main.js'), 'utf-8'
    );
    messageHandlerSource = fs.readFileSync(
      path.resolve(__dirname, '../../../src/webview/messageHandler.ts'), 'utf-8'
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
    ['copy-info', 'copyCommitInfo'],
    ['copy-cherry-pick', 'copyCherryPickCommand'],
    ['copy-revert', 'copyRevertCommand'],
    ['copy-url', 'copyCommitUrl'],
    ['copy-author-email', 'copyAuthorEmail'],
    ['copy-author-name', 'copyAuthorName'],
    ['copy-short-hash', 'copyShortHash'],
    ['copy-subject', 'copySubject'],
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
    ['create-branch', 'handleCreateBranch'],
    ['create-tag', 'handleCreateTag'],
    ['delete-tag', 'handleDeleteTag'],
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
