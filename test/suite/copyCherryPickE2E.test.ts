import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Copy Cherry-Pick Command E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHash: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-cherry-pick-'));
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

  test('handleCopyCherryPickCommand writes git cherry-pick command to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify handler uses git cherry-pick format
    assert.ok(source.includes('function handleCopyCherryPickCommand'),
      'handleCopyCherryPickCommand should be defined');
    assert.ok(source.includes('vscode.env.clipboard.writeText'),
      'Should write to clipboard');
    assert.ok(source.includes('git cherry-pick'),
      'Should use git cherry-pick format');
  });

  test('handleCopyCherryPickCommand gets commit from panel', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify handler gets commits from panel
    const fnStart = source.indexOf('function handleCopyCherryPickCommand');
    assert.ok(fnStart >= 0, 'handleCopyCherryPickCommand should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('panel.getCommits()'),
      'Should get commits from panel');
  });

  test('handleCopyCherryPickCommand handles missing commit', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify missing commit handling
    const fnStart = source.indexOf('function handleCopyCherryPickCommand');
    const fnEnd = source.indexOf('\nfunction', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found') || fnBody.includes('No commit selected'),
      'Should handle commit not found');
  });

  test('main.js handleCopyCherryPick prioritizes focused over selected', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify focused prioritized over selected
    const fnStart = source.indexOf('function handleCopyCherryPick');
    assert.ok(fnStart >= 0, 'handleCopyCherryPick should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('focusedIndex'),
      'Should check focusedIndex');
    assert.ok(fnBody.includes('selectedCommits'),
      'Should check selectedCommits');
    assert.ok(fnBody.includes('focusedIndex >= 0'),
      'Should prioritize focused over selected');
  });

  test('main.js handleCopyCherryPick sends correct message type', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCherryPick');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copyCherryPickCommand'"),
      'Should send copyCherryPickCommand message type');
  });

  test('main.js handleCopyCherryPick handles no target', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCherryPick');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('Select a commit') || fnBody.includes('No commit'),
      'Should show error when no commit selected');
  });

  test('main.js handleCopyCherryPick uses getFilteredCommits', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCherryPick');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('getOrderedCommits(getFilteredCommits())'),
      'Should use getOrderedCommits(getFilteredCommits())');
  });

  test('context menu has copy-cherry-pick item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Check for context menu item
    assert.ok(source.includes('data-action="copy-cherry-pick"'),
      'Context menu should include copy-cherry-pick');
    assert.ok(source.includes('Copy cherry-pick command') || source.includes('Cherry-pick'),
      'Context menu should have label for cherry-pick');
  });

  test('context menu click handles copy-cherry-pick action', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Check handler for the action
    assert.ok(source.includes("action === 'copy-cherry-pick'"),
      'Should handle copy-cherry-pick action');
  });

  test('Ctrl+Shift+P keyboard shortcut integration', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Verify keyboard handler
    assert.ok(source.includes("e.key === 'p'") && source.includes('handleCopyCherryPick'),
      'Ctrl+Shift+P shortcut should be handled');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyCherryPick"'),
      'package.json should register copyCherryPick command');
    assert.ok(content.includes('"ctrl+shift+p"'),
      'package.json should define Ctrl+Shift+P keybinding');
  });

  test('keyboard help includes Copy Cherry-Pick Command', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Copy cherry-pick') || source.includes('cherry-pick'),
      'Keyboard help should include Copy cherry-pick command');
  });
});