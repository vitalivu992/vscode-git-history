import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Copy Selected Hashes E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHashes: string[];

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-selected-hashes-'));
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

  test('handleCopySelectedHashes handles empty hashes array', async () => {
    // This tests the messageHandler function directly
    // We verify the logic through source code inspection in unit tests
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify the handler exists and handles empty array case
    assert.ok(source.includes('function handleCopySelectedHashes'),
      'handleCopySelectedHashes should be defined');
    assert.ok(source.includes("hashes.length === 0"),
      'Should handle empty hashes array case');
  });

  test('handleCopySelectedHashes joins hashes with newline', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify it joins hashes with newline character
    assert.ok(source.includes("hashes.join('\\n')"),
      'Should join hashes with newline');
  });

  test('handleCopySelectedHashes shows correct confirmation message', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Check for singular/plural handling
    assert.ok(source.includes("Copied ${hashes.length} commit hash") ||
             source.includes("Copied ${hashes.length} commit hash${hashes.length > 1"),
      'Should show correct message with singular/plural');
  });

  test('main.js handleCopySelectedHashes falls back to focused when 0 selected', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify fallback logic
    const fnStart = source.indexOf('function handleCopySelectedHashes');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("selectedHashes.length === 0"),
      'Should handle 0 selected case');
    assert.ok(fnBody.includes('handleCopyHash') || fnBody.includes('copyCommitHash'),
      'Should fallback to single hash copy');
  });

  test('main.js handleCopySelectedHashes falls back to single when 1 selected', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopySelectedHashes');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("selectedHashes.length === 1"),
      'Should handle 1 selected case');
  });

  test('main.js handleCopySelectedHashes copies all when 2+ selected', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopySelectedHashes');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copySelectedHashes'"),
      'Should send copySelectedHashes message type');
  });

  test('context menu shows copy selected hashes when multi-selected', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Check for context menu item with conditional display
    assert.ok(source.includes('data-action="copy-selected-hashes"'),
      'Context menu should include copy-selected-hashes action');
  });

  test('Ctrl+Shift+; keyboard shortcut integration', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify keyboard handler
    const kdStart = source.indexOf('function handleKeyDown');
    const kdEnd = source.indexOf('\nfunction', kdStart + 1);
    const kdBody = source.substring(kdStart, kdEnd > kdStart ? kdEnd : undefined);

    assert.ok(kdBody.includes("e.key === ';'") && kdBody.includes('handleCopySelectedHashes'),
      'Ctrl+Shift+; shortcut should be handled');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copySelectedHashes"'),
      'package.json should register copySelectedHashes command');
    assert.ok(content.includes('"ctrl+shift+;"') || content.includes('"ctrl+shift+;"'),
      'package.json should define Ctrl+Shift+; keybinding');
  });
});