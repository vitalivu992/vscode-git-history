import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

interface TestCommitInfo {
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

// Simulates getting filtered commits (from main.js logic)
function getFilteredCommits(
  commits: TestCommitInfo[],
  searchQuery: string,
  hideMergeCommits: boolean
): TestCommitInfo[] {
  let filtered = commits;

  if (hideMergeCommits) {
    filtered = filtered.filter(commit => !(commit.parentHashes && commit.parentHashes.length > 1));
  }

  if (!searchQuery) return filtered;
  const q = searchQuery.toLowerCase();
  return filtered.filter(commit =>
    commit.hash.toLowerCase().includes(q) ||
    commit.shortHash.toLowerCase().includes(q) ||
    commit.author.toLowerCase().includes(q) ||
    commit.email.toLowerCase().includes(q) ||
    commit.message.toLowerCase().includes(q) ||
    (commit.tags && commit.tags.some(t => t.toLowerCase().includes(q)))
  );
}

// Simulates the export formatters from messageHandler.ts
function formatCommitsAsJson(commits: TestCommitInfo[]): string {
  return JSON.stringify(commits, null, 2);
}

function escapeCsvField(field: string): string {
  if (/[",\n\r]/.test(field)) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function formatCommitsAsCsv(commits: TestCommitInfo[]): string {
  const headers = ['Hash', 'Short Hash', 'Author', 'Email', 'Date', 'Message', 'Tags', 'Files Changed', 'Insertions', 'Deletions'];
  const lines = [headers.join(',')];

  for (const commit of commits) {
    const fields = [
      commit.hash,
      commit.shortHash,
      escapeCsvField(commit.author),
      commit.email,
      commit.date,
      escapeCsvField(commit.message),
      commit.tags ? commit.tags.join(';') : '',
      commit.stats?.filesChanged?.toString() || '0',
      commit.stats?.insertions?.toString() || '0',
      commit.stats?.deletions?.toString() || '0'
    ];
    lines.push(fields.join(','));
  }

  return lines.join('\n');
}

suite('Export Commits E2E Tests', () => {
  const testCommits: TestCommitInfo[] = [
    {
      hash: 'abc123def456abc123def456abc123def456abc1',
      shortHash: 'abc123d',
      parentHashes: [],
      author: 'Alice Cooper',
      email: 'alice@example.com',
      date: '2024-01-15T10:30:00Z',
      message: 'Initial commit',
      fullMessage: 'Initial commit\n\nThis is the first commit',
      tags: ['v1.0.0'],
      stats: { filesChanged: 3, insertions: 150, deletions: 0 }
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
      stats: { filesChanged: 5, insertions: 200, deletions: 50 }
    },
    {
      hash: '789def123abc789def123abc789def123abc789d',
      shortHash: '789def1',
      parentHashes: ['def456abc123def456abc123def456abc123def4', 'someotherparent'],
      author: 'Charlie Day',
      email: 'charlie@example.com',
      date: '2024-01-17T09:00:00Z',
      message: 'Merge pull request #42',
      fullMessage: 'Merge pull request #42',
      tags: undefined,
      stats: { filesChanged: 1, insertions: 0, deletions: 0 }
    }
  ];

  test('export all commits as JSON includes complete data', () => {
    const filtered = getFilteredCommits(testCommits, '', false);
    const json = formatCommitsAsJson(filtered);
    const parsed = JSON.parse(json) as TestCommitInfo[];

    assert.strictEqual(parsed.length, 3);
    assert.strictEqual(parsed[0].hash, testCommits[0].hash);
    assert.strictEqual(parsed[1].author, 'Bob Marley');
    assert.deepStrictEqual(parsed[1].stats, { filesChanged: 5, insertions: 200, deletions: 50 });
  });

  test('export filtered commits as JSON respects search filter', () => {
    const filtered = getFilteredCommits(testCommits, 'Bob', false);
    const json = formatCommitsAsJson(filtered);
    const parsed = JSON.parse(json) as TestCommitInfo[];

    assert.strictEqual(parsed.length, 1);
    assert.strictEqual(parsed[0].author, 'Bob Marley');
  });

  test('export filtered commits as JSON respects hideMergeCommits', () => {
    const filtered = getFilteredCommits(testCommits, '', true);
    const json = formatCommitsAsJson(filtered);
    const parsed = JSON.parse(json) as TestCommitInfo[];

    assert.strictEqual(parsed.length, 2); // Merge commit with 2 parents is filtered out
    assert.ok(!parsed.some(c => c.message.includes('Merge')));
  });

  test('export all commits as CSV includes correct headers', () => {
    const filtered = getFilteredCommits(testCommits, '', false);
    const csv = formatCommitsAsCsv(filtered);
    const lines = csv.split('\n');

    assert.strictEqual(lines[0], 'Hash,Short Hash,Author,Email,Date,Message,Tags,Files Changed,Insertions,Deletions');
  });

  test('export all commits as CSV includes all data rows', () => {
    const filtered = getFilteredCommits(testCommits, '', false);
    const csv = formatCommitsAsCsv(filtered);
    const lines = csv.split('\n');

    // Header + 3 data rows = 4 lines
    assert.strictEqual(lines.length, 4);
    assert.ok(lines[1].includes('abc123def456abc123def456abc123def456abc1'));
    assert.ok(lines[1].includes('Alice Cooper'));
    assert.ok(lines[1].includes('v1.0.0'));
  });

  test('export filtered commits as CSV respects search filter', () => {
    const filtered = getFilteredCommits(testCommits, 'feature', false);
    const csv = formatCommitsAsCsv(filtered);
    const lines = csv.split('\n');

    assert.strictEqual(lines.length, 2); // Header + 1 matching row
    assert.ok(lines[1].includes('Add feature X'));
  });

  test('export filtered commits as CSV respects tag filter', () => {
    const filtered = getFilteredCommits(testCommits, 'v1.1.0', false);
    const csv = formatCommitsAsCsv(filtered);
    const lines = csv.split('\n');

    assert.strictEqual(lines.length, 2); // Header + 1 matching row
    assert.ok(lines[1].includes('Bob Marley'));
  });

  test('export with combined filters (search + hideMergeCommits)', () => {
    const filtered = getFilteredCommits(testCommits, 'example.com', true);
    const csv = formatCommitsAsCsv(filtered);
    const lines = csv.split('\n');

    // Should include Alice (example.com) and exclude Charlie (merge commit)
    // Bob is company.org so excluded too
    assert.strictEqual(lines.length, 2); // Header + Alice only
    assert.ok(lines[1].includes('Alice Cooper'));
  });

  test('exported JSON can be re-parsed and contains same data', () => {
    const filtered = getFilteredCommits(testCommits, '', false);
    const json = formatCommitsAsJson(filtered);
    const parsed = JSON.parse(json) as TestCommitInfo[];

    // Verify all original properties are preserved
    for (let i = 0; i < testCommits.length; i++) {
      assert.strictEqual(parsed[i].hash, testCommits[i].hash);
      assert.strictEqual(parsed[i].author, testCommits[i].author);
      assert.strictEqual(parsed[i].message, testCommits[i].message);
    }
  });

  test('exported CSV stats columns default to zero for missing stats', () => {
    const commitWithoutStats: TestCommitInfo = {
      ...testCommits[0],
      stats: undefined
    };
    const csv = formatCommitsAsCsv([commitWithoutStats]);
    const lines = csv.split('\n');
    const fields = lines[1].split(',');

    // Last 3 fields should be 0
    assert.strictEqual(fields[fields.length - 1], '0'); // deletions
    assert.strictEqual(fields[fields.length - 2], '0'); // insertions
    assert.strictEqual(fields[fields.length - 3], '0'); // filesChanged
  });

  test('export empty filtered results should produce valid but minimal output', () => {
    const filtered = getFilteredCommits(testCommits, 'nonexistent', false);
    assert.strictEqual(filtered.length, 0);

    const json = formatCommitsAsJson(filtered);
    assert.strictEqual(json, '[]');

    const csv = formatCommitsAsCsv(filtered);
    assert.strictEqual(csv, 'Hash,Short Hash,Author,Email,Date,Message,Tags,Files Changed,Insertions,Deletions');
  });
});

suite('Export Commits Source Verification', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const webviewProviderPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
  const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');

  test('main.js should define handleExportCommits function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleExportCommits'),
      'main.js should define handleExportCommits function');
  });

