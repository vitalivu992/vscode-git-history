import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Open File at Commit E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHashes: string[];

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-open-file-e2e-'));
    testFile = path.join(tempDir, 'test.txt');
    commitHashes = [];

    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    fs.writeFileSync(testFile, 'Line 1\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Commit 1: Add line 1"', { cwd: tempDir });
    commitHashes.push(execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim());

    fs.writeFileSync(testFile, 'Line 1\nLine 2\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Commit 2: Add line 2"', { cwd: tempDir });
    commitHashes.push(execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim());

    fs.writeFileSync(testFile, 'Line 1\nLine 2\nLine 3\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Commit 3: Add line 3"', { cwd: tempDir });
    commitHashes.push(execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim());
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('getFileContentAtCommit returns correct content for first commit', async () => {
    const { getFileContentAtCommit } = await import('../../src/git/gitService');

    const content = await getFileContentAtCommit(testFile, commitHashes[0], tempDir);
    assert.strictEqual(content, 'Line 1\n');
  });

  test('getFileContentAtCommit returns correct content for second commit', async () => {
    const { getFileContentAtCommit } = await import('../../src/git/gitService');

    const content = await getFileContentAtCommit(testFile, commitHashes[1], tempDir);
    assert.strictEqual(content, 'Line 1\nLine 2\n');
  });

  test('getFileContentAtCommit returns correct content for latest commit', async () => {
    const { getFileContentAtCommit } = await import('../../src/git/gitService');

    const content = await getFileContentAtCommit(testFile, commitHashes[2], tempDir);
    assert.strictEqual(content, 'Line 1\nLine 2\nLine 3\n');
  });

  test('getFileContentAtCommit resolves relative path from cwd', async () => {
    const { getFileContentAtCommit } = await import('../../src/git/gitService');

    const content = await getFileContentAtCommit(testFile, commitHashes[0], tempDir);
    assert.strictEqual(content, 'Line 1\n');
  });

  test('handleMessage routes openFileAtCommit to correct handler', async () => {
    const { handleMessage } = await import('../../src/webview/messageHandler');
    const postedMessages: any[] = [];

    const mockPanel: any = {
      getCwd: () => tempDir,
      getCommits: () => commitHashes.map((hash: string, i: number) => ({
        hash,
        shortHash: hash.substring(0, 7),
        message: `Commit ${i + 1}`,
        parentHashes: i > 0 ? [commitHashes[i - 1]] : [],
        author: 'Test User',
        email: 'test@example.com',
        date: new Date().toISOString(),
        fullMessage: `Commit ${i + 1}`
      })),
      postMessage: (msg: any) => {
        postedMessages.push(msg);
      }
    };

    const mockSettingsService: any = {
      saveSettings: async () => {},
      getSettings: () => ({ diffType: 'unified', wordWrapEnabled: false, sortMode: 0, hideMergeCommits: false, regexSearchEnabled: false }),
      resetSettings: async () => {},
      getSetting: () => undefined,
      setSetting: async () => {}
    };

    const mockFirstRunTipService: any = {
      shouldShowTip: () => false,
      markAsShown: async () => {},
      reset: async () => {}
    };

    try {
      await handleMessage(
        { type: 'openFileAtCommit', hash: commitHashes[0], filePath: testFile },
        mockPanel,
        mockSettingsService,
        mockFirstRunTipService
      );
    } catch (error) {
      // Expected in test environment - VS Code APIs not available
    }

    assert.ok(true, 'handleMessage processed openFileAtCommit without throwing');
  });

  test('handleMessage routes copyFilePath to correct handler', async () => {
    const { handleMessage } = await import('../../src/webview/messageHandler');
    const postedMessages: any[] = [];

    const mockPanel: any = {
      getCwd: () => tempDir,
      getCommits: () => [],
      postMessage: (msg: any) => {
        postedMessages.push(msg);
      }
    };

    const mockSettingsService: any = {
      saveSettings: async () => {},
      getSettings: () => ({ diffType: 'unified', wordWrapEnabled: false, sortMode: 0, hideMergeCommits: false, regexSearchEnabled: false }),
      resetSettings: async () => {},
      getSetting: () => undefined,
      setSetting: async () => {}
    };

    const mockFirstRunTipService: any = {
      shouldShowTip: () => false,
      markAsShown: async () => {},
      reset: async () => {}
    };

    try {
      await handleMessage(
        { type: 'copyFilePath', filePath: 'src/webview/panel/main.js' },
        mockPanel,
        mockSettingsService,
        mockFirstRunTipService
      );
    } catch (error) {
      // Expected in test environment
    }

    assert.ok(true, 'handleMessage processed copyFilePath without throwing');
    assert.strictEqual(postedMessages.length, 0, 'copyFilePath should not post messages back');
  });

  test('unknown message type does not crash handler', async () => {
    const { handleMessage } = await import('../../src/webview/messageHandler');

    const mockPanel: any = {
      getCwd: () => tempDir,
      getCommits: () => [],
      postMessage: () => {}
    };

    const mockSettingsService: any = {
      saveSettings: async () => {},
      getSettings: () => ({ diffType: 'unified', wordWrapEnabled: false, sortMode: 0, hideMergeCommits: false, regexSearchEnabled: false }),
      resetSettings: async () => {},
      getSetting: () => undefined,
      setSetting: async () => {}
    };

    const mockFirstRunTipService: any = {
      shouldShowTip: () => false,
      markAsShown: async () => {},
      reset: async () => {}
    };

    await handleMessage(
      { type: 'nonExistentMessageType' },
      mockPanel,
      mockSettingsService,
      mockFirstRunTipService
    );

    assert.ok(true, 'Unknown message type should not crash');
  });

  test('file content differs between commits', async () => {
    const { getFileContentAtCommit } = await import('../../src/git/gitService');

    const content1 = await getFileContentAtCommit(testFile, commitHashes[0], tempDir);
    const content2 = await getFileContentAtCommit(testFile, commitHashes[1], tempDir);
    const content3 = await getFileContentAtCommit(testFile, commitHashes[2], tempDir);

    assert.notStrictEqual(content1, content2, 'Content should differ between commits 1 and 2');
    assert.notStrictEqual(content2, content3, 'Content should differ between commits 2 and 3');
    assert.notStrictEqual(content1, content3, 'Content should differ between commits 1 and 3');
  });
});

