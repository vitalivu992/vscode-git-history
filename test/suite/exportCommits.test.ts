import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

// Test types matching CommitInfo interface
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

// Formatter functions (mirroring the implementation in messageHandler.ts)
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

suite('Export Formatters Unit Tests', () => {
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

  // ─── JSON Formatter Tests ───────────────────────────────────────────────────

  test('formatCommitsAsJson returns valid JSON string', () => {
    const result = formatCommitsAsJson(sampleCommits);
    const parsed = JSON.parse(result);
    assert.ok(Array.isArray(parsed));
    assert.strictEqual(parsed.length, 3);
  });

  test('formatCommitsAsJson preserves all commit fields', () => {
    const result = formatCommitsAsJson(sampleCommits);
    const parsed = JSON.parse(result) as TestCommitInfo[];

    assert.strictEqual(parsed[0].hash, sampleCommits[0].hash);
    assert.strictEqual(parsed[0].author, sampleCommits[0].author);
    assert.strictEqual(parsed[0].email, sampleCommits[0].email);
    assert.strictEqual(parsed[0].message, sampleCommits[0].message);
    assert.deepStrictEqual(parsed[0].stats, sampleCommits[0].stats);
  });

  test('formatCommitsAsJson handles empty commits array', () => {
    const result = formatCommitsAsJson([]);
    assert.strictEqual(result, '[]');
  });

  test('formatCommitsAsJson includes tags when present', () => {
    const result = formatCommitsAsJson(sampleCommits);
    const parsed = JSON.parse(result) as TestCommitInfo[];

    assert.deepStrictEqual(parsed[0].tags, ['v1.0.0']);
    assert.deepStrictEqual(parsed[1].tags, ['v1.1.0', 'release']);
    assert.strictEqual(parsed[2].tags, undefined);
  });

  test('formatCommitsAsJson formats with 2-space indentation', () => {
    const result = formatCommitsAsJson([sampleCommits[0]]);
    const lines = result.split('\n');
    // First line should be '['
    assert.strictEqual(lines[0], '[');
    // Second line should have 2-space indent
    assert.ok(lines[1].startsWith('  '));
  });

  // ─── CSV Formatter Tests ──────────────────────────────────────────────────

  test('formatCommitsAsCsv includes correct headers', () => {
    const result = formatCommitsAsCsv([]);
    const lines = result.split('\n');
    assert.strictEqual(lines[0], 'Hash,Short Hash,Author,Email,Date,Message,Tags,Files Changed,Insertions,Deletions');
  });

  test('formatCommitsAsCsv formats single commit correctly', () => {
    const result = formatCommitsAsCsv([sampleCommits[0]]);
    const lines = result.split('\n');
    const dataLine = lines[1];

    assert.ok(dataLine.includes(sampleCommits[0].hash));
    assert.ok(dataLine.includes(sampleCommits[0].shortHash));
    assert.ok(dataLine.includes(sampleCommits[0].author));
    assert.ok(dataLine.includes(sampleCommits[0].email));
    assert.ok(dataLine.includes('3')); // filesChanged
    assert.ok(dataLine.includes('150')); // insertions
    assert.ok(dataLine.includes('0')); // deletions
  });

  test('formatCommitsAsCsv handles multiple commits', () => {
    const result = formatCommitsAsCsv(sampleCommits);
    const lines = result.split('\n');
    // Header + 3 commits = 4 lines
    assert.strictEqual(lines.length, 4);
  });

  test('formatCommitsAsCsv joins multiple tags with semicolon', () => {
    const result = formatCommitsAsCsv([sampleCommits[1]]);
    const lines = result.split('\n');
    assert.ok(lines[1].includes('v1.1.0;release'));
  });

  test('formatCommitsAsCsv handles missing stats as zeros', () => {
    const result = formatCommitsAsCsv([sampleCommits[2]]);
    const lines = result.split('\n');
    const fields = lines[1].split(',');
    // Last 3 fields should be 0,0,0 for missing stats
    assert.strictEqual(fields[fields.length - 1], '0');
    assert.strictEqual(fields[fields.length - 2], '0');
    assert.strictEqual(fields[fields.length - 3], '0');
  });

  // ─── CSV Escaping Tests ─────────────────────────────────────────────────────

  test('escapeCsvField handles fields without special characters', () => {
    const field = 'Simple text';
    assert.strictEqual(escapeCsvField(field), field);
  });

  test('escapeCsvField escapes fields containing commas', () => {
    const field = 'Smith, John';
    assert.strictEqual(escapeCsvField(field), '"Smith, John"');
  });

  test('escapeCsvField escapes fields containing quotes', () => {
    const field = 'He said "hello"';
    assert.strictEqual(escapeCsvField(field), '"He said ""hello"""');
  });

  test('escapeCsvField escapes fields containing newlines', () => {
    const field = 'Line 1\nLine 2';
    assert.strictEqual(escapeCsvField(field), '"Line 1\nLine 2"');
  });

  test('escapeCsvField handles combination of special characters', () => {
    const field = 'Co., "Inc"\nLine 2';
    assert.strictEqual(escapeCsvField(field), '"Co., ""Inc""\nLine 2"');
  });

  test('formatCommitsAsCsv escapes author names with commas', () => {
    const commit: TestCommitInfo = {
      ...sampleCommits[0],
      author: 'Smith, John'
    };
    const result = formatCommitsAsCsv([commit]);
    assert.ok(result.includes('"Smith, John"'));
  });

  test('formatCommitsAsCsv escapes messages with quotes', () => {
    const commit: TestCommitInfo = {
      ...sampleCommits[0],
      message: 'Fix "critical" bug'
    };
    const result = formatCommitsAsCsv([commit]);
    assert.ok(result.includes('"Fix ""critical"" bug"'));
  });

  test('formatCommitsAsCsv handles empty commits array', () => {
    const result = formatCommitsAsCsv([]);
    assert.strictEqual(result, 'Hash,Short Hash,Author,Email,Date,Message,Tags,Files Changed,Insertions,Deletions');
  });

  test('formatCommitsAsCsv handles message with newlines', () => {
    const commit: TestCommitInfo = {
      ...sampleCommits[0],
      message: 'First line\nSecond line'
    };
    const result = formatCommitsAsCsv([commit]);
    const lines = result.split('\n');
    // Should still have only 2 lines (header + data), with message properly escaped
    assert.strictEqual(lines.length, 3); // newline in message creates an extra line
    assert.ok(result.includes('"First line\nSecond line"'));
  });
});

