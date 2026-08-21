import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('Show File History Shortcut E2E Tests', () => {
  let packageJson: any;

  suiteSetup(() => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  });

  test('showFileHistory command is declared in package.json with correct title', () => {
    const commands = packageJson.contributes?.commands || [];
    const cmd = commands.find((c: any) => c.command === 'gitHistory.showFileHistory');

    assert.ok(cmd, 'gitHistory.showFileHistory command should be declared');
    assert.ok(cmd.title && cmd.title.length > 0, 'Command should have a title');
  });

  test('showSelectionHistory command is declared in package.json with correct title', () => {
    const commands = packageJson.contributes?.commands || [];
    const cmd = commands.find((c: any) => c.command === 'gitHistory.showSelectionHistory');

    assert.ok(cmd, 'gitHistory.showSelectionHistory command should be declared');
    assert.ok(cmd.title && cmd.title.length > 0, 'Command should have a title');
  });

  test('keybindings reference correct commands', () => {
    const keybindings = packageJson.contributes?.keybindings || [];

    const fileHistoryKb = keybindings.find((k: any) => k.command === 'gitHistory.showFileHistory');
    assert.ok(fileHistoryKb, 'Keybinding should exist for showFileHistory');
    assert.strictEqual(fileHistoryKb.key, 'ctrl+alt+h');
    assert.strictEqual(fileHistoryKb.mac, 'cmd+alt+h');

    const selectionHistoryKb = keybindings.find((k: any) => k.command === 'gitHistory.showSelectionHistory');
    assert.ok(selectionHistoryKb, 'Keybinding should exist for showSelectionHistory');
    assert.strictEqual(selectionHistoryKb.key, 'ctrl+alt+shift+h');
    assert.strictEqual(selectionHistoryKb.mac, 'cmd+alt+shift+h');
  });

  test('showFileHistory command is registered in extension.ts', () => {
    const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(
      source.includes("gitHistory.showFileHistory"),
      'extension.ts should register gitHistory.showFileHistory command'
    );
  });

  test('showSelectionHistory command is registered in extension.ts', () => {
    const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(
      source.includes("gitHistory.showSelectionHistory"),
      'extension.ts should register gitHistory.showSelectionHistory command'
    );
  });

  test('when clauses follow existing keybinding conventions', () => {
    const keybindings = packageJson.contributes?.keybindings || [];

    // Check showFileHistory uses same when clause as toggleBlame
    const toggleBlameKb = keybindings.find((k: any) => k.command === 'gitHistory.toggleBlame');
    const fileHistoryKb = keybindings.find((k: any) => k.command === 'gitHistory.showFileHistory');

    assert.ok(toggleBlameKb, 'toggleBlame keybinding should exist');
    assert.ok(fileHistoryKb, 'showFileHistory keybinding should exist');
    assert.strictEqual(
      fileHistoryKb.when,
      toggleBlameKb.when,
      'showFileHistory when clause should match toggleBlame convention'
    );
  });
});
