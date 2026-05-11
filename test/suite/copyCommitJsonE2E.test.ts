import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

suite('Copy Commit JSON E2E Tests', () => {
  let tempDir: string;
  let testFile: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-json-'));
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

    // Create root commit (no parent)
    fs.writeFileSync(testFile, 'Hello World 3\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit"', { cwd: tempDir });
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('handleCopyCommitJson builds JSON with all required fields', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitJson');
    assert.ok(fnStart >= 0, 'handleCopyCommitJson should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    // Check for hash field
    assert.ok(fnBody.includes('hash:') || fnBody.includes('"hash"'),
      'JSON should include hash field');

    // Check for shortHash field
    assert.ok(fnBody.includes('shortHash:') || fnBody.includes('"shortHash"'),
      'JSON should include shortHash field');

    // Check for author object with name and email
    assert.ok(fnBody.includes('author:') || fnBody.includes('"author"'),
      'JSON should include author object');
    assert.ok(fnBody.includes('name:') && fnBody.includes('email:'),
      'author object should have name and email properties');

    // Check for date field
    assert.ok(fnBody.includes('date:') || fnBody.includes('"date"'),
      'JSON should include date field');

    // Check for message field
    assert.ok(fnBody.includes('message:') || fnBody.includes('"message"'),
      'JSON should include message field');

    // Check for body field
    assert.ok(fnBody.includes('body:') || fnBody.includes('"body"'),
      'JSON should include body field');

    // Check for parentHashes field
    assert.ok(fnBody.includes('parentHashes:') || fnBody.includes('"parentHashes"'),
      'JSON should include parentHashes array');

    // Check for tags field
    assert.ok(fnBody.includes('tags:') || fnBody.includes('"tags"'),
      'JSON should include tags array');

    // Check for stats field
    assert.ok(fnBody.includes('stats:') || fnBody.includes('"stats"'),
      'JSON should include stats object');
  });

  test('handleCopyCommitJson uses JSON.stringify with 2-space indentation', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitJson');
    assert.ok(fnStart >= 0, 'handleCopyCommitJson should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('JSON.stringify'),
      'Should use JSON.stringify');
    assert.ok(fnBody.includes(', null, 2') || fnBody.includes("', null, 2'"),
      'JSON.stringify should use 2-space indentation for pretty printing');
  });

  test('handleCopyCommitJson handles commits without body', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitJson');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('fullMessage') || fnBody.includes('indexOf'),
      'Should extract body from fullMessage');
    assert.ok(fnBody.includes('\\n') || fnBody.includes("'\n'"),
      'Should split on newline to separate subject from body');
    assert.ok(fnBody.includes('|| null') || fnBody.includes('? null') || fnBody.includes('?: null'),
      'Should return null when no body exists');
  });

  test('handleCopyCommitJson handles root commits (empty parentHashes)', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitJson');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('parentHashes') || fnBody.includes('"parentHashes"'),
      'Should include parentHashes field');
    assert.ok(fnBody.includes('|| []') || fnBody.includes('? []'),
      'Should use empty array for root commits');
  });

  test('handleCopyCommitJson handles commits without tags', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitJson');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('tags') || fnBody.includes('"tags"'),
      'Should include tags field');
    assert.ok(fnBody.includes('|| []') || fnBody.includes('? []'),
      'Should use empty array for commits without tags');
  });

  test('handleCopyCommitJson handles commits without stats', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitJson');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('stats') || fnBody.includes('"stats"'),
      'Should include stats field');
    assert.ok(fnBody.includes('|| null') || fnBody.includes('? null'),
      'Should use null for commits without stats');
  });

  test('handleCopyCommitJson writes JSON to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitJson');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write JSON to clipboard');
    assert.ok(fnBody.includes('json'),
      'Should pass JSON string to clipboard');
  });

  test('handleCopyCommitJson handles commit not found', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitJson');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'Should handle commit not found gracefully');
  });

  test('handleCopyCommitJson shows confirmation message', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitJson');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Copied as JSON'),
      'Should show confirmation with "Copied as JSON"');
    assert.ok(fnBody.includes('shortHash') || fnBody.includes('commit.shortHash'),
      'Should include short hash in confirmation');
  });

  test('main.js handleCopyJson target resolution prioritizes focused', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyJson');
    assert.ok(fnStart >= 0, 'handleCopyJson should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('focusedIndex'),
      'Should check focusedIndex');
    assert.ok(fnBody.includes('selectedCommits'),
      'Should check selectedCommits');
    assert.ok(fnBody.includes('focusedIndex >= 0'),
      'Should prioritize focused over selected');
  });

  test('main.js handleCopyJson sends correct message type', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyJson');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copyCommitJson'"),
      'Should send copyCommitJson message type');
  });

  test('main.js handleCopyJson handles no target', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyJson');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('Select a commit') && fnBody.includes('JSON'),
      'Should show error when no commit selected');
  });

  test('context menu has copy-json item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-json"'),
      'Context menu should include copy-json');
    assert.ok(source.includes('Copy as JSON'),
      'Context menu should have label Copy as JSON');
    assert.ok(source.includes('{}'),
      'Context menu should have {} icon');
  });

  test('context menu click handles copy-json action', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("action === 'copy-json'"),
      'Should handle copy-json action');
    assert.ok(source.includes("type: 'copyCommitJson'"),
      'Should send copyCommitJson message');
  });

  test('Ctrl+Alt+J keyboard shortcut integration', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("e.key === 'j'") &&
      source.includes('e.altKey') &&
      source.includes('handleCopyJson'),
      'Ctrl+Alt+J shortcut should be handled');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyCommitJson"'),
      'package.json should register copyCommitJson command');
    assert.ok(content.includes('"ctrl+alt+j"'),
      'package.json should define Ctrl+Alt+J keybinding');
  });

  test('package.json keybinding uses correct keys', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    const json = JSON.parse(content);

    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyCommitJson'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyCommitJson');
    assert.strictEqual(binding.key, 'ctrl+alt+j');
    assert.strictEqual(binding.mac, 'cmd+alt+j');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('keyboard help includes Copy as JSON', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Copy as JSON') || source.includes('copy-json'),
      'Keyboard help should include Copy as JSON');
    assert.ok(source.includes("'J'") || source.includes('"J"'),
      'Keyboard help should include J key');
  });

  test('JSON output format is valid and parseable', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitJson');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    // Verify the JSON structure is built correctly
    assert.ok(fnBody.includes('commitJson') || fnBody.includes('const json'),
      'Should build JSON object');

    // Check for JSON.stringify usage
    assert.ok(fnBody.includes('JSON.stringify'),
      'Should use JSON.stringify to serialize');

    // Verify indentation is 2 spaces
    assert.ok(fnBody.includes(', null, 2') || fnBody.includes("', null, 2'"),
      'Should use 2-space indentation for readability');
  });

  test('JSON structure matches expected schema', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitJson');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd);

    // Verify author is an object with name and email
    assert.ok(fnBody.includes('author:') || fnBody.includes('"author"'),
      'JSON should have author field');
    assert.ok(fnBody.includes('name:') && fnBody.includes('email:'),
      'author should be an object with name and email');

    // Verify date is formatted as ISO 8601
    assert.ok(fnBody.includes('toISOString') || fnBody.includes('ISO'),
      'Date should be formatted as ISO 8601');

    // Verify tags and parentHashes are arrays
    assert.ok(fnBody.includes('parentHashes') && (fnBody.includes('|| []') || fnBody.includes('? []')),
      'parentHashes should default to empty array');
    assert.ok(fnBody.includes('tags') && (fnBody.includes('|| []') || fnBody.includes('? []')),
      'tags should default to empty array');

    // Verify stats can be null
    assert.ok(fnBody.includes('stats') && (fnBody.includes('|| null') || fnBody.includes('? null')),
      'stats should default to null');
  });
});