suite('Export Feature Source Verification', () => {
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const htmlProviderPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');

  test('messageHandler.ts should define exportCommits message type handler', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'exportCommits'"),
      'messageHandler should handle exportCommits case');
    assert.ok(source.includes('handleExportCommits'),
      'messageHandler should define handleExportCommits function');
  });

  test('handleExportCommits should use vscode.window.showSaveDialog', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleExportCommits');
    assert.ok(fnStart >= 0, 'handleExportCommits function should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('showSaveDialog'),
      'handleExportCommits should use showSaveDialog for file selection');
    assert.ok(fnBody.includes('fs.promises.writeFile'),
      'handleExportCommits should use fs.promises.writeFile to save file');
  });

  test('types.ts should define exportCommits message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("type: 'exportCommits'"),
      'WebviewToExtMessage should include exportCommits type');
    assert.ok(source.includes("format: 'json' | 'csv'"),
      'exportCommits should accept json or csv format');
  });

  test('main.js should define handleExportCommits function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleExportCommits'),
      'main.js should define handleExportCommits function');
    assert.ok(source.includes('showExportFormatDialog'),
      'main.js should define showExportFormatDialog function');
  });

  test('main.js should handle Ctrl+Shift+O keyboard shortcut', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const kdStart = source.indexOf('function handleKeyDown');
    const kdEnd = source.indexOf('\nfunction', kdStart + 1);
    const kdBody = source.substring(kdStart, kdEnd > kdStart ? kdEnd : undefined);

    assert.ok(kdBody.includes("e.key === 'o'") && kdBody.includes('handleExportCommits'),
      'handleKeyDown should handle Ctrl+Shift+O and call handleExportCommits');
  });

  test('main.js should send exportCommits message with format and commits', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    // Look for the vscode.postMessage call with exportCommits type
    assert.ok(source.includes("type: 'exportCommits'"),
      'main.js should send exportCommits message');
    assert.ok(source.includes("format,"),
      'exportCommits message should include format');
    assert.ok(source.includes('commits: commitsToExport'),
      'exportCommits message should include commits');
  });

  test('webviewProvider.ts should include export button', () => {
    const source = fs.readFileSync(htmlProviderPath, 'utf-8');
    assert.ok(source.includes('id="export-btn"'),
      'webviewProvider.ts should include export button');
    assert.ok(source.includes('export-btn'),
      'webviewProvider.ts should reference export-btn class');
  });

  test('webviewProvider.ts export button should have keyboard shortcut tooltip', () => {
    const source = fs.readFileSync(htmlProviderPath, 'utf-8');
    assert.ok(source.includes('Ctrl+Shift+O') || source.includes('Ctrl&#x2b;Shift&#x2b;O'),
      'Export button tooltip should mention Ctrl+Shift+O keyboard shortcut');
  });
});