  test('main.js should define showExportFormatDialog function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function showExportFormatDialog'),
      'main.js should define showExportFormatDialog function');
  });

  test('main.js should handle Ctrl+Shift+O keyboard shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("e.key === 'o'") && source.includes('e.shiftKey'),
      'main.js should handle Ctrl+Shift+O keyboard shortcut');
  });

  test('main.js should reference export-btn element', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("getElementById('export-btn')"),
      'main.js should reference export-btn element');
  });

  test('main.js should add click listener to export button', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("exportBtn.addEventListener('click', handleExportCommits)"),
      'main.js should add click listener to export button');
  });

  test('messageHandler.ts should handle exportCommits case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'exportCommits':"),
      'messageHandler.ts should handle exportCommits case');
  });

  test('messageHandler.ts should define handleExportCommits function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleExportCommits'),
      'messageHandler.ts should define handleExportCommits function');
  });

  test('messageHandler.ts should define formatCommitsAsJson function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function formatCommitsAsJson'),
      'messageHandler.ts should define formatCommitsAsJson function');
  });

  test('messageHandler.ts should define formatCommitsAsCsv function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function formatCommitsAsCsv'),
      'messageHandler.ts should define formatCommitsAsCsv function');
  });

  test('messageHandler.ts should use showSaveDialog for export', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleExportCommits');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('showSaveDialog'),
      'handleExportCommits should use showSaveDialog');
  });

  test('types.ts should define exportCommits message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("type: 'exportCommits'"),
      'types.ts should define exportCommits message type');
    assert.ok(source.includes("format: 'json' | 'csv'"),
      'exportCommits should accept json or csv format');
  });

  test('webviewProvider.ts should include export button', () => {
    const source = fs.readFileSync(webviewProviderPath, 'utf-8');
    assert.ok(source.includes('id="export-btn"'),
      'webviewProvider.ts should include export button');
  });

  test('styles.css should include export-btn styling', () => {
    const source = fs.readFileSync(stylesPath, 'utf-8');
    assert.ok(source.includes('.export-btn'),
      'styles.css should include export-btn styling');
  });

  test('styles.css should include export-modal styling', () => {
    const source = fs.readFileSync(stylesPath, 'utf-8');
    assert.ok(source.includes('#export-modal'),
      'styles.css should include #export-modal styling');
    assert.ok(source.includes('.export-options'),
      'styles.css should include export-options styling');
    assert.ok(source.includes('.export-option-btn'),
      'styles.css should include export-option-btn styling');
  });
});
