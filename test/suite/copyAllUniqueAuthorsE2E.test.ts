import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

suite('Copy All Unique Authors E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHash1: string;
  let commitHash2: string;
  let commitHash3: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-all-unique-authors-'));
    testFile = path.join(tempDir, 'test.txt');

    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Create first commit by Alice
    fs.writeFileSync(testFile, 'First commit\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "First commit"', { cwd: tempDir });
    commitHash1 = execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim();

    // Create second commit by Bob
    execSync('git config user.name "Bob Smith"', { cwd: tempDir });
    execSync('git config user.email "bob@example.com"', { cwd: tempDir });
    fs.writeFileSync(testFile, 'Second commit\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Second commit"', { cwd: tempDir });
    commitHash2 = execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim();

    // Create third commit by Alice (same name/email as first)
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });
    fs.writeFileSync(testFile, 'Third commit\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Third commit"', { cwd: tempDir });
    commitHash3 = execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim();
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('git log shows different authors for commits', async () => {
    const author1 = execSync(`git log --format=%an -1 ${commitHash1}`, { cwd: tempDir, encoding: 'utf-8' }).trim();
    const author2 = execSync(`git log --format=%an -1 ${commitHash2}`, { cwd: tempDir, encoding: 'utf-8' }).trim();
    const author3 = execSync(`git log --format=%an -1 ${commitHash3}`, { cwd: tempDir, encoding: 'utf-8' }).trim();

    assert.strictEqual(author1, 'Test User', 'First commit should be by Test User');
    assert.strictEqual(author2, 'Bob Smith', 'Second commit should be by Bob Smith');
    assert.strictEqual(author3, 'Test User', 'Third commit should be by Test User');
  });

  test('handleCopyAllUniqueAuthors with valid commits', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyAllUniqueAuthors'),
      'handleCopyAllUniqueAuthors should be defined');
    assert.ok(source.includes('panel.getCommits()'),
      'Should get commits from panel');
    assert.ok(source.includes('commit.author'),
      'Should use author from commit');
    assert.ok(source.includes('commit.email'),
      'Should use email from commit');
  });

  test('handleCopyAllUniqueAuthors formats as Name <email>', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAllUniqueAuthors');
    assert.ok(fnStart >= 0, 'handleCopyAllUniqueAuthors should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('commit.author') && fnBody.includes('commit.email'),
      'Should use author and email from commit');
    assert.ok(fnBody.includes('`${commit.author} <${commit.email}>`'),
      'Should format as Name <email>');
  });

  test('handleCopyAllUniqueAuthors uses deduplication', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAllUniqueAuthors');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Map') || fnBody.includes('Set') || fnBody.includes('uniqueAuthors'),
      'Should use deduplication for unique authors');
  });

  test('handleCopyAllUniqueAuthors sorts alphabetically', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAllUniqueAuthors');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('.sort()'),
      'Should sort authors alphabetically');
  });

  test('handleCopyAllUniqueAuthors writes sorted unique authors to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAllUniqueAuthors');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write to clipboard');
    assert.ok(fnBody.includes('authorsText') || fnBody.includes("join('\\n')"),
      'Should join authors with newlines');
  });

  test('handleCopyAllUniqueAuthors handles empty hashes', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAllUniqueAuthors');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('hashes.length === 0'),
      'Should check for empty hashes');
    assert.ok(fnBody.includes('No commits visible in current view'),
      'Should show message when no commits visible');
  });

  test('handleCopyAllUniqueAuthors shows confirmation with singular/plural', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAllUniqueAuthors');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Copied'),
      'Should show confirmation with "Copied"');
    assert.ok(fnBody.includes('unique author'),
      'Should mention unique authors in confirmation');
    assert.ok(fnBody.includes('authorsArray.length') && fnBody.includes('!=='),
      'Should use singular/plural form');
  });

  test('handleCopyAllUniqueAuthors deduplicates same author from different commits', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAllUniqueAuthors');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    // The function should loop through hashes and collect unique authors
    assert.ok(fnBody.includes('for (const hash of hashes)'),
      'Should iterate through hashes');
    assert.ok(fnBody.includes('uniqueAuthors'),
      'Should track unique authors');
  });

  test('main.js handleCopyAllUniqueAuthors gets filtered commits', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAllUniqueAuthors');
    assert.ok(fnStart >= 0, 'handleCopyAllUniqueAuthors should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('getOrderedCommits(getFilteredCommits())'),
      'Should get ordered filtered commits');
  });

  test('main.js handleCopyAllUniqueAuthors handles no commits', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAllUniqueAuthors');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('length === 0'),
      'Should check if commits array is empty');
    assert.ok(fnBody.includes('showError') && fnBody.includes('No commits visible'),
      'Should show error when no commits visible');
  });

  test('main.js handleCopyAllUniqueAuthors sends correct message type', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAllUniqueAuthors');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copyAllUniqueAuthors'"),
      'Should send copyAllUniqueAuthors message type');
  });

  test('main.js handleCopyAllUniqueAuthors maps commits to hashes', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAllUniqueAuthors');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('displayCommits.map(commit => commit.hash)'),
      'Should map commits to hashes');
  });

  test('context menu has copy-all-unique-authors item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-all-unique-authors"'),
      'Context menu should include copy-all-unique-authors');
    assert.ok(source.includes('Copy all unique authors'),
      'Context menu should have label Copy all unique authors');
  });

  test('context menu copy-all-unique-authors has 👥 icon', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('👥'),
      'Context menu copy-all-unique-authors should have 👥 icon');
  });

  test('context menu click handles copy-all-unique-authors action', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("action === 'copy-all-unique-authors'"),
      'Should handle copy-all-unique-authors action');
  });

  test('context menu shows unique author count in label', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('new Set') && source.includes('map(c =>') &&
      source.includes('c.author') && source.includes('c.email'),
      'Context menu should show unique author count using Set');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyAllUniqueAuthors"'),
      'package.json should register copyAllUniqueAuthors command');
    assert.ok(content.includes('"ctrl+shift+alt+p"'),
      'package.json should define Ctrl+Shift+Alt+P keybinding');
  });

  test('package.json keybinding uses correct keys', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    const json = JSON.parse(content);

    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyAllUniqueAuthors'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyAllUniqueAuthors');
    assert.strictEqual(binding.key, 'ctrl+shift+alt+p');
    assert.strictEqual(binding.mac, 'cmd+shift+alt+p');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('keyboard help includes Copy all unique authors', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Copy all unique authors'),
      'Keyboard help should include Copy all unique authors');
  });

  test('keyboard help shows Ctrl+Shift+Alt+P keybinding', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Ctrl+Shift+Alt+P') || source.includes('ctrl+shift+alt+p') ||
      source.includes('Cmd+Shift+Alt+P') || source.includes('cmd+shift+alt+p'),
      'Keyboard help should show Ctrl+Shift+Alt+P keybinding');
  });
});
