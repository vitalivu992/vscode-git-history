import * as assert from 'assert';
import { parseGitLog, parseNameStatus, parseLineHistoryLog, isBinaryFile } from '../../src/git/gitParser';

suite('Git Parser Tests', () => {
  test('parseGitLog should parse commit blocks', () => {
    // Format: %H%x00%P%x00%an%x00%ae%x00%at%x00%s%x00%b%x00%d%x00%G?%x00%GS%x00---COMMIT-END---%n
    // Note: hashes must be valid hex (0-9, a-f) for the parser to accept them
    // commit1 is a root commit (no parents), commit2 has commit1 as parent
    const commit1 = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0\x00\x00John Doe\x00john@example.com\x001234567890\x00Initial commit\x00\x00\x00---COMMIT-END---';
    const commit2 = 'b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0\x00a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0\x00Jane Smith\x00jane@example.com\x001234567900\x00Add feature\x00This adds a new feature.\x00\x00---COMMIT-END---';
    const input = commit1 + '\n' + commit2;

    const commits = parseGitLog(input);

    assert.strictEqual(commits.length, 2);
    assert.strictEqual(commits[0].hash, 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0');
    assert.strictEqual(commits[0].shortHash, 'a1b2c3d');
    assert.deepStrictEqual(commits[0].parentHashes, []);
    assert.strictEqual(commits[0].author, 'John Doe');
    assert.strictEqual(commits[0].email, 'john@example.com');
    assert.strictEqual(commits[0].message, 'Initial commit');

    assert.strictEqual(commits[1].hash, 'b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0');
    assert.deepStrictEqual(commits[1].parentHashes, ['a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0']);
    assert.strictEqual(commits[1].author, 'Jane Smith');
    assert.strictEqual(commits[1].message, 'Add feature');
  });

  test('parseNameStatus should parse file changes', () => {
    const input = 'M\tsrc/file.ts\nA\tnewfile.js\nD\tdeleted.txt\nR100\told.ts\tpath/to/new.ts';

    const result = parseNameStatus(input);

    assert.strictEqual(result.size, 4);
    assert.deepStrictEqual(result.get('src/file.ts'), { status: 'M' });
    assert.deepStrictEqual(result.get('newfile.js'), { status: 'A' });
    assert.deepStrictEqual(result.get('deleted.txt'), { status: 'D' });
    assert.deepStrictEqual(result.get('path/to/new.ts'), { status: 'R', previousPath: 'old.ts' });
  });

  test('parseNameStatus should parse copied file', () => {
    const input = 'C100\toriginal.ts\tcopied.ts';

    const result = parseNameStatus(input);

    assert.strictEqual(result.size, 1);
    assert.deepStrictEqual(result.get('copied.ts'), { status: 'C', previousPath: 'original.ts' });
  });

  test('parseNameStatus should handle empty input', () => {
    const result = parseNameStatus('');

    assert.strictEqual(result.size, 0);
  });

  test('parseNameStatus should handle mixed statuses', () => {
    const input = 'M\tfile1.ts\nA\tfile2.ts\nD\tfile3.ts\nR100\told.ts\tnew.ts\nC100\torig.ts\tcopy.ts';

    const result = parseNameStatus(input);

    assert.strictEqual(result.size, 5);
    assert.deepStrictEqual(result.get('file1.ts'), { status: 'M' });
    assert.deepStrictEqual(result.get('file2.ts'), { status: 'A' });
    assert.deepStrictEqual(result.get('file3.ts'), { status: 'D' });
    assert.deepStrictEqual(result.get('new.ts'), { status: 'R', previousPath: 'old.ts' });
    assert.deepStrictEqual(result.get('copy.ts'), { status: 'C', previousPath: 'orig.ts' });
  });

  test('parseLineHistoryLog should parse -L output', () => {
    // Format: %H%x00%P%x00%an%x00%ae%x00%at%x00%s%x00%d%x00%G?%x00%GS (one header line per commit, diff lines have no nulls)
    const hash1 = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0';
    const hash2 = 'b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0';
    const input = [
      `${hash1}\x00${hash2}\x00John Doe\x00john@example.com\x001234567890\x00Added line\x00\x00G\x00Alice <alice@example.com>`,
      'diff --git a/file.ts b/file.ts',
      '--- a/file.ts',
      '+++ b/file.ts',
      `${hash2}\x00\x00Jane Smith\x00jane@example.com\x001234567900\x00Modified line\x00\x00N\x00\x00`,
    ].join('\n');

    const commits = parseLineHistoryLog(input);

    assert.strictEqual(commits.length, 2);
    assert.strictEqual(commits[0].hash, hash1);
    assert.strictEqual(commits[0].author, 'John Doe');
    assert.strictEqual(commits[0].message, 'Added line');
    assert.deepStrictEqual(commits[0].parentHashes, [hash2]);
    assert.strictEqual(commits[0].signature?.verified, true);
    assert.strictEqual(commits[0].signature?.signer, 'Alice <alice@example.com>');
    assert.strictEqual(commits[1].hash, hash2);
    assert.strictEqual(commits[1].message, 'Modified line');
    assert.deepStrictEqual(commits[1].parentHashes, []);
    assert.strictEqual(commits[1].signature, undefined);
  });

  test('parseLineHistoryLog should handle empty input', () => {
    const commits = parseLineHistoryLog('');

    assert.strictEqual(commits.length, 0);
  });

  test('parseLineHistoryLog should de-duplicate commits', () => {
    const hash1 = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0';
    const hash2 = 'b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0';
    // hash1 appears twice, should only be included once
    const input = [
      `${hash1}\x00\x00John Doe\x00john@example.com\x00\x00\x001234567890\x00First commit\x00`,
      'diff line',
      `${hash2}\x00\x00Jane Smith\x00jane@example.com\x00\x00\x001234567900\x00Second commit\x00`,
      'another diff line',
      `${hash1}\x00\x00John Doe\x00john@example.com\x00\x00\x001234567890\x00First commit\x00`, // duplicate
    ].join('\n');

    const commits = parseLineHistoryLog(input);

    assert.strictEqual(commits.length, 2);
    assert.strictEqual(commits[0].hash, hash1);
    assert.strictEqual(commits[1].hash, hash2);
  });

  test('parseGitLog should parse committer fields', () => {
    // Format: %H%x00%P%x00%an%x00%ae%x00%cn%x00%ce%x00%at%x00%s%x00%b%x00%d%x00%G?%x00%GS%x00---COMMIT-END---%n
    const commit = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0\x00\x00John Doe\x00john@example.com\x00Jane Smith\x00jane@example.com\x001234567890\x00Committed by Jane\x00\x00\x00---COMMIT-END---';

    const commits = parseGitLog(commit);

    assert.strictEqual(commits.length, 1);
    assert.strictEqual(commits[0].author, 'John Doe');
    assert.strictEqual(commits[0].email, 'john@example.com');
    assert.strictEqual(commits[0].committer, 'Jane Smith');
    assert.strictEqual(commits[0].committerEmail, 'jane@example.com');
  });

  test('parseGitLog should fallback to author when committer is empty', () => {
    // Empty committer fields (missing %cn and %ce)
    const commit = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0\x00\x00John Doe\x00john@example.com\x00\x00\x001234567890\x00Self-authored\x00\x00\x00---COMMIT-END---';

    const commits = parseGitLog(commit);

    assert.strictEqual(commits.length, 1);
    assert.strictEqual(commits[0].author, 'John Doe');
    assert.strictEqual(commits[0].email, 'john@example.com');
    assert.strictEqual(commits[0].committer, 'John Doe'); // fallback to author
    assert.strictEqual(commits[0].committerEmail, 'john@example.com'); // fallback to email
  });

  test('parseLineHistoryLog should parse committer fields', () => {
    // Format: %H%x00%P%x00%an%x00%ae%x00%cn%x00%ce%x00%at%x00%s%x00%d%x00%G?%x00%GS
    const hash1 = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0';
    const input = `${hash1}\x00\x00John Doe\x00john@example.com\x00Jane Smith\x00jane@example.com\x001234567890\x00Added line\x00\x00G\x00Alice <alice@example.com>`;

    const commits = parseLineHistoryLog(input);

    assert.strictEqual(commits.length, 1);
    assert.strictEqual(commits[0].author, 'John Doe');
    assert.strictEqual(commits[0].email, 'john@example.com');
    assert.strictEqual(commits[0].committer, 'Jane Smith');
    assert.strictEqual(commits[0].committerEmail, 'jane@example.com');
  });

  test('parseLineHistoryLog should fallback to author when committer is empty', () => {
    // Empty committer fields in -L format
    const hash1 = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0';
    const input = `${hash1}\x00\x00John Doe\x00john@example.com\x00\x00\x001234567890\x00Self-authored\x00`;

    const commits = parseLineHistoryLog(input);

    assert.strictEqual(commits.length, 1);
    assert.strictEqual(commits[0].author, 'John Doe');
    assert.strictEqual(commits[0].email, 'john@example.com');
    assert.strictEqual(commits[0].committer, 'John Doe'); // fallback to author
    assert.strictEqual(commits[0].committerEmail, 'john@example.com'); // fallback to email
  });

  test('isBinaryFile should detect binary files', () => {
    assert.strictEqual(isBinaryFile('Binary files a.png and b.png differ'), true);
    assert.strictEqual(isBinaryFile('GIT binary patch'), true);
    assert.strictEqual(isBinaryFile('diff --git a/file.ts b/file.ts'), false);
    assert.strictEqual(isBinaryFile('--- a/file.ts\n+++ b/file.ts'), false);
  });

  test('parseGitLog should parse tags from decorations field', () => {
    const commitWithTag = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0\x00\x00John Doe\x00john@example.com\x001234567890\x00Release\x00\x00 (HEAD -> main, tag: v1.0.0, origin/main)\x00---COMMIT-END---';
    const commitNoTag = 'b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0\x00a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0\x00John Doe\x00john@example.com\x001234567900\x00Normal commit\x00\x00\x00---COMMIT-END---';

    const commits = parseGitLog(commitWithTag + '\n' + commitNoTag);

    assert.strictEqual(commits.length, 2);
    assert.deepStrictEqual(commits[0].tags, ['v1.0.0']);
    assert.ok(!commits[1].tags || commits[1].tags.length === 0);
  });

  test('parseGitLog should handle empty input', () => {
    const commits = parseGitLog('');
    assert.strictEqual(commits.length, 0);
  });

  test('parseGitLog should handle malformed commit gracefully', () => {
    // First is invalid (not enough fields), second is valid
    // Note: hash must be valid hex (0-9, a-f) and exactly 40 chars
    const invalidCommit = 'invalid\x00data\x00---COMMIT-END---';
    const validCommit = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0\x00\x00John Doe\x00john@example.com\x001234567890\x00Valid commit\x00\x00\x00---COMMIT-END---';
    const input = invalidCommit + '\n' + validCommit;

    const commits = parseGitLog(input);
    assert.strictEqual(commits.length, 1);
    assert.strictEqual(commits[0].author, 'John Doe');
  });

  test('parseGitLog should parse commit body into fullMessage', () => {
    // Format includes body field after subject
    const subject = 'Add new feature';
    const body = 'This commit adds a new feature\nwith multiple lines\nof description.';
    const commitWithBody = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0\x00\x00John Doe\x00john@example.com\x001234567890\x00' + subject + '\x00' + body + '\x00\x00---COMMIT-END---';

    const commits = parseGitLog(commitWithBody);

    assert.strictEqual(commits.length, 1);
    assert.strictEqual(commits[0].message, subject);
    assert.strictEqual(commits[0].fullMessage, subject + '\n\n' + body);
  });

  test('parseGitLog should handle commit without body', () => {
    // Empty body field
    const subject = 'Simple commit';
    const commitNoBody = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0\x00\x00John Doe\x00john@example.com\x001234567890\x00' + subject + '\x00\x00\x00---COMMIT-END---';

    const commits = parseGitLog(commitNoBody);

    assert.strictEqual(commits.length, 1);
    assert.strictEqual(commits[0].message, subject);
    assert.strictEqual(commits[0].fullMessage, subject);
  });

  test('parseGitLog should parse multiple tags from decorations', () => {
    const commitMultipleTags = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0\x00\x00John Doe\x00john@example.com\x001234567890\x00Release\x00\x00 (HEAD -> main, tag: v1.0.0, tag: v1.1.0)\x00---COMMIT-END---';

    const commits = parseGitLog(commitMultipleTags);

    assert.strictEqual(commits.length, 1);
    assert.deepStrictEqual(commits[0].tags, ['v1.0.0', 'v1.1.0']);
  });

  test('parseGitLog should parse tags with special characters', () => {
    const commitSpecial = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0\x00\x00John Doe\x00john@example.com\x001234567890\x00Release\x00\x00 (tag: release/v1.x, tag: v1.0.0-beta)\x00---COMMIT-END---';

    const commits = parseGitLog(commitSpecial);

    assert.strictEqual(commits.length, 1);
    assert.strictEqual(commits[0].tags![0], 'release/v1.x');
    assert.strictEqual(commits[0].tags![1], 'v1.0.0-beta');
  });

  test('parseGitLog should handle empty decorations', () => {
    const commitEmptyDecorations = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0\x00\x00John Doe\x00john@example.com\x001234567890\x00Commit\x00\x00\x00---COMMIT-END---';

    const commits = parseGitLog(commitEmptyDecorations);

    assert.strictEqual(commits.length, 1);
    assert.ok(!commits[0].tags || commits[0].tags.length === 0);
  });

  test('parseGitLog should return null for invalid date', () => {
    // Invalid timestamp (not a number)
    const commitInvalidDate = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0\x00\x00John Doe\x00john@example.com\x00invalid\x00Commit\x00\x00\x00---COMMIT-END---';
    // Followed by valid commit
    const validCommit = 'b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0\x00\x00John Doe\x00john@example.com\x001234567890\x00Valid\x00\x00\x00---COMMIT-END---';

    const commits = parseGitLog(commitInvalidDate + '\n' + validCommit);

    assert.strictEqual(commits.length, 1);
    assert.strictEqual(commits[0].hash, 'b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0');
  });

  test('parseGitLog should handle merge commits with multiple parents', () => {
    // Merge commit with two parents
    const mergeCommit = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0\x00parent1 parent2\x00Jane Doe\x00jane@example.com\x001234567890\x00Merge branch\x00\x00\x00---COMMIT-END---';

    const commits = parseGitLog(mergeCommit);

    assert.strictEqual(commits.length, 1);
    assert.deepStrictEqual(commits[0].parentHashes, ['parent1', 'parent2']);
  });

  test('parseGitLog should parse GPG signature status (verified)', () => {
    // G = good/verified signature, with signer name
    const commitWithSig = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0\x00\x00' +
      'John Doe\x00john@example.com\x001234567890\x00Signed commit\x00\x00\x00G\x00Alice Smith <alice@example.com>\x00---COMMIT-END---';

    const commits = parseGitLog(commitWithSig);

    assert.strictEqual(commits.length, 1);
    assert.strictEqual(commits[0].signature?.verified, true);
    assert.strictEqual(commits[0].signature?.signer, 'Alice Smith <alice@example.com>');
  });

  test('parseGitLog should parse invalid signature', () => {
    // B = bad signature
    const commitBadSig = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0\x00\x00' +
      'John Doe\x00john@example.com\x001234567890\x00Bad signed commit\x00\x00\x00B\x00\x00---COMMIT-END---';

    const commits = parseGitLog(commitBadSig);

    assert.strictEqual(commits.length, 1);
    assert.strictEqual(commits[0].signature?.verified, false);
    assert.strictEqual(commits[0].signature?.signer, null);
  });

  test('parseGitLog should handle unsigned commits (N)', () => {
    // N = no signature
    const commitUnsigned = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0\x00\x00' +
      'John Doe\x00john@example.com\x001234567890\x00Unsigned commit\x00\x00\x00N\x00\x00---COMMIT-END---';

    const commits = parseGitLog(commitUnsigned);

    assert.strictEqual(commits.length, 1);
    assert.strictEqual(commits[0].signature, undefined);
  });

  test('parseGitLog should handle expired signature (X)', () => {
    // X = good signature that has expired
    const commitExpiredSig = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0\x00\x00' +
      'John Doe\x00john@example.com\x001234567890\x00Expired sig commit\x00\x00\x00X\x00Bob <bob@example.com>\x00---COMMIT-END---';

    const commits = parseGitLog(commitExpiredSig);

    assert.strictEqual(commits.length, 1);
    assert.strictEqual(commits[0].signature?.verified, false);
    assert.strictEqual(commits[0].signature?.signer, 'Bob <bob@example.com>');
  });

  test('parseGitLog should handle untrusted signature (U)', () => {
    // U = good signature with unknown validity
    const commitUntrustedSig = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0\x00\x00' +
      'John Doe\x00john@example.com\x001234567890\x00Untrusted sig\x00\x00\x00U\x00\x00---COMMIT-END---';

    const commits = parseGitLog(commitUntrustedSig);

    assert.strictEqual(commits.length, 1);
    assert.strictEqual(commits[0].signature?.verified, false);
    assert.strictEqual(commits[0].signature?.signer, null);
  });
});
