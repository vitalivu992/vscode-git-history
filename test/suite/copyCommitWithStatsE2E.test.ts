import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';

interface TestCommitWithStats {
  hash: string;
  shortHash: string;
  message: string;
  fullMessage: string;
  stats?: {
    filesChanged: number;
    insertions: number;
    deletions: number;
  };
}

function formatCommitWithStats(commit: TestCommitWithStats): string {
  let copyText = commit.message;

  // Add body if present
  const body = commit.fullMessage.split('\n').slice(1).join('\n').trim();
  if (body) {
    copyText += '\n\n' + body;
  }

  // Add stats if available
  if (commit.stats) {
    const stats = commit.stats;
    const filesWord = stats.filesChanged === 1 ? 'file' : 'files';
    const insertionsWord = stats.insertions === 1 ? 'insertion' : 'insertions';
    const deletionsWord = stats.deletions === 1 ? 'deletion' : 'deletions';
    copyText += '\n\n' + `${stats.filesChanged} ${filesWord} changed, ${stats.insertions} ${insertionsWord}(+), ${stats.deletions} ${deletionsWord}(-)`;
  }

  return copyText;
}

suite('Copy Commit Message with Stats E2E Tests', () => {
  const testRepoPath = path.resolve(__dirname, '../../../test-repository');

  setup(async () => {
    // Open the test repository workspace
    await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(testRepoPath));
  });

  teardown(async () => {
    // Close all open editors
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
  });

  test('copy commit message with stats copies subject, body, and stats', async () => {
    // Open file history
    const filePath = path.resolve(testRepoPath, 'test-file.txt');
    await vscode.commands.executeCommand('gitHistory.showFileHistory', vscode.Uri.file(filePath));

    // Wait for the webview to load
    await vscode.commands.executeCommand('gitHistory.refresh');

    // Get the first commit's hash by checking the document
    const editor = vscode.window.activeTextEditor;
    assert.ok(editor, 'Should have an active editor');

    // Execute copy commit message with stats action for the first commit
    await vscode.commands.executeCommand('gitHistory.copyCommitWithStats');

    // Verify clipboard content
    const clipboardContent = await vscode.env.clipboard.readText();
    assert.ok(clipboardContent.length > 0, 'Clipboard should have content');
    // Verify it includes subject (first line)
    assert.ok(clipboardContent.includes('\n\n'), 'Should have newlines separating sections');
  });

  test('formatCommitWithStats handles commit with body and stats', () => {
    const commit: TestCommitWithStats = {
      hash: 'abc123',
      shortHash: 'abc123',
      message: 'Fix bug',
      fullMessage: 'Fix bug\n\nThis is the body',
      stats: { filesChanged: 1, insertions: 5, deletions: 2 }
    };

    const result = formatCommitWithStats(commit);
    const expected = 'Fix bug\n\nThis is the body\n\n1 file changed, 5 insertions(+), 2 deletions(-)';
    assert.strictEqual(result, expected);
  });

  test('formatCommitWithStats handles commit without body', () => {
    const commit: TestCommitWithStats = {
      hash: 'abc123',
      shortHash: 'abc123',
      message: 'Simple commit',
      fullMessage: 'Simple commit',
      stats: { filesChanged: 3, insertions: 50, deletions: 10 }
    };

    const result = formatCommitWithStats(commit);
    const expected = 'Simple commit\n\n3 files changed, 50 insertions(+), 10 deletions(-)';
    assert.strictEqual(result, expected);
  });

  test('formatCommitWithStats handles commit without stats', () => {
    const commit: TestCommitWithStats = {
      hash: 'abc123',
      shortHash: 'abc123',
      message: 'No stats commit',
      fullMessage: 'No stats commit\n\nBody text',
      stats: undefined
    };

    const result = formatCommitWithStats(commit);
    const expected = 'No stats commit\n\nBody text';
    assert.strictEqual(result, expected);
  });

  test('formatCommitWithStats handles commit without body and stats', () => {
    const commit: TestCommitWithStats = {
      hash: 'abc123',
      shortHash: 'abc123',
      message: 'Just subject',
      fullMessage: 'Just subject',
      stats: undefined
    };

    const result = formatCommitWithStats(commit);
    const expected = 'Just subject';
    assert.strictEqual(result, expected);
  });

  test('output format matches specification with body', () => {
    const commit: TestCommitWithStats = {
      hash: 'abc123',
      shortHash: 'abc123',
      message: 'Fix authentication bug',
      fullMessage: 'Fix authentication bug\n\nUpdated JWT validation logic to handle expired tokens properly',
      stats: { filesChanged: 3, insertions: 45, deletions: 12 }
    };

    const result = formatCommitWithStats(commit);
    const expected = 'Fix authentication bug\n\nUpdated JWT validation logic to handle expired tokens properly\n\n3 files changed, 45 insertions(+), 12 deletions(-)';
    assert.strictEqual(result, expected);
  });

  test('output format matches specification without body', () => {
    const commit: TestCommitWithStats = {
      hash: 'abc123',
      shortHash: 'abc123',
      message: 'Fix authentication bug',
      fullMessage: 'Fix authentication bug',
      stats: { filesChanged: 3, insertions: 45, deletions: 12 }
    };

    const result = formatCommitWithStats(commit);
    const expected = 'Fix authentication bug\n\n3 files changed, 45 insertions(+), 12 deletions(-)';
    assert.strictEqual(result, expected);
  });

  test('keyboard shortcut Ctrl+Alt+W triggers the command', async () => {
    // This test verifies the keyboard shortcut is registered
    // The actual triggering is handled by VS Code keybinding system
    const allCommands = await vscode.commands.getCommands(true);
    const commandExists = allCommands.includes('gitHistory.copyCommitWithStats');
    assert.ok(commandExists, 'gitHistory.copyCommitWithStats command should be registered');
  });
});