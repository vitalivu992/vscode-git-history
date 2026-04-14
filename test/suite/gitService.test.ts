import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { getFileHistory, getSelectionHistory, getCommitDiff, getCombinedDiff, getCommitFiles, getGitRoot, getCurrentBranch, getFileContentAtCommit } from '../../src/git/gitService';

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

  test('getCommitDiff with filePath should return diff for only that file', async () => {
    const { execSync } = require('child_process');

    // Create a second file and commit touching both files
    const testFile2 = path.join(tempDir, 'test2.txt');
    fs.writeFileSync(testFile2, 'File 2 content\n');
    fs.writeFileSync(testFile, 'Line 1\nLine 2 modified\nLine 3\nLine 4\nLine 5\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Modify test.txt and add test2.txt"', { cwd: tempDir });

    const commits = await getFileHistory(testFile, tempDir);
    const latestHash = commits[0].hash;

    // File-scoped diff should only contain the specified file
    const fileDiff = await getCommitDiff(latestHash, tempDir, testFile);
    assert.ok(fileDiff.diff.includes('test.txt'), 'File-scoped diff should include test.txt');
    assert.ok(!fileDiff.diff.includes('test2.txt'), 'File-scoped diff should not include test2.txt');

    // Full commit diff should contain both files
    const fullDiff = await getCommitDiff(latestHash, tempDir);
    assert.ok(fullDiff.diff.includes('test.txt'), 'Full diff should include test.txt');
    assert.ok(fullDiff.diff.includes('test2.txt'), 'Full diff should include test2.txt');
  });

  test('getCommitDiff with relative filePath should work correctly', async () => {
    const commits = await getFileHistory(testFile, tempDir);
    const latestHash = commits[0].hash;

    // Use a relative path (as returned by parseNameStatus / git --name-status)
    const relPath = 'test.txt';
    const diffResult = await getCommitDiff(latestHash, tempDir, relPath);
    assert.ok(diffResult.diff.includes('test.txt'), 'Diff with relative path should include filename');
  });

  test('getSelectionHistory should return commits for line selection', async () => {
    const history = await getSelectionHistory(testFile, 2, 2, tempDir);

    assert.ok(Array.isArray(history));
    // Line 2 has been modified, so there should be at least one commit
    assert.ok(history.length >= 1);
  });

  test('getFileHistory commits should include email field for search', async () => {
    const commits = await getFileHistory(testFile, tempDir);

    assert.ok(commits.length > 0);
    for (const commit of commits) {
      assert.ok(commit.email, 'Each commit should have an email field');
      assert.ok(typeof commit.email === 'string', 'Email should be a string');
    }
  });

  test('getFileHistory commits should include tags field when tags exist', async () => {
    const { execSync } = require('child_process');
    const commits = await getFileHistory(testFile, tempDir);

    // Tag the latest commit
    execSync('git tag v-test-tag ' + commits[0].hash, { cwd: tempDir });

    const commitsAfterTag = await getFileHistory(testFile, tempDir);
    const tagged = commitsAfterTag.find(c => c.hash === commits[0].hash);

    assert.ok(tagged, 'Tagged commit should be found');
    assert.ok(Array.isArray(tagged.tags), 'Tags should be an array');
    assert.ok(tagged.tags!.includes('v-test-tag'), 'Tag should include v-test-tag');

    // Clean up tag
    execSync('git tag -d v-test-tag', { cwd: tempDir });
  });

  test('getCurrentBranch should return the current branch name', async () => {
    const branch = await getCurrentBranch(tempDir);

    assert.ok(typeof branch === 'string', 'Branch should be a string');
    assert.ok(branch.length > 0, 'Branch name should not be empty');
    // Default branch in test repo is 'main' or 'master' depending on git version
    assert.ok(branch === 'main' || branch === 'master', 'Should be on main or master branch');
  });

  test('getCurrentBranch should handle detached HEAD state', async () => {
    const { execSync } = require('child_process');
    const commits = await getFileHistory(testFile, tempDir);

    // Create a detached HEAD state by checking out a specific commit
    execSync(`git checkout ${commits[0].hash}`, { cwd: tempDir });

    try {
      const branch = await getCurrentBranch(tempDir);
      // In detached HEAD state, git rev-parse --abbrev-ref HEAD returns "HEAD"
      assert.strictEqual(branch, 'HEAD', 'Should return HEAD in detached state');
    } finally {
      // Return to main branch
      execSync('git checkout -', { cwd: tempDir });
    }
  });

  test('getFileContentAtCommit should return file content at specific commit', async () => {
    const commits = await getFileHistory(testFile, tempDir);
    assert.ok(commits.length >= 3, 'Should have at least 3 commits');

    // Get the oldest commit (last in array since commits are newest-first)
    const oldestCommit = commits[commits.length - 1];
    assert.strictEqual(oldestCommit.message, 'Initial commit', 'Oldest commit should be "Initial commit"');

    // Get file content at the oldest commit
    const content = await getFileContentAtCommit(testFile, oldestCommit.hash, tempDir);

    // The initial commit had: 'Line 1\nLine 2\nLine 3\n'
    assert.ok(content.includes('Line 1'), 'Content should include Line 1');
    assert.ok(content.includes('Line 2'), 'Content should include Line 2');
    assert.ok(content.includes('Line 3'), 'Content should include Line 3');
    assert.ok(!content.includes('Line 4'), 'Content should not include Line 4 (added later)');
  });

  test('getFileContentAtCommit should return different content for different commits', async () => {
    const commits = await getFileHistory(testFile, tempDir);
    assert.ok(commits.length >= 2, 'Should have at least 2 commits');

    // Get content from newest and oldest commits
    const newestContent = await getFileContentAtCommit(testFile, commits[0].hash, tempDir);
    const oldestContent = await getFileContentAtCommit(testFile, commits[commits.length - 1].hash, tempDir);

    // The content should be different
    assert.notStrictEqual(newestContent, oldestContent, 'Content should differ between commits');

    // Newer content should have more lines (line 4 was added in a later commit)
    assert.ok(newestContent.includes('Line 4') || newestContent.split('\n').length >= 4,
      'Newer content should have more lines');
  });
});
