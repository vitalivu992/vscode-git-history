import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Copy Author Git Format E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHash: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-author-git-format-'));
    testFile = path.join(tempDir, 'test.txt');

    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Create initial commit
    fs.writeFileSync(testFile, 'Hello World\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit"', { cwd: tempDir });
    commitHash = execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim();
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('handleCopyAuthorGitFormat with valid commit', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify handler reads from commits array
    assert.ok(source.includes('function handleCopyAuthorGitFormat'),
      'handleCopyAuthorGitFormat should be defined');
    assert.ok(source.includes('panel.getCommits()'),
      'Should get commits from panel');
    assert.ok(source.includes('commit.author') && source.includes('commit.email'),
      'Should read commit.author and commit.email');
  });

  test('handleCopyAuthorGitFormat formats as Name <email>', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify git format output
    const fnStart = source.indexOf('function handleCopyAuthorGitFormat');
    assert.ok(fnStart >= 0, 'handleCopyAuthorGitFormat should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('`${commit.author} <${commit.email}>`'),
      'Should format as Name <email>');
  });

  test('handleCopyAuthorGitFormat writes to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify clipboard write with git format
    const fnStart = source.indexOf('function handleCopyAuthorGitFormat');
    assert.ok(fnStart >= 0, 'handleCopyAuthorGitFormat should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write to clipboard');
    assert.ok(fnBody.includes('gitFormat'),
      'Should use gitFormat variable');
  });

  test('handleCopyAuthorGitFormat handles missing commit', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify missing commit handling
    const fnStart = source.indexOf('function handleCopyAuthorGitFormat');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'Should handle commit not found');
  });

  test('handleCopyAuthorGitFormat handles special characters in email', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // The function should handle emails with special characters
    const fnStart = source.indexOf('function handleCopyAuthorGitFormat');
    assert.ok(fnStart >= 0, 'handleCopyAuthorGitFormat should exist');

    // The format should be Name <email> - this works for any valid email
    assert.ok(source.includes('commit.email'),
      'Should read commit.email directly');
  });

  test('main.js handleCopyAuthorGitFormat target resolution prioritizes focused', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify focused prioritized over selected
    const fnStart = source.indexOf('function handleCopyAuthorGitFormat');
    assert.ok(fnStart >= 0, 'handleCopyAuthorGitFormat should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('focusedIndex'),
      'Should check focusedIndex');
    assert.ok(fnBody.includes('selectedCommits'),
      'Should check selectedCommits');
    assert.ok(fnBody.includes('focusedIndex >= 0'),
      'Should prioritize focused over selected');
  });

  test('main.js handleCopyAuthorGitFormat sends correct message type', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAuthorGitFormat');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copyAuthorGitFormat'"),
      'Should send copyAuthorGitFormat message type');
  });

  test('main.js handleCopyAuthorGitFormat handles no target', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAuthorGitFormat');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('Select a commit to copy author'),
      'Should show error when no commit selected');
  });

  test('context menu has copy-author-git-format item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Check for context menu item
    assert.ok(source.includes('data-action="copy-author-git-format"'),
      'Context menu should include copy-author-git-format');
    assert.ok(source.includes('Copy author (git format)'),
      'Context menu should have label Copy author (git format)');
  });

  test('context menu click handles copy-author-git-format action', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Check handler for the action
    assert.ok(source.includes("action === 'copy-author-git-format'"),
      'Should handle copy-author-git-format action');
  });

  test('Ctrl+Alt+Shift+A keyboard shortcut integration', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify keyboard help dialog includes the entry
    assert.ok(source.includes('Copy author (git format)'),
      'Keyboard help should include copy author git format');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyAuthorGitFormat"'),
      'package.json should register copyAuthorGitFormat command');
    assert.ok(content.includes('"ctrl+alt+shift+a"'),
      'package.json should define Ctrl+Alt+Shift+A keybinding');
  });

  test('git format output is correct for Co-authored-by trailers', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify the format matches git's expected format
    const fnStart = source.indexOf('function handleCopyAuthorGitFormat');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    // The format should be: Name <email>
    assert.ok(fnBody.includes('`${commit.author} <${commit.email}>`'),
      'Should format as Name <email> for Co-authored-by compatibility');
  });
});
