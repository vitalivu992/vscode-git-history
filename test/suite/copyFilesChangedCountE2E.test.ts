import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Simulate copy files changed count behavior
 */
interface CommitStats {
  filesChanged: number;
  insertions: number;
  deletions: number;
}

interface CommitInfo {
  hash: string;
  stats?: CommitStats;
}

function simulateCopyFilesChangedCount(commit: CommitInfo): { text: string; error: string | null } {
  if (!commit.stats) {
    return { text: '', error: 'No statistics available for this commit' };
  }

  const { stats } = commit;
  const filesWord = stats.filesChanged === 1 ? 'file' : 'files';
  const copyText = `${stats.filesChanged} ${filesWord}`;

  return { text: copyText, error: null };
}

suite('Copy Files Changed Count E2E Logic Tests', () => {
  test('copying files changed count for single file commit uses singular', () => {
    const commit: CommitInfo = {
      hash: 'abc123',
      stats: { filesChanged: 1, insertions: 10, deletions: 5 }
    };
    const result = simulateCopyFilesChangedCount(commit);
    assert.strictEqual(result.text, '1 file');
    assert.strictEqual(result.error, null);
  });

  test('copying files changed count for multiple files commit uses plural', () => {
    const commit: CommitInfo = {
      hash: 'def456',
      stats: { filesChanged: 3, insertions: 45, deletions: 12 }
    };
    const result = simulateCopyFilesChangedCount(commit);
    assert.strictEqual(result.text, '3 files');
    assert.strictEqual(result.error, null);
  });

  test('copying files changed count for zero files shows "0 files"', () => {
    const commit: CommitInfo = {
      hash: 'ghi789',
      stats: { filesChanged: 0, insertions: 0, deletions: 0 }
    };
    const result = simulateCopyFilesChangedCount(commit);
    assert.strictEqual(result.text, '0 files');
    assert.strictEqual(result.error, null);
  });

  test('copying files changed count for many files uses plural', () => {
    const commit: CommitInfo = {
      hash: 'jkl012',
      stats: { filesChanged: 100, insertions: 1000, deletions: 500 }
    };
    const result = simulateCopyFilesChangedCount(commit);
    assert.strictEqual(result.text, '100 files');
    assert.strictEqual(result.error, null);
  });

  test('copying files changed count without stats returns error', () => {
    const commit: CommitInfo = {
      hash: 'mno345'
    };
    const result = simulateCopyFilesChangedCount(commit);
    assert.strictEqual(result.text, '');
    assert.strictEqual(result.error, 'No statistics available for this commit');
  });

  test('copying files changed count with undefined stats returns error', () => {
    const commit: CommitInfo = {
      hash: 'pqr678',
      stats: undefined
    };
    const result = simulateCopyFilesChangedCount(commit);
    assert.strictEqual(result.text, '');
    assert.strictEqual(result.error, 'No statistics available for this commit');
  });

  test('output format is just "N file(s)" without insertions/deletions', () => {
    const commit: CommitInfo = {
      hash: 'stu901',
      stats: { filesChanged: 5, insertions: 123, deletions: 45 }
    };
    const result = simulateCopyFilesChangedCount(commit);
    assert.ok(result.text.includes('5 files'));
    assert.ok(!result.text.includes('insertions'));
    assert.ok(!result.text.includes('deletions'));
    assert.ok(!result.text.includes('changed'));
  });
});

