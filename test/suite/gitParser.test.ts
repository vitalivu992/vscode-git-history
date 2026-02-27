import * as assert from 'assert';
import { parseGitLog, parseNameStatus, parseLineHistoryLog, isBinaryFile } from '../../src/git/gitParser';

suite('Git Parser Tests', () => {
  test('parseGitLog should parse commit blocks', () => {
    // Format: %H%x00%an%x00%ae%x00%at%x00%s%x00%b%x00---COMMIT-END---%n
    // Note: hashes must be valid hex (0-9, a-f) for the parser to accept them
    const commit1 = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0\x00John Doe\x00john@example.com\x001234567890\x00Initial commit\x00\x00---COMMIT-END---';
    const commit2 = 'b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0\x00Jane Smith\x00jane@example.com\x001234567900\x00Add feature\x00This adds a new feature.\x00---COMMIT-END---';
    const input = commit1 + '\n' + commit2;

    const commits = parseGitLog(input);

    assert.strictEqual(commits.length, 2);
    assert.strictEqual(commits[0].hash, 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0');
    assert.strictEqual(commits[0].shortHash, 'a1b2c3d');
    assert.strictEqual(commits[0].author, 'John Doe');
    assert.strictEqual(commits[0].email, 'john@example.com');
    assert.strictEqual(commits[0].message, 'Initial commit');

    assert.strictEqual(commits[1].hash, 'b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0');
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

  test('parseLineHistoryLog should parse -L output', () => {
    // Note: hashes must be valid hex (0-9, a-f)
    const input = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0 John Doe <john@example.com> 1234567890 Added line\nb1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0 Jane Smith <jane@example.com> 1234567900 Modified line';

    const commits = parseLineHistoryLog(input);

    assert.strictEqual(commits.length, 2);
    assert.strictEqual(commits[0].hash, 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0');
    assert.strictEqual(commits[0].author, 'John Doe');
    assert.strictEqual(commits[0].message, 'Added line');
    assert.strictEqual(commits[1].message, 'Modified line');
  });

  test('isBinaryFile should detect binary files', () => {
    assert.strictEqual(isBinaryFile('Binary files a.png and b.png differ'), true);
    assert.strictEqual(isBinaryFile('GIT binary patch'), true);
    assert.strictEqual(isBinaryFile('diff --git a/file.ts b/file.ts'), false);
    assert.strictEqual(isBinaryFile('--- a/file.ts\n+++ b/file.ts'), false);
  });

  test('parseGitLog should handle empty input', () => {
    const commits = parseGitLog('');
    assert.strictEqual(commits.length, 0);
  });

  test('parseGitLog should handle malformed commit gracefully', () => {
    // First is invalid (not enough fields), second is valid
    // Note: hash must be valid hex (0-9, a-f) and exactly 40 chars
    const invalidCommit = 'invalid\x00data\x00---COMMIT-END---';
    const validCommit = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0\x00John Doe\x00john@example.com\x001234567890\x00Valid commit\x00\x00---COMMIT-END---';
    const input = invalidCommit + '\n' + validCommit;

    const commits = parseGitLog(input);
    assert.strictEqual(commits.length, 1);
    assert.strictEqual(commits[0].author, 'John Doe');
  });
});
