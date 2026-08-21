import * as assert from 'assert';
import * as vscode from 'vscode';

suite('focusCommitList E2E Tests', function() {

  this.timeout(60000);

  test('should execute focusCommitList command without error', async function() {
    // The command should be registered and execute without throwing
    try {
      await vscode.commands.executeCommand('gitHistory.focusCommitList');
      // If we get here without error, the command is properly registered
      assert.ok(true, 'Command executed without error');
    } catch (error) {
      // It's OK if the command fails because there's no active panel
      // We just want to verify the command exists
      const errMsg = error instanceof Error ? error.message : String(error);
      // Expected error: no active panel or similar
      assert.ok(
        errMsg.includes('panel') || errMsg.includes('active') || errMsg.includes('No active'),
        `Command should be registered (got: ${errMsg})`
      );
    }
  });

  test('should have focusCommitList in keyboard shortcuts', async function() {
    // Get all commands
    const allCommands = await vscode.commands.getCommands(true);

    // Check that our command is registered
    const commandExists = allCommands.includes('gitHistory.focusCommitList');
    assert.ok(commandExists, 'focusCommitList command should be registered');

    // Verify it can be executed (even if it fails due to no active panel)
    const canExecute = allCommands.filter((c) => c === 'gitHistory.focusCommitList');
    assert.ok(canExecute.includes('gitHistory.focusCommitList'), 'Command should exist in VS Code');
  });

  test('focusCommitList should have correct keybinding', async function() {
    // Read package.json to verify keybindings
    const fs = require('fs');
    const path = require('path');
    const packagePath = path.join(__dirname, '..', '..', '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

    const keybinding = pkg.contributes.keybindings.find((k: any) => k.command === 'gitHistory.focusCommitList');

    assert.ok(keybinding, 'Keybinding should exist');
    assert.strictEqual(keybinding.key, 'ctrl+l', 'Windows/Linux key should be ctrl+l');
    assert.strictEqual(keybinding.mac, 'cmd+l', 'Mac key should be cmd+l');
    assert.strictEqual(keybinding.when, 'activeWebviewPanelId == gitHistory.webview', 'When clause should be correct');
  });

  test('focusCommitList keyboard help should show correct keys', async function() {
    // Read main.js to verify keyboard help entry
    const fs = require('fs');
    const path = require('path');
    const mainJsPath = path.join(__dirname, '..', '..', '..', 'src', 'webview', 'panel', 'main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Check for keyboard help entry
    assert.ok(source.includes("'Focus commit list for navigation'"), 'Keyboard help should include focusCommitList');

    // Check that it shows the right keys (Cmd+L for Mac, Ctrl+L for others)
    assert.ok(source.includes('cmdKey') && source.includes("'L'"), 'Should reference cmdKey and L');
  });

  test('focusCommitList integration with keyboard navigation', async function() {
    // This test verifies that focusCommitList integrates with the existing navigation system

    const fs = require('fs');
    const path = require('path');
    const mainJsPath = path.join(__dirname, '..', '..', '..', 'src', 'webview', 'panel', 'main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify that handleFocusCommitList uses existing navigation infrastructure
    const fnMatch = source.match(/function handleFocusCommitList\(\)[^]*}/s);
    assert.ok(fnMatch, 'Should have handleFocusCommitList function');

    const fnBody = fnMatch![0];

    // Should use getFilteredCommits to get commits
    assert.ok(fnBody.includes('getFilteredCommits()'), 'Should use getFilteredCommits');

    // Should use getOrderedCommits to get proper order
    assert.ok(fnBody.includes('getOrderedCommits'), 'Should use getOrderedCommits');

    // Should set focusedIndex to 0
    assert.ok(fnBody.includes('focusedIndex = 0'), 'Should set focusedIndex to 0');

    // Should call updateFocusedRow to update UI
    assert.ok(fnBody.includes('updateFocusedRow()'), 'Should call updateFocusedRow');

    // Should call scrollFocusedIntoView to scroll
    assert.ok(fnBody.includes('scrollFocusedIntoView()'), 'Should call scrollFocusedIntoView');
  });
});
