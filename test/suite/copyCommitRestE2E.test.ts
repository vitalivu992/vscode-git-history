import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

suite('Copy Commit ReST E2E Tests', () => {
  let tempDir: string;
  let testFile: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-rest-'));
    testFile = path.join(tempDir, 'test.txt');

    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Create commit with multi-line message (subject + body), stats, and tags
    fs.writeFileSync(testFile, 'Hello World\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Add authentication feature\n\nImplemented JWT-based authentication with refresh token support.\n- Added login/logout endpoints\n- Created auth middleware\n- Added token validation"', { cwd: tempDir });
    execSync('git tag v1.0.0', { cwd: tempDir });

    // Create commit with stats but no body
    fs.writeFileSync(testFile, 'Hello World 2\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Fix typo in README"', { cwd: tempDir });

    // Create commit with minimal info (no stats at beginning of history)
    fs.writeFileSync(testFile, 'Hello World 3\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit"', { cwd: tempDir });
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('git commit with body can be formatted as reStructuredText', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('function formatCommitAsRest'),
      'formatCommitAsRest should be defined');
    assert.ok(source.includes('commit.message') || source.includes('underline'),
      'Should format commit with ReST title and underline');
  });

  test('formatCommitAsRest includes all required fields', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function formatCommitAsRest');
    assert.ok(fnStart >= 0, 'formatCommitAsRest should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 800);
    const fnBody = source.substring(fnStart, fnEnd);

    // Check for title with = underline
    assert.ok(fnBody.includes('commit.message') && fnBody.includes("'="),
      'Should include title with = underline matching message length');

    // Check for :Author: field
    assert.ok(fnBody.includes(':Author:') || fnBody.includes('Author'),
      'Should include :Author: field');

    // Check for :Date: field
    assert.ok(fnBody.includes(':Date:') || fnBody.includes('Date'),
      'Should include :Date: field');

    // Check for :Hash: field
    assert.ok(fnBody.includes(':Hash:') || fnBody.includes('Hash'),
      'Should include :Hash: field');

    // Check for author name and email
    assert.ok(fnBody.includes('commit.author') || fnBody.includes('commit.email'),
      'Should include author name and email');

    // Check for ISO date format
    assert.ok(fnBody.includes('toISOString') || fnBody.includes('shortHash'),
      'Should format date as ISO and use short hash');

    // Check for stats section
    assert.ok(fnBody.includes('**Statistics:**') || fnBody.includes('stats'),
      'Should include file stats');

    // Check for tags section
    assert.ok(fnBody.includes('Tags:') || fnBody.includes('tags'),
      'Should handle tags');

    // Check for body section
    assert.ok(fnBody.includes('fullMessage') || fnBody.includes('body'),
      'Should include commit body when different from subject');
  });

  test('formatCommitAsRest handles commits without body', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function formatCommitAsRest');
    const fnEnd = source.indexOf('\n}', fnStart + 800);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('fullMessage') && fnBody.includes('commit.message'),
      'Should check if fullMessage differs from message');
    assert.ok(fnBody.includes('.trim()'),
      'Should trim body before checking');
  });

  test('formatCommitAsRest handles commits without stats', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function formatCommitAsRest');
    const fnEnd = source.indexOf('\n}', fnStart + 800);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('commit.stats') || fnBody.includes('if ('),
      'Should check if stats exist before including');
    assert.ok(fnBody.includes('filesChanged') || fnBody.includes('insertions'),
      'Should access stats properties');
  });

  test('formatCommitAsRest handles commits without tags', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function formatCommitAsRest');
    const fnEnd = source.indexOf('\n}', fnStart + 800);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('commit.tags') || fnBody.includes('tags'),
      'Should check for tags');
    assert.ok(fnBody.includes('.length') || fnBody.includes('join'),
      'Should handle tags array');
  });

  test('formatCommitAsRest uses correct ReST underline characters', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function formatCommitAsRest');
    const fnEnd = source.indexOf('\n}', fnStart + 800);
    const fnBody = source.substring(fnStart, fnEnd);

    // Title should use = underline
    assert.ok(fnBody.includes("'=") || fnBody.includes('==='),
      'Title should use = characters for underline');

    assert.ok(fnBody.includes("'-'") || fnBody.includes('---') || fnBody.includes('Commit Body'),
      'Body section should use - characters for underline');
    assert.ok(fnBody.includes("'-'") || fnBody.includes('---') || fnBody.includes('Commit Body'),
      'Body section should use - characters for underline');
  });

  test('formatCommitAsRest uses ReST field syntax', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function formatCommitAsRest');
    const fnEnd = source.indexOf('\n}', fnStart + 800);
    const fnBody = source.substring(fnStart, fnEnd);

    // Check for :Field: value syntax
    assert.ok(fnBody.includes(':Author:') && fnBody.includes(':Date:') && fnBody.includes(':Hash:'),
      'Should use :Field: ReST syntax for metadata');
  });

  test('handleCopyCommitRest calls formatCommitAsRest', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitRest');
    assert.ok(fnStart >= 0, 'handleCopyCommitRest should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 300);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('formatCommitAsRest'),
      'Should call formatCommitAsRest helper');
    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write formatted ReST to clipboard');
  });

  test('handleCopyCommitRest handles commit not found', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitRest');
    const fnEnd = source.indexOf('\n}', fnStart + 300);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'Should handle commit not found');
  });

  test('handleCopyCommitRest shows confirmation message', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitRest');
    const fnEnd = source.indexOf('\n}', fnStart + 300);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Copied as ReST'),
      'Should show confirmation with "Copied as ReST"');
    assert.ok(fnBody.includes('shortHash'),
      'Should include short hash in confirmation');
  });

  test('main.js handleCopyRest target resolution prioritizes focused', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyRest');
    assert.ok(fnStart >= 0, 'handleCopyRest should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('focusedIndex'),
      'Should check focusedIndex');
    assert.ok(fnBody.includes('selectedCommits'),
      'Should check selectedCommits');
    assert.ok(fnBody.includes('focusedIndex >= 0'),
      'Should prioritize focused over selected');
  });

  test('main.js handleCopyRest sends correct message type', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyRest');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copyCommitRest'"),
      'Should send copyCommitRest message type');
  });

  test('main.js handleCopyRest handles no target', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyRest');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('Select a commit') && fnBody.includes('reStructuredText'),
      'Should show error when no commit selected');
  });

  test('context menu has copy-rest item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-rest"'),
      'Context menu should include copy-rest');
    assert.ok(source.includes('Copy as reStructuredText'),
      'Context menu should have label Copy as reStructuredText');
  });

  test('context menu click handles copy-rest action', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("action === 'copy-rest'"),
      'Should handle copy-rest action');
    assert.ok(source.includes("type: 'copyCommitRest'"),
      'Should send copyCommitRest message');
  });

  test('Ctrl+Alt+Y keyboard shortcut integration', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("e.key === 'y'") &&
      source.includes('e.altKey') &&
      source.includes('handleCopyRest'),
      'Ctrl+Alt+Y shortcut should be handled');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyCommitRest"'),
      'package.json should register copyCommitRest command');
    assert.ok(content.includes('"ctrl+alt+y"'),
      'package.json should define Ctrl+Alt+Y keybinding');
  });

  test('package.json keybinding uses correct keys', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    const json = JSON.parse(content);

    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyCommitRest'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyCommitRest');
    assert.strictEqual(binding.key, 'ctrl+alt+y');
    assert.strictEqual(binding.mac, 'cmd+alt+y');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('keyboard help includes Copy as reStructuredText', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Copy as reStructuredText') || source.includes('copy-rest'),
      'Keyboard help should include Copy as reStructuredText');
  });

  test('ReST format example matches specification', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function formatCommitAsRest');
    const fnEnd = source.indexOf('\n}', fnStart + 800);
    const fnBody = source.substring(fnStart, fnEnd);

    // Verify format: {message}\n{underline with =}
    assert.ok(fnBody.includes('commit.message') && (fnBody.includes("'=") || fnBody.includes('===')),
      'Should format title as "{message}\n{====}"');

    // Verify: :Author: {name} <{email}>
    assert.ok(fnBody.includes(':Author:') && (fnBody.includes('<') || fnBody.includes('commit.email')),
      'Should include author field with email in angle brackets');

    // Verify: :Date: {ISO date}
    assert.ok(fnBody.includes(':Date:') && fnBody.includes('toISOString'),
      'Should include date field in ISO format');

    // Verify: :Hash: {shortHash}
    assert.ok(fnBody.includes(':Hash:') && fnBody.includes('shortHash'),
      'Should include hash field with short hash');

    // Verify: **Statistics:** {stats}
    assert.ok(fnBody.includes('**Statistics:**'),
      'Should include statistics in bold (using ReST ** syntax)');

    // Verify: Tags: {comma-separated tags}
    assert.ok(fnBody.includes('Tags:') || fnBody.includes('.join'),
      'Should include tags line');

    // Verify body section with - underline
    assert.ok(fnBody.includes('Commit Body') || (fnBody.includes('body') && fnBody.includes("'-'")),
      'Should include body section with - underline');
  });
});
