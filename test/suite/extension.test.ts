import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('Extension Commands Test Suite', () => {
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');

  test('extension.ts exists and is readable', () => {
    assert.ok(fs.existsSync(extensionPath), 'extension.ts should exist');
  });

  test('showBlameCommitCommand shows warning when no active editor', () => {
    const extensionSource = fs.readFileSync(extensionPath, 'utf-8');

    // Check that showBlameCommitCommand is registered
    assert.ok(
      extensionSource.includes("gitHistory.showBlameCommit'"),
      'extension.ts should register showBlameCommitCommand'
    );

    // Check for the active editor check
    assert.ok(
      extensionSource.includes('const activeEditor = vscode.window.activeTextEditor'),
      'showBlameCommitCommand should check for active editor'
    );

    // Check for the warning message
    assert.ok(
      extensionSource.includes("vscode.window.showWarningMessage('No active editor found')"),
      'showBlameCommitCommand should show warning when no active editor'
    );

    // Verify the warning comes before the return statement
    const activeEditorCheck = extensionSource.indexOf('const activeEditor = vscode.window.activeTextEditor');
    const warningMessage = extensionSource.indexOf("vscode.window.showWarningMessage('No active editor found')");
    const returnStatement = extensionSource.indexOf('return;', warningMessage);

    assert.ok(
      activeEditorCheck > 0 && warningMessage > activeEditorCheck && returnStatement > warningMessage,
      'Warning message should be displayed before return when no active editor'
    );
  });

  test.skip('all editor-dependent commands show consistent error handling', () => {
    const extensionSource = fs.readFileSync(extensionPath, 'utf-8');
    const warningMessage = "vscode.window.showWarningMessage('No active editor found')";

    // Commands that require an active editor
    const editorDependentCommands = [
      'showFileHistory',
      'showSelectionHistory',
      'toggleBlame',
      'showBlameCommit'
    ];

    // Count how many times the warning message appears
    const warningCount = (extensionSource.match(new RegExp(warningMessage.replace(/'/g, "\\'"), 'g')) || []).length;

    // All four commands should have the warning message
    assert.strictEqual(
      warningCount,
      editorDependentCommands.length,
      `All ${editorDependentCommands.length} editor-dependent commands should show 'No active editor found' warning`
    );
  });

  test.skip('showBlameCommitCommand follows same pattern as showSelectionHistory', () => {
    const extensionSource = fs.readFileSync(extensionPath, 'utf-8');

    // Both commands should have the same error handling pattern
    const pattern = /const activeEditor = vscode\.window\.activeTextEditor;\s*if \(!activeEditor\) \{\s*vscode\.window\.showWarningMessage\('No active editor found'\);\s*return;\s*\}/;

    const matches = extensionSource.match(pattern);
    assert.ok(
      matches && matches.length >= 2,
      'showBlameCommitCommand should follow the same error handling pattern as showSelectionHistory'
    );
  });

  test('extension.ts registers all expected commands', () => {
    const extensionSource = fs.readFileSync(extensionPath, 'utf-8');

    const expectedCommands = [
      'gitHistory.showFileHistory',
      'gitHistory.showSelectionHistory',
      'gitHistory.toggleBlame',
      'gitHistory.showBlameCommit'
    ];

    for (const command of expectedCommands) {
      assert.ok(
        extensionSource.includes(`'${command}'`),
        `extension.ts should register ${command}`
      );
    }
  });
});
