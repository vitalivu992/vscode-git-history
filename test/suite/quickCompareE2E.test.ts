import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Quick Compare E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHashes: string[];

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-quick-compare-'));
    testFile = path.join(tempDir, 'test.txt');
    commitHashes = [];

    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Create initial commit (root commit - no parent)
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

  test('git service getCommitParentDiff returns valid diff', async () => {
    const { getCommitParentDiff } = await import('../../src/git/gitService');

    // Get diff between commit 2 and its parent (commit 1)
    const result = await getCommitParentDiff(commitHashes[1], tempDir);

    assert.ok(typeof result.diff === 'string', 'Should return a diff string');
    assert.strictEqual(result.isBinary, false, 'Text file should not be binary');
    assert.ok(result.diff.includes('Line 2'), 'Diff should show line 2 addition');
    assert.ok(result.diff.includes('+Line 2'), 'Diff should have addition indicator');
  });

  test('getCommitParentDiff with file path returns scoped diff', async () => {
    const { getCommitParentDiff } = await import('../../src/git/gitService');

    const result = await getCommitParentDiff(commitHashes[2], tempDir, testFile);

    assert.ok(result.diff.includes('test.txt'), 'Diff should reference the file');
    assert.ok(result.diff.includes('Line 3'), 'Diff should show line 3 addition');
  });

  test('quick compare between adjacent commits shows single change', async () => {
    const { getCommitParentDiff } = await import('../../src/git/gitService');

    // Between commit 3 and its parent (commit 2)
    const result = await getCommitParentDiff(commitHashes[2], tempDir);

    assert.ok(result.diff.length > 0, 'Should have diff content');
    assert.ok(result.diff.includes('Line 3'), 'Should show addition of line 3');
    assert.ok(!result.diff.includes('Line 1'), 'Should not show Line 1 (not changed)');
  });

  test('quick compare uses correct git command format', async () => {
    const { getCommitParentDiff } = await import('../../src/git/gitService');

    const result = await getCommitParentDiff(commitHashes[1], tempDir);

    assert.ok(result.diff.includes('diff --git'), 'Should use git diff format');
    assert.ok(result.diff.includes('--- a/'), 'Should have old file indicator');
    assert.ok(result.diff.includes('+++ b/'), 'Should have new file indicator');
  });

  test('file history returns commits with parent hashes', async () => {
    const { getFileHistory } = await import('../../src/git/gitService');

    const commits = await getFileHistory(testFile, tempDir);

    assert.strictEqual(commits.length, 3, 'Should have 3 commits');
    
    // Latest commit should have parent
    assert.ok(commits[0].parentHashes.length > 0, 'Latest commit should have parent');
    assert.strictEqual(commits[0].parentHashes[0], commitHashes[1], 'Parent should be previous commit');
  });

  test('commits have valid structure for quick compare', async () => {
    const { getFileHistory } = await import('../../src/git/gitService');

    const commits = await getFileHistory(testFile, tempDir);

    for (const commit of commits) {
      assert.ok(commit.hash.length === 40, 'Hash should be 40 characters');
      assert.ok(/^[a-f0-9]+$/.test(commit.hash), 'Hash should be hexadecimal');
      assert.ok(commit.parentHashes.length >= 0, 'Should have parentHashes array');
    }
  });

  test('quick compare for different commits returns different diffs', async () => {
    const { getCommitParentDiff } = await import('../../src/git/gitService');

    const diff2 = await getCommitParentDiff(commitHashes[1], tempDir);
    const diff3 = await getCommitParentDiff(commitHashes[2], tempDir);

    // Different commits should have different diffs
    assert.notStrictEqual(diff2.diff, diff3.diff, 'Different commits should have different diffs');
    assert.ok(diff2.diff.includes('Line 2'), 'Diff2 should include line 2');
    assert.ok(diff3.diff.includes('Line 3'), 'Diff3 should include line 3');
  });
});
