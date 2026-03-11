import * as assert from 'assert';
import * as path from 'path';

// Load graphLayout.js directly from source (it's a plain JS browser file, not compiled by TS)
const { computeGraphLayout } = require(path.resolve(__dirname, '../../../src/webview/panel/graphLayout'));

interface GraphCell {
  nodeCol: number;
  nodeColor: number;
  segments: Array<{ type: string; col?: number; fromCol?: number; toCol?: number; color: number }>;
  maxColumns: number;
}

function makeCommit(hash: string, parentHashes: string[]): { hash: string; parentHashes: string[] } {
  return { hash, parentHashes };
}

suite('Graph Layout Tests', () => {
  test('empty list returns empty array', () => {
    const result = computeGraphLayout([]);
    assert.deepStrictEqual(result, []);
  });

  test('null/undefined returns empty array', () => {
    assert.deepStrictEqual(computeGraphLayout(null), []);
    assert.deepStrictEqual(computeGraphLayout(undefined), []);
  });

  test('single commit with no parents (root)', () => {
    const commits = [makeCommit('aaaa', [])];
    const result: GraphCell[] = computeGraphLayout(commits);

    assert.strictEqual(result.length, 1);
    const cell = result[0];
    assert.strictEqual(cell.nodeCol, 0);
    assert.strictEqual(typeof cell.nodeColor, 'number');
    assert.ok(Array.isArray(cell.segments));
    // Root commit: no top-half (not in lane before), no bottom-half (no parents)
    const hasTopHalf = cell.segments.some(s => s.type === 'top-half');
    const hasBottomHalf = cell.segments.some(s => s.type === 'bottom-half');
    assert.strictEqual(hasTopHalf, false);
    assert.strictEqual(hasBottomHalf, false);
  });

  test('linear history - single vertical line', () => {
    const c1 = 'aaaa';
    const c2 = 'bbbb';
    const c3 = 'cccc';
    const commits = [
      makeCommit(c3, [c2]), // newest
      makeCommit(c2, [c1]),
      makeCommit(c1, [])    // root
    ];
    const result: GraphCell[] = computeGraphLayout(commits);

    assert.strictEqual(result.length, 3);

    // All commits should be in column 0 (linear history = one lane)
    for (const cell of result) {
      assert.strictEqual(cell.nodeCol, 0, 'Linear history: all nodes in column 0');
    }

    // First commit (c3): no top-half (first in lane), has bottom-half (has parent c2)
    assert.strictEqual(result[0].segments.some(s => s.type === 'top-half'), false);
    assert.strictEqual(result[0].segments.some(s => s.type === 'bottom-half'), true);

    // Middle commit (c2): has top-half and bottom-half
    assert.strictEqual(result[1].segments.some(s => s.type === 'top-half'), true);
    assert.strictEqual(result[1].segments.some(s => s.type === 'bottom-half'), true);

    // Root commit (c1): has top-half (was tracked from c2), no bottom-half (root)
    assert.strictEqual(result[2].segments.some(s => s.type === 'top-half'), true);
    assert.strictEqual(result[2].segments.some(s => s.type === 'bottom-half'), false);
  });

  test('merge commit has two parents - produces merge segment', () => {
    const main = 'aaaa';
    const branch = 'bbbb';
    const base = 'cccc';
    const merge = 'dddd';
    // merge commit joins main and branch, both descend from base
    const commits = [
      makeCommit(merge, [main, branch]), // merge commit (newest)
      makeCommit(main, [base]),
      makeCommit(branch, [base]),
      makeCommit(base, [])
    ];
    const result: GraphCell[] = computeGraphLayout(commits);

    assert.strictEqual(result.length, 4);

    // First cell (merge commit) should have a 'merge' segment
    const mergeCell = result[0];
    const hasMergeSegment = mergeCell.segments.some(s => s.type === 'merge');
    assert.strictEqual(hasMergeSegment, true, 'Merge commit should have a merge segment');
  });

  test('multiple parallel branches', () => {
    // Two independent commits (no shared history)
    const commits = [
      makeCommit('aaaa', []),
      makeCommit('bbbb', [])
    ];
    const result: GraphCell[] = computeGraphLayout(commits);

    assert.strictEqual(result.length, 2);
    // Each commit is a new branch head: they should be in different columns or same (both are roots)
    // First commit takes col 0
    assert.strictEqual(result[0].nodeCol, 0);
    // After first commit terminates (root, no parents), second takes col 0 again
    assert.strictEqual(result[1].nodeCol, 0);
  });

  test('max columns capped at 10', () => {
    // Create a scenario with many parallel branches to test cap
    const commits = [];
    // 12 independent root commits
    for (let i = 0; i < 12; i++) {
      const hash = i.toString().padStart(4, '0');
      commits.push(makeCommit(hash, []));
    }
    const result: GraphCell[] = computeGraphLayout(commits);

    for (const cell of result) {
      assert.ok(cell.maxColumns <= 10, `maxColumns should be capped at 10, got ${cell.maxColumns}`);
    }
  });

  test('commit with missing parentHashes field (backwards compat)', () => {
    // parentHashes undefined should be handled gracefully
    const commits = [{ hash: 'aaaa' }]; // no parentHashes field
    const result: GraphCell[] = computeGraphLayout(commits as any);

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].nodeCol, 0);
  });

  test('filtered subset with broken parent chains', () => {
    // Simulate a filtered list where parent commits are not present
    const commits = [
      makeCommit('cccc', ['bbbb']), // parent 'bbbb' not in list
      makeCommit('aaaa', [])
    ];
    const result: GraphCell[] = computeGraphLayout(commits);

    assert.strictEqual(result.length, 2);
    // Should not throw; lanes for missing parents are opened but may not close
    assert.strictEqual(typeof result[0].nodeCol, 'number');
    assert.strictEqual(typeof result[1].nodeCol, 'number');
  });
});
