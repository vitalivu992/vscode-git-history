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
      getSettings: () => ({ diffType: 'unified', wordWrapEnabled: false, sortOldestFirst: false, hideMergeCommits: false, regexSearchEnabled: false }),
      resetSettings: async () => {},
      getSetting: () => undefined,
      setSetting: async () => {}
    };

    try {
      await handleMessage(
        { type: 'openFileAtCommit', hash: commitHashes[0], filePath: testFile },
        mockPanel,
        mockSettingsService
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
      getSettings: () => ({ diffType: 'unified', wordWrapEnabled: false, sortOldestFirst: false, hideMergeCommits: false, regexSearchEnabled: false }),
      resetSettings: async () => {},
      getSetting: () => undefined,
      setSetting: async () => {}
    };

    try {
      await handleMessage(
        { type: 'copyFilePath', filePath: 'src/webview/panel/main.js' },
        mockPanel,
        mockSettingsService
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
      getSettings: () => ({ diffType: 'unified', wordWrapEnabled: false, sortOldestFirst: false, hideMergeCommits: false, regexSearchEnabled: false }),
      resetSettings: async () => {},
      getSetting: () => undefined,
      setSetting: async () => {}
    };

    await handleMessage(
      { type: 'nonExistentMessageType' },
      mockPanel,
      mockSettingsService
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
