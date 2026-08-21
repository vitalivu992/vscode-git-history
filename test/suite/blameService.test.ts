import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { getFileBlame } from '../../src/git/gitService';
import { formatRelativeTime } from '../../src/blame/blameService';

suite('Blame Service Integration Tests', () => {
  let tempDir: string;
  let testFile: string;

  suiteSetup(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-blame-test-'));
    testFile = path.join(tempDir, 'test.txt');

    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Initial commit with 3 lines
    fs.writeFileSync(testFile, 'Line 1\nLine 2\nLine 3\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit"', { cwd: tempDir });

    // Second commit modifying line 2
    fs.writeFileSync(testFile, 'Line 1\nLine 2 modified\nLine 3\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Modify line 2"', { cwd: tempDir });
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('getFileBlame returns blame info for each line', async () => {
    const lines = await getFileBlame(testFile, tempDir);

    assert.ok(Array.isArray(lines));
    assert.strictEqual(lines.length, 3);
  });

  test('lines are attributed to correct commits', async () => {
    const lines = await getFileBlame(testFile, tempDir);

    // Line 2 was modified in the second commit
    const line2 = lines.find(l => l.lineNumber === 2);
    assert.ok(line2);
    assert.strictEqual(line2.summary, 'Modify line 2');

    // Line 1 was from the initial commit
    const line1 = lines.find(l => l.lineNumber === 1);
    assert.ok(line1);
    assert.strictEqual(line1.summary, 'Initial commit');
  });

  test('single-commit file works', async () => {
    const singleFile = path.join(tempDir, 'single.txt');
    fs.writeFileSync(singleFile, 'only one commit\n');
    const { execSync } = require('child_process');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Single commit file"', { cwd: tempDir });

    const lines = await getFileBlame(singleFile, tempDir);

    assert.strictEqual(lines.length, 1);
    assert.strictEqual(lines[0].lineNumber, 1);
    assert.strictEqual(lines[0].summary, 'Single commit file');
    assert.ok(lines[0].hash);
    assert.strictEqual(lines[0].shortHash.length, 7);
  });

  test('all lines have correct author info', async () => {
    const lines = await getFileBlame(testFile, tempDir);

    for (const line of lines) {
      assert.strictEqual(line.author, 'Test User');
      assert.strictEqual(line.authorEmail, 'test@example.com');
      assert.ok(line.authorTime > 0);
    }
  });
});

suite('formatRelativeTime Tests', () => {
  test('formats just now', () => {
    const now = Math.floor(Date.now() / 1000);
    assert.strictEqual(formatRelativeTime(now), 'just now');
    assert.strictEqual(formatRelativeTime(now - 30), 'just now');
  });

  test('formats minutes ago', () => {
    const now = Math.floor(Date.now() / 1000);
    assert.strictEqual(formatRelativeTime(now - 60), '1 minute ago');
    assert.strictEqual(formatRelativeTime(now - 120), '2 minutes ago');
    assert.strictEqual(formatRelativeTime(now - 3599), '59 minutes ago');
  });

  test('formats hours ago', () => {
    const now = Math.floor(Date.now() / 1000);
    assert.strictEqual(formatRelativeTime(now - 3600), '1 hour ago');
    assert.strictEqual(formatRelativeTime(now - 7200), '2 hours ago');
  });

  test('formats days ago', () => {
    const now = Math.floor(Date.now() / 1000);
    assert.strictEqual(formatRelativeTime(now - 86400), '1 day ago');
    assert.strictEqual(formatRelativeTime(now - 172800), '2 days ago');
  });

  test('formats weeks ago', () => {
    const now = Math.floor(Date.now() / 1000);
    assert.strictEqual(formatRelativeTime(now - 604800), '1 week ago');
    assert.strictEqual(formatRelativeTime(now - 1209600), '2 weeks ago');
  });

  test('formats months ago', () => {
    const now = Math.floor(Date.now() / 1000);
    assert.strictEqual(formatRelativeTime(now - 2592000), '1 month ago');
    assert.strictEqual(formatRelativeTime(now - 5184000), '2 months ago');
  });

  test('formats years ago', () => {
    const now = Math.floor(Date.now() / 1000);
    assert.strictEqual(formatRelativeTime(now - 31536000), '1 year ago');
    assert.strictEqual(formatRelativeTime(now - 63072000), '2 years ago');
  });
});
