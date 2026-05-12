import * as assert from 'assert';
import { CommitInfo } from '../../src/types';
import { formatCommitsAsMarkdown } from '../../src/webview/messageHandler';

type TestCommitInfo = CommitInfo;

suite('Markdown Formatter Unit Tests', () => {
  const sampleCommits: TestCommitInfo[] = [
    {
      hash: 'abc123def456abc123def456abc123def456abc1',
      shortHash: 'abc123d',
      parentHashes: ['0000000000000000000000000000000000000000'],
      author: 'Alice Cooper',
      email: 'alice@example.com',
      date: '2024-01-15T10:30:00Z',
      message: 'Initial commit',
      fullMessage: 'Initial commit\n\nThis is the first commit',
      tags: ['v1.0.0'],
      stats: {
        filesChanged: 3,
        insertions: 150,
        deletions: 0
      }
    },
    {
      hash: 'def456abc123def456abc123def456abc123def4',
      shortHash: 'def456a',
      parentHashes: ['abc123def456abc123def456abc123def456abc1'],
      author: 'Bob Marley',
      email: 'bob@company.org',
      date: '2024-01-16T14:45:00Z',
      message: 'Add feature X',
      fullMessage: 'Add feature X',
      tags: ['v1.1.0', 'release'],
      stats: {
        filesChanged: 5,
        insertions: 200,
        deletions: 50
      }
    },
    {
      hash: '123abc456def789abc123def456abc789def123a',
      shortHash: '123abc4',
      parentHashes: ['def456abc123def456abc123def456abc123def4'],
      author: 'Charlie Day',
      email: 'charlie@example.com',
      date: '2024-01-17T09:00:00Z',
      message: 'Fix bug in parser',
      fullMessage: 'Fix bug in parser\n\nCloses #123',
      tags: undefined,
      stats: undefined
    }
  ];

  test('formatCommitsAsMarkdown contains ### heading with short hash', () => {
    const result = formatCommitsAsMarkdown([sampleCommits[0]]);
    assert.ok(result.includes('### abc123d'));
  });

  test('formatCommitsAsMarkdown includes stats in heading', () => {
    const result = formatCommitsAsMarkdown([sampleCommits[0]]);
    assert.ok(result.includes('(3 files, +150, -0)'));
  });

  test('formatCommitsAsMarkdown includes tags as inline code', () => {
    const result = formatCommitsAsMarkdown([sampleCommits[0]]);
    assert.ok(result.includes('`v1.0.0`'));
  });

  test('formatCommitsAsMarkdown includes author with email', () => {
    const result = formatCommitsAsMarkdown([sampleCommits[0]]);
    assert.ok(result.includes('**Author:** Alice Cooper <alice@example.com>'));
  });

  test('formatCommitsAsMarkdown includes date', () => {
    const result = formatCommitsAsMarkdown([sampleCommits[0]]);
    assert.ok(result.includes('**Date:** 2024-01-15T10:30:00Z'));
  });

  test('formatCommitsAsMarkdown includes message', () => {
    const result = formatCommitsAsMarkdown([sampleCommits[0]]);
    assert.ok(result.includes('Initial commit'));
  });

  test('formatCommitsAsMarkdown shows body when fullMessage differs', () => {
    const result = formatCommitsAsMarkdown([sampleCommits[0]]);
    assert.ok(result.includes('---'));
    assert.ok(result.includes('This is the first commit'));
  });

  test('formatCommitsAsMarkdown handles commit without body', () => {
    const result = formatCommitsAsMarkdown([sampleCommits[1]]);
    assert.ok(!result.includes('---'));
  });

  test('formatCommitsAsMarkdown handles multiple tags', () => {
    const result = formatCommitsAsMarkdown([sampleCommits[1]]);
    assert.ok(result.includes('`v1.1.0`'));
    assert.ok(result.includes('`release`'));
  });

  test('formatCommitsAsMarkdown handles single file stats', () => {
    const singleFileCommit = { ...sampleCommits[1], stats: { filesChanged: 1, insertions: 10, deletions: 2 } };
    const result = formatCommitsAsMarkdown([singleFileCommit]);
    assert.ok(result.includes('(1 file, +10, -2)'));
  });

  test('formatCommitsAsMarkdown handles commit without stats', () => {
    const result = formatCommitsAsMarkdown([sampleCommits[2]]);
    assert.ok(!result.includes('(')); // No stats parentheses
    assert.ok(result.includes('### 123abc4'));
  });

  test('formatCommitsAsMarkdown handles commit without tags', () => {
    const result = formatCommitsAsMarkdown([sampleCommits[2]]);
    assert.ok(!result.includes('`'));
  });

  test('formatCommitsAsMarkdown formats multiple commits', () => {
    const result = formatCommitsAsMarkdown(sampleCommits);
    const sections = result.split('### ');
    // Should have 4 sections: empty intro + 3 commits
    assert.strictEqual(sections.length, 4);
  });

  test('formatCommitsAsMarkdown handles empty commits array', () => {
    const result = formatCommitsAsMarkdown([]);
    assert.strictEqual(result, '');
  });
});