suite('Copy Files Changed Count E2E Source Integration Tests', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const packageJsonPath = path.resolve(__dirname, '../../../package.json');

  test('types.ts defines copyFilesChangedCount in all required unions', () => {
    const typesSource = fs.readFileSync(typesPath, 'utf-8');

    // Check WebviewAction
    const actionMatch = typesSource.match(/WebviewAction\s*=\s*([\s\S]*?);/);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'copyFilesChangedCount'"),
      'WebviewAction should include copyFilesChangedCount');

    // Check WebviewToExtMessage
    const msgMatch = typesSource.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);/);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'copyFilesChangedCount'"),
      'WebviewToExtMessage should include copyFilesChangedCount');
  });

  test('messageHandler.ts implements handleCopyFilesChangedCount function', () => {
    const handlerSource = fs.readFileSync(handlerPath, 'utf-8');

    // Check function exists
    assert.ok(handlerSource.includes('function handleCopyFilesChangedCount'),
      'messageHandler.ts should have handleCopyFilesChangedCount function');

    // Check switch case
    assert.ok(handlerSource.includes("case 'copyFilesChangedCount':"),
      'messageHandler.ts should handle copyFilesChangedCount case');
  });

  test('handleCopyFilesChangedCount handles edge cases correctly', () => {
    const handlerSource = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = handlerSource.indexOf('function handleCopyFilesChangedCount');
    assert.ok(fnStart >= 0, 'Function should exist');

    const fnEnd = handlerSource.indexOf('\n}', fnStart + 400);
    const fnBody = handlerSource.substring(fnStart, fnEnd);

    // Check for commit not found handling
    assert.ok(fnBody.includes('Commit not found'),
      'Function should handle commit not found');

    // Check for no stats handling
    assert.ok(fnBody.includes('No statistics available'),
      'Function should handle missing statistics');

    // Check for singular/plural handling
    assert.ok(fnBody.includes('=== 1 ?') || fnBody.includes('=== 1'),
      'Function should check for singular form');

    // Check for clipboard write
    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Function should write to clipboard');

    // Check for confirmation message
    assert.ok(fnBody.includes('showInformationMessage'),
      'Function should show confirmation');
  });

  test('main.js has handleCopyFilesChangedCount function and sends message', () => {
    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');

    // Check function exists
    assert.ok(mainSource.includes('function handleCopyFilesChangedCount'),
      'main.js should have handleCopyFilesChangedCount function');

    // Check message sending
    assert.ok(mainSource.includes("type: 'copyFilesChangedCount'"),
      'main.js should send copyFilesChangedCount message');
  });

  test('main.js has context menu entry for copy-files-changed-count', () => {
    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');

    // Check context menu HTML
    assert.ok(mainSource.includes('data-action="copy-files-changed-count"'),
      'main.js should have context menu entry');

    // Check icon
    assert.ok(mainSource.includes('📊'),
      'main.js should have stats icon');

    // Check label
    assert.ok(mainSource.includes('Copy files changed count'),
      'main.js should have correct label');
  });

  test('main.js triggerAction dispatches copyFilesChangedCount', () => {
    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(mainSource.includes("case 'copyFilesChangedCount':"),
      'main.js triggerAction should handle copyFilesChangedCount');
    assert.ok(mainSource.includes("handleCopyFilesChangedCount()"),
      'main.js should call handleCopyFilesChangedCount');
  });

  test('extension.ts registers copyFilesChangedCount webview action', () => {
    const extensionSource = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(extensionSource.includes("action: 'copyFilesChangedCount'"),
      'extension.ts should register copyFilesChangedCount webview action');
    assert.ok(extensionSource.includes('gitHistory.copyFilesChangedCount'),
      'extension.ts should register gitHistory.copyFilesChangedCount command');
  });

  test('package.json defines copyFilesChangedCount command', () => {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    // Check command definition
    const commands = packageJson.contributes.commands;
    const command = commands.find((c: any) => c.command === 'gitHistory.copyFilesChangedCount');
    assert.ok(command, 'package.json should define gitHistory.copyFilesChangedCount command');
    assert.strictEqual(command.title, 'Git History: Copy Files Changed Count');
    assert.strictEqual(command.category, 'Git History');
  });

  test('package.json defines keybinding for copyFilesChangedCount', () => {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const keybindings = packageJson.contributes.keybindings || [];
    const keybinding = keybindings.find((k: any) => k.command === 'gitHistory.copyFilesChangedCount');
    assert.ok(keybinding, 'package.json should define F4 keybinding for copyFilesChangedCount');
    assert.strictEqual(keybinding.key, 'f4', 'Keybinding should be F4');
    assert.strictEqual(keybinding.mac, 'f4', 'mac keybinding should also be F4');
  });

  test('README.md documents the feature', () => {
    const readmePath = path.resolve(__dirname, '../../../README.md');
    const readmeSource = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(readmeSource.includes('Copy files changed count'),
      'README.md should document Copy files changed count');
  });
});

suite('Copy Files Changed Count E2E Message Flow Tests', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');

  test('main.js prioritizes focused row over selected commit', () => {
    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = mainSource.indexOf('function handleCopyFilesChangedCount');
    assert.ok(fnStart >= 0);

    const fnEnd = mainSource.indexOf('\n}', fnStart + 400);
    const fnBody = mainSource.substring(fnStart, fnEnd);

    // Check that focusedIndex is checked first
    const focusedIndexPos = fnBody.indexOf('focusedIndex');
    const selectedCommitsPos = fnBody.indexOf('selectedCommits');

    assert.ok(focusedIndexPos >= 0, 'Function should check focusedIndex');
    assert.ok(selectedCommitsPos >= 0, 'Function should check selectedCommits');

    // Focused should be checked before selected
    assert.ok(focusedIndexPos < selectedCommitsPos,
      'Function should prioritize focused row over selected commit');
  });

  test('main.js shows error when no commit is selected', () => {
    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = mainSource.indexOf('function handleCopyFilesChangedCount');
    assert.ok(fnStart >= 0);

    const fnEnd = mainSource.indexOf('\n}', fnStart + 400);
    const fnBody = mainSource.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('showError') || fnBody.includes('error'),
      'Function should show error when no commit selected');
    assert.ok(fnBody.includes('Select a commit'),
      'Error message should prompt user to select a commit');
  });

  test('message handler formats output as "N file(s)"', () => {
    const handlerSource = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = handlerSource.indexOf('function handleCopyFilesChangedCount');
    assert.ok(fnStart >= 0);

    const fnEnd = handlerSource.indexOf('\n}', fnStart + 400);
    const fnBody = handlerSource.substring(fnStart, fnEnd);

    // Check for filesWord variable
    assert.ok(fnBody.includes('filesWord'),
      'Function should define filesWord variable');

    // Check that the format is just files count
    assert.ok(fnBody.includes('stats.filesChanged'),
      'Function should use filesChanged from stats');

    // Verify the format includes only the count and word
    const formatMatch = fnBody.match(/`?\$\{[^}]*\} \$\{[^}]*\}`?/);
    assert.ok(formatMatch, 'Function should format output');
  });
});
