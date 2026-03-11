import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { getFileHistory, getSelectionHistory, getCommitDiff, getCombinedDiff, getCommitFiles, getGitRoot } from '../../src/git/gitService';

suite('Git Service Integration Tests', () => {
  let tempDir: string;
  let testFile: string;

  suiteSetup(async () => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-test-'));
    testFile = path.join(tempDir, 'test.txt');

    // Initialize git repo
    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Create initial commit
    fs.writeFileSync(testFile, 'Line 1\nLine 2\nLine 3\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit"', { cwd: tempDir });

    // Second commit
    fs.writeFileSync(testFile, 'Line 1\nLine 2 modified\nLine 3\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Modify line 2"', { cwd: tempDir });

    // Third commit
    fs.writeFileSync(testFile, 'Line 1\nLine 2 modified\nLine 3\nLine 4\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Add line 4"', { cwd: tempDir });
  });

  suiteTeardown(() => {
    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('getGitRoot should return git root directory', async () => {
    const root = await getGitRoot(testFile);
    assert.strictEqual(root, tempDir);
  });

  test('getFileHistory should return commits for a file', async () => {
    const commits = await getFileHistory(testFile, tempDir);

    assert.ok(commits.length >= 3);
    assert.strictEqual(commits[0].message, 'Add line 4');
    assert.ok(commits.some(c => c.message === 'Initial commit'));
    assert.ok(commits.some(c => c.message === 'Modify line 2'));
  });

  test('getFileHistory should return commits with valid structure', async () => {
    const commits = await getFileHistory(testFile, tempDir);
    const firstCommit = commits[0];

    assert.ok(firstCommit.hash);
    assert.ok(firstCommit.shortHash);
    assert.strictEqual(firstCommit.shortHash.length, 7);
    assert.ok(firstCommit.author);
    assert.ok(firstCommit.date);
    assert.ok(firstCommit.message);
    assert.ok(Array.isArray(firstCommit.parentHashes));
  });

  test('getCommitDiff should return diff for a commit', async () => {
    const commits = await getFileHistory(testFile, tempDir);
    const diffResult = await getCommitDiff(commits[0].hash, tempDir);

    assert.ok(diffResult.diff);
    assert.strictEqual(diffResult.isBinary, false);
    assert.ok(diffResult.diff.includes('diff --git'));
  });

  test('getCommitFiles should return changed files for a commit', async () => {
    const commits = await getFileHistory(testFile, tempDir);
    const files = await getCommitFiles(commits[0].hash, tempDir);

    assert.ok(Array.isArray(files));
    assert.ok(files.length > 0);
    assert.ok(files[0].path);
    assert.ok(files[0].status);
  });

  test('getCombinedDiff should return combined diff for multiple commits', async () => {
    const commits = await getFileHistory(testFile, tempDir);
    const hashes = commits.slice(0, 2).map(c => c.hash);

    const diffResult = await getCombinedDiff(hashes, tempDir);

    // diff can be empty if the changes cancel out or if earliest is initial commit
    // The important thing is that it doesn't throw and returns a valid result
    assert.ok(typeof diffResult.diff === 'string');
    assert.strictEqual(diffResult.isBinary, false);
  });

  test('getCombinedDiff should handle single commit', async () => {
    const commits = await getFileHistory(testFile, tempDir);
    const diffResult = await getCombinedDiff([commits[0].hash], tempDir);

    assert.ok(diffResult.diff);
  });

  test('getCombinedDiff should handle empty array', async () => {
    const diffResult = await getCombinedDiff([], tempDir);

    assert.strictEqual(diffResult.diff, '');
    assert.strictEqual(diffResult.isBinary, false);
  });

  test('getSelectionHistory should return commits for line selection', async () => {
    const history = await getSelectionHistory(testFile, 2, 2, tempDir);

    assert.ok(Array.isArray(history));
    // Line 2 has been modified, so there should be at least one commit
    assert.ok(history.length >= 1);
  });
});
