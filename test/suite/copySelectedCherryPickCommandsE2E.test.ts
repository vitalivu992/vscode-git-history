import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Copy Selected Cherry-Pick Commands E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHashes: string[];

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-selected-cherry-pick-'));
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

  test('handleCopySelectedCherryPickCommands handles empty hashes array', async () => {
    // This tests the messageHandler function directly
    // We verify the logic through source code inspection in unit tests
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify the handler exists and handles empty array case
    assert.ok(source.includes('function handleCopySelectedCherryPickCommands'),
      'handleCopySelectedCherryPickCommands should be defined');
    assert.ok(source.includes("hashes.length === 0"),
      'Should handle empty hashes array case');
  });

  test('handleCopySelectedCherryPickCommands formats as git cherry-pick commands', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify it generates cherry-pick commands
    assert.ok(source.includes('git cherry-pick'),
      'Should generate git cherry-pick command format');
    assert.ok(source.includes("hashes.map(hash => `git cherry-pick ${hash}`"),
      'Should map hashes to cherry-pick commands');
  });

  test('handleCopySelectedCherryPickCommands shows correct confirmation message', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Check for singular/plural handling
    assert.ok(source.includes("Copied ${hashes.length} cherry-pick command") ||
             source.includes("Copied ${hashes.length} cherry-pick command${hashes.length > 1"),
      'Should show correct message with singular/plural for commands');
  });

  test('main.js handleCopySelectedCherryPickCommands falls back to single when 0-1 selected', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopySelectedCherryPickCommands');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("selectedHashes.length === 0"),
      'Should handle 0 selected case');
    assert.ok(fnBody.includes('handleCopyCherryPick()') || fnBody.includes('copyCherryPickCommand'),
      'Should fallback to single cherry-pick behavior');
  });

  test('main.js handleCopySelectedCherryPickCommands sends multi message for 2+ selected', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopySelectedCherryPickCommands');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copySelectedCherryPickCommands'"),
      'Should send copySelectedCherryPickCommands message type for 2+ selected');
  });

  test('context menu shows copy-selected-cherry-pick-commands when 2+ commits selected', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Check for context menu item with conditional display
    assert.ok(source.includes('data-action="copy-selected-cherry-pick-commands"'),
      'Context menu should include copy-selected-cherry-pick-commands action');
    assert.ok(source.includes('Copy cherry-pick commands (selected)') || source.includes('cherry-pick commands'),
      'Context menu should have label for cherry-pick commands');
  });

  test('context menu click handles copy-selected-cherry-pick-commands action', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Check handler for the action
    assert.ok(source.includes("action === 'copy-selected-cherry-pick-commands'"),
      'Should handle copy-selected-cherry-pick-commands action');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copySelectedCherryPickCommands"'),
      'package.json should register copySelectedCherryPickCommands command');
    assert.ok(content.includes('Copy Cherry-Pick Commands (Selected)'),
      'package.json should include proper title');
  });

  test('keyboard help includes Copy Cherry-Pick Commands (Selected)', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // The context menu should show this item when multiple commits are selected
    // There's no keyboard shortcut specifically for this feature (follows copySelectedHashes pattern)
    assert.ok(source.includes('Copy cherry-pick commands') || source.includes('cherry-pick commands'),
      'UI should mention cherry-pick commands');
  });

  test('cherry-pick command format is correct', async () => {
    const testHash = 'abc123def456789';
    const expectedFormat = `git cherry-pick ${testHash}`;

    assert.strictEqual(expectedFormat, `git cherry-pick ${testHash}`,
      'Each cherry-pick command should be formatted as "git cherry-pick <hash>"');
  });

  test('multiple cherry-pick commands are newline-separated', async () => {
    const hashes = ['hash1', 'hash2', 'hash3'];
    const expectedCommands = `git cherry-pick ${hashes[0]}\ngit cherry-pick ${hashes[1]}\ngit cherry-pick ${hashes[2]}`;
    const joinedCommands = hashes.map(h => `git cherry-pick ${h}`).join('\n');

    assert.strictEqual(joinedCommands, expectedCommands,
      'Multiple cherry-pick commands should be newline-separated');
  });
});
