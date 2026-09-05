import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

suite('Copy Range Diff Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const usagePath = path.resolve(__dirname, '../../../USAGE.md');
  let tempDir: string;
  let firstHash: string;
  let lastHash: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-range-diff-'));
    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    fs.writeFileSync(path.join(tempDir, 'file.txt'), 'one\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "first"', { cwd: tempDir });
    firstHash = execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim();

    fs.writeFileSync(path.join(tempDir, 'file.txt'), 'one\ntwo\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "second"', { cwd: tempDir });
    lastHash = execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim();
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('getCommitRangeDiff produces the diff between two commits', async () => {
    const { getCommitRangeDiff } = await import('../../src/git/gitService');
    const result = await getCommitRangeDiff(firstHash, lastHash, tempDir);
    assert.strictEqual(result.isBinary, false);
    assert.ok(result.diff.includes('+two'), 'Range diff should contain the added line');
  });

  test('types.ts should have copyRangeDiff in WebviewAction and WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copyRangeDiff'"),
      'types.ts should have copyRangeDiff type');
    assert.ok(source.includes("type: 'copyRangeDiff'; fromHash: string; toHash: string"),
      'copyRangeDiff message should carry fromHash and toHash');
  });

  test('messageHandler.ts should handle copyRangeDiff case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyRangeDiff':"),
      'messageHandler.ts should handle copyRangeDiff case');
    assert.ok(source.includes('function handleCopyRangeDiff'),
      'messageHandler.ts should have handleCopyRangeDiff function');
  });

  test('handleCopyRangeDiff should reuse getCommitRangeDiff and write to clipboard', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyRangeDiff');
    assert.ok(fnStart >= 0, 'handleCopyRangeDiff function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('getCommitRangeDiff'),
      'handleCopyRangeDiff should reuse getCommitRangeDiff');
    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'handleCopyRangeDiff should write to clipboard');
    assert.ok(fnBody.includes('binary'),
      'handleCopyRangeDiff should reject binary diffs');
  });

  test('main.js should have handleCopyRangeDiff using the range selection endpoints', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function handleCopyRangeDiff');
    assert.ok(fnStart >= 0, 'handleCopyRangeDiff function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('rangeSelectionAnchor') && fnBody.includes('rangeSelectionTarget'),
      'handleCopyRangeDiff should use the Shift+click range endpoints');
    assert.ok(fnBody.includes('selectedCommits.size === 2'),
      'handleCopyRangeDiff should fall back to two selected commits');
    assert.ok(source.includes("type: 'copyRangeDiff'"),
      'main.js should send copyRangeDiff message');
  });

  test('main.js should handle Ctrl+Shift+Alt+R before the Ctrl+Shift+R refresh handler', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const kdStart = source.indexOf('function handleKeyDown');
    const rangePos = source.indexOf("e.shiftKey && e.altKey && e.key === 'r'", kdStart);
    const refreshPos = source.indexOf("e.shiftKey && e.key === 'r'", kdStart);
    assert.ok(rangePos >= 0, 'Ctrl+Shift+Alt+R handler should exist');
    assert.ok(rangePos < refreshPos,
      'Ctrl+Shift+Alt+R handler must precede the refresh handler (which has no !altKey guard)');
  });

  test('main.js triggerAction should dispatch copyRangeDiff', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyRangeDiff': handleCopyRangeDiff()"),
      'main.js triggerAction should dispatch copyRangeDiff');
  });

  test('package.json should register copyRangeDiff command and keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const command = json.contributes.commands.find((c: any) => c.command === 'gitHistory.copyRangeDiff');
    assert.ok(command, 'Should declare gitHistory.copyRangeDiff command');
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyRangeDiff'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyRangeDiff');
    assert.strictEqual(binding.key, 'ctrl+shift+alt+r');
    assert.strictEqual(binding.mac, 'cmd+shift+alt+r');
    assert.strictEqual(binding.when, 'activeWebviewViewId == gitHistory.webview');
  });

  test('extension.ts should register copyRangeDiff webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'copyRangeDiff'"),
      'extension.ts should register copyRangeDiff webview action');
  });

  test('CLAUDE.md should document Copy Range Diff feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Copy Range Diff'),
      'CLAUDE.md should document Copy Range Diff feature');
  });

  test('USAGE.md should document the copy range diff shortcut', () => {
    const source = fs.readFileSync(usagePath, 'utf-8');
    assert.ok(source.includes('Ctrl+Shift+Alt+R') && source.toLowerCase().includes('range diff'),
      'USAGE.md should document Ctrl+Shift+Alt+R copy range diff');
  });
});
