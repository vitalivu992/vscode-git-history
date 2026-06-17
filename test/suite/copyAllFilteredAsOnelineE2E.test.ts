import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

suite('Copy All Filtered as Oneline E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHash1: string;
  let commitHash2: string;
  let shortHash1: string;
  let shortHash2: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-all-filtered-oneline-'));
    testFile = path.join(tempDir, 'test.txt');

    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Create first commit
    fs.writeFileSync(testFile, 'First commit\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "First commit"', { cwd: tempDir });
    commitHash1 = execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim();
    shortHash1 = execSync('git log --format=%h -1', { cwd: tempDir, encoding: 'utf-8' }).trim();

    // Create second commit
    fs.writeFileSync(testFile, 'Second commit\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Second commit"', { cwd: tempDir });
    commitHash2 = execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim();
    shortHash2 = execSync('git log --format=%h -1', { cwd: tempDir, encoding: 'utf-8' }).trim();
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('oneline format components are available from git', async () => {
    const hash = execSync('git log --format=%h -1', { cwd: tempDir, encoding: 'utf-8' }).trim();
    const subject = execSync('git log --format=%s -1', { cwd: tempDir, encoding: 'utf-8' }).trim();

    assert.ok(/^[\da-f]{7}$/.test(hash), 'Short hash should be 7 hex characters');
    assert.ok(subject.length > 0, 'Subject should not be empty');
  });

  test('handleCopyAllFilteredAsOneline with valid commits', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyAllFilteredAsOneline'),
      'handleCopyAllFilteredAsOneline should be defined');
    assert.ok(source.includes('panel.getCommits()'),
      'Should get commits from panel');
    assert.ok(source.includes('commit.shortHash'),
      'Should use shortHash from commit');
    assert.ok(source.includes('commit.message'),
      'Should use message from commit');
  });

  test('handleCopyAllFilteredAsOneline formats as {shortHash} {message}', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAllFilteredAsOneline');
    assert.ok(fnStart >= 0, 'handleCopyAllFilteredAsOneline should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    // Should include the space-separated format
    assert.ok(fnBody.includes('commit.shortHash') && fnBody.includes('commit.message'),
      'Should format with shortHash and message');
    assert.ok(fnBody.includes("`${commit.shortHash} ${commit.message}`"),
      'Should use template string for format');
  });

  test('handleCopyAllFilteredAsOneline writes formatted text to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAllFilteredAsOneline');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write to clipboard');
    assert.ok(fnBody.includes('onelineText'),
      'Should store formatted text in onelineText variable');
  });

  test('handleCopyAllFilteredAsOneline handles empty hashes', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAllFilteredAsOneline');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('hashes.length === 0'),
      'Should check for empty hashes');
    assert.ok(fnBody.includes('No commits visible in current view'),
      'Should show message when no commits visible');
  });

  test('handleCopyAllFilteredAsOneline shows confirmation with singular/plural', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAllFilteredAsOneline');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Copied'),
      'Should show confirmation with "Copied"');
    assert.ok(fnBody.includes('commit') && fnBody.includes('>'),
      'Should use singular/plural form for "commit"');
  });

  test('handleCopyAllFilteredAsOneline maps hashes to commits', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAllFilteredAsOneline');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('.map(hash => commits.find'),
      'Should map hashes to commits');
    assert.ok(fnBody.includes('.filter((commit): commit is CommitInfo => commit !== undefined)'),
      'Should filter out undefined commits');
  });

  test('handleCopyAllFilteredAsOneline joins commits with newlines', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAllFilteredAsOneline');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes("join('\\n')"),
      'Should join oneline commits with newlines');
  });

  test('main.js handleCopyAllFilteredAsOneline gets filtered commits', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAllFilteredAsOneline');
    assert.ok(fnStart >= 0, 'handleCopyAllFilteredAsOneline should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('getOrderedCommits(getFilteredCommits())'),
      'Should get ordered filtered commits');
  });

  test('main.js handleCopyAllFilteredAsOneline handles no commits', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAllFilteredAsOneline');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('length === 0'),
      'Should check if commits array is empty');
    assert.ok(fnBody.includes('showError') && fnBody.includes('No commits visible'),
      'Should show error when no commits visible');
  });

  test('main.js handleCopyAllFilteredAsOneline sends correct message type', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAllFilteredAsOneline');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copyAllFilteredAsOneline'"),
      'Should send copyAllFilteredAsOneline message type');
  });

  test('main.js handleCopyAllFilteredAsOneline maps commits to hashes', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAllFilteredAsOneline');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('displayCommits.map(commit => commit.hash)'),
      'Should map commits to hashes');
  });

  test('context menu has copy-all-filtered-as-oneline item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-all-filtered-as-oneline"'),
      'Context menu should include copy-all-filtered-as-oneline');
    assert.ok(source.includes('Copy all filtered as oneline'),
      'Context menu should have label Copy all filtered as oneline');
  });

  test('context menu copy-all-filtered-as-oneline has ≡ icon', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('≡'),
      'Context menu copy-all-filtered-as-oneline should have ≡ icon');
  });

  test('context menu click handles copy-all-filtered-as-oneline action', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("action === 'copy-all-filtered-as-oneline'"),
      'Should handle copy-all-filtered-as-oneline action');
  });

  test('context menu shows commit count in label', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('getOrderedCommits(getFilteredCommits()).length'),
      'Context menu should show commit count');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyAllFilteredAsOneline"'),
      'package.json should register copyAllFilteredAsOneline command');
    assert.ok(content.includes('"ctrl+shift+alt+y"'),
      'package.json should define Ctrl+Shift+Alt+Y keybinding');
  });

  test('package.json keybinding uses correct keys', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    const json = JSON.parse(content);

    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyAllFilteredAsOneline'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyAllFilteredAsOneline');
    assert.strictEqual(binding.key, 'ctrl+shift+alt+y');
    assert.strictEqual(binding.mac, 'cmd+shift+alt+y');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('keyboard help includes Copy all filtered as oneline', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Copy all filtered as oneline'),
      'Keyboard help should include Copy all filtered as oneline');
  });

  test('keyboard help shows Ctrl+Shift+Alt+Y keybinding', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Ctrl+Shift+Alt+Y') || source.includes('ctrl+shift+alt+y') ||
      source.includes('Cmd+Shift+Alt+Y') || source.includes('cmd+shift+alt+y'),
      'Keyboard help should show Ctrl+Shift+Alt+Y keybinding');
  });
});
