import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { getCommitFiles, getCommitDiff, getCombinedDiff, getCommitRangeDiff, getFileContentAtCommit, restoreFileFromCommit, diffFileWithWorkingTree, getFileUrl } from '../../src/git/gitService';

/**
 * Changed-file paths from `git show --name-status` are relative to the
 * repository root, but the workspace can be opened at a subdirectory. These
 * tests pin the contract that every changed-file action still targets the
 * right file when the extension's cwd is not the repo root.
 */
suite('Repo-root-relative changed-file paths', () => {
  let tempDir: string;
  let subDir: string;
  let firstCommit: string;
  let secondCommit: string;
  const v1 = 'version one\n';
  const v2 = 'version two\n';
  const deepV1 = 'deep version one\n';
  const deepV2 = 'deep version two\n';
  let execSync: (cmd: string, opts?: object) => Buffer;

  suiteSetup(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-reporoot-'));
    execSync = require('child_process').execSync;

    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });
    execSync('git remote add origin https://github.com/test-owner/test-repo.git', { cwd: tempDir });

    // First commit: files at the repo root and in a nested directory
    fs.writeFileSync(path.join(tempDir, 'root-file.txt'), v1);
    fs.mkdirSync(path.join(tempDir, 'nested', 'dir'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'nested', 'dir', 'deep.txt'), deepV1);
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit"', { cwd: tempDir });

    // Second commit: modify both files
    fs.writeFileSync(path.join(tempDir, 'root-file.txt'), v2);
    fs.writeFileSync(path.join(tempDir, 'nested', 'dir', 'deep.txt'), deepV2);
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Second commit"', { cwd: tempDir });

    const hashes = execSync('git log --format=%H --reverse', { cwd: tempDir })
      .toString().trim().split('\n');
    firstCommit = hashes[0];
    secondCommit = hashes[1];

    // The extension's cwd is a subdirectory of the repo, not the root
    subDir = path.join(tempDir, 'nested');
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('getCommitFiles returns repo-root-relative paths when cwd is a subdirectory', async () => {
    const files = await getCommitFiles(secondCommit, subDir);
    const paths = files.map(f => f.path).sort();

    assert.deepStrictEqual(paths, ['nested/dir/deep.txt', 'root-file.txt']);
  });

  test('getCommitDiff with a changed-file filter matches from a subdirectory cwd', async () => {
    const result = await getCommitDiff(secondCommit, subDir, 'root-file.txt');

    assert.ok(result.diff.includes('diff --git'), 'expected a diff body');
    assert.ok(result.diff.includes('root-file.txt'), 'expected the filtered file');
    assert.ok(!result.diff.includes('deep.txt'), 'expected only the filtered file');
  });

  test('getCombinedDiff with a changed-file filter matches from a subdirectory cwd', async () => {
    const result = await getCombinedDiff([firstCommit, secondCommit], subDir, 'root-file.txt');

    assert.ok(result.diff.includes('diff --git'), 'expected a diff body');
    assert.ok(result.diff.includes('root-file.txt'), 'expected the filtered file');
  });

  test('getCommitRangeDiff with a changed-file filter matches from a subdirectory cwd', async () => {
    const result = await getCommitRangeDiff(firstCommit, secondCommit, subDir, 'nested/dir/deep.txt');

    assert.ok(result.diff.includes('diff --git'), 'expected a diff body');
    assert.ok(result.diff.includes('deep.txt'), 'expected the filtered file');
  });

  test('getFileContentAtCommit resolves repo-root-relative path from a subdirectory cwd', async () => {
    const content = await getFileContentAtCommit('nested/dir/deep.txt', firstCommit, subDir);

    assert.strictEqual(content, deepV1);
  });

  test('diffFileWithWorkingTree matches repo-root-relative path from a subdirectory cwd', async () => {
    const result = await diffFileWithWorkingTree(firstCommit, 'root-file.txt', subDir);

    assert.ok(result.diff.includes('diff --git'), 'expected a diff body');
    assert.ok(result.diff.includes('version two'), 'expected the working-tree content');
  });

  test('getFileUrl resolves absolute changed-file paths against the repo root', async () => {
    const url = await getFileUrl(path.join(tempDir, 'root-file.txt'), secondCommit, subDir);

    assert.ok(url, 'expected a URL for the fake GitHub remote');
    assert.ok(!url!.includes('..'), `URL should not contain ../ segments: ${url}`);
    assert.strictEqual(url!, `https://github.com/test-owner/test-repo/blob/${secondCommit.substring(0, 7)}/root-file.txt`);
  });

  test('getFileUrl resolves repo-root-relative changed-file paths from a subdirectory cwd', async () => {
    const url = await getFileUrl('nested/dir/deep.txt', secondCommit, subDir);

    assert.strictEqual(url!, `https://github.com/test-owner/test-repo/blob/${secondCommit.substring(0, 7)}/nested/dir/deep.txt`);
  });

  test('restoreFileFromCommit matches repo-root-relative path from a subdirectory cwd', async () => {
    await restoreFileFromCommit('root-file.txt', firstCommit, subDir);

    const content = fs.readFileSync(path.join(tempDir, 'root-file.txt'), 'utf8');
    assert.strictEqual(content, v1, 'expected the first-commit version restored into the working tree');
  });
});