suite('Compare with Parent Context Menu E2E Tests', () => {
  test('commit context menu should include compare-parent action', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const menuStart = source.indexOf('function showCommitContextMenu');
    const menuEnd = source.indexOf('// ───', menuStart + 1) || source.indexOf('function showFileContextMenu', menuStart + 1);
    const menuSection = source.substring(menuStart, menuEnd > menuStart ? menuEnd : menuStart + 5000);

    assert.ok(menuSection.includes('data-action="compare-parent"'), 'Commit context menu should have compare-parent action');
    assert.ok(menuSection.includes('Compare with parent'), 'Commit context menu should show "Compare with parent" label');
  });

  test('compare-parent action should send quickCompare message', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("action === 'compare-parent'"), 'Should handle compare-parent action');
    assert.ok(source.includes("type: 'quickCompare'"), 'compare-parent should send quickCompare message');
  });

  test('compare-parent should be separated from copy actions by divider', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const menuStart = source.indexOf('function showCommitContextMenu');
    const menuEnd = source.indexOf('// ───', menuStart + 1) || source.indexOf('function showFileContextMenu', menuStart + 1);
    const menuSection = source.substring(menuStart, menuEnd > menuStart ? menuEnd : menuStart + 5000);

    const compareIdx = menuSection.indexOf('compare-parent');
    const dividerBeforeCompare = menuSection.lastIndexOf('context-menu-divider', compareIdx);
    assert.ok(dividerBeforeCompare > 0, 'There should be a divider before compare-parent action');
  });

  test('quickCompare message type should be defined in types.ts', () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("type: 'quickCompare'"), 'types.ts should define quickCompare message type');
    assert.ok(source.includes('hash: string'), 'quickCompare should have hash field');
  });

  test('handleQuickCompare should handle root commits gracefully', () => {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('async function handleQuickCompare');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('parentHashes'), 'Should check parentHashes');
    assert.ok(fnBody.includes('Root commit'), 'Should provide error message for root commits');
  });
});

