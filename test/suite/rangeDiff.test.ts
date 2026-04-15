import * as assert from 'assert';
import * as path from 'path';

interface TestCommit {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  message: string;
  date: string;
}

// Simulates the range selection logic from main.js
function handleRangeSelection(
  anchorHash: string,
  targetHash: string,
  commits: TestCommit[]
): string[] {
  const anchorIndex = commits.findIndex(c => c.hash === anchorHash);
  const targetIndex = commits.findIndex(c => c.hash === targetHash);

  if (anchorIndex === -1 || targetIndex === -1) {
    return [];
  }

  const startIndex = Math.min(anchorIndex, targetIndex);
  const endIndex = Math.max(anchorIndex, targetIndex);

  const selectedHashes: string[] = [];
  for (let i = startIndex; i <= endIndex; i++) {
    selectedHashes.push(commits[i].hash);
  }

  return selectedHashes;
}

// Simulates finding commits in order
function getOrderedCommits(commits: TestCommit[], sortOldestFirst: boolean): TestCommit[] {
  if (sortOldestFirst) {
    return [...commits].reverse();
  }
  return [...commits];
}

suite('Range Selection (Compare Any Two Commits) Tests', () => {
  const commits: TestCommit[] = [
    {
      hash: 'dddddddddddddddddddddddddddddddddddddddd',
      shortHash: 'ddddddd',
      author: 'Diana Prince',
      email: 'diana@example.com',
      message: 'Latest: Add feature Z',
      date: '2024-01-20T10:00:00Z'
    },
    {
      hash: 'cccccccccccccccccccccccccccccccccccccccc',
      shortHash: 'ccccccc',
      author: 'Charlie Day',
      email: 'charlie@example.com',
      message: 'Fix bug in parser',
      date: '2024-01-17T09:15:00Z'
    },
    {
      hash: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      shortHash: 'bbbbbbb',
      author: 'Bob Marley',
      email: 'bob@company.org',
      message: 'Add feature X',
      date: '2024-01-16T14:45:00Z'
    },
    {
      hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      shortHash: 'aaaaaaa',
      author: 'Alice Cooper',
      email: 'alice@example.com',
      message: 'Initial commit',
      date: '2024-01-15T10:30:00Z'
    }
  ];

  test('handleRangeSelection should select all commits between anchor and target', () => {
    const anchorHash = commits[0].hash; // Latest commit
    const targetHash = commits[2].hash; // Third commit

    const selected = handleRangeSelection(anchorHash, targetHash, commits);

    assert.strictEqual(selected.length, 3);
    assert.strictEqual(selected[0], commits[0].hash);
    assert.strictEqual(selected[1], commits[1].hash);
    assert.strictEqual(selected[2], commits[2].hash);
  });

  test('handleRangeSelection should work regardless of click order', () => {
    // Click older first, then newer
    const selected1 = handleRangeSelection(commits[3].hash, commits[1].hash, commits);

    // Click newer first, then older
    const selected2 = handleRangeSelection(commits[1].hash, commits[3].hash, commits);

    // Both should select the same range
    assert.deepStrictEqual(selected1, selected2);
    assert.strictEqual(selected1.length, 3);
    assert.strictEqual(selected1[0], commits[3].hash);
    assert.strictEqual(selected1[1], commits[2].hash);
    assert.strictEqual(selected1[2], commits[1].hash);
  });

  test('handleRangeSelection should handle adjacent commits', () => {
    const selected = handleRangeSelection(commits[0].hash, commits[1].hash, commits);

    assert.strictEqual(selected.length, 2);
    assert.strictEqual(selected[0], commits[0].hash);
    assert.strictEqual(selected[1], commits[1].hash);
  });

  test('handleRangeSelection should return single commit when anchor equals target', () => {
    const selected = handleRangeSelection(commits[1].hash, commits[1].hash, commits);

    assert.strictEqual(selected.length, 1);
    assert.strictEqual(selected[0], commits[1].hash);
  });

  test('handleRangeSelection should return empty array for invalid hashes', () => {
    const selected = handleRangeSelection('invalidhash', commits[0].hash, commits);

    assert.strictEqual(selected.length, 0);
  });

  test('getOrderedCommits should return commits in original order when newest first', () => {
    const ordered = getOrderedCommits(commits, false);

    assert.strictEqual(ordered[0].hash, commits[0].hash);
    assert.strictEqual(ordered[1].hash, commits[1].hash);
    assert.strictEqual(ordered[2].hash, commits[2].hash);
    assert.strictEqual(ordered[3].hash, commits[3].hash);
  });

  test('getOrderedCommits should reverse commits when oldest first', () => {
    const ordered = getOrderedCommits(commits, true);

    assert.strictEqual(ordered[0].hash, commits[3].hash);
    assert.strictEqual(ordered[1].hash, commits[2].hash);
    assert.strictEqual(ordered[2].hash, commits[1].hash);
    assert.strictEqual(ordered[3].hash, commits[0].hash);
  });

  test('range selection should work with oldest-first ordering', () => {
    const ordered = getOrderedCommits(commits, true);
    const anchorHash = ordered[0].hash; // Oldest
    const targetHash = ordered[2].hash; // Third oldest

    const selected = handleRangeSelection(anchorHash, targetHash, ordered);

    assert.strictEqual(selected.length, 3);
    assert.strictEqual(selected[0], ordered[0].hash);
    assert.strictEqual(selected[1], ordered[1].hash);
    assert.strictEqual(selected[2], ordered[2].hash);
  });

  test('range selection end hashes should be the anchor and target', () => {
    const anchorHash = commits[0].hash;
    const targetHash = commits[3].hash;

    const selected = handleRangeSelection(anchorHash, targetHash, commits);

    // The range endpoints should be the original anchor and target
    assert.strictEqual(selected[0], anchorHash);
    assert.strictEqual(selected[selected.length - 1], targetHash);
  });
});

