import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';

interface TestCommit {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  date: string;
  message: string;
  fullMessage: string;
  stats?: {
    filesChanged: number;
    insertions: number;
    deletions: number;
  };
}

interface TestFileStats {
  path: string;
  insertions: number;
  deletions: number;
  isBinary: boolean;
}

function formatFullInfoWithStats(commit: TestCommit, files: TestFileStats[]): string {
  const messageText = commit.fullMessage || commit.message;
  const dateStr = new Date(commit.date).toLocaleString();
  let result = `commit ${commit.hash}\nAuthor: ${commit.author} <${commit.email}>\nDate: ${dateStr}\n\n    ${messageText.split('\n').join('\n    ')}`;

  if (commit.stats) {
    const filesWord = commit.stats.filesChanged === 1 ? 'file' : 'files';
    result += `\n\n${commit.stats.filesChanged} ${filesWord} changed, ${commit.stats.insertions} insertions(+), ${commit.stats.deletions} deletions(-)`;
  }

  if (files.length > 0) {
    result += '\n';
    for (const f of files) {
      if (f.isBinary) {
        result += `\n${f.path} | Binary`;
      } else {
        result += `\n${f.path} | +${f.insertions}, -${f.deletions}`;
      }
    }
  }

  return result;
}

suite('Copy Full Commit Info with File Stats E2E Tests', () => {
  const testRepoPath = path.resolve(__dirname, '../../../test-repository');

  setup(async () => {
    // Open the test repository workspace
    await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(testRepoPath));
  });

  teardown(async () => {
    // Close all open editors
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
  });

  test('formatFullInfoWithStats combines commit info and file stats', () => {
    const commit: TestCommit = {
      hash: 'abc123def456',
      shortHash: 'abc123d',
      author: 'John Doe',
      email: 'john@example.com',
      date: '2026-05-25T10:30:45.000Z',
      message: 'Fix authentication bug in login flow',
      fullMessage: 'Fix authentication bug in login flow\n\nThe previous implementation had a race condition.',
      stats: { filesChanged: 3, insertions: 15, deletions: 5 }
    };
    const files: TestFileStats[] = [
      { path: 'src/auth/login.ts', insertions: 12, deletions: 3, isBinary: false },
      { path: 'src/auth/session.ts', insertions: 2, deletions: 1, isBinary: false },
      { path: 'src/auth/utils.ts', insertions: 1, deletions: 1, isBinary: false },
    ];

    const result = formatFullInfoWithStats(commit, files);

    assert.ok(result.includes('commit abc123def456'));
    assert.ok(result.includes('Author: John Doe <john@example.com>'));
    assert.ok(result.includes('Date:'));
    assert.ok(result.includes('Fix authentication bug in login flow'));
    assert.ok(result.includes('The previous implementation had a race condition.'));
    assert.ok(result.includes('3 files changed, 15 insertions(+), 5 deletions(-)'));
    assert.ok(result.includes('src/auth/login.ts | +12, -3'));
    assert.ok(result.includes('src/auth/session.ts | +2, -1'));
    assert.ok(result.includes('src/auth/utils.ts | +1, -1'));
  });

  test('formatFullInfoWithStats handles binary files', () => {
    const commit: TestCommit = {
      hash: 'abc123',
      shortHash: 'abc1234',
      author: 'Test',
      email: 'test@test.com',
      date: new Date().toISOString(),
      message: 'Add image',
      fullMessage: 'Add image',
      stats: { filesChanged: 2, insertions: 10, deletions: 0 }
    };
    const files: TestFileStats[] = [
      { path: 'image.png', insertions: 0, deletions: 0, isBinary: true },
      { path: 'README.md', insertions: 10, deletions: 0, isBinary: false },
    ];

    const result = formatFullInfoWithStats(commit, files);
    assert.ok(result.includes('image.png | Binary'));
    assert.ok(result.includes('README.md | +10, -0'));
  });

  test('formatFullInfoWithStats handles no file stats', () => {
    const commit: TestCommit = {
      hash: 'abc123',
      shortHash: 'abc1234',
      author: 'Test',
      email: 'test@test.com',
      date: new Date().toISOString(),
      message: 'Simple commit',
      fullMessage: 'Simple commit',
      stats: { filesChanged: 1, insertions: 5, deletions: 2 }
    };

    const result = formatFullInfoWithStats(commit, []);
    assert.ok(result.includes('commit abc123'));
    assert.ok(result.includes('1 file changed'));
    assert.ok(!result.includes(' | '));
  });

  test('formatFullInfoWithStats indents multi-line message', () => {
    const commit: TestCommit = {
      hash: 'abc123',
      shortHash: 'abc1234',
      author: 'Test',
      email: 'test@test.com',
      date: new Date().toISOString(),
      message: 'Subject',
      fullMessage: 'Subject\n\nBody line 1\nBody line 2',
    };
    const files: TestFileStats[] = [];

    const result = formatFullInfoWithStats(commit, files);
    assert.ok(result.includes('    Subject'));
    assert.ok(result.includes('    Body line 1'));
    assert.ok(result.includes('    Body line 2'));
  });

  test('keyboard shortcut command is registered', async () => {
    const allCommands = await vscode.commands.getCommands(true);
    const commandExists = allCommands.includes('gitHistory.copyFullCommitInfoWithFileStats');
    assert.ok(commandExists, 'gitHistory.copyFullCommitInfoWithFileStats command should be registered');
  });

  test('copy full commit info with file stats action is available', async () => {
    // Open file history
    const filePath = path.resolve(testRepoPath, 'test-file.txt');
    await vscode.commands.executeCommand('gitHistory.showFileHistory', vscode.Uri.file(filePath));

    // Wait for the webview to load
    await vscode.commands.executeCommand('gitHistory.refresh');

    // Execute the command
    await vscode.commands.executeCommand('gitHistory.copyFullCommitInfoWithFileStats');

    // Verify clipboard has content
    const clipboardContent = await vscode.env.clipboard.readText();
    assert.ok(clipboardContent.length > 0, 'Clipboard should have content');
    assert.ok(clipboardContent.includes('commit '), 'Should contain commit header');
    assert.ok(clipboardContent.includes('Author: '), 'Should contain author line');
    assert.ok(clipboardContent.includes('Date: '), 'Should contain date line');
  });
});
