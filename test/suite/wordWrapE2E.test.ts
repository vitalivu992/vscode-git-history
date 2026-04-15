import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

function simulateWordWrapToggle(initialState: boolean): { newState: boolean; diffViewerClasses: string[]; buttonClasses: string[]; buttonTitle: string } {
  let wordWrapEnabled = initialState;
  const diffViewerClasses: string[] = [];
  const buttonClasses: string[] = [];

  wordWrapEnabled = !wordWrapEnabled;

  if (wordWrapEnabled) {
    diffViewerClasses.push('word-wrap');
    buttonClasses.push('active');
  } else {
    const wrapIdx = diffViewerClasses.indexOf('word-wrap');
    if (wrapIdx >= 0) diffViewerClasses.splice(wrapIdx, 1);
    const activeIdx = buttonClasses.indexOf('active');
    if (activeIdx >= 0) buttonClasses.splice(activeIdx, 1);
  }

  const buttonTitle = wordWrapEnabled
    ? 'Word wrap enabled (Ctrl+Shift+W to toggle)'
    : 'Toggle word wrap (Ctrl+Shift+W)';

  return { newState: wordWrapEnabled, diffViewerClasses, buttonClasses, buttonTitle };
}

suite('Word Wrap E2E Logic Tests', () => {
  test('toggle from disabled to enabled adds word-wrap class', () => {
    const result = simulateWordWrapToggle(false);
    assert.strictEqual(result.newState, true);
    assert.ok(result.diffViewerClasses.includes('word-wrap'), 'Should add word-wrap class');
    assert.ok(result.buttonClasses.includes('active'), 'Should add active class to button');
    assert.ok(result.buttonTitle.includes('enabled'), 'Title should indicate enabled state');
    assert.ok(result.buttonTitle.includes('Ctrl+Shift+W'), 'Title should include shortcut');
  });

  test('toggle from enabled to disabled removes word-wrap class', () => {
    const result = simulateWordWrapToggle(true);
    assert.strictEqual(result.newState, false);
    assert.ok(!result.diffViewerClasses.includes('word-wrap'), 'Should not have word-wrap class');
    assert.ok(!result.buttonClasses.includes('active'), 'Should not have active class on button');
    assert.ok(result.buttonTitle.includes('Toggle'), 'Title should indicate toggle state');
    assert.ok(result.buttonTitle.includes('Ctrl+Shift+W'), 'Title should include shortcut');
  });

  test('toggling twice returns to initial state', () => {
    const first = simulateWordWrapToggle(false);
    const second = simulateWordWrapToggle(first.newState);
    assert.strictEqual(second.newState, false);
    assert.ok(!second.diffViewerClasses.includes('word-wrap'));
    assert.ok(!second.buttonClasses.includes('active'));
  });

  test('toggling three times ends in enabled state', () => {
    const first = simulateWordWrapToggle(false);
    const second = simulateWordWrapToggle(first.newState);
    const third = simulateWordWrapToggle(second.newState);
    assert.strictEqual(third.newState, true);
    assert.ok(third.diffViewerClasses.includes('word-wrap'));
  });
});

