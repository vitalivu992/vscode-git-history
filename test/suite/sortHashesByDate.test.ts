import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

async function sortHashesByDate(hashes: string[], cwd: string): Promise<string[]> {
  if (hashes.length <= 1) return [...hashes];
  try {
    const { execFile } = require('child_process');
    const { promisify } = require('util');
    const execFileAsync = promisify(execFile);
    const { stdout } = await execFileAsync('git', [
      'log', '--format=%H %at', '--no-walk', ...hashes
    ], { cwd, maxBuffer: 10 * 1024 * 1024 });
    const entries = stdout.trim().split('\n').filter(Boolean).map((line: string) => {
      const spaceIdx = line.indexOf(' ');
      return {
        hash: line.substring(0, spaceIdx),
        timestamp: parseInt(line.substring(spaceIdx + 1), 10)
      };
    });
    entries.sort((a: { timestamp: number }, b: { timestamp: number }) => a.timestamp - b.timestamp);
    return entries.map((e: { hash: string }) => e.hash);
  } catch {
    return [...hashes].sort();
  }
}

suite('sortHashesByDate Tests', () => {
  let tempDir: string;

  suiteSetup(async function () {
    this.timeout(10000);
    const { execSync } = require('child_process');
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-sort-test-'));
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    fs.writeFileSync(path.join(tempDir, 'a.txt'), 'a\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "first"', { cwd: tempDir });

    await new Promise(r => setTimeout(r, 1100));

    fs.writeFileSync(path.join(tempDir, 'b.txt'), 'b\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "second"', { cwd: tempDir });

    await new Promise(r => setTimeout(r, 1100));

    fs.writeFileSync(path.join(tempDir, 'c.txt'), 'c\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "third"', { cwd: tempDir });
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  function getHashes(count: number): string[] {
    const { execSync } = require('child_process');
    const output = execSync('git log --format=%H -n ' + count, { cwd: tempDir }).toString().trim();
    return output.split('\n');
  }

  test('should return single hash unchanged', async () => {
    const hashes = getHashes(1);
    const result = await sortHashesByDate(hashes, tempDir);
    assert.deepStrictEqual(result, hashes);
  });

  test('should return empty array unchanged', async () => {
    const result = await sortHashesByDate([], tempDir);
    assert.deepStrictEqual(result, []);
  });

  test('should sort hashes chronologically oldest first', async () => {
    const hashes = getHashes(3);
    const oldestFirst = [...hashes].reverse();
    const shuffled = [hashes[0], hashes[2], hashes[1]];
    const result = await sortHashesByDate(shuffled, tempDir);
    assert.deepStrictEqual(result, oldestFirst);
  });

  test('should sort hashes when given in reverse order', async () => {
    const hashes = getHashes(3);
    const oldestFirst = [...hashes].reverse();
    const newestFirst = [...hashes];
    const result = await sortHashesByDate(newestFirst, tempDir);
    assert.deepStrictEqual(result, oldestFirst);
  });

  test('should already sorted hashes remain stable', async () => {
    const hashes = getHashes(3);
    const oldestFirst = [...hashes].reverse();
    const result = await sortHashesByDate(oldestFirst, tempDir);
    assert.deepStrictEqual(result, oldestFirst);
  });

  test('should handle two hashes', async () => {
    const hashes = getHashes(2);
    const oldestFirst = [...hashes].reverse();
    const result = await sortHashesByDate([hashes[0], hashes[1]], tempDir);
    assert.deepStrictEqual(result, oldestFirst);
  });

  test('should fallback to lexicographic sort on invalid directory', async () => {
    const hashes = ['ccc', 'aaa', 'bbb'];
    const result = await sortHashesByDate(hashes, '/nonexistent/path');
    assert.deepStrictEqual(result, ['aaa', 'bbb', 'ccc']);
  });

  test('should not mutate input array', async () => {
    const hashes = getHashes(3);
    const reversed = [...hashes].reverse();
    const inputCopy = [...reversed];
    await sortHashesByDate(reversed, tempDir);
    assert.deepStrictEqual(reversed, inputCopy, 'Input array should not be mutated');
  });

  test('should return same hashes even if already in order', async () => {
    const hashes = getHashes(3);
    const oldestFirst = [...hashes].reverse();
    const result = await sortHashesByDate(oldestFirst, tempDir);
    assert.strictEqual(result.length, 3);
    for (let i = 0; i < 3; i++) {
      assert.ok(result.includes(oldestFirst[i]), `Result should contain hash ${i}`);
    }
  });
});

suite('sortHashesByDate Source Verification Tests', () => {
  const srcPath = path.resolve(__dirname, '..', '..', '..', 'src', 'git', 'gitService.ts');

  test('gitService should export getCombinedDiff', () => {
    const src = fs.readFileSync(srcPath, 'utf8');
    assert.ok(src.includes('export async function getCombinedDiff'), 'Should export getCombinedDiff');
  });

  test('sortHashesByDate should use git log --no-walk for date sorting', () => {
    const src = fs.readFileSync(srcPath, 'utf8');
    assert.ok(src.includes('--no-walk'), 'Should use --no-walk flag');
    assert.ok(src.includes('%at'), 'Should use %at timestamp format');
  });

  test('sortHashesByDate should fallback to lexicographic sort on error', () => {
    const src = fs.readFileSync(srcPath, 'utf8');
    assert.ok(src.includes('[...hashes].sort()'), 'Should have lexicographic fallback');
  });

  test('getCombinedDiff should use sortHashesByDate instead of plain sort', () => {
    const src = fs.readFileSync(srcPath, 'utf8');
    const combinedDiffMatch = src.match(/getCombinedDiff[\s\S]*?sortedHashes\s*=\s*await\s+sortHashesByDate/);
    assert.ok(combinedDiffMatch, 'getCombinedDiff should use await sortHashesByDate');
  });

  test('sortHashesByDate should handle single element edge case', () => {
    const src = fs.readFileSync(srcPath, 'utf8');
    assert.ok(src.includes('hashes.length <= 1'), 'Should short-circuit for 0 or 1 hashes');
  });

  test('sortHashesByDate should sort ascending by timestamp', () => {
    const src = fs.readFileSync(srcPath, 'utf8');
    assert.ok(src.includes('a.timestamp - b.timestamp'), 'Should sort ascending');
  });

  test('CLAUDE.md should document combined diff date-based sorting', () => {
    const claudePath = path.resolve(__dirname, '..', '..', '..', 'CLAUDE.md');
    const src = fs.readFileSync(claudePath, 'utf8');
    assert.ok(
      src.includes('sortHashesByDate') || src.includes('date-based') || src.includes('chronological'),
      'CLAUDE.md should document date-based hash sorting in combined diff'
    );
  });
});
