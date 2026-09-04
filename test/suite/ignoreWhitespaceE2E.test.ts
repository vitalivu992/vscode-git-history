import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

function simulateIgnoreWhitespaceToggle(initialState: boolean): { newState: boolean; buttonClasses: string[]; buttonTitle: string } {
  let ignoreWhitespace = initialState;
  const buttonClasses: string[] = [];

  ignoreWhitespace = !ignoreWhitespace;

  if (ignoreWhitespace) {
    buttonClasses.push('active');
  } else {
    const activeIdx = buttonClasses.indexOf('active');
    if (activeIdx >= 0) buttonClasses.splice(activeIdx, 1);
  }

  const buttonTitle = ignoreWhitespace
    ? 'Ignore whitespace enabled (Ctrl+Shift+Alt+J to toggle)'
    : 'Toggle ignore whitespace (Ctrl+Shift+Alt+J)';

  return { newState: ignoreWhitespace, buttonClasses, buttonTitle };
}

suite('Ignore Whitespace E2E Logic Tests', () => {
  test('toggle from disabled to enabled adds active class', () => {
    const result = simulateIgnoreWhitespaceToggle(false);
    assert.strictEqual(result.newState, true);
    assert.ok(result.buttonClasses.includes('active'), 'Should add active class to button');
    assert.ok(result.buttonTitle.includes('enabled'), 'Title should indicate enabled state');
    assert.ok(result.buttonTitle.includes('Ctrl+Shift+Alt+J'), 'Title should include shortcut');
  });

  test('toggle from enabled to disabled removes active class', () => {
    const result = simulateIgnoreWhitespaceToggle(true);
    assert.strictEqual(result.newState, false);
    assert.ok(!result.buttonClasses.includes('active'), 'Should not have active class on button');
    assert.ok(result.buttonTitle.includes('Toggle'), 'Title should indicate toggle state');
    assert.ok(result.buttonTitle.includes('Ctrl+Shift+Alt+J'), 'Title should include shortcut');
  });

  test('toggling twice returns to initial state', () => {
    const first = simulateIgnoreWhitespaceToggle(false);
    const second = simulateIgnoreWhitespaceToggle(first.newState);
    assert.strictEqual(second.newState, false);
    assert.ok(!second.buttonClasses.includes('active'));
  });

  test('toggling three times ends in enabled state', () => {
    const first = simulateIgnoreWhitespaceToggle(false);
    const second = simulateIgnoreWhitespaceToggle(first.newState);
    const third = simulateIgnoreWhitespaceToggle(second.newState);
    assert.strictEqual(third.newState, true);
    assert.ok(third.buttonClasses.includes('active'));
  });
});

suite('Ignore Whitespace E2E Source Integration Tests', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
  const indexPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
  const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');

  test('complete flow: button exists in both HTML templates and logic handles it', () => {
    const providerSource = fs.readFileSync(providerPath, 'utf-8');
    const indexSource = fs.readFileSync(indexPath, 'utf-8');
    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');
    const stylesSource = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(providerSource.includes('id="ignore-ws-btn"'), 'webviewProvider should have ignore-ws-btn');
    assert.ok(indexSource.includes('id="ignore-ws-btn"'), 'index.html should have ignore-ws-btn');
    assert.ok(mainSource.includes('handleIgnoreWhitespaceToggle'), 'main.js should have toggle handler');
    assert.ok(stylesSource.includes('.ignore-ws-btn'), 'styles.css should have button styling');
    assert.ok(stylesSource.includes('.ignore-ws-btn.active'), 'styles.css should have active button styling');
  });

  test('keyboard shortcut Ctrl+Shift+Alt+J triggers same function as button click', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const kdStart = source.indexOf('function handleKeyDown');
    const kdEnd = source.indexOf('\nfunction', kdStart + 1);
    const kdBody = source.substring(kdStart, kdEnd > kdStart ? kdEnd : undefined);

    const initStart = source.indexOf('function init()');
    const initEnd = source.indexOf('\n// ───', initStart);
    const initBody = source.substring(initStart, initEnd > initStart ? initEnd : undefined);

    assert.ok(kdBody.includes('handleIgnoreWhitespaceToggle'), 'Keyboard shortcut should call handleIgnoreWhitespaceToggle');
    assert.ok(initBody.includes('handleIgnoreWhitespaceToggle'), 'Button click should call handleIgnoreWhitespaceToggle');
  });
});

suite('Ignore Whitespace E2E Git Integration Tests', () => {
  let tempDir: string;
  let testFile: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-ignorews-e2e-'));
    testFile = path.join(tempDir, 'test.txt');

    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Commit with spaces
    fs.writeFileSync(testFile, 'line 1\n  line 2\n    line 3\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Add file with leading spaces"', { cwd: tempDir });

    // Commit with changed indentation (whitespace-only changes)
    fs.writeFileSync(testFile, 'line 1\n\tline 2\n\t\tline 3\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Change indentation to tabs"', { cwd: tempDir });
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('git diff without -w should show whitespace changes', async () => {
    const { execSync } = require('child_process');
    const hash = execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim();

    const diff = execSync(`git diff ${hash}~1..${hash}`, { cwd: tempDir, encoding: 'utf-8' });
    assert.ok(diff.length > 0, 'Diff should contain changes');
  });

  test('git diff with -w should ignore whitespace changes', async () => {
    const { execSync } = require('child_process');
    const hash = execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim();

    const diffWithWs = execSync(`git diff ${hash}~1..${hash}`, { cwd: tempDir, encoding: 'utf-8' });
    const diffNoWs = execSync(`git diff -w ${hash}~1..${hash}`, { cwd: tempDir, encoding: 'utf-8' });

    // With -w, the diff should be smaller (or empty) since whitespace changes are ignored
    assert.ok(diffNoWs.length <= diffWithWs.length, 'Diff with -w should be no larger than without -w');
  });

  test('getCommitDiff should accept ignoreWhitespace parameter', async () => {
    const gitServicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    const fnStart = source.indexOf('function getCommitDiff');
    const fnEnd = source.indexOf('\nasync function', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('ignoreWhitespace'), 'getCommitDiff should accept ignoreWhitespace');
    assert.ok(fnBody.includes("args.push('-w')"), 'Should push -w flag when ignoreWhitespace is enabled');
  });
});
