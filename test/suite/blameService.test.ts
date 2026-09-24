import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { getFileBlame } from '../../src/git/gitService';
import { formatRelativeTime, formatBlameLabel, escapeMarkdown, computeBlameAnnotationGap } from '../../src/blame/blameService';
import { BlameLineInfo } from '../../src/types';

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

suite('Blame Decoration Label Tests', () => {
  const committedLine: BlameLineInfo = {
    hash: 'abc1234abc1234abc1234abc1234abc1234abcd',
    shortHash: 'abc1234',
    author: 'Test User',
    authorEmail: 'test@example.com',
    authorTime: Date.UTC(2024, 2, 15, 10, 30) / 1000,
    summary: 'Do a thing',
    lineNumber: 1,
    originalLineNumber: 1,
    filename: 'test.txt'
  };

  test('label shows author and a short date, without the commit hash', () => {
    const label = formatBlameLabel(committedLine, 'short');

    assert.ok(label.startsWith('Test User, '), 'Label should start with the author');
    assert.ok(!label.includes(committedLine.shortHash), 'Label should not include the short hash');
  });

  test('iso date format renders YYYY-MM-DD', () => {
    assert.strictEqual(formatBlameLabel(committedLine, 'iso'), 'Test User, 2024-03-15');
  });

  test('relative date format renders a relative time', () => {
    const recent: BlameLineInfo = {
      ...committedLine,
      authorTime: Math.floor(Date.now() / 1000) - 120
    };

    assert.strictEqual(formatBlameLabel(recent, 'relative'), 'Test User, 2 minutes ago');
  });

  test('uncommitted lines are labelled instead of attributed', () => {
    const uncommitted: BlameLineInfo = {
      ...committedLine,
      hash: '0'.repeat(40),
      shortHash: '0000000'
    };

    assert.strictEqual(formatBlameLabel(uncommitted, 'short'), 'Not Committed Yet');
  });
});

suite('Blame Annotation Offset Tests', () => {
  test('short lines are padded out to the configured offset column', () => {
    assert.strictEqual(computeBlameAnnotationGap(20, 160), 140);
    assert.strictEqual(computeBlameAnnotationGap(0, 160), 160);
  });

  test('a line exactly at the offset column is padded with no gap', () => {
    assert.strictEqual(computeBlameAnnotationGap(160, 160), 0);
  });

  test('lines longer than the offset hide the annotation', () => {
    assert.strictEqual(computeBlameAnnotationGap(161, 160), undefined);
    assert.strictEqual(computeBlameAnnotationGap(300, 160), undefined);
  });
});

suite('Blame Hover Escaping Tests', () => {
  test('escapes command links so commit metadata cannot inject commands', () => {
    const escaped = escapeMarkdown('[click](command:gitHistory.deleteBranch?["main"])');

    assert.ok(!escaped.includes(']('), 'Link syntax should be neutralized');
    assert.ok(escaped.includes('\\['), 'Opening bracket should be escaped');
  });

  test('escapes image syntax so commit metadata cannot load remote resources', () => {
    const escaped = escapeMarkdown('![x](https://example.com/tracker.png)');

    assert.ok(escaped.startsWith('\\!'), 'Leading image marker should be escaped');
    assert.ok(!escaped.includes(']('), 'Image link syntax should be neutralized');
  });

  test('leaves plain author and summary text intact', () => {
    assert.strictEqual(escapeMarkdown('Jane Doe — fix thing'), 'Jane Doe — fix thing');
  });
});