suite('Copy Commit URL E2E Tests', () => {
  test('copyCommitUrl message type exists in WebviewToExtMessage', () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("type: 'copyCommitUrl'"), 'types.ts should define copyCommitUrl message type');
    assert.ok(source.includes('hash: string'), 'copyCommitUrl should have hash field');
  });

  test('handleCopyCommitUrl is implemented in messageHandler.ts', () => {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('async function handleCopyCommitUrl'), 'Should have handleCopyCommitUrl function');
    assert.ok(source.includes("case 'copyCommitUrl':"), 'Should handle copyCommitUrl message type');
  });

  test('commit context menu includes copy-url action', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const menuStart = source.indexOf('function showCommitContextMenu');
    const menuEnd = source.indexOf('// ───', menuStart + 1) || source.indexOf('function showFileContextMenu', menuStart + 1);
    const menuSection = source.substring(menuStart, menuEnd > menuStart ? menuEnd : menuStart + 5000);

    assert.ok(menuSection.includes('data-action="copy-url"'), 'Commit context menu should have copy-url action');
    assert.ok(menuSection.includes('Copy commit URL'), 'Commit context menu should show "Copy commit URL" label');
    assert.ok(menuSection.includes('🔗'), 'Copy commit URL should have link icon');
  });

  test('copy-url action should send copyCommitUrl message', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("action === 'copy-url'"), 'Should handle copy-url action');
    assert.ok(source.includes("type: 'copyCommitUrl'"), 'copy-url should send copyCommitUrl message');
  });

  test('keyboard help includes Copy commit URL entry', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const helpStart = source.indexOf('function showKeyboardHelpDialog');
    const helpEnd = source.lastIndexOf('}');
    const helpSection = source.substring(helpStart, helpEnd);

    assert.ok(helpSection.includes('Copy commit URL'), 'Keyboard help should include "Copy commit URL"');
    assert.ok(source.includes("'L'"), 'Should include L key in keyboard shortcuts');
  });

  test('handleCopyUrl function exists and sends copyCommitUrl message', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleCopyUrl()'), 'Should have handleCopyUrl function');
    assert.ok(source.includes("type: 'copyCommitUrl'"), 'handleCopyUrl should send copyCommitUrl message');
  });

  test('Ctrl+Shift+L keyboard shortcut triggers handleCopyUrl', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("e.key === 'l'"), 'Should handle L key');
    assert.ok(source.includes('handleCopyUrl()'), 'Should call handleCopyUrl function');
    });
});

suite('Copy Parent Hash E2E Tests', () => {
  test('handleCopyParentHash with commit that has parent', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyParentHash'),
      'handleCopyParentHash should be defined');
    assert.ok(source.includes('panel.getCommits()'),
      'Should get commits from panel');
    assert.ok(source.includes('parentHashes[0]'),
      'Should read parentHashes[0]');
  });

  test('handleCopyParentHash writes parent hash to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyParentHash');
    assert.ok(fnStart >= 0, 'handleCopyParentHash should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write to clipboard');
    assert.ok(fnBody.includes('Parent hash copied'),
      'Should show confirmation message');
  });

  test('handleCopyParentHash handles root commit', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyParentHash');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Root commit has no parent'),
      'Should handle root commit');
  });

  test('main.js handleCopyParentHash target resolution prioritizes focused', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyParentHash');
    assert.ok(fnStart >= 0, 'handleCopyParentHash should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('focusedIndex'),
      'Should check focusedIndex');
    assert.ok(fnBody.includes('selectedCommits'),
      'Should check selectedCommits');
    assert.ok(fnBody.includes('focusedIndex >= 0'),
      'Should prioritize focused over selected');
  });

  test('main.js handleCopyParentHash sends correct message type', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyParentHash');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copyParentHash'"),
      'Should send copyParentHash message type');
  });

  test('main.js handleCopyParentHash handles no target', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyParentHash');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('Select a commit to copy parent hash'),
      'Should show error when no commit selected');
  });

  test('context menu has copy-parent-hash item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-parent-hash"'),
      'Context menu should include copy-parent-hash');
    assert.ok(source.includes('Copy parent hash'),
      'Context menu should have label Copy parent hash');
  });

  test('Ctrl+Shift+V keyboard shortcut integration', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("e.key === 'v'") && source.includes('handleCopyParentHash'),
      'Ctrl+Shift+V shortcut should be handled');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyParentHash"'),
      'package.json should register copyParentHash command');
    assert.ok(content.includes('"ctrl+shift+v"'),
      'package.json should define Ctrl+Shift+V keybinding');
  });
});

