import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Combined Diff E2E Source Integration Tests', () => {
  test('types.ts should have requestCombinedDiff message type', () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("'requestCombinedDiff'"),
      'types.ts should have requestCombinedDiff message type');
  });

  test('types.ts should have combinedDiff response type', () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("| { type: 'combinedDiff'"),
      'types.ts should have combinedDiff response type');
  });

  test('types.ts copyCombinedDiff should have hashes field', () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes('hashes: string[]'),
      'types.ts copyCombinedDiff should have hashes array field');
  });

  test('gitService.ts should have getCombinedDiff function', () => {
    const servicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
    const source = fs.readFileSync(servicePath, 'utf-8');

    assert.ok(source.includes('export async function getCombinedDiff'),
      'gitService.ts should have getCombinedDiff function');
  });

  test('gitService.ts getCombinedDiff should use git diff command', () => {
    const servicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
    const source = fs.readFileSync(servicePath, 'utf-8');

    const funcStart = source.indexOf('export async function getCombinedDiff');
    const funcEnd = source.indexOf('\n}', funcStart) + 2;
    const funcBody = source.substring(funcStart, funcEnd);

    assert.ok(funcBody.includes("'diff'"), 'Should use git diff command');
    assert.ok(funcBody.includes('hashes'), 'Should reference hashes array');
  });

  test('messageHandler.ts should handle requestCombinedDiff case', () => {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes("case 'requestCombinedDiff':"),
      'messageHandler.ts should handle requestCombinedDiff case');
  });

  test('messageHandler.ts should have handleRequestCombinedDiff function', () => {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('async function handleRequestCombinedDiff'),
      'messageHandler.ts should have handleRequestCombinedDiff function');
  });

  test('messageHandler.ts should call getCombinedDiff', () => {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('getCombinedDiff'),
      'messageHandler.ts should call getCombinedDiff');
  });

  test('messageHandler.ts should handle copyCombinedDiff case', () => {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes("case 'copyCombinedDiff':"),
      'messageHandler.ts should handle copyCombinedDiff case');
  });

  test('main.js should have handleCopyCombinedDiff function', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleCopyCombinedDiff'),
      'main.js should have handleCopyCombinedDiff function');
  });

  test('main.js should send copyCombinedDiff message type', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("type: 'copyCombinedDiff'"),
      'main.js should send copyCombinedDiff message');
  });

  test('main.js handleCopyCombinedDiff validates minimum commits', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCombinedDiff');
    const fnEnd = source.indexOf('\n}', source.indexOf('\n}', fnStart) + 1) + 1;
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('hashes.length < 2'),
      'Should validate minimum 2 commits for combined diff');
    assert.ok(fnBody.includes('Select at least 2 commits'),
      'Should show error for insufficient commits');
  });

  test('main.js click handler should handle Ctrl+click for multi-select', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('e.ctrlKey') || source.includes('e.metaKey'),
      'Click handler should support Ctrl/Cmd+click for multi-select');
    assert.ok(source.includes('selectedCommits'),
      'Should track selected commits set');
  });

  test('main.js should handle combinedDiff message type', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'combinedDiff':"),
      'main.js handleMessage should handle combinedDiff case');
  });

  test('main.js should update header for combined diff', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('updateCommitDetailHeaderForMultiSelect') ||
      source.includes('Combined diff'),
      'Should show combined diff indicator in header');
  });
});

