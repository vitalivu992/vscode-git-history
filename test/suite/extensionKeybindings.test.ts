import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Extract webview actions from extension.ts source by parsing the webviewActions array.
 */
function extractWebviewActionsFromSource(source: string): { command: string; action: string }[] {
  const actions: { command: string; action: string }[] = [];

  // Match { command: 'gitHistory.xxx', action: 'yyy' } patterns
  const regex = /\{\s*command:\s*'([^']+)',\s*action:\s*'([^']+)'\s*\}/g;
  let match;
  while ((match = regex.exec(source)) !== null) {
    actions.push({ command: match[1], action: match[2] });
  }

  return actions;
}

suite('Extension Keybindings Tests', () => {
  // Dynamically derive webview actions from extension.ts source
  let derivedWebviewActions: { command: string; action: string }[];

  suiteSetup(() => {
    const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
    const extensionSource = fs.readFileSync(extensionPath, 'utf-8');
    derivedWebviewActions = extractWebviewActionsFromSource(extensionSource);
  });

  test('webview actions array is not empty', () => {
    assert.ok(derivedWebviewActions.length > 0, 'Should have webview actions');
  });

  test('all webview action commands follow gitHistory.* naming pattern', () => {
    for (const { command } of derivedWebviewActions) {
      assert.ok(
        command.startsWith('gitHistory.'),
        `Command "${command}" should start with "gitHistory."`
      );
    }
  });

  test('extension.ts registers all webview action commands', () => {
    const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
    const extensionSource = fs.readFileSync(extensionPath, 'utf-8');

    // Check for webviewActions array definition
    assert.ok(
      extensionSource.includes('const webviewActions = ['),
      'extension.ts should define webviewActions array'
    );

    // Verify each action is in the array
    for (const { action } of derivedWebviewActions) {
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
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const mainJsSource = fs.readFileSync(mainJsPath, 'utf-8');

    // Check for triggerAction case
    assert.ok(
      mainJsSource.includes("case 'triggerAction':"),
      'main.js should handle triggerAction message type'
    );

    // Verify each action is handled in the switch
    for (const { action } of derivedWebviewActions) {
      assert.ok(
        mainJsSource.includes(`case '${action}':`) || mainJsSource.includes(`action === '${action}'`),
        `triggerAction handler should handle "${action}" action`
      );
    }
  });

  test('triggerAction message type is defined in types.ts', () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const typesSource = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(
      typesSource.includes("type: 'triggerAction'"),
      'types.ts should define triggerAction message type'
    );
    assert.ok(
      typesSource.includes('action: WebviewAction') || typesSource.includes('action: string'),
      'triggerAction should have action field'
    );
  });

  test('all webview action commands are declared in package.json', () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    const commands = packageJson.contributes?.commands || [];
    const commandNames = new Set(commands.map((c: any) => c.command));

    for (const { command } of derivedWebviewActions) {
      assert.ok(
        commandNames.has(command),
        `package.json should declare command "${command}"`
      );
    }
  });

  test('all webview action keybindings have correct when clause', () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    // Actions that intentionally have no default keybinding (Command Palette only)
    const noKeybindingActions = new Set(['renameBranch']);
    const actionsWithKeybindings = derivedWebviewActions.filter(
      (a) => !noKeybindingActions.has(a.action)
    );

    const keybindings = packageJson.contributes?.keybindings || [];
    const webviewKeybindings = keybindings.filter((kb: any) =>
      derivedWebviewActions.some((a) => a.command === kb.command)
    );

    // gitHistory.refresh has two keybindings (F5 and Ctrl+Shift+R),
    // so the keybinding count is one more than the action count.
    const uniqueKeybindingCommands = new Set(webviewKeybindings.map((kb: any) => kb.command));
    assert.strictEqual(
      uniqueKeybindingCommands.size,
      actionsWithKeybindings.length,
      `Should have keybindings for all ${actionsWithKeybindings.length} webview actions (${derivedWebviewActions.length} total, ${noKeybindingActions.size} intentionally keybinding-less)`
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

    for (const { command } of derivedWebviewActions) {
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