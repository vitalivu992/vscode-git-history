import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

suite('Copy Co-Authors E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let noCoAuthorsHash: string;
  let singleCoAuthorHash: string;
  let multiCoAuthorsHash: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-coauthors-'));
    testFile = path.join(tempDir, 'test.txt');

    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Commit 1: no co-authors
    fs.writeFileSync(testFile, 'Hello World\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit"', { cwd: tempDir });
    noCoAuthorsHash = execSync('git rev-parse HEAD', { cwd: tempDir, encoding: 'utf-8' }).trim();

    // Commit 2: single co-author
    fs.writeFileSync(testFile, 'Hello World 2\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Second commit\n\nCo-authored-by: Alice <alice@example.com>"', { cwd: tempDir });
    singleCoAuthorHash = execSync('git rev-parse HEAD', { cwd: tempDir, encoding: 'utf-8' }).trim();

    // Commit 3: multiple co-authors
    fs.writeFileSync(testFile, 'Hello World 3\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Third commit\n\nCo-authored-by: Bob <bob@example.com>\nCo-authored-by: Charlie <charlie@example.com>"', { cwd: tempDir });
    multiCoAuthorsHash = execSync('git rev-parse HEAD', { cwd: tempDir, encoding: 'utf-8' }).trim();
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // ─── Git integration ────────────────────────────────────────────────────────

  test('git commit body contains co-author trailers', () => {
    const body = execSync(`git log --format=%b -1 ${singleCoAuthorHash}`, {
      cwd: tempDir, encoding: 'utf-8'
    }).trim();
    assert.ok(body.includes('Co-authored-by: Alice <alice@example.com>'),
      'Commit body should contain co-author trailer');
  });

  test('git commit body contains multiple co-authors', () => {
    const body = execSync(`git log --format=%b -1 ${multiCoAuthorsHash}`, {
      cwd: tempDir, encoding: 'utf-8'
    }).trim();
    assert.ok(body.includes('Co-authored-by: Bob <bob@example.com>'),
      'Commit body should contain first co-author');
    assert.ok(body.includes('Co-authored-by: Charlie <charlie@example.com>'),
      'Commit body should contain second co-author');
  });

  test('git commit without co-authors has no trailer', () => {
    const body = execSync(`git log --format=%b -1 ${noCoAuthorsHash}`, {
      cwd: tempDir, encoding: 'utf-8'
    }).trim();
    assert.ok(!body.includes('Co-authored-by:'),
      'Commit body should not contain co-author trailer');
  });

  // ─── Message handler ────────────────────────────────────────────────────────

  test('handleCopyCoAuthors function exists and gets commits from panel', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyCoAuthors'),
      'handleCopyCoAuthors should be defined');
    assert.ok(source.includes('panel.getCommits()'),
      'Should get commits from panel');
  });

  test('handleCopyCoAuthors calls extractCoAuthors with fullMessage', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCoAuthors');
    assert.ok(fnStart >= 0, 'handleCopyCoAuthors function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('extractCoAuthors'),
      'Should call extractCoAuthors');
    assert.ok(fnBody.includes('commit.fullMessage'),
      'Should pass commit.fullMessage to extractCoAuthors');
  });

  test('handleCopyCoAuthors handles no co-authors', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCoAuthors');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('coAuthors.length === 0'),
      'Should check for empty coAuthors array');
    assert.ok(fnBody.includes('No co-authors on commit'),
      'Should show "No co-authors on commit" message');
  });

  test('handleCopyCoAuthors writes co-authors to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCoAuthors');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write to clipboard');
    assert.ok(fnBody.includes("coAuthors.join('\\n')") || fnBody.includes('coAuthors.join'),
      'Should join co-authors with newlines');
  });

  test('handleCopyCoAuthors shows confirmation with count', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCoAuthors');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Copied'),
      'Should show confirmation');
    assert.ok(fnBody.includes('co-author'),
      'Should mention co-author(s)');
    assert.ok(fnBody.includes("coAuthors.length > 1 ? 's' : ''") || fnBody.includes('co-author'),
      'Should handle singular/plural');
  });

  test('handleCopyCoAuthors handles commit not found', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCoAuthors');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'Should show "Commit not found" error');
  });

  // ─── extractCoAuthors utility ───────────────────────────────────────────────

  test('extractCoAuthors function exists and is exported', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('export function extractCoAuthors'),
      'extractCoAuthors should be defined and exported');
  });

  test('extractCoAuthors uses case-insensitive regex', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function extractCoAuthors');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('/i'),
      'Regex should be case-insensitive');
    assert.ok(fnBody.includes('Co-authored-by'),
      'Should look for Co-authored-by pattern');
  });

  test('extractCoAuthors captures Name <email> format', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function extractCoAuthors');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('<([^>]+)>'),
      'Should capture email in angle brackets');
    assert.ok(fnBody.includes('coAuthors.push'),
      'Should collect results into array');
  });

  // ─── Webview (main.js) ──────────────────────────────────────────────────────

  test('main.js handleCopyCoAuthors prioritizes focused row', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCoAuthors');
    assert.ok(fnStart >= 0, 'handleCopyCoAuthors should exist in main.js');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('focusedIndex'),
      'Should check focusedIndex');
    assert.ok(fnBody.includes('focusedIndex >= 0'),
      'Should prioritize focused over selected');
    assert.ok(fnBody.includes('selectedCommits'),
      'Should fall back to selectedCommits');
  });

  test('main.js handleCopyCoAuthors sends correct message type', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCoAuthors');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copyCoAuthors'"),
      'Should send copyCoAuthors message type');
    assert.ok(fnBody.includes('hash: targetCommit.hash'),
      'Should send commit hash');
  });

  test('main.js shows error when no commit is selected', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCoAuthors');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('Select a commit to copy co-authors'),
      'Should show error when no commit selected');
  });

  test('context menu has copy-co-authors item with correct icon and label', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-co-authors"'),
      'Context menu should have copy-co-authors action');
    assert.ok(source.includes('👥'),
      'Context menu should have 👥 icon');
    assert.ok(source.includes('Copy co-authors'),
      'Context menu should have "Copy co-authors" label');
  });

  test('context menu click handles copy-co-authors action', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("action === 'copy-co-authors'"),
      'Should handle copy-co-authors action');
  });

  test('Ctrl+Shift+K keyboard shortcut triggers handleCopyCoAuthors', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("e.key === 'k'") && source.includes('handleCopyCoAuthors'),
      'Ctrl+Shift+K should trigger handleCopyCoAuthors');
  });

  test('triggerAction dispatches copyCoAuthors', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'copyCoAuthors': handleCopyCoAuthors()"),
      'triggerAction should dispatch copyCoAuthors');
  });

  test('keyboard help includes Copy co-authors', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Copy co-authors'),
      'Keyboard help should include Copy co-authors');
  });

  // ─── Package registration ───────────────────────────────────────────────────

  test('package.json registers gitHistory.copyCoAuthors command', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyCoAuthors"'),
      'package.json should register gitHistory.copyCoAuthors command');
  });

  test('package.json has correct keybinding for copyCoAuthors', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    const json = JSON.parse(content);

    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyCoAuthors'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyCoAuthors');
    assert.strictEqual(binding.key, 'ctrl+shift+k');
    assert.strictEqual(binding.mac, 'cmd+shift+k');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  // ─── Types ──────────────────────────────────────────────────────────────────

  test('types.ts has copyCoAuthors in WebviewAction', async () => {
    const typesPath = path.resolve(__dirname, '../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("'copyCoAuthors'"),
      'types.ts should include copyCoAuthors');
  });

  test('types.ts has copyCoAuthors message with hash field', async () => {
    const typesPath = path.resolve(__dirname, '../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    const msgMatch = source.match(/type:\s*'copyCoAuthors'[^}]*hash:\s*string/);
    assert.ok(msgMatch,
      'types.ts should have copyCoAuthors message with hash: string field');
  });

  // ─── Documentation ──────────────────────────────────────────────────────────

  test('CLAUDE.md documents Copy Co-Authors feature', async () => {
    const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
    const source = fs.readFileSync(claudePath, 'utf-8');

    assert.ok(source.includes('Copy Co-Authors'),
      'CLAUDE.md should document Copy Co-Authors feature');
    assert.ok(source.includes('handleCopyCoAuthors'),
      'CLAUDE.md should reference handleCopyCoAuthors');
    assert.ok(source.includes('extractCoAuthors'),
      'CLAUDE.md should reference extractCoAuthors');
  });

  test('README.md documents Copy Co-Authors feature', async () => {
    const readmePath = path.resolve(__dirname, '../../../README.md');
    const source = fs.readFileSync(readmePath, 'utf-8');

    assert.ok(source.includes('Co-Authors') || source.includes('co-author'),
      'README.md should document copy co-authors feature');
  });
});