suite('Range Diff Source Verification', () => {
  test('types.ts should have requestRangeDiff message type', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("'requestRangeDiff'"),
      'types.ts should have requestRangeDiff message type');
  });

  test('types.ts should have rangeDiff response type', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("| { type: 'rangeDiff'"),
      'types.ts should have rangeDiff response type');
  });

  test('types.ts rangeDiff should have fromHash and toHash fields', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes('fromHash') && source.includes('toHash'),
      'types.ts rangeDiff should have fromHash and toHash fields');
  });

  test('gitService.ts should have getCommitRangeDiff function', () => {
    const fs = require('fs');
    const servicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
    const source = fs.readFileSync(servicePath, 'utf-8');

    assert.ok(source.includes('export async function getCommitRangeDiff'),
      'gitService.ts should have getCommitRangeDiff function');
  });

  test('gitService.ts getCommitRangeDiff should use git diff command', () => {
    const fs = require('fs');
    const servicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
    const source = fs.readFileSync(servicePath, 'utf-8');

    assert.ok(source.includes("'diff'") && source.includes('fromHash') && source.includes('toHash'),
      'getCommitRangeDiff should use git diff with fromHash..toHash');
  });

  test('messageHandler.ts should handle requestRangeDiff case', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes("case 'requestRangeDiff':"),
      'messageHandler.ts should handle requestRangeDiff case');
  });

  test('messageHandler.ts should have handleRequestRangeDiff function', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('async function handleRequestRangeDiff'),
      'messageHandler.ts should have handleRequestRangeDiff function');
  });

  test('messageHandler.ts should call getCommitRangeDiff', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('getCommitRangeDiff'),
      'messageHandler.ts should call getCommitRangeDiff');
  });

  test('main.js should have rangeSelectionAnchor variable', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('rangeSelectionAnchor'),
      'main.js should have rangeSelectionAnchor variable');
  });

  test('main.js should have handleRangeSelection function', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleRangeSelection'),
      'main.js should have handleRangeSelection function');
  });

  test('main.js should have requestRangeDiff function', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("type: 'requestRangeDiff'"),
      'main.js should send requestRangeDiff message');
  });

  test('main.js click handler should handle Shift+click', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('e.shiftKey') && source.includes('handleRangeSelection'),
      'main.js click handler should handle Shift+click for range selection');
  });

  test('main.js should have updateCommitDetailHeaderForRange function', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function updateCommitDetailHeaderForRange'),
      'main.js should have updateCommitDetailHeaderForRange function');
  });

  test('main.js should handle rangeDiff message type', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'rangeDiff':"),
      'main.js handleMessage should handle rangeDiff case');
  });

  test('main.js should set rangeSelectionAnchor on single click', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('rangeSelectionAnchor = commit.hash'),
      'main.js should set rangeSelectionAnchor on click');
  });

  test('main.js clearSelection should reset rangeSelectionAnchor', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('rangeSelectionAnchor = null'),
      'main.js clearSelection should reset rangeSelectionAnchor');
  });
});
