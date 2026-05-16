import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Jump to Commit with Stats Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  // ─── Source verification tests ──────────────────────────────────────────

  test('types.ts should have jumpToNextCommitWithStats in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);/);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'jumpToNextCommitWithStats'"),
      'WebviewAction should include jumpToNextCommitWithStats');
  });

  test('types.ts should have jumpToPreviousCommitWithStats in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);/);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'jumpToPreviousCommitWithStats'"),
      'WebviewAction should include jumpToPreviousCommitWithStats');
  });

  test('main.js should have getCommitsWithStats function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function getCommitsWithStats()'),
      'main.js should have getCommitsWithStats function');
  });

  test('main.js should have jumpToNextCommitWithStats function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function jumpToNextCommitWithStats()'),
      'main.js should have jumpToNextCommitWithStats function');
  });

  test('main.js should have jumpToPreviousCommitWithStats function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function jumpToPreviousCommitWithStats()'),
      'main.js should have jumpToPreviousCommitWithStats function');
  });

  test('main.js triggerAction should dispatch jumpToNextCommitWithStats', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'jumpToNextCommitWithStats': jumpToNextCommitWithStats()"),
      'main.js triggerAction should dispatch jumpToNextCommitWithStats');
  });

  test('main.js triggerAction should dispatch jumpToPreviousCommitWithStats', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'jumpToPreviousCommitWithStats': jumpToPreviousCommitWithStats()"),
      'main.js triggerAction should dispatch jumpToPreviousCommitWithStats');
  });

  test('main.js should show error when no commits with stats found', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("'No commits with file changes found'"),
      'main.js should show error when no commits with stats found');
  });

  test('main.js getCommitsWithStats should filter commits with filesChanged > 0', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function getCommitsWithStats()');
    assert.ok(fnStart >= 0, 'getCommitsWithStats function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);
    assert.ok(fnBody.includes('filesChanged > 0'),
      'getCommitsWithStats should filter for filesChanged > 0');
  });

  test('main.js should wrap around in jumpToNextCommitWithStats', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function jumpToNextCommitWithStats()');
    assert.ok(fnStart >= 0, 'jumpToNextCommitWithStats function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);
    assert.ok(fnBody.includes('nextIndex = 0'),
      'jumpToNextCommitWithStats should wrap around to first commit');
  });

  test('main.js should wrap around in jumpToPreviousCommitWithStats', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function jumpToPreviousCommitWithStats()');
    assert.ok(fnStart >= 0, 'jumpToPreviousCommitWithStats function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);
    assert.ok(fnBody.includes('prevIndex = commitsWithStats.length - 1'),
      'jumpToPreviousCommitWithStats should wrap around to last commit');
  });

  test('main.js jumpToNextCommitWithStats should call scrollToCommitByHash', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function jumpToNextCommitWithStats()');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);
    assert.ok(fnBody.includes('scrollToCommitByHash'),
      'jumpToNextCommitWithStats should call scrollToCommitByHash');
  });

  test('main.js jumpToNextCommitWithStats should call setFocusedRow', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function jumpToNextCommitWithStats()');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);
    assert.ok(fnBody.includes('setFocusedRow'),
      'jumpToNextCommitWithStats should call setFocusedRow');
  });

  test('main.js keyboard help should include jump to next commit with changes', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('Jump to next commit with changes'),
      'Keyboard help should include jump to next commit with changes');
  });

  test('main.js keyboard help should include jump to previous commit with changes', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('Jump to previous commit with changes'),
      'Keyboard help should include jump to previous commit with changes');
  });

  test('package.json should register jumpToNextCommitWithStats command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.jumpToNextCommitWithStats'),
      'package.json should register gitHistory.jumpToNextCommitWithStats command');
  });

  test('package.json should register jumpToPreviousCommitWithStats command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.jumpToPreviousCommitWithStats'),
      'package.json should register gitHistory.jumpToPreviousCommitWithStats command');
  });

  test('package.json should have Jump to Next Commit with Stats command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Jump to Next Commit with Stats'),
      'package.json should have Jump to Next Commit with Stats command title');
  });

  test('package.json should have Jump to Previous Commit with Stats command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Jump to Previous Commit with Stats'),
      'package.json should have Jump to Previous Commit with Stats command title');
  });

  test('package.json should register Ctrl+Alt+] keybinding for jumpToNextCommitWithStats', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.jumpToNextCommitWithStats'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.jumpToNextCommitWithStats');
    assert.strictEqual(binding.key, 'ctrl+alt+]');
    assert.strictEqual(binding.mac, 'cmd+alt+]');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('package.json should register Ctrl+Alt+[ keybinding for jumpToPreviousCommitWithStats', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.jumpToPreviousCommitWithStats'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.jumpToPreviousCommitWithStats');
    assert.strictEqual(binding.key, 'ctrl+alt+[');
    assert.strictEqual(binding.mac, 'cmd+alt+[');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('extension.ts should register jumpToNextCommitWithStats webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'jumpToNextCommitWithStats'"),
      'extension.ts should register jumpToNextCommitWithStats webview action');
  });

  test('extension.ts should register jumpToPreviousCommitWithStats webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'jumpToPreviousCommitWithStats'"),
      'extension.ts should register jumpToPreviousCommitWithStats webview action');
  });

  test('CLAUDE.md should document Jump to Next/Previous Commit with Stats feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Jump to Next/Previous Commit with Stats'),
      'CLAUDE.md should document Jump to Next/Previous Commit with Stats feature');
    assert.ok(source.includes('jumpToNextCommitWithStats'),
      'CLAUDE.md should reference jumpToNextCommitWithStats');
    assert.ok(source.includes('jumpToPreviousCommitWithStats'),
      'CLAUDE.md should reference jumpToPreviousCommitWithStats');
  });

  test('README.md should document Jump to Commit with Changes feature', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('commit with changes') || source.includes('Cmd+Shift+'),
      'README.md should document Jump to Commit with Changes feature');
  });

  // ─── Logic tests (pure function tests) ──────────────────────────────────

  test('should filter commits that have filesChanged > 0', () => {
    const mockCommits = [
      { hash: 'aaa', stats: { filesChanged: 0, insertions: 0, deletions: 0 } },
      { hash: 'bbb', stats: { filesChanged: 3, insertions: 10, deletions: 2 } },
      { hash: 'ccc', stats: { filesChanged: 0, insertions: 0, deletions: 0 } },
      { hash: 'ddd', stats: { filesChanged: 1, insertions: 5, deletions: 1 } },
      { hash: 'eee', stats: { filesChanged: 5, insertions: 20, deletions: 8 } },
    ];
    const withStats = mockCommits.filter(c => c.stats && c.stats.filesChanged > 0);
    assert.strictEqual(withStats.length, 3);
    assert.strictEqual(withStats[0].hash, 'bbb');
    assert.strictEqual(withStats[1].hash, 'ddd');
    assert.strictEqual(withStats[2].hash, 'eee');
  });

  test('should filter out commits without stats', () => {
    const mockCommits = [
      { hash: 'aaa' },
      { hash: 'bbb', stats: { filesChanged: 2, insertions: 5, deletions: 1 } },
      { hash: 'ccc', stats: null },
    ];
    const withStats = mockCommits.filter(c => c.stats && c.stats.filesChanged > 0);
    assert.strictEqual(withStats.length, 1);
    assert.strictEqual(withStats[0].hash, 'bbb');
  });

  test('should find current commit index in stats list', () => {
    const withStats = [
      { hash: 'bbb', stats: { filesChanged: 3, insertions: 10, deletions: 2 } },
      { hash: 'ddd', stats: { filesChanged: 1, insertions: 5, deletions: 1 } },
      { hash: 'eee', stats: { filesChanged: 5, insertions: 20, deletions: 8 } },
    ];
    const currentHash = 'ddd';
    const index = withStats.findIndex(c => c.hash === currentHash);
    assert.strictEqual(index, 1);
  });

  test('should return -1 when current commit has no stats', () => {
    const withStats = [
      { hash: 'bbb', stats: { filesChanged: 3, insertions: 10, deletions: 2 } },
      { hash: 'ddd', stats: { filesChanged: 1, insertions: 5, deletions: 1 } },
    ];
    const currentHash = 'aaa';
    const index = withStats.findIndex(c => c.hash === currentHash);
    assert.strictEqual(index, -1);
  });

  test('should wrap around when at last commit with stats (next)', () => {
    const withStats = [
      { hash: 'bbb', stats: { filesChanged: 3, insertions: 10, deletions: 2 } },
      { hash: 'ddd', stats: { filesChanged: 1, insertions: 5, deletions: 1 } },
      { hash: 'eee', stats: { filesChanged: 5, insertions: 20, deletions: 8 } },
    ];
    let nextIndex = 2;
    if (nextIndex < withStats.length - 1) {
      nextIndex = nextIndex + 1;
    } else {
      nextIndex = 0;
    }
    assert.strictEqual(nextIndex, 0);
  });

  test('should wrap around when at first commit with stats (previous)', () => {
    const withStats = [
      { hash: 'bbb', stats: { filesChanged: 3, insertions: 10, deletions: 2 } },
      { hash: 'ddd', stats: { filesChanged: 1, insertions: 5, deletions: 1 } },
      { hash: 'eee', stats: { filesChanged: 5, insertions: 20, deletions: 8 } },
    ];
    let prevIndex = 0;
    if (prevIndex > 0) {
      prevIndex = prevIndex - 1;
    } else {
      prevIndex = withStats.length - 1;
    }
    assert.strictEqual(prevIndex, 2);
  });

  test('should start from first when no current commit (next)', () => {
    const withStats = [
      { hash: 'bbb', stats: { filesChanged: 3, insertions: 10, deletions: 2 } },
      { hash: 'ddd', stats: { filesChanged: 1, insertions: 5, deletions: 1 } },
    ];
    const currentIndex = -1;
    let nextIndex;
    if (currentIndex < 0) {
      nextIndex = 0;
    } else if (currentIndex < withStats.length - 1) {
      nextIndex = currentIndex + 1;
    } else {
      nextIndex = 0;
    }
    assert.strictEqual(nextIndex, 0);
  });

  test('should start from last when no current commit (previous)', () => {
    const withStats = [
      { hash: 'bbb', stats: { filesChanged: 3, insertions: 10, deletions: 2 } },
      { hash: 'ddd', stats: { filesChanged: 1, insertions: 5, deletions: 1 } },
    ];
    const currentIndex = -1;
    let prevIndex;
    if (currentIndex < 0) {
      prevIndex = withStats.length - 1;
    } else if (currentIndex > 0) {
      prevIndex = currentIndex - 1;
    } else {
      prevIndex = withStats.length - 1;
    }
    assert.strictEqual(prevIndex, 1);
  });

  test('should handle single commit with stats', () => {
    const withStats = [
      { hash: 'bbb', stats: { filesChanged: 3, insertions: 10, deletions: 2 } },
    ];
    let nextIndex = 0;
    if (nextIndex < withStats.length - 1) {
      nextIndex = nextIndex + 1;
    } else {
      nextIndex = 0;
    }
    assert.strictEqual(nextIndex, 0);

    let prevIndex = 0;
    if (prevIndex > 0) {
      prevIndex = prevIndex - 1;
    } else {
      prevIndex = withStats.length - 1;
    }
    assert.strictEqual(prevIndex, 0);
  });

  test('should handle empty commits with stats list', () => {
    const mockCommits = [
      { hash: 'aaa', stats: { filesChanged: 0, insertions: 0, deletions: 0 } },
      { hash: 'ccc', stats: null },
    ];
    const withStats = mockCommits.filter(c => c.stats && c.stats.filesChanged > 0);
    assert.strictEqual(withStats.length, 0);
  });
});
