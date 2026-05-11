import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('Extension Keybindings Tests', () => {
  const expectedWebviewActions = [
    { command: 'gitHistory.refresh', action: 'refresh' },
    { command: 'gitHistory.copyCommitMessage', action: 'copyCommitMessage' },
    { command: 'gitHistory.copyCommitHash', action: 'copyCommitHash' },
    { command: 'gitHistory.copyCommitInfo', action: 'copyCommitInfo' },
    { command: 'gitHistory.copyCherryPick', action: 'copyCherryPick' },
    { command: 'gitHistory.copyRevert', action: 'copyRevert' },
    { command: 'gitHistory.copyCommitFiles', action: 'copyCommitFiles' },
    { command: 'gitHistory.copyCommitDiff', action: 'copyCommitDiff' },
    { command: 'gitHistory.copyCommitPatch', action: 'copyCommitPatch' },
    { command: 'gitHistory.copyCommitUrl', action: 'copyCommitUrl' },
    { command: 'gitHistory.exportCommits', action: 'exportCommits' },
    { command: 'gitHistory.quickCompare', action: 'quickCompare' },
    { command: 'gitHistory.toggleMyCommits', action: 'toggleMyCommits' },
    { command: 'gitHistory.toggleWordWrap', action: 'toggleWordWrap' },
    { command: 'gitHistory.toggleRegex', action: 'toggleRegex' },
    { command: 'gitHistory.jumpToHash', action: 'jumpToHash' },
    { command: 'gitHistory.focusSearch', action: 'focusSearch' },
    { command: 'gitHistory.showKeyboardHelp', action: 'showKeyboardHelp' },
  ] as const;

  test('webview actions array has exactly 18 entries', () => {
    assert.strictEqual(expectedWebviewActions.length, 18, 'Should have 18 webview action commands');
  });

  test('all webview action commands follow gitHistory.* naming pattern', () => {
    for (const { command } of expectedWebviewActions) {
      assert.ok(
        command.startsWith('gitHistory.'),
        `Command "${command}" should start with "gitHistory."`
      );
    }
  });

  test('extension.ts registers all 18 webview action commands', () => {
    const extensionPath = path.resolve(__dirname, '../../src/extension.ts');
    const extensionSource = fs.readFileSync(extensionPath, 'utf-8');

    // Check for webviewActions array definition
    assert.ok(
      extensionSource.includes('const webviewActions = ['),
      'extension.ts should define webviewActions array'
    );

    // Verify each action is in the array
    for (const { action } of expectedWebviewActions) {
      assert.ok(
        extensionSource.includes(`action: '${action}'`),
        `webviewActions should include "${action}"`
      );
    }

    // Check for command registration loop
    assert.ok(
      extensionSource.includes("vscode.commands.registerCommand(command, () =>"),
      'extension.ts should register commands in a loop'
    );

    // Check for triggerAction message posting
    assert.ok(
      extensionSource.includes("{ type: 'triggerAction', action }"),
      'Commands should post triggerAction messages'
    );
  });

  test('all triggerAction cases are handled in main.js', () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const mainJsSource = fs.readFileSync(mainJsPath, 'utf-8');

    // Check for triggerAction case
    assert.ok(
      mainJsSource.includes("case 'triggerAction':"),
      'main.js should handle triggerAction message type'
    );

    // Verify each action is handled in the switch
    for (const { action } of expectedWebviewActions) {
      assert.ok(
        mainJsSource.includes(`case '${action}':`) || mainJsSource.includes(`action === '${action}'`),
        `triggerAction handler should handle "${action}" action`
      );
    }
  });

  test('triggerAction message type is defined in types.ts', () => {
    const typesPath = path.resolve(__dirname, '../../src/types.ts');
    const typesSource = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(
      typesSource.includes("type: 'triggerAction'"),
      'types.ts should define triggerAction message type'
    );
    assert.ok(
      typesSource.includes('action: string'),
      'triggerAction should have action field'
    );
  });

  test('all webview action commands are declared in package.json', () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    const commands = packageJson.contributes?.commands || [];
    const commandNames = new Set(commands.map((c: any) => c.command));

    for (const { command } of expectedWebviewActions) {
      assert.ok(
        commandNames.has(command),
        `package.json should declare command "${command}"`
      );
    }
  });

  test('all webview action keybindings have correct when clause', () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    const keybindings = packageJson.contributes?.keybindings || [];
    const webviewKeybindings = keybindings.filter((kb: any) =>
      expectedWebviewActions.some((a) => a.command === kb.command)
    );

    assert.strictEqual(
      webviewKeybindings.length,
      expectedWebviewActions.length,
      'Should have keybindings for all 18 webview actions'
    );

    for (const kb of webviewKeybindings) {
      assert.strictEqual(
        kb.when,
        'activeWebviewPanelId == gitHistory.webview',
        `Keybinding for "${kb.command}" should have correct when clause`
      );
    }
  });

  test('all keybindings reference valid commands', () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    const commands = new Set(
      (packageJson.contributes?.commands || []).map((c: any) => c.command)
    );
    const keybindings = packageJson.contributes?.keybindings || [];

    for (const kb of keybindings) {
      assert.ok(
        commands.has(kb.command),
        `Keybinding references valid command "${kb.command}"`
      );
    }
  });

  test('all webview action commands have titles in package.json', () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    const commands = packageJson.contributes?.commands || [];

    for (const { command } of expectedWebviewActions) {
      const cmd = commands.find((c: any) => c.command === command);
      assert.ok(
        cmd,
        `Command "${command}" should exist in package.json`
      );
      assert.ok(
        cmd.title && cmd.title.length > 0,
        `Command "${command}" should have a title`
      );
      assert.strictEqual(
        cmd.category,
        'Git History',
        `Command "${command}" should be in "Git History" category`
      );
    }
  });

  test('no duplicate keybindings with same when clause', () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const keybindings = packageJson.contributes.keybindings;

    // Group by key+when combo
    const keyMap = new Map<string, string[]>();
    for (const kb of keybindings) {
      const key = `${kb.key}|${kb.when || ''}`;
      if (!keyMap.has(key)) {
        keyMap.set(key, []);
      }
      keyMap.get(key)!.push(kb.command);
    }

    // Check for duplicates
    const duplicates = [...keyMap.entries()].filter(([_, cmds]) => cmds.length > 1);
    assert.strictEqual(duplicates.length, 0,
      `Found duplicate keybindings: ${JSON.stringify(duplicates)}`);
  });
});
