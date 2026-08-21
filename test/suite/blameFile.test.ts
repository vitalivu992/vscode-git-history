import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as vscode from 'vscode';
import { handleMessage } from '../../src/webview/messageHandler';
import { GitHistoryPanel } from '../../src/webview/webviewProvider';

suite('Blame File Feature', () => {
  let tempDir: string;
  let testFile: string;
  let mockPanel: GitHistoryPanel;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-blame-file-test-'));
    testFile = path.join(tempDir, 'test.txt');

    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    fs.writeFileSync(testFile, 'Initial content line 1\nInitial content line 2\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit"', { cwd: tempDir });

    fs.writeFileSync(testFile, 'Initial content line 1\nModified content line 2\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Second commit"', { cwd: tempDir });

    mockPanel = {
      getCwd: () => tempDir
    } as unknown as GitHistoryPanel;
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  const mockSettingsService: any = {
    saveSettings: async () => {},
    getSettings: () => ({}),
    resetSettings: async () => {},
    getSetting: () => undefined,
    setSetting: async () => {}
  };

  const mockFirstRunTipService: any = {
    shouldShowTip: () => false,
    markAsShown: async () => {},
    reset: async () => {}
  };

  test('blameFile message type should be defined in types', () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(
      source.includes("type: 'blameFile'"),
      'WebviewToExtMessage should include blameFile'
    );
    assert.ok(
      /type: 'blameFile'; filePath: string/.test(source),
      'blameFile message should carry a filePath'
    );
  });

  test('messageHandler should process blameFile message and open the file', async () => {
    await handleMessage(
      { type: 'blameFile', filePath: 'test.txt' },
      mockPanel,
      mockSettingsService,
      mockFirstRunTipService
    );

    const activeEditor = vscode.window.activeTextEditor;
    assert.ok(activeEditor, 'A text editor should be active after blaming a file');
    assert.strictEqual(
      activeEditor!.document.uri.fsPath,
      testFile,
      'The blamed file should be the open editor'
    );

    // Toggle blame back off so the test host is left in a clean state
    await vscode.commands.executeCommand('gitHistory.toggleBlame');
  });

  test('messageHandler should resolve relative paths against the repo cwd', async () => {
    await handleMessage(
      { type: 'blameFile', filePath: path.join(tempDir, 'test.txt') },
      mockPanel,
      mockSettingsService,
      mockFirstRunTipService
    );

    const activeEditor = vscode.window.activeTextEditor;
    assert.ok(activeEditor, 'A text editor should be active after blaming a file');
    assert.strictEqual(
      activeEditor!.document.uri.fsPath,
      testFile,
      'An absolute path should resolve to the same file'
    );

    await vscode.commands.executeCommand('gitHistory.toggleBlame');
  });

  test('messageHandler should not throw when the file is missing from the working tree', async () => {
    await handleMessage(
      { type: 'blameFile', filePath: 'deleted-file.txt' },
      mockPanel,
      mockSettingsService,
      mockFirstRunTipService
    );

    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
      assert.notStrictEqual(
        path.basename(activeEditor.document.uri.fsPath),
        'deleted-file.txt',
        'No editor should be opened for a missing file'
      );
    }
  });

  test('messageHandler should reuse the registered toggleBlame command', () => {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const handlerSection = source.substring(source.indexOf('async function handleBlameFile'));
    assert.ok(handlerSection.length > 0, 'handleBlameFile should exist');
    assert.ok(
      handlerSection.includes("executeCommand('gitHistory.toggleBlame')"),
      'handleBlameFile should toggle blame via the registered command'
    );
    assert.ok(
      handlerSection.includes('fs.existsSync'),
      'handleBlameFile should check the file exists before blaming'
    );
  });

  test('webview file context menu should offer a blame entry', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const menuSection = source.substring(
      source.indexOf('function showFileContextMenu'),
      source.indexOf('function showCommitContextMenu')
    );
    assert.ok(menuSection.length > 0, 'showFileContextMenu should exist in main.js');
    assert.ok(
      menuSection.includes('data-action="blame-file"'),
      'File context menu should contain a blame-file item'
    );
    assert.ok(
      menuSection.includes("type: 'blameFile'"),
      'Blame menu item should post a blameFile message'
    );
  });
});
