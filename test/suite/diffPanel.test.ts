import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Tests for the split layout: bottom-panel "Git History" view (commit list +
 * commit detail) and the editor-area diff WebviewPanel (gitHistory.diffView).
 */
suite('GitHistoryDiffPanel Tests', () => {
  const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');

  suite('Diff panel class', () => {
    test('GitHistoryDiffPanel class is exported with the gitHistory.diffView viewType', () => {
      const source = fs.readFileSync(providerPath, 'utf-8');
      assert.ok(source.includes('export class GitHistoryDiffPanel'), 'webviewProvider should export GitHistoryDiffPanel');
      assert.ok(source.includes("viewType = 'gitHistory.diffView'"), 'diff panel should use the gitHistory.diffView viewType');
      assert.ok(source.includes('public static instance: GitHistoryDiffPanel | undefined'), 'diff panel should be a singleton');
    });

    test('diff panel is created with preserveFocus: true', () => {
      const source = fs.readFileSync(providerPath, 'utf-8');
      assert.ok(source.includes('preserveFocus: true'), 'diff panel should be created/revealed with preserveFocus: true');
    });

    test('diff panel is disposed on close and its static instance is cleared', () => {
      const source = fs.readFileSync(providerPath, 'utf-8');
      assert.ok(source.includes('onDidDispose'), 'diff panel should hook onDidDispose');
      assert.ok(source.includes('GitHistoryDiffPanel.instance = undefined'), 'onDidDispose should clear the static instance');
    });

    test('diff panel renders the diff-surface HTML', () => {
      const source = fs.readFileSync(providerPath, 'utf-8');
      assert.ok(source.includes('getDiffHtml(this._panel.webview, this._extensionUri)'),
        'diff panel should load the diff HTML builder');
    });

    test('diff panel forwards non-ready messages to handleMessage with the list panel', () => {
      const source = fs.readFileSync(providerPath, 'utf-8');
      assert.ok(source.includes('await handleMessage(message, listPanel'),
        'diff panel webview messages should be handled with the LIST panel as state owner');
    });
  });

  suite('Diff panel title format', () => {
    test('formatCommitTitle combines short hash and subject', async () => {
      const { GitHistoryDiffPanel } = await import('../../src/webview/webviewProvider');
      assert.strictEqual(GitHistoryDiffPanel.formatCommitTitle('abc1234', 'Fix thing'), 'abc1234 Fix thing');
    });

    test('formatCommitTitle truncates long subjects to ~48 characters', async () => {
      const { GitHistoryDiffPanel } = await import('../../src/webview/webviewProvider');
      const longSubject = 'A very long commit subject that definitely exceeds the forty-eight character budget';
      const title = GitHistoryDiffPanel.formatCommitTitle('abc1234', longSubject);
      assert.ok(title.length <= 48, `Title should be at most 48 chars, got ${title.length}`);
      assert.ok(title.endsWith('...'), 'Truncated title should end with ellipsis');
      assert.ok(title.startsWith('abc1234 '), 'Title should start with the short hash');
    });

    test('formatCommitTitle keeps a 48-char title intact', async () => {
      const { GitHistoryDiffPanel } = await import('../../src/webview/webviewProvider');
      const exact = 'abc1234 ' + 'x'.repeat(40); // 8 + 40 = 48 chars
      assert.strictEqual(GitHistoryDiffPanel.formatCommitTitle('abc1234', 'x'.repeat(40)), exact);
    });

    test('formatCommitTitle handles an empty subject', async () => {
      const { GitHistoryDiffPanel } = await import('../../src/webview/webviewProvider');
      assert.strictEqual(GitHistoryDiffPanel.formatCommitTitle('abc1234', ''), 'abc1234');
    });
  });

  suite('Diff panel keybinding routing', () => {
    test('diff-view actions are bound to the diff panel, not the list view', () => {
      const packageJsonPath = path.resolve(__dirname, '../../../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const keybindings = packageJson.contributes?.keybindings || [];

      const diffCommands = ['gitHistory.toggleWordWrap', 'gitHistory.toggleIgnoreWhitespace', 'gitHistory.cycleDiffContextLines'];
      for (const command of diffCommands) {
        const bindings = keybindings.filter((kb: any) => kb.command === command);
        assert.ok(bindings.length > 0, `${command} should have a keybinding`);
        for (const kb of bindings) {
          assert.strictEqual(kb.when, 'activeWebviewPanelId == gitHistory.diffView',
            `${command} should only be bound when the diff panel is focused`);
        }
      }
    });

    test('refresh is bound on both surfaces', () => {
      const packageJsonPath = path.resolve(__dirname, '../../../package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const keybindings = packageJson.contributes?.keybindings || [];

      const refreshBindings = keybindings.filter((kb: any) => kb.command === 'gitHistory.refresh');
      const whens = new Set(refreshBindings.map((kb: any) => kb.when));
      assert.ok(whens.has('activeWebviewViewId == gitHistory.webview'), 'refresh should be bound in the list view');
      assert.ok(whens.has('activeWebviewPanelId == gitHistory.diffView'), 'refresh should be bound in the diff panel');
    });

    test('extension.ts routes diff-surface actions to GitHistoryDiffPanel.instance', () => {
      const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
      const source = fs.readFileSync(extensionPath, 'utf-8');

      assert.ok(source.includes("diffPanel.postMessage({ type: 'triggerAction', action })"),
        'diff-surface actions should post triggerAction to the diff panel');
      assert.ok(source.includes("GitHistoryPanel.currentPanel?.postMessage({ type: 'triggerAction', action })"),
        'list actions should keep posting triggerAction to the list panel');
    });
  });

  suite('main.js mode branching', () => {
    test('main.js branches on the body data-mode attribute', () => {
      const source = fs.readFileSync(mainJsPath, 'utf-8');
      assert.ok(source.includes('document.body.dataset.mode'), 'main.js should read the body data-mode attribute');
      assert.ok(source.includes("MODE === 'diff'"), 'main.js should branch on diff mode');
    });

    test('diff-mode keydown handles refresh, wrap, ignore-whitespace and context lines', () => {
      const source = fs.readFileSync(mainJsPath, 'utf-8');
      const start = source.indexOf('function handleDiffModeKeyDown');
      assert.ok(start > 0, 'main.js should have a diff-mode keydown handler');
      const end = source.indexOf('\nfunction', start + 1);
      const body = source.substring(start, end > start ? end : undefined);
      for (const fn of ['handleRefresh', 'handleWordWrapToggle', 'handleIgnoreWhitespaceToggle', 'handleDiffContextLinesCycle']) {
        assert.ok(body.includes(fn), `diff-mode keydown should handle ${fn}`);
      }
    });

    test('diff surface consumes init for diff settings only', () => {
      const source = fs.readFileSync(mainJsPath, 'utf-8');
      assert.ok(source.includes('applyDiffSurfaceSettings'), 'main.js should apply diff-surface settings from init');
    });
  });
});

suite('Diff Panel Message Routing Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHashes: string[];
  let postedToDiff: any[];
  let postedToList: any[];
  let fakeDiffPanel: any;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-diff-panel-'));
    testFile = path.join(tempDir, 'file.txt');
    commitHashes = [];

    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    fs.writeFileSync(testFile, 'Line 1\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "First commit"', { cwd: tempDir });
    commitHashes.push(execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim());

    fs.writeFileSync(testFile, 'Line 1\nLine 2\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Second commit"', { cwd: tempDir });
    commitHashes.push(execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim());
  });

  suiteTeardown(async () => {
    const { GitHistoryDiffPanel } = await import('../../src/webview/webviewProvider');
    GitHistoryDiffPanel.instance = undefined;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  setup(async () => {
    const { GitHistoryDiffPanel } = await import('../../src/webview/webviewProvider');
    postedToDiff = [];
    postedToList = [];

    fakeDiffPanel = {
      postMessage: (msg: any) => { postedToDiff.push(msg); },
      setCommit: () => {},
      setCurrentHash: () => {},
      getCurrentHash: () => commitHashes[1],
      setTitleForRange: () => {},
      setTitleForCombined: () => {}
    };
    GitHistoryDiffPanel.instance = fakeDiffPanel as any;
  });

  function makeMockPanel(): any {
    return {
      getCwd: () => tempDir,
      getFilePath: () => testFile,
      getCommits: () => commitHashes.map((hash: string, i: number) => ({
        hash,
        shortHash: hash.substring(0, 7),
        message: i === 0 ? 'First commit' : 'Second commit',
        parentHashes: i > 0 ? [commitHashes[i - 1]] : [],
        author: 'Test User',
        email: 'test@example.com',
        date: new Date().toISOString(),
        fullMessage: i === 0 ? 'First commit' : 'Second commit'
      })),
      getIgnoreWhitespace: () => false,
      getDiffContextLines: () => 3,
      loadData: async () => {},
      postMessage: (msg: any) => { postedToList.push(msg); }
    };
  }

  const mockSettingsService: any = {
    saveSettings: async () => {},
    getSettings: () => ({ diffType: 'unified', wordWrapEnabled: false, sortMode: 0 }),
    resetSettings: async () => {},
    getSetting: () => undefined,
    setSetting: async () => {}
  };

  const mockFirstRunTipService: any = {
    shouldShowTip: () => false,
    markAsShown: async () => {},
    reset: async () => {}
  };

  test('requestDiff routes diff to the diff panel and commitFiles to the list panel', async () => {
    const { handleMessage } = await import('../../src/webview/messageHandler');
    await handleMessage(
      { type: 'requestDiff', hash: commitHashes[1] },
      makeMockPanel(),
      mockSettingsService,
      mockFirstRunTipService
    );

    const diffMsgs = postedToDiff.filter(m => m.type === 'diff');
    assert.strictEqual(diffMsgs.length, 1, 'diff panel should receive exactly one diff message');
    assert.ok(diffMsgs[0].diff.includes('diff --git') || diffMsgs[0].diff.includes('Line 2'), 'diff content should be present');
    assert.strictEqual(diffMsgs[0].hash, commitHashes[1]);

    const filesMsgs = postedToList.filter(m => m.type === 'commitFiles');
    assert.strictEqual(filesMsgs.length, 1, 'list panel should receive exactly one commitFiles message');
    assert.strictEqual(filesMsgs[0].hash, commitHashes[1]);
    assert.ok(filesMsgs[0].files.length > 0, 'commitFiles should carry the changed files');
  });

  test('requestFileDiff routes the file diff with selectedFile to both surfaces', async () => {
    const { handleMessage } = await import('../../src/webview/messageHandler');
    await handleMessage(
      { type: 'requestFileDiff', hash: commitHashes[1], filePath: 'file.txt' },
      makeMockPanel(),
      mockSettingsService,
      mockFirstRunTipService
    );

    const diffMsgs = postedToDiff.filter(m => m.type === 'diff');
    assert.strictEqual(diffMsgs.length, 1, 'diff panel should render the file diff');
    assert.strictEqual(diffMsgs[0].selectedFile, 'file.txt');

    const filesMsgs = postedToList.filter(m => m.type === 'commitFiles');
    assert.strictEqual(filesMsgs.length, 1, 'list panel should sync the changed-files list');
    assert.strictEqual(filesMsgs[0].selectedFile, 'file.txt', 'commitFiles should carry the selected file for highlight');
  });

  test('requestRangeDiff renders in the diff panel and updates the list header', async () => {
    const { handleMessage } = await import('../../src/webview/messageHandler');
    await handleMessage(
      { type: 'requestRangeDiff', fromHash: commitHashes[0], toHash: commitHashes[1] },
      makeMockPanel(),
      mockSettingsService,
      mockFirstRunTipService
    );

    assert.ok(postedToDiff.some(m => m.type === 'rangeDiff'), 'diff panel should receive the range diff');
    assert.ok(postedToList.some(m => m.type === 'rangeDiff'), 'list panel should receive the range diff for its Comparing header');
  });

  test('requestRefresh reloads the list and re-requests the current diff', async () => {
    const { handleMessage } = await import('../../src/webview/messageHandler');
    await handleMessage(
      { type: 'requestRefresh' },
      makeMockPanel(),
      mockSettingsService,
      mockFirstRunTipService
    );

    assert.ok(postedToDiff.some(m => m.type === 'diff' && m.hash === commitHashes[1]),
      'diff panel should get a fresh diff for its current commit');
  });
});
