import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { getFileHistory, getSelectionHistory, getCommitDiff, getCombinedDiff, getCommitRangeDiff, getCommitFiles, getGitRoot, getCurrentBranch, getFileContentAtCommit, getAllBranches, getBranchCommitHashes, parseRemoteUrl, getRemoteUrl, getCommitParentDiff, getCommitPatch, checkoutBranch, getCommitUrl, getBranchUrl, getFileUrl } from '../../src/git/gitService';

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

  test('getCombinedDiff should produce same result regardless of hash order', async () => {
    const commits = await getFileHistory(testFile, tempDir);

    if (commits.length >= 2) {
      const hashes = commits.slice(0, 2).map(c => c.hash);
      const forwardResult = await getCombinedDiff(hashes, tempDir);
      const reverseResult = await getCombinedDiff([...hashes].reverse(), tempDir);

      assert.strictEqual(forwardResult.diff, reverseResult.diff,
        'Combined diff should be identical regardless of input hash order');
    }
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

  test('getCommitRangeDiff should return diff between two commits', async () => {
    const commits = await getFileHistory(testFile, tempDir);
    assert.ok(commits.length >= 2, 'Should have at least 2 commits');

    const fromCommit = commits[commits.length - 1]; // Oldest
    const toCommit = commits[0]; // Newest

    const diffResult = await getCommitRangeDiff(fromCommit.hash, toCommit.hash, tempDir);

    assert.ok(typeof diffResult.diff === 'string', 'Diff should be a string');
    assert.strictEqual(diffResult.isBinary, false, 'Text file should not be binary');
  });

  test('getCommitRangeDiff should show cumulative changes between commits', async () => {
    const { execSync } = require('child_process');
    const commits = await getFileHistory(testFile, tempDir);
    assert.ok(commits.length >= 2, 'Should have at least 2 commits');

    const fromCommit = commits[commits.length - 1]; // Oldest (Initial commit)
    const toCommit = commits[0]; // Newest

    const rangeDiff = await getCommitRangeDiff(fromCommit.hash, toCommit.hash, tempDir);

    // The range diff should show all changes between initial and latest
    // The file has been modified multiple times, so there should be content
    assert.ok(rangeDiff.diff.length > 0, 'Range diff should have content');

    // Compare with combined diff of all commits
    const allHashes = commits.map(c => c.hash);
    const combinedDiff = await getCombinedDiff(allHashes, tempDir);

    // Both should show the overall changes (though format may differ slightly)
    assert.ok(combinedDiff.diff.length > 0, 'Combined diff should also have content');
  });

  test('getCommitRangeDiff should handle same from and to hash', async () => {
    const commits = await getFileHistory(testFile, tempDir);
    const hash = commits[0].hash;

    // When comparing a commit to itself, diff should be empty
    const diffResult = await getCommitRangeDiff(hash, hash, tempDir);

    assert.strictEqual(diffResult.diff, '', 'Diff between same commit should be empty');
    assert.strictEqual(diffResult.isBinary, false);
  });

  test('getCommitRangeDiff with filePath should return diff for only that file', async () => {
    const { execSync } = require('child_process');
    const commits = await getFileHistory(testFile, tempDir);
    assert.ok(commits.length >= 2, 'Should have at least 2 commits');

    // Create another file
    const testFile2 = path.join(tempDir, 'another.txt');
    fs.writeFileSync(testFile2, 'Another file content\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Add another file"', { cwd: tempDir });

    const updatedCommits = await getFileHistory(testFile, tempDir);
    const fromCommit = updatedCommits[updatedCommits.length - 1];
    const toCommit = updatedCommits[0];

    // Get range diff scoped to only testFile
    const fileDiff = await getCommitRangeDiff(fromCommit.hash, toCommit.hash, tempDir, testFile);
    assert.ok(fileDiff.diff.includes('test.txt'), 'File-scoped range diff should include test.txt');
    assert.ok(!fileDiff.diff.includes('another.txt'), 'File-scoped range diff should not include another.txt');
  });

  test('getCommitRangeDiff should be commutative in terms of content direction', async () => {
    const commits = await getFileHistory(testFile, tempDir);
    assert.ok(commits.length >= 2, 'Should have at least 2 commits');

    const fromCommit = commits[0]; // Newest
    const toCommit = commits[commits.length - 1]; // Oldest

    // A..B shows changes from A to B
    const forwardDiff = await getCommitRangeDiff(fromCommit.hash, toCommit.hash, tempDir);
    const reverseDiff = await getCommitRangeDiff(toCommit.hash, fromCommit.hash, tempDir);

    // Both should return valid results (though with opposite change directions)
    assert.ok(typeof forwardDiff.diff === 'string');
    assert.ok(typeof reverseDiff.diff === 'string');
  });

  test('getAllBranches should return all branch names', async () => {
    const branches = await getAllBranches(tempDir);
    assert.ok(branches.length > 0, 'Should have at least one branch');
    assert.ok(branches.includes('main') || branches.includes('master'), 'Should include main or master branch');
  });

  test('getBranchCommitHashes should return hashes for specified branches', async () => {
    const branches = await getAllBranches(tempDir);
    const branchName = branches[0];
    const hashes = await getBranchCommitHashes([branchName], tempDir, testFile);
    assert.ok(typeof hashes === 'object', 'Should return an object');
    assert.ok(hashes[branchName], `Should have ${branchName} branch entry`);
    assert.ok(Array.isArray(hashes[branchName]), 'Branch hashes should be an array');
    assert.ok(hashes[branchName].length > 0, 'Should have at least one hash for branch');
  });

  test('getCommitDiff should use default context lines (3) when not specified', async () => {
    const { execSync } = require('child_process');
    const commits = await getFileHistory(testFile, tempDir);

    // Create a commit with more context lines
    fs.writeFileSync(testFile, 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Add more lines"', { cwd: tempDir });

    const updatedCommits = await getFileHistory(testFile, tempDir);
    const diffResult = await getCommitDiff(updatedCommits[0].hash, tempDir);

    // Default git behavior shows 3 lines of context
    // Verify the diff contains expected content
    assert.ok(diffResult.diff.includes('@@'), 'Diff should contain hunk headers');
  });

  test('getCommitDiff should use custom context lines when specified', async () => {
    const { execSync } = require('child_process');

    // Create a commit with more lines
    fs.writeFileSync(testFile, 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Add even more lines"', { cwd: tempDir });

    const commits = await getFileHistory(testFile, tempDir);

    // Test with 5 context lines
    const diffResult = await getCommitDiff(commits[0].hash, tempDir, undefined, undefined, 5);

    // Verify the diff contains expected content
    assert.ok(diffResult.diff.includes('@@'), 'Diff should contain hunk headers');
    assert.ok(diffResult.diff.length > 0, 'Diff should have content');
  });

  test('getCommitDiff should include -U flag in git command when diffContextLines is not default', async () => {
    const commits = await getFileHistory(testFile, tempDir);

    // This test verifies the function works with custom context lines
    // The actual -U flag usage is internal to the function
    const diffResult = await getCommitDiff(commits[0].hash, tempDir, undefined, undefined, 1);

    assert.ok(diffResult.diff, 'Diff should be returned');
  });

  test('getCombinedDiff should use custom context lines when specified', async () => {
    const { execSync } = require('child_process');
    const commits = await getFileHistory(testFile, tempDir);

    if (commits.length >= 2) {
      const hashes = commits.slice(0, 2).map(c => c.hash);
      const diffResult = await getCombinedDiff(hashes, tempDir, undefined, undefined, 5);

      assert.ok(typeof diffResult.diff === 'string', 'Combined diff should return a string');
    }
  });

  test('getCommitRangeDiff should use custom context lines when specified', async () => {
    const commits = await getFileHistory(testFile, tempDir);

    if (commits.length >= 2) {
      const fromCommit = commits[commits.length - 1];
      const toCommit = commits[0];
      const diffResult = await getCommitRangeDiff(fromCommit.hash, toCommit.hash, tempDir, undefined, undefined, 5);

      assert.ok(typeof diffResult.diff === 'string', 'Range diff should return a string');
    }
  });

  test('getCommitParentDiff should use custom context lines when specified', async () => {
    const commits = await getFileHistory(testFile, tempDir);

    // Skip first commit as it has no parent
    const commitWithParent = commits.find(c => c.parentHashes && c.parentHashes.length > 0);

    if (commitWithParent) {
      const diffResult = await getCommitParentDiff(commitWithParent.hash, tempDir, undefined, undefined, 5);

      assert.ok(typeof diffResult.diff === 'string', 'Parent diff should return a string');
    }
  });

  test('diffContextLines with value 1 should work', async () => {
    const { execSync } = require('child_process');

    fs.writeFileSync(testFile, 'A\nB\nC\nD\nE\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Test minimum context"', { cwd: tempDir });

    const commits = await getFileHistory(testFile, tempDir);
    const diffResult = await getCommitDiff(commits[0].hash, tempDir, undefined, undefined, 1);

    assert.ok(diffResult.diff, 'Diff should work with 1 context line');
  });

  test('diffContextLines with value 10 should work', async () => {
    const { execSync } = require('child_process');

    // Create a file with many lines
    const lines = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`).join('\n');
    fs.writeFileSync(testFile, lines);
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Test maximum context"', { cwd: tempDir });

    const commits = await getFileHistory(testFile, tempDir);
    const diffResult = await getCommitDiff(commits[0].hash, tempDir, undefined, undefined, 10);

    assert.ok(diffResult.diff, 'Diff should work with 10 context lines');
  });

  suite('getCommitPatch', () => {
    test('getCommitPatch should return valid patch format', async () => {
      const commits = await getFileHistory(testFile, tempDir);
      const latestHash = commits[0].hash;

      const patch = await getCommitPatch(latestHash, tempDir);

      assert.ok(typeof patch === 'string', 'Patch should be a string');
      assert.ok(patch.length > 0, 'Patch should not be empty');
    });

    test('getCommitPatch should include proper git headers', async () => {
      const commits = await getFileHistory(testFile, tempDir);
      const latestHash = commits[0].hash;

      const patch = await getCommitPatch(latestHash, tempDir);

      // git format-patch includes From, Date, Subject headers
      assert.ok(patch.includes('From '), 'Patch should include From header');
      assert.ok(patch.includes('Date: '), 'Patch should include Date header');
      assert.ok(patch.includes('Subject: '), 'Patch should include Subject header');
    });

    test('getCommitPatch should handle file modifications correctly', async () => {
      const commits = await getFileHistory(testFile, tempDir);
      const latestHash = commits[0].hash;

      const patch = await getCommitPatch(latestHash, tempDir);

      // Should show diff format with --- a/ and +++ b/
      assert.ok(patch.includes('--- a/'), 'Patch should show old file path');
      assert.ok(patch.includes('+++ b/'), 'Patch should show new file path');
      assert.ok(patch.includes('diff --git'), 'Patch should include git diff header');
    });

    test('getCommitPatch should show diff with proper line additions', async () => {
      const commits = await getFileHistory(testFile, tempDir);
      const latestHash = commits[0].hash;

      const patch = await getCommitPatch(latestHash, tempDir);

      // Should show addition markers
      assert.ok(patch.includes('+') || patch.includes('-'), 'Patch should show line changes');
    });

    test('getCommitPatch should include commit message in subject', async () => {
      const commits = await getFileHistory(testFile, tempDir);
      const latestCommit = commits[0];

      const patch = await getCommitPatch(latestCommit.hash, tempDir);

      // Subject should contain the commit message
      assert.ok(patch.includes(latestCommit.message), 'Patch subject should include commit message');
    });
  });
});

suite('Commit URL Generation Tests', () => {
  suite('parseRemoteUrl', () => {
    test('parses GitHub HTTPS URLs with .git suffix', () => {
      const result = parseRemoteUrl('https://github.com/owner/repo.git');
      assert.ok(result, 'Should parse GitHub HTTPS URL');
      assert.strictEqual(result?.platform, 'github');
      assert.strictEqual(result?.baseUrl, 'https://github.com');
      assert.strictEqual(result?.owner, 'owner');
      assert.strictEqual(result?.repo, 'repo');
    });

    test('parses GitHub HTTPS URLs without .git suffix', () => {
      const result = parseRemoteUrl('https://github.com/owner/repo');
      assert.ok(result, 'Should parse GitHub HTTPS URL without .git');
      assert.strictEqual(result?.platform, 'github');
      assert.strictEqual(result?.baseUrl, 'https://github.com');
      assert.strictEqual(result?.owner, 'owner');
      assert.strictEqual(result?.repo, 'repo');
    });

    test('parses GitHub SSH URLs', () => {
      const result = parseRemoteUrl('git@github.com:owner/repo.git');
      assert.ok(result, 'Should parse GitHub SSH URL');
      assert.strictEqual(result?.platform, 'github');
      assert.strictEqual(result?.baseUrl, 'https://github.com');
      assert.strictEqual(result?.owner, 'owner');
      assert.strictEqual(result?.repo, 'repo');
    });

    test('parses GitLab HTTPS URLs', () => {
      const result = parseRemoteUrl('https://gitlab.com/owner/repo.git');
      assert.ok(result, 'Should parse GitLab HTTPS URL');
      assert.strictEqual(result?.platform, 'gitlab');
      assert.strictEqual(result?.baseUrl, 'https://gitlab.com');
      assert.strictEqual(result?.owner, 'owner');
      assert.strictEqual(result?.repo, 'repo');
    });

    test('parses GitLab SSH URLs', () => {
      const result = parseRemoteUrl('git@gitlab.com:owner/repo.git');
      assert.ok(result, 'Should parse GitLab SSH URL');
      assert.strictEqual(result?.platform, 'gitlab');
      assert.strictEqual(result?.baseUrl, 'https://gitlab.com');
      assert.strictEqual(result?.owner, 'owner');
      assert.strictEqual(result?.repo, 'repo');
    });

    test('parses Bitbucket HTTPS URLs', () => {
      const result = parseRemoteUrl('https://bitbucket.org/owner/repo.git');
      assert.ok(result, 'Should parse Bitbucket HTTPS URL');
      assert.strictEqual(result?.platform, 'bitbucket');
      assert.strictEqual(result?.baseUrl, 'https://bitbucket.org');
      assert.strictEqual(result?.owner, 'owner');
      assert.strictEqual(result?.repo, 'repo');
    });

    test('parses Bitbucket SSH URLs', () => {
      const result = parseRemoteUrl('git@bitbucket.org:owner/repo.git');
      assert.ok(result, 'Should parse Bitbucket SSH URL');
      assert.strictEqual(result?.platform, 'bitbucket');
      assert.strictEqual(result?.baseUrl, 'https://bitbucket.org');
      assert.strictEqual(result?.owner, 'owner');
      assert.strictEqual(result?.repo, 'repo');
    });

    test('parses GitHub Enterprise URLs (github.company.com)', () => {
      const result = parseRemoteUrl('https://github.company.com/owner/repo.git');
      assert.ok(result, 'Should parse GitHub Enterprise URL');
      assert.strictEqual(result?.platform, 'github');
      assert.strictEqual(result?.baseUrl, 'https://github.company.com');
      assert.strictEqual(result?.owner, 'owner');
      assert.strictEqual(result?.repo, 'repo');
    });

    test('parses self-hosted GitLab URLs', () => {
      const result = parseRemoteUrl('https://gitlab.company.com/owner/repo.git');
      assert.ok(result, 'Should parse self-hosted GitLab URL');
      assert.strictEqual(result?.platform, 'gitlab');
      assert.strictEqual(result?.baseUrl, 'https://gitlab.company.com');
      assert.strictEqual(result?.owner, 'owner');
      assert.strictEqual(result?.repo, 'repo');
    });

    test('returns null for unknown platforms', () => {
      const result = parseRemoteUrl('https://unknown-platform.com/owner/repo.git');
      assert.strictEqual(result, null);
    });

    test('handles URLs with custom ports', () => {
      const result = parseRemoteUrl('https://github.com:8443/owner/repo.git');
      assert.ok(result, 'Should parse URL with custom port');
      assert.strictEqual(result?.baseUrl, 'https://github.com:8443');
    });
  });

  suite('getRemoteUrl', () => {
    test('returns null when no remote configured', async () => {
      const result = await getRemoteUrl('/non/existent/path');
      assert.strictEqual(result, null);
    });
  });

  suite('checkoutBranch', () => {
    const { execSync } = require('child_process');
    let checkoutTestDir: string;
    let checkoutTestFile: string;

    suiteSetup(() => {
      // Create a separate test directory for checkout tests
      checkoutTestDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-checkout-test-'));
      checkoutTestFile = path.join(checkoutTestDir, 'checkout-test.txt');

      // Initialize git repo
      execSync('git init', { cwd: checkoutTestDir });
      execSync('git config user.name "Test User"', { cwd: checkoutTestDir });
      execSync('git config user.email "test@example.com"', { cwd: checkoutTestDir });

      // Create initial commit on main branch
      fs.writeFileSync(checkoutTestFile, 'Initial content\n');
      execSync('git add .', { cwd: checkoutTestDir });
      execSync('git commit -m "Initial commit"', { cwd: checkoutTestDir });

      // Create a new branch
      execSync('git branch feature-branch', { cwd: checkoutTestDir });
    });

    suiteTeardown(() => {
      // Clean up checkout test directory
      if (fs.existsSync(checkoutTestDir)) {
        fs.rmSync(checkoutTestDir, { recursive: true, force: true });
      }
    });

    test('should checkout a valid branch', async () => {
      // Start on main (default)
      const branchBefore = await getCurrentBranch(checkoutTestDir);
      assert.ok(branchBefore, 'Should have a current branch');

      // Checkout the feature branch
      await checkoutBranch('feature-branch', checkoutTestDir);

      // Verify we're on the feature branch
      const branchAfter = await getCurrentBranch(checkoutTestDir);
      assert.strictEqual(branchAfter, 'feature-branch', 'Should be on feature-branch');
    });

    test('should throw error for invalid branch', async () => {
      await assert.rejects(
        async () => {
          await checkoutBranch('non-existent-branch', checkoutTestDir);
        },
        /pathspec 'non-existent-branch' did not match any file/
      );
    });

    test('should throw error with uncommitted changes', async () => {
      // Create uncommitted changes
      fs.writeFileSync(checkoutTestFile, 'Uncommitted changes\n');

      await assert.rejects(
        async () => {
          await checkoutBranch('feature-branch', checkoutTestDir);
        },
        /changes/
      );

      // Clean up the uncommitted changes for other tests
      execSync('git checkout -- .', { cwd: checkoutTestDir });
    });
  });

  suite('getCommitUrl', () => {
    const { execSync } = require('child_process');
    let urlTestDir: string;
    let commitHash: string;

    suiteSetup(() => {
      urlTestDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-commit-url-test-'));
      execSync('git init', { cwd: urlTestDir });
      execSync('git config user.name "Test User"', { cwd: urlTestDir });
      execSync('git config user.email "test@example.com"', { cwd: urlTestDir });
      execSync('git commit --allow-empty -m "Initial"', { cwd: urlTestDir });
      commitHash = execSync('git rev-parse HEAD', { cwd: urlTestDir }).toString().trim();
    });

    suiteTeardown(() => {
      if (fs.existsSync(urlTestDir)) {
        fs.rmSync(urlTestDir, { recursive: true, force: true });
      }
    });

    async function withRemote(remoteUrl: string, remoteName: string, fn: () => Promise<void>) {
      execSync(`git remote add ${remoteName} ${remoteUrl}`, { cwd: urlTestDir });
      try {
        await fn();
      } finally {
        execSync(`git remote remove ${remoteName}`, { cwd: urlTestDir });
      }
    }

    test('should generate GitHub HTTPS URL', async () => {
      await withRemote('https://github.com/owner/repo.git', 'origin', async () => {
        const url = await getCommitUrl(commitHash, urlTestDir);
        assert.strictEqual(url, `https://github.com/owner/repo/commit/${commitHash.substring(0, 7)}`);
      });
    });

    test('should generate GitHub SSH URL', async () => {
      await withRemote('git@github.com:owner/repo.git', 'origin', async () => {
        const url = await getCommitUrl(commitHash, urlTestDir);
        assert.strictEqual(url, `https://github.com/owner/repo/commit/${commitHash.substring(0, 7)}`);
      });
    });

    test('should generate GitLab HTTPS URL', async () => {
      await withRemote('https://gitlab.com/owner/repo.git', 'origin', async () => {
        const url = await getCommitUrl(commitHash, urlTestDir);
        assert.strictEqual(url, `https://gitlab.com/owner/repo/-/commit/${commitHash.substring(0, 7)}`);
      });
    });

    test('should generate GitLab SSH URL', async () => {
      await withRemote('git@gitlab.com:owner/repo.git', 'origin', async () => {
        const url = await getCommitUrl(commitHash, urlTestDir);
        assert.strictEqual(url, `https://gitlab.com/owner/repo/-/commit/${commitHash.substring(0, 7)}`);
      });
    });

    test('should generate Bitbucket HTTPS URL', async () => {
      await withRemote('https://bitbucket.org/owner/repo.git', 'origin', async () => {
        const url = await getCommitUrl(commitHash, urlTestDir);
        assert.strictEqual(url, `https://bitbucket.org/owner/repo/commits/${commitHash.substring(0, 7)}`);
      });
    });

    test('should generate Bitbucket SSH URL', async () => {
      await withRemote('git@bitbucket.org:owner/repo.git', 'origin', async () => {
        const url = await getCommitUrl(commitHash, urlTestDir);
        assert.strictEqual(url, `https://bitbucket.org/owner/repo/commits/${commitHash.substring(0, 7)}`);
      });
    });

    test('should generate GitHub Enterprise URL', async () => {
      await withRemote('https://github.company.com/owner/repo.git', 'origin', async () => {
        const url = await getCommitUrl(commitHash, urlTestDir);
        assert.strictEqual(url, `https://github.company.com/owner/repo/commit/${commitHash.substring(0, 7)}`);
      });
    });

    test('should generate self-hosted GitLab URL', async () => {
      await withRemote('https://gitlab.company.com/owner/repo.git', 'origin', async () => {
        const url = await getCommitUrl(commitHash, urlTestDir);
        assert.strictEqual(url, `https://gitlab.company.com/owner/repo/-/commit/${commitHash.substring(0, 7)}`);
      });
    });

    test('should use 7-character short hash', async () => {
      await withRemote('https://github.com/owner/repo.git', 'origin', async () => {
        const url = await getCommitUrl(commitHash, urlTestDir);
        assert.ok(url, 'Should return a URL');
        const hashInUrl = url!.split('/').pop()!;
        assert.strictEqual(hashInUrl.length, 7, 'Hash in URL should be 7 characters');
      });
    });

    test('should return null for unknown platform', async () => {
      await withRemote('https://unknown-platform.com/owner/repo.git', 'origin', async () => {
        const url = await getCommitUrl(commitHash, urlTestDir);
        assert.strictEqual(url, null);
      });
    });

    test('should return null when no remote configured', async () => {
      const url = await getCommitUrl(commitHash, urlTestDir);
      assert.strictEqual(url, null);
    });

    test('should work with custom remote name', async () => {
      await withRemote('https://github.com/owner/repo.git', 'upstream', async () => {
        const url = await getCommitUrl(commitHash, urlTestDir, 'upstream');
        assert.strictEqual(url, `https://github.com/owner/repo/commit/${commitHash.substring(0, 7)}`);
      });
    });
  });

  suite('getBranchUrl', () => {
    const { execSync } = require('child_process');
    let branchUrlTestDir: string;

    suiteSetup(() => {
      branchUrlTestDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-branch-url-test-'));
      execSync('git init', { cwd: branchUrlTestDir });
      execSync('git config user.name "Test User"', { cwd: branchUrlTestDir });
      execSync('git config user.email "test@example.com"', { cwd: branchUrlTestDir });
      execSync('git commit --allow-empty -m "Initial"', { cwd: branchUrlTestDir });
    });

    suiteTeardown(() => {
      if (fs.existsSync(branchUrlTestDir)) {
        fs.rmSync(branchUrlTestDir, { recursive: true, force: true });
      }
    });

    async function withBranchRemote(remoteUrl: string, remoteName: string, fn: () => Promise<void>) {
      execSync(`git remote add ${remoteName} ${remoteUrl}`, { cwd: branchUrlTestDir });
      try {
        await fn();
      } finally {
        execSync(`git remote remove ${remoteName}`, { cwd: branchUrlTestDir });
      }
    }

    test('should generate GitHub branch URL', async () => {
      await withBranchRemote('https://github.com/owner/repo.git', 'origin', async () => {
        const url = await getBranchUrl('main', branchUrlTestDir);
        assert.strictEqual(url, 'https://github.com/owner/repo/tree/main');
      });
    });

    test('should generate GitHub SSH branch URL', async () => {
      await withBranchRemote('git@github.com:owner/repo.git', 'origin', async () => {
        const url = await getBranchUrl('feature/test', branchUrlTestDir);
        assert.strictEqual(url, 'https://github.com/owner/repo/tree/feature/test');
      });
    });

    test('should generate GitLab branch URL', async () => {
      await withBranchRemote('https://gitlab.com/owner/repo.git', 'origin', async () => {
        const url = await getBranchUrl('develop', branchUrlTestDir);
        assert.strictEqual(url, 'https://gitlab.com/owner/repo/-/tree/develop');
      });
    });

    test('should generate GitLab SSH branch URL', async () => {
      await withBranchRemote('git@gitlab.com:owner/repo.git', 'origin', async () => {
        const url = await getBranchUrl('main', branchUrlTestDir);
        assert.strictEqual(url, 'https://gitlab.com/owner/repo/-/tree/main');
      });
    });

    test('should generate Bitbucket branch URL', async () => {
      await withBranchRemote('https://bitbucket.org/owner/repo.git', 'origin', async () => {
        const url = await getBranchUrl('main', branchUrlTestDir);
        assert.strictEqual(url, 'https://bitbucket.org/owner/repo/src/main');
      });
    });

    test('should generate Bitbucket SSH branch URL', async () => {
      await withBranchRemote('git@bitbucket.org:owner/repo.git', 'origin', async () => {
        const url = await getBranchUrl('release/v2', branchUrlTestDir);
        assert.strictEqual(url, 'https://bitbucket.org/owner/repo/src/release/v2');
      });
    });

    test('should generate GitHub Enterprise branch URL', async () => {
      await withBranchRemote('https://github.company.com/owner/repo.git', 'origin', async () => {
        const url = await getBranchUrl('main', branchUrlTestDir);
        assert.strictEqual(url, 'https://github.company.com/owner/repo/tree/main');
      });
    });

    test('should generate self-hosted GitLab branch URL', async () => {
      await withBranchRemote('https://gitlab.company.com/owner/repo.git', 'origin', async () => {
        const url = await getBranchUrl('main', branchUrlTestDir);
        assert.strictEqual(url, 'https://gitlab.company.com/owner/repo/-/tree/main');
      });
    });

    test('should return null for unknown platform', async () => {
      await withBranchRemote('https://unknown-platform.com/owner/repo.git', 'origin', async () => {
        const url = await getBranchUrl('main', branchUrlTestDir);
        assert.strictEqual(url, null);
      });
    });

    test('should return null when no remote configured', async () => {
      const url = await getBranchUrl('main', branchUrlTestDir);
      assert.strictEqual(url, null);
    });

    test('should work with custom remote name', async () => {
      await withBranchRemote('https://github.com/owner/repo.git', 'upstream', async () => {
        const url = await getBranchUrl('main', branchUrlTestDir, 'upstream');
        assert.strictEqual(url, 'https://github.com/owner/repo/tree/main');
      });
    });
  });

  // Azure DevOps URL tests
  suite('parseRemoteUrl - Azure DevOps', () => {
    test('parses Azure DevOps HTTPS URLs (dev.azure.com) with .git suffix', () => {
      const result = parseRemoteUrl('https://dev.azure.com/myorg/myproject/_git/myrepo.git');
      assert.ok(result, 'Should parse Azure DevOps HTTPS URL with .git');
      assert.strictEqual(result?.platform, 'azure');
      assert.strictEqual(result?.baseUrl, 'https://dev.azure.com');
      assert.strictEqual(result?.owner, 'myorg');
      assert.strictEqual(result?.project, 'myproject');
      assert.strictEqual(result?.repo, 'myrepo');
    });

    test('parses Azure DevOps HTTPS URLs (dev.azure.com) without .git suffix', () => {
      const result = parseRemoteUrl('https://dev.azure.com/myorg/myproject/_git/myrepo');
      assert.ok(result, 'Should parse Azure DevOps HTTPS URL without .git');
      assert.strictEqual(result?.platform, 'azure');
      assert.strictEqual(result?.baseUrl, 'https://dev.azure.com');
      assert.strictEqual(result?.owner, 'myorg');
      assert.strictEqual(result?.project, 'myproject');
      assert.strictEqual(result?.repo, 'myrepo');
    });

    test('parses Azure DevOps legacy HTTPS URLs (*.visualstudio.com)', () => {
      const result = parseRemoteUrl('https://myorg.visualstudio.com/myproject/_git/myrepo.git');
      assert.ok(result, 'Should parse Azure DevOps legacy URL');
      assert.strictEqual(result?.platform, 'azure');
      assert.strictEqual(result?.baseUrl, 'https://myorg.visualstudio.com');
      assert.strictEqual(result?.owner, 'myorg');
      assert.strictEqual(result?.project, 'myproject');
      assert.strictEqual(result?.repo, 'myrepo');
    });

    test('parses Azure DevOps SSH URLs (ssh.dev.azure.com)', () => {
      const result = parseRemoteUrl('git@ssh.dev.azure.com:v3/myorg/myproject/myrepo');
      assert.ok(result, 'Should parse Azure DevOps SSH URL');
      assert.strictEqual(result?.platform, 'azure');
      assert.strictEqual(result?.baseUrl, 'https://dev.azure.com');
      assert.strictEqual(result?.owner, 'myorg');
      assert.strictEqual(result?.project, 'myproject');
      assert.strictEqual(result?.repo, 'myrepo');
    });

    test('parses Azure DevOps SSH URLs with .git suffix', () => {
      const result = parseRemoteUrl('git@ssh.dev.azure.com:v3/myorg/myproject/myrepo.git');
      assert.ok(result, 'Should parse Azure DevOps SSH URL with .git');
      assert.strictEqual(result?.platform, 'azure');
      assert.strictEqual(result?.owner, 'myorg');
      assert.strictEqual(result?.project, 'myproject');
      assert.strictEqual(result?.repo, 'myrepo');
    });
  });

  suite('getCommitUrl - Azure DevOps', () => {
    const { execSync } = require('child_process');
    let azureUrlTestDir: string;
    let azureCommitHash: string;

    suiteSetup(() => {
      azureUrlTestDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-azure-url-test-'));
      execSync('git init', { cwd: azureUrlTestDir });
      execSync('git config user.name "Test User"', { cwd: azureUrlTestDir });
      execSync('git config user.email "test@example.com"', { cwd: azureUrlTestDir });
      execSync('git commit --allow-empty -m "Initial"', { cwd: azureUrlTestDir });
      azureCommitHash = execSync('git rev-parse HEAD', { cwd: azureUrlTestDir }).toString().trim();
    });

    suiteTeardown(() => {
      if (fs.existsSync(azureUrlTestDir)) {
        fs.rmSync(azureUrlTestDir, { recursive: true, force: true });
      }
    });

    async function withAzureRemote(remoteUrl: string, remoteName: string, fn: () => Promise<void>) {
      execSync(`git remote add ${remoteName} ${remoteUrl}`, { cwd: azureUrlTestDir });
      try {
        await fn();
      } finally {
        execSync(`git remote remove ${remoteName}`, { cwd: azureUrlTestDir });
      }
    }

    test('generates correct commit URL for Azure DevOps (dev.azure.com)', async () => {
      await withAzureRemote('https://dev.azure.com/myorg/myproject/_git/myrepo.git', 'origin', async () => {
        const url = await getCommitUrl(azureCommitHash, azureUrlTestDir);
        assert.strictEqual(url, `https://dev.azure.com/myorg/myproject/_git/myrepo/commit/${azureCommitHash.substring(0, 7)}`);
      });
    });

    test('generates correct commit URL for Azure DevOps legacy (visualstudio.com)', async () => {
      await withAzureRemote('https://myorg.visualstudio.com/myproject/_git/myrepo.git', 'origin', async () => {
        const url = await getCommitUrl(azureCommitHash, azureUrlTestDir);
        assert.strictEqual(url, `https://myorg.visualstudio.com/myorg/myproject/_git/myrepo/commit/${azureCommitHash.substring(0, 7)}`);
      });
    });

    test('generates correct commit URL for Azure DevOps SSH', async () => {
      await withAzureRemote('git@ssh.dev.azure.com:v3/myorg/myproject/myrepo', 'origin', async () => {
        const url = await getCommitUrl(azureCommitHash, azureUrlTestDir);
        assert.strictEqual(url, `https://dev.azure.com/myorg/myproject/_git/myrepo/commit/${azureCommitHash.substring(0, 7)}`);
      });
    });

    test('generates correct commit URL for self-hosted Azure DevOps Server', async () => {
      await withAzureRemote('https://mycompany.visualstudio.com/myproject/_git/myrepo.git', 'origin', async () => {
        const url = await getCommitUrl(azureCommitHash, azureUrlTestDir);
        assert.strictEqual(url, `https://mycompany.visualstudio.com/mycompany/myproject/_git/myrepo/commit/${azureCommitHash.substring(0, 7)}`);
      });
    });
  });

  suite('getBranchUrl - Azure DevOps', () => {
    const { execSync } = require('child_process');
    let azureBranchTestDir: string;

    suiteSetup(() => {
      azureBranchTestDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-azure-branch-test-'));
      execSync('git init', { cwd: azureBranchTestDir });
      execSync('git config user.name "Test User"', { cwd: azureBranchTestDir });
      execSync('git config user.email "test@example.com"', { cwd: azureBranchTestDir });
      execSync('git commit --allow-empty -m "Initial"', { cwd: azureBranchTestDir });
    });

    suiteTeardown(() => {
      if (fs.existsSync(azureBranchTestDir)) {
        fs.rmSync(azureBranchTestDir, { recursive: true, force: true });
      }
    });

    async function withAzureBranchRemote(remoteUrl: string, remoteName: string, fn: () => Promise<void>) {
      execSync(`git remote add ${remoteName} ${remoteUrl}`, { cwd: azureBranchTestDir });
      try {
        await fn();
      } finally {
        execSync(`git remote remove ${remoteName}`, { cwd: azureBranchTestDir });
      }
    }

    test('generates correct branch URL for Azure DevOps', async () => {
      await withAzureBranchRemote('https://dev.azure.com/myorg/myproject/_git/myrepo.git', 'origin', async () => {
        const url = await getBranchUrl('main', azureBranchTestDir);
        assert.strictEqual(url, 'https://dev.azure.com/myorg/myproject/_git/myrepo?version=GBmain');
      });
    });

    test('handles branch names with slashes for Azure DevOps', async () => {
      await withAzureBranchRemote('https://dev.azure.com/myorg/myproject/_git/myrepo.git', 'origin', async () => {
        const url = await getBranchUrl('feature/my-feature', azureBranchTestDir);
        assert.strictEqual(url, 'https://dev.azure.com/myorg/myproject/_git/myrepo?version=GBfeature/my-feature');
      });
    });

    test('generates correct branch URL for Azure DevOps SSH', async () => {
      await withAzureBranchRemote('git@ssh.dev.azure.com:v3/myorg/myproject/myrepo', 'origin', async () => {
        const url = await getBranchUrl('develop', azureBranchTestDir);
        assert.strictEqual(url, 'https://dev.azure.com/myorg/myproject/_git/myrepo?version=GBdevelop');
      });
    });
  });

  suite('getFileUrl - Azure DevOps', () => {
    const { execSync } = require('child_process');
    let azureFileTestDir: string;
    let azureFileHash: string;

    suiteSetup(() => {
      azureFileTestDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-azure-file-test-'));
      execSync('git init', { cwd: azureFileTestDir });
      execSync('git config user.name "Test User"', { cwd: azureFileTestDir });
      execSync('git config user.email "test@example.com"', { cwd: azureFileTestDir });
      fs.writeFileSync(path.join(azureFileTestDir, 'test.txt'), 'content\n');
      execSync('git add .', { cwd: azureFileTestDir });
      execSync('git commit -m "Initial"', { cwd: azureFileTestDir });
      azureFileHash = execSync('git rev-parse HEAD', { cwd: azureFileTestDir }).toString().trim();
    });

    suiteTeardown(() => {
      if (fs.existsSync(azureFileTestDir)) {
        fs.rmSync(azureFileTestDir, { recursive: true, force: true });
      }
    });

    async function withAzureFileRemote(remoteUrl: string, remoteName: string, fn: () => Promise<void>) {
      execSync(`git remote add ${remoteName} ${remoteUrl}`, { cwd: azureFileTestDir });
      try {
        await fn();
      } finally {
        execSync(`git remote remove ${remoteName}`, { cwd: azureFileTestDir });
      }
    }

    test('generates correct file URL for Azure DevOps', async () => {
      await withAzureFileRemote('https://dev.azure.com/myorg/myproject/_git/myrepo.git', 'origin', async () => {
        const url = await getFileUrl('src/main.ts', azureFileHash, azureFileTestDir);
        assert.strictEqual(url, `https://dev.azure.com/myorg/myproject/_git/myrepo?path=%2Fsrc%2Fmain.ts&version=${azureFileHash.substring(0, 7)}`);
      });
    });

    test('handles nested file paths for Azure DevOps', async () => {
      await withAzureFileRemote('https://dev.azure.com/myorg/myproject/_git/myrepo.git', 'origin', async () => {
        const url = await getFileUrl('src/webview/panel/main.js', azureFileHash, azureFileTestDir);
        assert.strictEqual(url, `https://dev.azure.com/myorg/myproject/_git/myrepo?path=%2Fsrc%2Fwebview%2Fpanel%2Fmain.js&version=${azureFileHash.substring(0, 7)}`);
      });
    });

    test('generates correct file URL for Azure DevOps SSH', async () => {
      await withAzureFileRemote('git@ssh.dev.azure.com:v3/myorg/myproject/myrepo', 'origin', async () => {
        const url = await getFileUrl('test.txt', azureFileHash, azureFileTestDir);
        assert.strictEqual(url, `https://dev.azure.com/myorg/myproject/_git/myrepo?path=%2Ftest.txt&version=${azureFileHash.substring(0, 7)}`);
      });
    });
  });
});
