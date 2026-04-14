import * as assert from 'assert';
import { parseCommitStats, extractStatsFromCommitBlock, parseMultipleCommitStats } from '../../src/git/gitStatsParser';

suite('Git Stats Parser Tests', () => {
  test('parseCommitStats should parse standard stat line', () => {
    const statLine = '3 files changed, 45 insertions(+), 12 deletions(-)';
    const result = parseCommitStats(statLine);

    assert.strictEqual(result.filesChanged, 3);
    assert.strictEqual(result.insertions, 45);
    assert.strictEqual(result.deletions, 12);
  });

  test('parseCommitStats should parse single file changed', () => {
    const statLine = '1 file changed, 5 insertions(+)';
    const result = parseCommitStats(statLine);

    assert.strictEqual(result.filesChanged, 1);
    assert.strictEqual(result.insertions, 5);
    assert.strictEqual(result.deletions, 0);
  });

  test('parseCommitStats should parse only deletions', () => {
    const statLine = '2 files changed, 10 deletions(-)';
    const result = parseCommitStats(statLine);

    assert.strictEqual(result.filesChanged, 2);
    assert.strictEqual(result.insertions, 0);
    assert.strictEqual(result.deletions, 10);
  });

  test('parseCommitStats should parse single insertion/deletion singular forms', () => {
    const statLine = '1 file changed, 1 insertion(+), 1 deletion(-)';
    const result = parseCommitStats(statLine);

    assert.strictEqual(result.filesChanged, 1);
    assert.strictEqual(result.insertions, 1);
    assert.strictEqual(result.deletions, 1);
  });

  test('parseCommitStats should handle binary file stats', () => {
    const statLine = '1 file changed, 0 insertions(+), 0 deletions(-)';
    const result = parseCommitStats(statLine);

    assert.strictEqual(result.filesChanged, 1);
    assert.strictEqual(result.insertions, 0);
    assert.strictEqual(result.deletions, 0);
  });

  test('parseCommitStats should handle large numbers', () => {
    const statLine = '25 files changed, 1500 insertions(+), 800 deletions(-)';
    const result = parseCommitStats(statLine);

    assert.strictEqual(result.filesChanged, 25);
    assert.strictEqual(result.insertions, 1500);
    assert.strictEqual(result.deletions, 800);
  });

  test('parseCommitStats should return zeros for empty input', () => {
    const result = parseCommitStats('');

    assert.strictEqual(result.filesChanged, 0);
    assert.strictEqual(result.insertions, 0);
    assert.strictEqual(result.deletions, 0);
  });

  test('parseCommitStats should return zeros for unmatched input', () => {
    const result = parseCommitStats('some random text without stats');

    assert.strictEqual(result.filesChanged, 0);
    assert.strictEqual(result.insertions, 0);
    assert.strictEqual(result.deletions, 0);
  });

  test('extractStatsFromCommitBlock should find stats in commit output', () => {
    const block = `
commit a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0
Author: John Doe <john@example.com>
Date:   Mon Jan 1 00:00:00 2024 +0000

    Add feature

 src/file.ts | 10 ++++++----
 1 file changed, 6 insertions(+), 4 deletions(-)
    `.trim();

    const result = extractStatsFromCommitBlock(block);

    assert.strictEqual(result.filesChanged, 1);
    assert.strictEqual(result.insertions, 6);
    assert.strictEqual(result.deletions, 4);
  });

  test('extractStatsFromCommitBlock should handle multiple files', () => {
    const block = `
src/file1.ts | 10 ++++++-----
src/file2.ts | 5 +++--
src/file3.ts | 20 +++++++++++++++
 3 files changed, 25 insertions(+), 10 deletions(-)
    `.trim();

    const result = extractStatsFromCommitBlock(block);

    assert.strictEqual(result.filesChanged, 3);
    assert.strictEqual(result.insertions, 25);
    assert.strictEqual(result.deletions, 10);
  });

  test('extractStatsFromCommitBlock should return zeros for empty block', () => {
    const result = extractStatsFromCommitBlock('');

    assert.strictEqual(result.filesChanged, 0);
    assert.strictEqual(result.insertions, 0);
    assert.strictEqual(result.deletions, 0);
  });

  test('extractStatsFromCommitBlock should return zeros when no stats line', () => {
    const block = `
commit a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0
Author: John Doe <john@example.com>

    Some commit without stats
    `.trim();

    const result = extractStatsFromCommitBlock(block);

    assert.strictEqual(result.filesChanged, 0);
    assert.strictEqual(result.insertions, 0);
    assert.strictEqual(result.deletions, 0);
  });

  test('parseMultipleCommitStats should parse multiple commits', () => {
    const output = `
commit abc123...
 1 file changed, 5 insertions(+)
---COMMIT-END---
commit def456...
 2 files changed, 10 insertions(+), 3 deletions(-)
---COMMIT-END---
    `.trim();

    const results = parseMultipleCommitStats(output);

    assert.strictEqual(results.length, 2);
    assert.strictEqual(results[0].filesChanged, 1);
    assert.strictEqual(results[0].insertions, 5);
    assert.strictEqual(results[0].deletions, 0);
    assert.strictEqual(results[1].filesChanged, 2);
    assert.strictEqual(results[1].insertions, 10);
    assert.strictEqual(results[1].deletions, 3);
  });

  test('parseMultipleCommitStats should handle empty input', () => {
    const results = parseMultipleCommitStats('');

    assert.strictEqual(results.length, 0);
  });

  test('parseMultipleCommitStats should handle whitespace-only blocks', () => {
    const output = '---COMMIT-END------COMMIT-END---';

    const results = parseMultipleCommitStats(output);

    assert.strictEqual(results.length, 0);
  });

  test('parseMultipleCommitStats should handle single commit without separator', () => {
    const output = `
src/file.ts | 10 ++++++-----
 1 file changed, 6 insertions(+), 4 deletions(-)
    `.trim();

    const results = parseMultipleCommitStats(output);

    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].filesChanged, 1);
    assert.strictEqual(results[0].insertions, 6);
    assert.strictEqual(results[0].deletions, 4);
  });

  test('parseCommitStats should handle stats with only files changed (no insertions/deletions)', () => {
    // This case occurs with mode changes or empty commits
    const statLine = '1 file changed';
    const result = parseCommitStats(statLine);

    assert.strictEqual(result.filesChanged, 1);
    assert.strictEqual(result.insertions, 0);
    assert.strictEqual(result.deletions, 0);
  });

  test('parseCommitStats should handle commit with 0 files changed', () => {
    const statLine = '0 files changed';
    const result = parseCommitStats(statLine);

    assert.strictEqual(result.filesChanged, 0);
    assert.strictEqual(result.insertions, 0);
    assert.strictEqual(result.deletions, 0);
  });
});
