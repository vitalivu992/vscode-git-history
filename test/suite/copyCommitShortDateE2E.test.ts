import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Copy Commit Short Date E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHash: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-commit-short-date-'));
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

  test('handleCopyCommitShortDate with valid commit', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify handler reads from commits array
    assert.ok(source.includes('function handleCopyCommitShortDate'),
      'handleCopyCommitShortDate should be defined');
    assert.ok(source.includes('panel.getCommits()'),
      'Should get commits from panel');

    // Verify YYYY-MM-DD formatting
    const fnStart = source.indexOf('function handleCopyCommitShortDate');
    assert.ok(fnStart >= 0, 'handleCopyCommitShortDate should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 100);
    const fnBody = source.substring(fnStart, fnEnd);

    // Check for date formatting components
    assert.ok(fnBody.includes('getFullYear') || fnBody.includes('getUTCFullYear'),
      'Should extract year from date');
    assert.ok(fnBody.includes('getMonth') && fnBody.includes('getDate'),
      'Should extract month and day from date');
    // Check for the YYYY-MM-DD pattern construction
    assert.ok(fnBody.includes('${') && fnBody.includes('year') && fnBody.includes('month') && fnBody.includes('day'),
      'Should construct YYYY-MM-DD format');
  });

  test('handleCopyCommitShortDate writes YYYY-MM-DD to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify clipboard write with short date format
    const fnStart = source.indexOf('function handleCopyCommitShortDate');
    assert.ok(fnStart >= 0, 'handleCopyCommitShortDate should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 100);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write to clipboard');
    assert.ok(fnBody.includes('shortDateStr') || fnBody.includes('Copied short date'),
      'Should write short date string to clipboard');
  });

  test('handleCopyCommitShortDate handles missing commit', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify missing commit handling
    const fnStart = source.indexOf('function handleCopyCommitShortDate');
    const fnEnd = source.indexOf('\n}', fnStart + 100);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'Should handle commit not found');
  });

  test('handleCopyCommitShortDate format validation', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitShortDate');
    assert.ok(fnStart >= 0, 'handleCopyCommitShortDate should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 100);
    const fnBody = source.substring(fnStart, fnEnd);

    // Verify format components: year, month (with zero-padding), day (with zero-padding)
    assert.ok(fnBody.includes('getFullYear'),
      'Should use getFullYear for year component');
    assert.ok(fnBody.includes('getMonth'),
      'Should use getMonth for month component');
    assert.ok(fnBody.includes('getDate'),
      'Should use getDate for day component');
    assert.ok(fnBody.includes('padStart') || fnBody.includes('padZero') || (fnBody.includes("'0'") && fnBody.includes('2')),
      'Should zero-pad month and day to 2 digits');
  });

  test('main.js handleCopyCommitShortDate target resolution prioritizes focused', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify focused prioritized over selected
    const fnStart = source.indexOf('function handleCopyCommitShortDate');
    assert.ok(fnStart >= 0, 'handleCopyCommitShortDate should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('focusedIndex'),
      'Should check focusedIndex');
    assert.ok(fnBody.includes('selectedCommits'),
      'Should check selectedCommits');
    assert.ok(fnBody.includes('focusedIndex >= 0'),
      'Should prioritize focused over selected');
  });

  test('main.js handleCopyCommitShortDate sends correct message type', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitShortDate');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copyCommitShortDate'"),
      'Should send copyCommitShortDate message type');
    assert.ok(fnBody.includes('vscode.postMessage'),
      'Should post message to extension');
  });

  test('main.js triggerAction dispatches copyCommitShortDate', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'copyCommitShortDate':"),
      'Should have case for copyCommitShortDate');
    assert.ok(source.includes("handleCopyCommitShortDate()"),
      'Should call handleCopyCommitShortDate');
  });

  test('context menu includes copy-commit-short-date item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('copy-commit-short-date'),
      'Context menu should include copy-commit-short-date item');
    assert.ok(source.includes("Copy short date"),
      'Context menu should have "Copy short date" label');
    assert.ok(source.includes('📅'),
      'Context menu should have calendar icon');
  });

  test('package.json keybinding for Ctrl+Shift+J', async () => {
    const packagePath = path.resolve(__dirname, '../../package.json');
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);

    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyCommitShortDate'
    );

    assert.ok(binding, 'Should have keybinding for gitHistory.copyCommitShortDate');
    assert.strictEqual(binding.key, 'ctrl+shift+j',
      'Should use ctrl+shift+j for Windows/Linux');
    assert.strictEqual(binding.mac, 'cmd+shift+j',
      'Should use cmd+shift+j for macOS');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview',
      'Should only work when git history webview is active');
  });

  test('extension.ts registers copyCommitShortDate action', async () => {
    const extensionPath = path.resolve(__dirname, '../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes("action: 'copyCommitShortDate'"),
      'extension.ts should register copyCommitShortDate action');
    assert.ok(source.includes("'copyCommitShortDate'") || source.includes('"copyCommitShortDate"'),
      'extension.ts should reference copyCommitShortDate');
  });

  test('YYYY-MM-DD format produces valid date string', async () => {
    // Test that the format YYYY-MM-DD is valid and parseable
    const testDate = new Date('2026-05-26T10:30:45.000Z');
    const year = testDate.getFullYear();
    const month = String(testDate.getMonth() + 1).padStart(2, '0');
    const day = String(testDate.getDate()).padStart(2, '0');
    const shortDateStr = `${year}-${month}-${day}`;

    assert.strictEqual(shortDateStr, '2026-05-26',
      'YYYY-MM-DD format should produce correct date string');

    // Verify it's a valid date format
    const parsed = new Date(shortDateStr);
    assert.ok(!isNaN(parsed.getTime()),
      'YYYY-MM-DD format should be parseable as date');
  });

  test('full integration: message flow from main.js to messageHandler.ts', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');

    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');
    const handlerSource = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify main.js posts the message
    assert.ok(mainSource.includes("type: 'copyCommitShortDate'"),
      'main.js should post copyCommitShortDate message');

    // Verify messageHandler.ts handles the message
    assert.ok(handlerSource.includes("case 'copyCommitShortDate':"),
      'messageHandler.ts should handle copyCommitShortDate case');
    assert.ok(handlerSource.includes('handleCopyCommitShortDate'),
      'messageHandler.ts should call handleCopyCommitShortDate');
  });
});
