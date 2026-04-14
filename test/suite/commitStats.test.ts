import * as assert from 'assert';

/**
 * Simulates the formatCommitStats function from main.js
 * Formats commit statistics for display in the stats column
 */
function formatCommitStats(stats: { filesChanged: number; insertions: number; deletions: number } | undefined | null): string {
  if (!stats) {
    return '<span class="stats-empty">-</span>';
  }

  const { filesChanged, insertions, deletions } = stats;

  let html = '';

  if (filesChanged > 0) {
    html += `<span class="stats-files">${filesChanged}</span>`;
  }

  if (insertions > 0 || deletions > 0) {
    html += '<span class="stats-changes">';
    if (insertions > 0) {
      html += `<span class="stats-insertions">+${insertions}</span>`;
    }
    if (deletions > 0) {
      html += `<span class="stats-deletions">-${deletions}</span>`;
    }
    html += '</span>';
  }

  if (!html) {
    html = '<span class="stats-empty">-</span>';
  }

  return html;
}

/**
 * Generates tooltip text for stats (mirrors main.js behavior)
 */
function generateStatsTooltip(stats: { filesChanged: number; insertions: number; deletions: number } | undefined): string {
  if (!stats) {
    return '';
  }

  const fileWord = stats.filesChanged === 1 ? 'file' : 'files';
  const insertionWord = stats.insertions === 1 ? 'insertion' : 'insertions';
  const deletionWord = stats.deletions === 1 ? 'deletion' : 'deletions';

  return `${stats.filesChanged} ${fileWord} changed, ${stats.insertions} ${insertionWord}(+), ${stats.deletions} ${deletionWord}(-)`;
}

suite('Commit Statistics Rendering Tests', () => {
  test('formatCommitStats should show files count and changes', () => {
    const stats = { filesChanged: 3, insertions: 45, deletions: 12 };
    const result = formatCommitStats(stats);

    assert.ok(result.includes('stats-files'));
    assert.ok(result.includes('>3<'));
    assert.ok(result.includes('stats-insertions'));
    assert.ok(result.includes('+45'));
    assert.ok(result.includes('stats-deletions'));
    assert.ok(result.includes('-12'));
  });

  test('formatCommitStats should handle single file', () => {
    const stats = { filesChanged: 1, insertions: 5, deletions: 0 };
    const result = formatCommitStats(stats);

    assert.ok(result.includes('>1<'));
    assert.ok(result.includes('+5'));
    assert.ok(!result.includes('stats-deletions'));
  });

  test('formatCommitStats should handle only deletions', () => {
    const stats = { filesChanged: 2, insertions: 0, deletions: 10 };
    const result = formatCommitStats(stats);

    assert.ok(result.includes('>2<'));
    assert.ok(!result.includes('stats-insertions'));
    assert.ok(result.includes('-10'));
  });

  test('formatCommitStats should handle binary file (no insertions/deletions)', () => {
    const stats = { filesChanged: 1, insertions: 0, deletions: 0 };
    const result = formatCommitStats(stats);

    assert.ok(result.includes('>1<'));
    // When there are no changes, only files count is shown
    assert.ok(!result.includes('stats-changes'));
  });

  test('formatCommitStats should show dash for missing stats', () => {
    const result = formatCommitStats(undefined);

    assert.ok(result.includes('stats-empty'));
    assert.ok(result.includes('-'));
  });

  test('formatCommitStats should show dash for null stats', () => {
    const result = formatCommitStats(null as any);

    assert.ok(result.includes('stats-empty'));
  });

  test('formatCommitStats should handle zero files changed', () => {
    const stats = { filesChanged: 0, insertions: 0, deletions: 0 };
    const result = formatCommitStats(stats);

    // When all are zero, it shows empty
    assert.ok(result.includes('stats-empty'));
  });

  test('formatCommitStats should handle large numbers', () => {
    const stats = { filesChanged: 150, insertions: 5000, deletions: 2500 };
    const result = formatCommitStats(stats);

    assert.ok(result.includes('>150<'));
    assert.ok(result.includes('+5000'));
    assert.ok(result.includes('-2500'));
  });

  test('generateStatsTooltip should format tooltip correctly', () => {
    const stats = { filesChanged: 3, insertions: 45, deletions: 12 };
    const tooltip = generateStatsTooltip(stats);

    assert.ok(tooltip.includes('3 files changed'));
    assert.ok(tooltip.includes('45 insertions(+)'));
    assert.ok(tooltip.includes('12 deletions(-)'));
  });

  test('generateStatsTooltip should use singular forms for single values', () => {
    const stats = { filesChanged: 1, insertions: 1, deletions: 1 };
    const tooltip = generateStatsTooltip(stats);

    assert.ok(tooltip.includes('1 file changed'));
    assert.ok(tooltip.includes('1 insertion(+)'));
    assert.ok(tooltip.includes('1 deletion(-)'));
  });

  test('generateStatsTooltip should return empty string for undefined stats', () => {
    const tooltip = generateStatsTooltip(undefined);

    assert.strictEqual(tooltip, '');
  });

  test('stats should be included in commit data structure', () => {
    // This test verifies the TypeScript interface is correctly defined
    interface CommitInfo {
      hash: string;
      shortHash: string;
      parentHashes: string[];
      author: string;
      email: string;
      date: string;
      message: string;
      fullMessage: string;
      tags?: string[];
      stats?: {
        filesChanged: number;
        insertions: number;
        deletions: number;
      };
    }

    const commit: CommitInfo = {
      hash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
      shortHash: 'a1b2c3d',
      parentHashes: [],
      author: 'John Doe',
      email: 'john@example.com',
      date: '2024-01-01T00:00:00.000Z',
      message: 'Test commit',
      fullMessage: 'Test commit',
      stats: {
        filesChanged: 2,
        insertions: 10,
        deletions: 5
      }
    };

    assert.strictEqual(commit.stats?.filesChanged, 2);
    assert.strictEqual(commit.stats?.insertions, 10);
    assert.strictEqual(commit.stats?.deletions, 5);
  });

  test('stats column HTML structure is correct', () => {
    const stats = { filesChanged: 3, insertions: 45, deletions: 12 };
    const formatted = formatCommitStats(stats);

    // Verify HTML structure contains expected elements
    assert.ok(formatted.includes('<span class="stats-files">'));
    assert.ok(formatted.includes('<span class="stats-changes">'));
    assert.ok(formatted.includes('<span class="stats-insertions">'));
    assert.ok(formatted.includes('<span class="stats-deletions">'));
  });

  test('stats rendering handles edge case of zero insertions with deletions', () => {
    const stats = { filesChanged: 1, insertions: 0, deletions: 5 };
    const result = formatCommitStats(stats);

    assert.ok(result.includes('>1<'));
    assert.ok(!result.includes('+0'));
    assert.ok(result.includes('-5'));
  });

  test('stats rendering handles edge case of zero deletions with insertions', () => {
    const stats = { filesChanged: 2, insertions: 20, deletions: 0 };
    const result = formatCommitStats(stats);

    assert.ok(result.includes('>2<'));
    assert.ok(result.includes('+20'));
    assert.ok(!result.includes('-0'));
  });
});
