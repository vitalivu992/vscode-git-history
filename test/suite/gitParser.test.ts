import * as assert from 'assert';
import { parseGitLog, parseNameStatus, parseLineHistoryLog, isBinaryFile } from '../../src/git/gitParser';

suite('Git Parser Tests', () => {
  test('parseGitLog should parse commit blocks', () => {
    const input = `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
author John Doe <john@example.com>
date 1234567890
msg Initial commit
fullmessage Initial commit
---COMMIT-END---
b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1
author Jane Smith <jane@example.com>
date 1234567900
msg Add feature
fullmessage Add feature

This adds a new feature.
---COMMIT-END---`;

    const commits = parseGitLog(input);

    assert.strictEqual(commits.length, 2);
    assert.strictEqual(commits[0].hash, 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0');
    assert.strictEqual(commits[0].shortHash, 'a1b2c3d');
    assert.strictEqual(commits[0].author, 'John Doe');
    assert.strictEqual(commits[0].email, 'john@example.com');
    assert.strictEqual(commits[0].message, 'Initial commit');

    assert.strictEqual(commits[1].hash, 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1');
    assert.strictEqual(commits[1].author, 'Jane Smith');
    assert.strictEqual(commits[1].message, 'Add feature');
  });

  test('parseNameStatus should parse file changes', () => {
    const input = `M\tsrc/file.ts
A\tnewfile.js
D\tdeleted.txt
R100\told.ts\tpath/to/new.ts`;

    const result = parseNameStatus(input);

    assert.strictEqual(result.size, 4);
    assert.deepStrictEqual(result.get('src/file.ts'), { status: 'M' });
    assert.deepStrictEqual(result.get('newfile.js'), { status: 'A' });
    assert.deepStrictEqual(result.get('deleted.txt'), { status: 'D' });
    assert.deepStrictEqual(result.get('path/to/new.ts'), { status: 'R', previousPath: 'old.ts' });
  });

  test('parseLineHistoryLog should parse -L output', () => {
    const input = `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0 John Doe <john@example.com> 1234567890 Added line
b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1 Jane Smith <jane@example.com> 1234567900 Modified line`;

    const commits = parseLineHistoryLog(input);

    assert.strictEqual(commits.length, 2);
    assert.strictEqual(commits[0].hash, 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0');
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
    const input = `invalid commit data
---COMMIT-END---
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
author John Doe <john@example.com>
date 1234567890
msg Valid commit
fullmessage Valid commit
---COMMIT-END---`;

    const commits = parseGitLog(input);
    assert.strictEqual(commits.length, 1);
    assert.strictEqual(commits[0].author, 'John Doe');
  });
});
