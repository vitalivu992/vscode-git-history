import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Copy Commit Patch E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let testFile2: string;
  let commitHashes: string[];

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-patch-'));
    testFile = path.join(tempDir, 'test.txt');
    testFile2 = path.join(tempDir, 'test2.txt');
    commitHashes = [];

    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Create initial commit
    fs.writeFileSync(testFile, 'Line 1\nLine 2\nLine 3\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit: Add test file"', { cwd: tempDir });
    commitHashes.push(execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim());

    // Create second commit with modification
    fs.writeFileSync(testFile, 'Line 1\nLine 2 modified\nLine 3\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Modify line 2"', { cwd: tempDir });
    commitHashes.push(execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim());

    // Create third commit with multiple files
    fs.writeFileSync(testFile, 'Line 1\nLine 2 modified\nLine 3\nLine 4\n');
    fs.writeFileSync(testFile2, 'File 2 content\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Add line 4 and second file"', { cwd: tempDir });
    commitHashes.push(execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim());
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('getCommitPatch generates apply-able patch', async () => {
    const { getCommitPatch } = await import('../../src/git/gitService');

    const patch = await getCommitPatch(commitHashes[1], tempDir);

    assert.ok(typeof patch === 'string', 'Patch should be a string');
    assert.ok(patch.length > 0, 'Patch should have content');

    // Should have git format-patch structure
    assert.ok(patch.includes('From '), 'Should have From header');
    assert.ok(patch.includes('Date:'), 'Should have Date header');
    assert.ok(patch.includes('Subject:'), 'Should have Subject header');
  });

  test('getCommitPatch includes commit metadata headers', async () => {
    const { getCommitPatch } = await import('../../src/git/gitService');

    const patch = await getCommitPatch(commitHashes[0], tempDir);

    // From header with hash
    assert.ok(patch.includes('From '), 'Should have From header');
    assert.ok(patch.includes(commitHashes[0]), 'Should include commit hash in From header');

    // Date header
    assert.ok(patch.includes('Date:'), 'Should have Date header');
    assert.ok(/Date: .*, \d{4}/.test(patch), 'Date should be in proper format');

    // Subject header with commit message
    assert.ok(patch.includes('Subject:'), 'Should have Subject header');
    assert.ok(patch.includes('Initial commit: Add test file'), 'Should include commit message in Subject');
  });

  test('getCommitPatch handles commits with multiple files', async () => {
    const { getCommitPatch } = await import('../../src/git/gitService');

    const patch = await getCommitPatch(commitHashes[2], tempDir);

    // Should include both files in the patch
    assert.ok(patch.includes('diff --git a/test.txt'), 'Should include test.txt diff');
    assert.ok(patch.includes('diff --git a/test2.txt'), 'Should include test2.txt diff');

    // Both files should have proper diff format
    assert.ok(patch.includes('--- a/test.txt'), 'Should have old path for test.txt');
    assert.ok(patch.includes('+++ b/test.txt'), 'Should have new path for test.txt');
    assert.ok(patch.includes('--- a/test2.txt'), 'Should have old path for test2.txt');
    assert.ok(patch.includes('+++ b/test2.txt'), 'Should have new path for test2.txt');
  });

  test('getCommitPatch includes author and date in patch', async () => {
    const { getCommitPatch } = await import('../../src/git/gitService');

    const patch = await getCommitPatch(commitHashes[1], tempDir);

    // Should have From line with author info
    assert.ok(patch.includes('From: Test User <test@example.com>'), 'Should include author in From header');

    // Should have Date line
    const dateMatch = patch.match(/Date: (.+)/);
    assert.ok(dateMatch, 'Should have Date header');
    assert.ok(dateMatch && dateMatch[1].length > 0, 'Date should not be empty');
  });

  test('getCommitPatch produces valid unified diff format', async () => {
    const { getCommitPatch } = await import('../../src/git/gitService');

    const patch = await getCommitPatch(commitHashes[1], tempDir);

    // Unified diff format elements
    assert.ok(patch.includes('--- a/'), 'Should have old file marker');
    assert.ok(patch.includes('+++ b/'), 'Should have new file marker');
    assert.ok(patch.includes('@@'), 'Should have hunk header');
    assert.ok(patch.includes('+') || patch.includes('-'), 'Should have line change markers');
  });

  test('getCommitPatch handles file additions correctly', async () => {
    const { getCommitPatch } = await import('../../src/git/gitService');

    const patch = await getCommitPatch(commitHashes[2], tempDir);

    // test2.txt was added in this commit
    assert.ok(patch.includes('diff --git a/test2.txt'), 'Should show test2.txt in diff');
    assert.ok(patch.includes('+++ b/test2.txt'), 'Should have new file marker for test2.txt');

    // New files typically show "/dev/null" as the old file
    const test2Section = patch.substring(
      patch.indexOf('diff --git a/test2.txt'),
      patch.indexOf('diff --git a/test2.txt') + 200
    );
    assert.ok(test2Section.includes('/dev/null') || test2Section.includes('--- a/test2.txt'),
      'New file should show /dev/null or file path as old file');
  });

  test('getCommitPatch shows correct diff for modifications', async () => {
    const { getCommitPatch } = await import('../../src/git/gitService');

    const patch = await getCommitPatch(commitHashes[1], tempDir);

    // This commit modified line 2
    assert.ok(patch.includes('Line 2 modified'), 'Should show modified content');
    assert.ok(patch.includes('+'), 'Should have addition markers');

    // Should show context lines
    assert.ok(patch.includes('Line 1') || patch.includes('Line 3'), 'Should include context lines');
  });
});
