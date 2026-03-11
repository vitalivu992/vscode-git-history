import * as assert from 'assert';
import { parseBlameOutput } from '../../src/git/blameParser';

suite('Blame Parser Tests', () => {
  const COMMIT_HASH = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0';
  const UNCOMMITTED_HASH = '0000000000000000000000000000000000000000';

  function buildPorcelainBlock(
    hash: string,
    origLine: number,
    finalLine: number,
    includesMeta: boolean,
    author: string = 'John Doe',
    email: string = 'john@example.com',
    time: number = 1700000000,
    summary: string = 'Initial commit',
    filename: string = 'src/file.ts',
    content: string = 'some code'
  ): string {
    let block = `${hash} ${origLine} ${finalLine} 1\n`;
    if (includesMeta) {
      block += `author ${author}\n`;
      block += `author-mail <${email}>\n`;
      block += `author-time ${time}\n`;
      block += `author-tz +0000\n`;
      block += `committer ${author}\n`;
      block += `committer-mail <${email}>\n`;
      block += `committer-time ${time}\n`;
      block += `committer-tz +0000\n`;
      block += `summary ${summary}\n`;
      block += `filename ${filename}\n`;
    }
    block += `\t${content}\n`;
    return block;
  }

  test('should parse standard porcelain blame output', () => {
    const output = buildPorcelainBlock(COMMIT_HASH, 1, 1, true);
    const result = parseBlameOutput(output);

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].hash, COMMIT_HASH);
    assert.strictEqual(result[0].shortHash, 'a1b2c3d');
    assert.strictEqual(result[0].author, 'John Doe');
    assert.strictEqual(result[0].authorEmail, 'john@example.com');
    assert.strictEqual(result[0].authorTime, 1700000000);
    assert.strictEqual(result[0].summary, 'Initial commit');
    assert.strictEqual(result[0].lineNumber, 1);
    assert.strictEqual(result[0].originalLineNumber, 1);
    assert.strictEqual(result[0].filename, 'src/file.ts');
  });

  test('should handle repeated commits (cached metadata)', () => {
    // First occurrence has metadata, second does not
    const block1 = buildPorcelainBlock(COMMIT_HASH, 1, 1, true, 'Jane Smith', 'jane@example.com', 1700000001, 'Feature commit');
    // Second occurrence of same hash without metadata
    const block2 = `${COMMIT_HASH} 2 2 1\n\tsecond line\n`;

    const output = block1 + block2;
    const result = parseBlameOutput(output);

    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].author, 'Jane Smith');
    assert.strictEqual(result[1].author, 'Jane Smith'); // from cache
    assert.strictEqual(result[1].lineNumber, 2);
  });

  test('should handle uncommitted lines', () => {
    const output = buildPorcelainBlock(
      UNCOMMITTED_HASH, 1, 1, true,
      'Not Committed Yet', '', 0, 'Version of test.txt', 'test.txt'
    );
    const result = parseBlameOutput(output);

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].author, 'Not Committed Yet');
    assert.strictEqual(result[0].summary, 'Not Committed Yet');
    assert.strictEqual(result[0].shortHash, '0000000');
  });

  test('should handle empty input', () => {
    assert.deepStrictEqual(parseBlameOutput(''), []);
    assert.deepStrictEqual(parseBlameOutput('   '), []);
  });

  test('should extract correct line numbers', () => {
    const hash2 = 'b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0';
    const block1 = buildPorcelainBlock(COMMIT_HASH, 3, 5, true, 'Alice', 'alice@example.com', 1700000000, 'commit A', 'file.ts', 'line 5');
    const block2 = buildPorcelainBlock(hash2, 1, 7, true, 'Bob', 'bob@example.com', 1700000001, 'commit B', 'file.ts', 'line 7');

    const result = parseBlameOutput(block1 + block2);

    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].lineNumber, 5);
    assert.strictEqual(result[0].originalLineNumber, 3);
    assert.strictEqual(result[1].lineNumber, 7);
    assert.strictEqual(result[1].originalLineNumber, 1);
  });

  test('should handle special characters in filenames', () => {
    const filename = 'src/path with spaces/file-name_test.ts';
    const output = buildPorcelainBlock(COMMIT_HASH, 1, 1, true, 'Author', 'a@b.com', 1700000000, 'msg', filename);
    const result = parseBlameOutput(output);

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].filename, filename);
  });

  test('should handle multiple different commits', () => {
    const hash1 = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const hash2 = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    const block1 = buildPorcelainBlock(hash1, 1, 1, true, 'Alice', 'alice@example.com', 1700000000, 'First commit');
    const block2 = buildPorcelainBlock(hash2, 2, 2, true, 'Bob', 'bob@example.com', 1700000001, 'Second commit');

    const result = parseBlameOutput(block1 + block2);

    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].author, 'Alice');
    assert.strictEqual(result[1].author, 'Bob');
  });
});
