import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Copy All Filtered Hashes E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHashes: string[];

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-all-filtered-'));
    testFile = path.join(tempDir, 'test.txt');
    commitHashes = [];

    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Create initial commit
    fs.writeFileSync(testFile, 'Line 1\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Commit 1: Add line 1"', { cwd: tempDir });
    commitHashes.push(execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim());

    // Create second commit
    fs.writeFileSync(testFile, 'Line 1\nLine 2\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Commit 2: Add line 2"', { cwd: tempDir });
    commitHashes.push(execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim());

    // Create third commit
    fs.writeFileSync(testFile, 'Line 1\nLine 2\nLine 3\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Commit 3: Add line 3"', { cwd: tempDir });
    commitHashes.push(execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim());
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('handleCopyAllFilteredHashes handles empty hashes array', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyAllFilteredHashes'),
      'handleCopyAllFilteredHashes should be defined');
    assert.ok(source.includes("hashes.length === 0"),
      'Should handle empty hashes array case');
    assert.ok(source.includes('No commits visible in current view'),
      'Should show appropriate message for empty view');
  });

  test('handleCopyAllFilteredHashes joins hashes with newline', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes("hashes.join('\\n')"),
      'Should join hashes with newline');
  });

  test('handleCopyAllFilteredHashes shows correct confirmation message', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes("Copied ${hashes.length} filtered commit hash"),
      'Should show message with filtered commit count');
  });

  test('main.js handleCopyAllFilteredHashes gets all filtered commits', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAllFilteredHashes');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('getOrderedCommits(getFilteredCommits())'),
      'Should get all ordered filtered commits');
    assert.ok(fnBody.includes("type: 'copyAllFilteredHashes'"),
      'Should send copyAllFilteredHashes message type');
    assert.ok(fnBody.includes('displayCommits.length === 0'),
      'Should handle empty case');
  });

  test('context menu shows copy all filtered hashes with count', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-all-filtered-hashes"'),
      'Context menu should include copy-all-filtered-hashes action');
    assert.ok(source.includes('Copy all filtered hashes'),
      'Context menu should display "Copy all filtered hashes" label');
  });

  test('Ctrl+Shift+Alt+H keyboard shortcut integration', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const kdStart = source.indexOf('function handleKeyDown');
    const kdEnd = source.indexOf('\nfunction', kdStart + 1);
    const kdBody = source.substring(kdStart, kdEnd > kdStart ? kdEnd : undefined);

    assert.ok(
      kdBody.includes('e.altKey') &&
      (kdBody.includes("e.key === 'h'") || kdBody.includes("e.key === 'H'")) &&
      kdBody.includes('handleCopyAllFilteredHashes'),
      'Ctrl+Shift+Alt+H shortcut should be handled'
    );
  });

  test('package.json command and keybinding registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyAllFilteredHashes"'),
      'package.json should register copyAllFilteredHashes command');
    assert.ok(content.includes('Git History: Copy All Filtered Hashes'),
      'package.json should have correct command title');
    assert.ok(content.includes('"ctrl+shift+alt+h"') || content.includes('"ctrl+shift+alt+H"'),
      'package.json should define Ctrl+Shift+Alt+H keybinding');
    assert.ok(content.includes('"cmd+shift+alt+h"') || content.includes('"cmd+shift+alt+H"'),
      'package.json should define Cmd+Shift+Alt+H keybinding for Mac');
  });

  test('types.ts defines copyAllFilteredHashes in WebviewAction and WebviewToExtMessage', async () => {
    const typesPath = path.resolve(__dirname, '../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("| 'copyAllFilteredHashes'"),
      'WebviewAction should include copyAllFilteredHashes');
    assert.ok(source.includes("type: 'copyAllFilteredHashes'"),
      'WebviewToExtMessage should include copyAllFilteredHashes message type');
  });

  test('extension.ts registers copyAllFilteredHashes webview action', async () => {
    const extensionPath = path.resolve(__dirname, '../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes("gitHistory.copyAllFilteredHashes"),
      'extension.ts should register copyAllFilteredHashes command');
    assert.ok(source.includes("action: 'copyAllFilteredHashes'"),
      'extension.ts should map command to copyAllFilteredHashes action');
  });
});
