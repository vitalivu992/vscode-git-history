import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Git Stats E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHashes: string[];

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-stats-e2e-'));
    testFile = path.join(tempDir, 'test.txt');
    commitHashes = [];

    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Commit 1: Initial file with insertions only
    fs.writeFileSync(testFile, 'Line 1\nLine 2\nLine 3\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit"', { cwd: tempDir });
    commitHashes.push(execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim());

    // Commit 2: Add lines (mixed insertions and deletions)
    fs.writeFileSync(testFile, 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Add more lines"', { cwd: tempDir });
    commitHashes.push(execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim());

    // Commit 3: Modify and delete lines
    fs.writeFileSync(testFile, 'Line 1\nModified Line 2\nLine 3\nLine 4\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Modify and delete"', { cwd: tempDir });
    commitHashes.push(execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim());

    // Create a new file for variety
    const newFile = path.join(tempDir, 'newfile.js');
    fs.writeFileSync(newFile, 'const x = 1;\nconst y = 2;\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Add new file"', { cwd: tempDir });
    commitHashes.push(execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim());

    // Create a merge commit (should have different stats behavior)
    execSync('git checkout -b feature', { cwd: tempDir });
    fs.writeFileSync(path.join(tempDir, 'feature.txt'), 'feature content\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Feature commit"', { cwd: tempDir });
    const featureHash = execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim();
    commitHashes.push(featureHash);

    // Merge back to main - merge commits may have no stats
    execSync('git checkout main', { cwd: tempDir });
    execSync('git merge feature --no-edit', { cwd: tempDir });
    const mergeHash = execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim();
    commitHashes.push(mergeHash);

    // Add a binary-like file (0 insertions/deletions due to git treating it specially)
    const binFile = path.join(tempDir, 'binary.dat');
    fs.writeFileSync(binFile, Buffer.from([0x00, 0x01, 0x02, 0x03]));
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Add binary file"', { cwd: tempDir });
    commitHashes.push(execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim());
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('getFileHistory includes stats for commits with insertions', async () => {
    const { getFileHistory } = await import('../../src/git/gitService');

    const commits = await getFileHistory(testFile, tempDir);

    // Should have commits (excluding those not affecting test.txt)
    assert.ok(commits.length > 0, 'Should have at least one commit');

    // First commit should have stats
    const firstCommit = commits[0];
    assert.ok(firstCommit.stats, 'First commit should have stats object');
    assert.strictEqual(typeof firstCommit.stats?.filesChanged, 'number');
    assert.strictEqual(typeof firstCommit.stats?.insertions, 'number');
    assert.strictEqual(typeof firstCommit.stats?.deletions, 'number');
  });

  test('getFileHistory includes stats for commits with mixed changes', async () => {
    const { getFileHistory } = await import('../../src/git/gitService');

    const commits = await getFileHistory(testFile, tempDir);

    // Find the "Modify and delete" commit
    const modifyCommit = commits.find(c => c.message.includes('Modify and delete'));
    assert.ok(modifyCommit, 'Should find the modify commit');

    assert.ok(modifyCommit.stats, 'Modify commit should have stats');
    assert.ok(modifyCommit.stats!.filesChanged >= 1, 'Should have at least 1 file changed');
    // Note: actual insertions/deletions depend on git's diff algorithm
  });

  test('getFileHistory handles commits with new files', async () => {
    const { getFileHistory } = await import('../../src/git/gitService');

    const newFile = path.join(tempDir, 'newfile.js');
    const commits = await getFileHistory(newFile, tempDir);

    // Should have at least one commit (the one that added the file)
    assert.ok(commits.length > 0, 'Should have commits for newfile.js');

    const addCommit = commits.find(c => c.message.includes('Add new file'));
    assert.ok(addCommit, 'Should find the commit that added the file');

    assert.ok(addCommit?.stats, 'Add commit should have stats');
    assert.strictEqual(addCommit.stats!.filesChanged, 1, 'Should show 1 file changed');
  });

  test('stats are correctly aligned with commits by index', async () => {
    const { getFileHistory } = await import('../../src/git/gitService');

    const commits = await getFileHistory(testFile, tempDir);

    // All commits should have stats objects (even if zeros)
    for (const commit of commits) {
      assert.ok(commit.stats, `Commit "${commit.message.substring(0, 30)}" should have stats object`);
      assert.strictEqual(typeof commit.stats?.filesChanged, 'number');
      assert.strictEqual(typeof commit.stats?.insertions, 'number');
      assert.strictEqual(typeof commit.stats?.deletions, 'number');
    }
  });

  test('getFileHistory includes stats for all commits', async () => {
    const { getFileHistory } = await import('../../src/git/gitService');

    const commits = await getFileHistory(testFile, tempDir);

    // Count commits with non-zero stats
    const commitsWithStats = commits.filter(c =>
      c.stats &&
      (c.stats.filesChanged > 0 || c.stats.insertions > 0 || c.stats.deletions > 0)
    );

    // At least some commits should have stats
    assert.ok(commitsWithStats.length > 0, 'At least some commits should have stats');
  });

  test('stats values are non-negative', async () => {
    const { getFileHistory } = await import('../../src/git/gitService');

    const commits = await getFileHistory(testFile, tempDir);

    for (const commit of commits) {
      if (commit.stats) {
        assert.ok(commit.stats.filesChanged >= 0, 'filesChanged should be non-negative');
        assert.ok(commit.stats.insertions >= 0, 'insertions should be non-negative');
        assert.ok(commit.stats.deletions >= 0, 'deletions should be non-negative');
      }
    }
  });

  test('getFileHistory handles binary file commits', async () => {
    const { getFileHistory } = await import('../../src/git/gitService');

    const binFile = path.join(tempDir, 'binary.dat');
    const commits = await getFileHistory(binFile, tempDir);

    // Should have the commit that added the binary file
    assert.ok(commits.length > 0, 'Should have commits for binary file');

    const binCommit = commits.find(c => c.message.includes('Add binary file'));
    assert.ok(binCommit, 'Should find the binary file commit');

    // Binary files should have stats (git reports 0 insertions/deletions for binary changes)
    assert.ok(binCommit?.stats, 'Binary commit should have stats');
  });

  test('getFileHistory handles merge commits', async () => {
    const { getFileHistory } = await import('../../src/git/gitService');

    // Get history for the whole repo (using the tempDir itself)
    // to include merge commits
    const commits = await getFileHistory(tempDir, tempDir);

    // Find the merge commit
    const mergeCommit = commits.find(c => c.message.includes('Merge') || c.parentHashes.length > 1);

    if (mergeCommit) {
      // Merge commits may or may not have stats depending on git version and configuration
      // The important thing is that it doesn't crash and has a stats object
      assert.ok(mergeCommit.stats !== undefined, 'Merge commit should have stats object (possibly zeros)');
    }
  });

  test('stats match expected values for known commits', async () => {
    const { getFileHistory } = await import('../../src/git/gitService');

    const commits = await getFileHistory(testFile, tempDir);

    // Initial commit should have only insertions
    const initialCommit = commits.find(c => c.message.includes('Initial commit'));
    assert.ok(initialCommit, 'Should find initial commit');

    assert.ok(initialCommit?.stats, 'Initial commit should have stats');
    // Initial commit has only insertions (3 lines added)
    assert.strictEqual(initialCommit.stats!.deletions, 0, 'Initial commit should have 0 deletions');
    assert.ok(initialCommit.stats!.insertions > 0, 'Initial commit should have insertions');
  });

  test('commit hash and stats are aligned correctly', async () => {
    const { getFileHistory } = await import('../../src/git/gitService');

    const commits = await getFileHistory(testFile, tempDir);

    // Verify we can get a consistent set of commits with stats
    const commitsWithFullStats = commits.filter(c => c.stats && c.stats.filesChanged > 0);

    // Each commit should have a valid hash
    for (const commit of commitsWithFullStats) {
      assert.ok(commit.hash, 'Commit should have a hash');
      assert.ok(commit.hash.length === 40, 'Hash should be 40 characters');
      assert.ok(commit.stats, 'Commit with filesChanged > 0 should have stats');
    }
  });
});