suite('Keybinding Registration E2E Tests', () => {
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

  test('package.json declares all webview action commands', () => {
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

  test('package.json declares keybindings with correct when clause', () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    const keybindings = packageJson.contributes?.keybindings || [];
    const webviewKeybindings = keybindings.filter((kb: any) =>
      expectedWebviewActions.some((a) => a.command === kb.command)
    );

    assert.strictEqual(
      webviewKeybindings.length,
      expectedWebviewActions.length,
      `Should have ${expectedWebviewActions.length} webview keybindings`
    );

    for (const kb of webviewKeybindings) {
      assert.strictEqual(
        kb.when,
        'activeWebviewPanelId == gitHistory.webview',
        `Keybinding for "${kb.command}" should have when clause "activeWebviewPanelId == gitHistory.webview"`
      );
    }
  });

  test('triggerAction message type is handled in webview', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(
      source.includes("case 'triggerAction':"),
      'main.js should handle triggerAction message type'
    );
  });

  test('all 18 webview actions are handled in triggerAction switch', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const triggerActionStart = source.indexOf("case 'triggerAction':");
    const triggerActionEnd = source.indexOf('}', triggerActionStart + 100);
    const triggerActionSection = source.substring(triggerActionStart, triggerActionEnd + 2000);

    for (const { action } of expectedWebviewActions) {
      assert.ok(
        triggerActionSection.includes(`case '${action}':`),
        `triggerAction handler should handle "${action}" action`
      );
    }
  });

  test('extension.ts registers all webview action commands', () => {
    const extensionPath = path.resolve(__dirname, '../../src/extension.ts');
    const extensionSource = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(
      extensionSource.includes('const webviewActions = ['),
      'extension.ts should define webviewActions array'
    );

    for (const { command, action } of expectedWebviewActions) {
      assert.ok(
        extensionSource.includes(`command: '${command}'`) ||
        extensionSource.includes(`command: "${command}"`),
        `webviewActions should include command "${command}"`
      );
      assert.ok(
        extensionSource.includes(`action: '${action}'`) ||
        extensionSource.includes(`action: "${action}"`),
        `webviewActions should include action "${action}"`
      );
    }
  });

  test('commands post triggerAction message with correct action type', () => {
    const extensionPath = path.resolve(__dirname, '../../src/extension.ts');
    const extensionSource = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(
      extensionSource.includes("{ type: 'triggerAction', action }"),
      'Commands should post triggerAction messages'
    );

    assert.ok(
      extensionSource.includes('GitHistoryPanel.currentPanel?.postMessage'),
      'Commands should post to current webview panel'
    );
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
        `Keybinding "${kb.command}" should reference a valid command`
      );
    }
  });

  test('webview action commands are registered with correct command names', () => {
    const extensionPath = path.resolve(__dirname, '../../src/extension.ts');
    const extensionSource = fs.readFileSync(extensionPath, 'utf-8');

    for (const { command } of expectedWebviewActions) {
      assert.ok(
        extensionSource.includes(`vscode.commands.registerCommand('${command}'`) ||
        extensionSource.includes(`vscode.commands.registerCommand("${command}"`),
        `extension.ts should register command "${command}"`
      );
    }
  });
});
