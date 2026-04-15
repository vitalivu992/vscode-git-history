import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Simulates the complete range diff flow
function simulateRangeDiffFlow(
  commits: { hash: string; shortHash: string; message: string }[],
  anchorIndex: number,
  targetIndex: number
): { fromHash: string; toHash: string; selectedCount: number } {
  const orderedCommits = [...commits];
  const startIndex = Math.min(anchorIndex, targetIndex);
  const endIndex = Math.max(anchorIndex, targetIndex);

  const fromHash = orderedCommits[startIndex].hash;
  const toHash = orderedCommits[endIndex].hash;
  const selectedCount = endIndex - startIndex + 1;

  return { fromHash, toHash, selectedCount };
}

function simulateShiftClickOnCommitRow(
  event: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean },
  anchorHash: string | null,
  clickedHash: string
): { action: 'range' | 'toggle' | 'single' | 'none'; anchor: string | null } {
  if (event.shiftKey && anchorHash && anchorHash !== clickedHash) {
    return { action: 'range', anchor: anchorHash };
  }

  if (event.ctrlKey || event.metaKey) {
    return { action: 'toggle', anchor: clickedHash };
  }

  return { action: 'single', anchor: clickedHash };
}

suite('Range Diff E2E Logic Tests', () => {
  const testCommits = [
    { hash: 'dddddddddddddddddddddddddddddddddddddddd', shortHash: 'ddddddd', message: 'Latest commit' },
    { hash: 'cccccccccccccccccccccccccccccccccccccccc', shortHash: 'ccccccc', message: 'Third commit' },
    { hash: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', shortHash: 'bbbbbbb', message: 'Second commit' },
    { hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', shortHash: 'aaaaaaa', message: 'Initial commit' }
  ];

  test('simulateRangeDiffFlow selects correct range', () => {
    const result = simulateRangeDiffFlow(testCommits, 0, 2);

    assert.strictEqual(result.fromHash, testCommits[2].hash);
    assert.strictEqual(result.toHash, testCommits[0].hash);
    assert.strictEqual(result.selectedCount, 3);
  });

  test('simulateRangeDiffFlow works in reverse direction', () => {
    const forward = simulateRangeDiffFlow(testCommits, 3, 1);
    const reverse = simulateRangeDiffFlow(testCommits, 1, 3);

    assert.strictEqual(forward.fromHash, reverse.fromHash);
    assert.strictEqual(forward.toHash, reverse.toHash);
    assert.strictEqual(forward.selectedCount, reverse.selectedCount);
    assert.strictEqual(forward.selectedCount, 3);
  });

  test('simulateShiftClickOnCommitRow detects range selection with Shift', () => {
    const anchorHash = testCommits[0].hash;
    const clickedHash = testCommits[2].hash;

    const result = simulateShiftClickOnCommitRow(
      { shiftKey: true, ctrlKey: false, metaKey: false },
      anchorHash,
      clickedHash
    );

    assert.strictEqual(result.action, 'range');
    assert.strictEqual(result.anchor, anchorHash);
  });

  test('simulateShiftClickOnCommitRow falls back to single without anchor', () => {
    const clickedHash = testCommits[0].hash;

    const result = simulateShiftClickOnCommitRow(
      { shiftKey: true, ctrlKey: false, metaKey: false },
      null,
      clickedHash
    );

    assert.strictEqual(result.action, 'single');
    assert.strictEqual(result.anchor, clickedHash);
  });

  test('simulateShiftClickOnCommitRow detects multi-select with Ctrl', () => {
    const clickedHash = testCommits[1].hash;

    const result = simulateShiftClickOnCommitRow(
      { shiftKey: false, ctrlKey: true, metaKey: false },
      null,
      clickedHash
    );

    assert.strictEqual(result.action, 'toggle');
    assert.strictEqual(result.anchor, clickedHash);
  });

  test('simulateShiftClickOnCommitRow detects multi-select with Meta (Cmd)', () => {
    const clickedHash = testCommits[1].hash;

    const result = simulateShiftClickOnCommitRow(
      { shiftKey: false, ctrlKey: false, metaKey: true },
      null,
      clickedHash
    );

    assert.strictEqual(result.action, 'toggle');
    assert.strictEqual(result.anchor, clickedHash);
  });

  test('simulateShiftClickOnCommitRow defaults to single select', () => {
    const clickedHash = testCommits[0].hash;

    const result = simulateShiftClickOnCommitRow(
      { shiftKey: false, ctrlKey: false, metaKey: false },
      null,
      clickedHash
    );

    assert.strictEqual(result.action, 'single');
    assert.strictEqual(result.anchor, clickedHash);
  });

  test('range selection includes both endpoints', () => {
    const result = simulateRangeDiffFlow(testCommits, 0, 3);

    assert.strictEqual(result.selectedCount, 4);
    assert.strictEqual(result.fromHash, testCommits[3].hash); // Oldest
    assert.strictEqual(result.toHash, testCommits[0].hash);   // Newest
  });

  test('single commit range has count of 1', () => {
    const result = simulateRangeDiffFlow(testCommits, 1, 1);

    assert.strictEqual(result.selectedCount, 1);
    assert.strictEqual(result.fromHash, testCommits[1].hash);
    assert.strictEqual(result.toHash, testCommits[1].hash);
  });
});

suite('Range Diff E2E Source Integration Tests', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const servicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');

  test('complete flow: all components support range diff', () => {
    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');
    const handlerSource = fs.readFileSync(handlerPath, 'utf-8');
    const serviceSource = fs.readFileSync(servicePath, 'utf-8');
    const typesSource = fs.readFileSync(typesPath, 'utf-8');

    // UI layer
    assert.ok(mainSource.includes('handleRangeSelection'), 'main.js should have range selection handler');
    assert.ok(mainSource.includes('requestRangeDiff'), 'main.js should request range diff');
    assert.ok(mainSource.includes('rangeSelectionAnchor'), 'main.js should track anchor');

    // Message handler layer
    assert.ok(handlerSource.includes('handleRequestRangeDiff'), 'messageHandler should have handler');
    assert.ok(handlerSource.includes('getCommitRangeDiff'), 'messageHandler should call git service');

    // Git service layer
    assert.ok(serviceSource.includes('getCommitRangeDiff'), 'gitService should have range diff function');

    // Types layer
    assert.ok(typesSource.includes('requestRangeDiff'), 'types should define request message');
    assert.ok(typesSource.includes('rangeDiff'), 'types should define response message');
  });

  test('shift-click and shift-enter both trigger range selection', () => {
    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');

    // Check click handler
    assert.ok(mainSource.includes("e.shiftKey") && mainSource.includes('handleRangeSelection'),
      'Click handler should support shift+click');

    // Check keyboard handler
    const keyDownStart = mainSource.indexOf('function handleKeyDown');
    const keyDownEnd = mainSource.indexOf('\nfunction', keyDownStart + 1);
    const keyDownBody = mainSource.substring(keyDownStart, keyDownEnd > keyDownStart ? keyDownEnd : undefined);

    assert.ok(keyDownBody.includes('shiftKey') && keyDownBody.includes('handleRangeSelection'),
      'Keyboard handler should support shift+enter for range selection');
  });

  test('range diff uses correct git command format', () => {
    const serviceSource = fs.readFileSync(servicePath, 'utf-8');

    const funcStart = serviceSource.indexOf('export async function getCommitRangeDiff');
    const funcEnd = serviceSource.indexOf('\n}', funcStart) + 2;
    const funcBody = serviceSource.substring(funcStart, funcEnd);

    assert.ok(funcBody.includes("'diff'"), 'Should use git diff command');
    assert.ok(funcBody.includes('fromHash') && funcBody.includes('toHash'),
      'Should reference both from and to hashes');
    assert.ok(funcBody.includes('..'), 'Should use A..B range syntax');
  });

  test('range selection header shows comparison indicator', () => {
    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(mainSource.includes('updateCommitDetailHeaderForRange'),
      'Should have range header update function');
    assert.ok(mainSource.includes('Comparing:') || mainSource.includes('Comparing'),
      'Should show "Comparing" label in header');
  });

  test('styles support range selection visual feedback', () => {
    const stylesSource = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(stylesSource.includes('range-selected') || stylesSource.includes('.selected'),
      'Should have styling for selected/range commits');
  });
});

suite('Range Diff E2E Git Integration Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHashes: string[];

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-range-e2e-'));
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

  test('git service getCommitRangeDiff returns valid diff', async () => {
    const { getCommitRangeDiff } = await import('../../src/git/gitService');

    // Compare commit 1 and commit 4 (should show all changes)
    const result = await getCommitRangeDiff(commitHashes[0], commitHashes[3], tempDir);

    assert.ok(typeof result.diff === 'string', 'Should return a diff string');
    assert.strictEqual(result.isBinary, false, 'Text file should not be binary');
    assert.ok(result.diff.includes('Line 4'), 'Diff should show line 4 addition');
  });

  test('getCommitRangeDiff with file path returns scoped diff', async () => {
    const { getCommitRangeDiff } = await import('../../src/git/gitService');

    const result = await getCommitRangeDiff(commitHashes[0], commitHashes[2], tempDir, testFile);

    assert.ok(result.diff.includes('test.txt'), 'Diff should reference the file');
    assert.ok(result.diff.includes('Line 3'), 'Diff should show line 3 addition');
  });

  test('range diff between adjacent commits shows single change', async () => {
    const { getCommitRangeDiff } = await import('../../src/git/gitService');

    // Between commit 2 and 3
    const result = await getCommitRangeDiff(commitHashes[1], commitHashes[2], tempDir);

    assert.ok(result.diff.length > 0, 'Should have diff content');
    assert.ok(result.diff.includes('Line 3'), 'Should show addition of line 3');
  });

  test('same commit range diff is empty', async () => {
    const { getCommitRangeDiff } = await import('../../src/git/gitService');

    const result = await getCommitRangeDiff(commitHashes[0], commitHashes[0], tempDir);

    assert.strictEqual(result.diff, '', 'Same commit diff should be empty');
  });

  test('file history returns commits in expected order', async () => {
    const { getFileHistory } = await import('../../src/git/gitService');

    const commits = await getFileHistory(testFile, tempDir);

    assert.strictEqual(commits.length, 4, 'Should have 4 commits');
    assert.ok(commits[0].date > commits[3].date, 'First commit should be newest');
  });

  test('commits have valid hashes for range selection', async () => {
    const { getFileHistory } = await import('../../src/git/gitService');

    const commits = await getFileHistory(testFile, tempDir);

    for (const commit of commits) {
      assert.ok(commit.hash.length === 40, 'Hash should be 40 characters');
      assert.ok(/^[a-f0-9]+$/.test(commit.hash), 'Hash should be hexadecimal');
      assert.strictEqual(commit.shortHash.length, 7, 'Short hash should be 7 characters');
    }
  });
});