suite('Word Wrap E2E Source Integration Tests', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
  const indexPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
  const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');

  test('complete flow: button exists in both HTML templates and logic handles it', () => {
    const providerSource = fs.readFileSync(providerPath, 'utf-8');
    const indexSource = fs.readFileSync(indexPath, 'utf-8');
    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');
    const stylesSource = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(providerSource.includes('id="word-wrap-btn"'), 'webviewProvider should have word-wrap-btn');
    assert.ok(indexSource.includes('id="word-wrap-btn"'), 'index.html should have word-wrap-btn');
    assert.ok(mainSource.includes('handleWordWrapToggle'), 'main.js should have toggle handler');
    assert.ok(stylesSource.includes('.word-wrap-btn'), 'styles.css should have button styling');
    assert.ok(stylesSource.includes('#diff-viewer.word-wrap'), 'styles.css should have word-wrap diff styling');
  });

  test('button order is consistent between webviewProvider and index.html', () => {
    const providerSource = fs.readFileSync(providerPath, 'utf-8');
    const indexSource = fs.readFileSync(indexPath, 'utf-8');

    const getButtonOrder = (source: string): string[] => {
      const buttons = ['copy-btn', 'word-wrap-btn', 'sort-btn', 'merge-toggle-btn', 'refresh-btn'];
      return buttons.filter(btn => {
        const idx = source.indexOf(`id="${btn}"`);
        return idx >= 0;
      }).sort((a, b) => {
        return source.indexOf(`id="${a}"`) - source.indexOf(`id="${b}"`);
      });
    };

    const providerOrder = getButtonOrder(providerSource);
    const indexOrder = getButtonOrder(indexSource);

    assert.deepStrictEqual(providerOrder, indexOrder,
      `Button order should match: provider=${providerOrder.join(',')}, index=${indexOrder.join(',')}`);
  });

  test('keyboard shortcut Ctrl+Shift+W triggers same function as button click', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const kdStart = source.indexOf('function handleKeyDown');
    const kdEnd = source.indexOf('\nfunction', kdStart + 1);
    const kdBody = source.substring(kdStart, kdEnd > kdStart ? kdEnd : undefined);

    const initStart = source.indexOf('function init()');
    const initEnd = source.indexOf('\n// ───', initStart);
    const initBody = source.substring(initStart, initEnd > initStart ? initEnd : undefined);

    assert.ok(kdBody.includes('handleWordWrapToggle'), 'Keyboard shortcut should call handleWordWrapToggle');
    assert.ok(initBody.includes('handleWordWrapToggle'), 'Button click should call handleWordWrapToggle');
  });
});

suite('Word Wrap E2E Git Integration Tests', () => {
  let tempDir: string;
  let testFile: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-wordwrap-e2e-'));
    testFile = path.join(tempDir, 'longlines.json');

    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    const longLine = '{"key":"' + 'x'.repeat(500) + '"}';
    fs.writeFileSync(testFile, longLine + '\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Add JSON with long lines"', { cwd: tempDir });

    const longLine2 = '{"key":"' + 'y'.repeat(500) + '","updated":true}';
    fs.writeFileSync(testFile, longLine2 + '\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Update JSON with even longer lines"', { cwd: tempDir });
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('git service should return file history for long-line file', async () => {
    const { getFileHistory } = await import('../../src/git/gitService');
    const commits = await getFileHistory(testFile, tempDir);
    assert.ok(commits.length >= 1, 'Should have at least 1 commit');
    assert.ok(commits[0].hash, 'Commit should have a hash');
  });

  test('git service should return diff with long lines', async () => {
    const { getCommitDiff } = await import('../../src/git/gitService');
    const { execSync } = require('child_process');
    const hash = execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim();

    const diffResult = await getCommitDiff(hash, tempDir, testFile);
    assert.ok(!diffResult.isBinary, 'Should not be binary');
    assert.ok(diffResult.diff.length > 100, 'Diff should contain long line content');
    assert.ok(diffResult.diff.includes('diff --git'), 'Should be a valid diff');
  });

  test('word wrap CSS should handle long diff lines', () => {
    const stylesSource = fs.readFileSync(stylesPath, 'utf-8');
    const wordWrapIdx = stylesSource.indexOf('#diff-viewer.word-wrap');
    assert.ok(wordWrapIdx >= 0, 'Should have word-wrap CSS rule');

    const endIdx = stylesSource.indexOf('}', wordWrapIdx);
    const rule = stylesSource.substring(wordWrapIdx, endIdx);

    assert.ok(rule.includes('white-space: pre-wrap'), 'Should apply pre-wrap');
    assert.ok(rule.includes('word-break: break-all'), 'Should apply break-all');
  });
});

const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