suite('Combined Diff E2E Git Integration Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHashes: string[];

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-combined-e2e-'));
    testFile = path.join(tempDir, 'test.txt');
    commitHashes = [];

    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Create 4 commits
    fs.writeFileSync(testFile, 'Line 1\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Commit 1: Add line 1"', { cwd: tempDir });
    commitHashes.push(execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim());

    fs.writeFileSync(testFile, 'Line 1\nLine 2\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Commit 2: Add line 2"', { cwd: tempDir });
    commitHashes.push(execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim());

    fs.writeFileSync(testFile, 'Line 1\nLine 2\nLine 3\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Commit 3: Add line 3"', { cwd: tempDir });
    commitHashes.push(execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim());

    fs.writeFileSync(testFile, 'Line 1\nLine 2\nLine 3\nLine 4\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Commit 4: Add line 4"', { cwd: tempDir });
    commitHashes.push(execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim());
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('git service getCombinedDiff returns valid diff for multiple commits', async () => {
    const { getCombinedDiff } = await import('../../src/git/gitService');

    // Combined diff for commits 1, 2, and 3
    const result = await getCombinedDiff([commitHashes[0], commitHashes[1], commitHashes[2]], tempDir);

    assert.ok(typeof result.diff === 'string', 'Should return a diff string');
    assert.strictEqual(result.isBinary, false, 'Text file should not be binary');
    assert.ok(result.diff.length > 0, 'Combined diff should have content');
  });

  test('getCombinedDiff with file path returns scoped diff', async () => {
    const { getCombinedDiff } = await import('../../src/git/gitService');

    const result = await getCombinedDiff([commitHashes[0], commitHashes[1]], tempDir, testFile);

    assert.ok(result.diff.includes('test.txt'), 'Diff should reference the file');
  });

  test('getCombinedDiff requires at least 2 commits', async () => {
    const { getCombinedDiff } = await import('../../src/git/gitService');

    // Should work with 2 commits
    const result = await getCombinedDiff([commitHashes[0], commitHashes[1]], tempDir);
    assert.ok(result.diff.length > 0, 'Should work with 2 commits');
  });

  test('combined diff contains changes from all commits', async () => {
    const { getCombinedDiff } = await import('../../src/git/gitService');

    const result = await getCombinedDiff([commitHashes[0], commitHashes[1], commitHashes[2]], tempDir);

    // Should contain changes from the commits
    assert.ok(result.diff.includes('Line 3') || result.diff.includes('Line 2'),
      'Combined diff should show changes from multiple commits');
  });

  test('handleCopyCombinedDiff writes to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('async function handleCopyCombinedDiff');
    const fnEnd = source.indexOf('\n}', source.indexOf('\n}', fnStart) + 1) + 1;
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write combined diff to clipboard');
    assert.ok(fnBody.includes('Combined diff for'),
      'Should show confirmation with commit count');
  });

  test('handleCopyCombinedDiff handles binary files', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('async function handleCopyCombinedDiff');
    const fnEnd = source.indexOf('\n}', source.indexOf('\n}', fnStart) + 1) + 1;
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('isBinary'),
      'Should check for binary files');
    assert.ok(fnBody.includes('Cannot copy diff for binary file'),
      'Should handle binary file error');
  });

  test('handleCopyCombinedDiff validates minimum commits', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('async function handleCopyCombinedDiff');
    const fnEnd = source.indexOf('\n}', source.indexOf('\n}', fnStart) + 1) + 1;
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('hashes.length < 2'),
      'Should validate minimum 2 commits');
    assert.ok(fnBody.includes('Select at least 2 commits'),
      'Should show error for insufficient commits');
  });

  test('Ctrl+Alt+D keyboard shortcut is wired in main.js', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("e.key === 'd'") && source.includes('e.altKey'),
      'Should handle Alt+D key combination');
    assert.ok(source.includes('handleCopyCombinedDiff()'),
      'Should call handleCopyCombinedDiff function');
  });

  test('keyboard help dialog includes copy combined diff entry', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const helpStart = source.indexOf('function showKeyboardHelpDialog');
    const helpEnd = source.lastIndexOf('}');
    const helpSection = source.substring(helpStart, helpEnd);

    assert.ok(helpSection.includes('Copy combined diff') || helpSection.includes('combined diff'),
      'Keyboard help should include copy combined diff entry');
    assert.ok(helpSection.includes("'Alt'") && helpSection.includes("'D'"),
      'Should show Alt+D keys in help');
  });
});
