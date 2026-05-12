import * as assert from 'assert';

/**
 * extractCoAuthors function (copied from messageHandler.ts for unit testing)
 * Extracts co-authors from commit message body.
 * Looks for "Co-authored-by:" trailers in the format:
 * Co-authored-by: Name <email@example.com>
 */
function extractCoAuthors(fullMessage: string): string[] {
  const coAuthors: string[] = [];
  const lines = fullMessage.split('\n');

  for (const line of lines) {
    const match = line.match(/^\s*Co-authored-by:\s*(.+?)\s*<([^>]+)>/i);
    if (match) {
      const name = match[1].trim();
      const email = match[2];
      coAuthors.push(`${name} <${email}>`);
    }
  }

  return coAuthors;
}

suite('Extract Co-Authors Tests', () => {
  test('should extract single co-author with standard format', () => {
    const message = `Initial commit

Co-authored-by: Alice <alice@example.com>`;
    const result = extractCoAuthors(message);

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0], 'Alice <alice@example.com>');
  });

  test('should extract multiple co-authors on separate lines', () => {
    const message = `Initial commit

Co-authored-by: Alice <alice@example.com>
Co-authored-by: Bob <bob@example.com>
Co-authored-by: Carol <carol@example.com>`;
    const result = extractCoAuthors(message);

    assert.strictEqual(result.length, 3);
    assert.strictEqual(result[0], 'Alice <alice@example.com>');
    assert.strictEqual(result[1], 'Bob <bob@example.com>');
    assert.strictEqual(result[2], 'Carol <carol@example.com>');
  });

  test('should return empty array when no co-authors in message', () => {
    const message = `Initial commit

This is a simple commit message without any co-authors.`;
    const result = extractCoAuthors(message);

    assert.strictEqual(result.length, 0);
    assert.deepStrictEqual(result, []);
  });

  test('should handle co-author with complex name (hyphens, dots, apostrophes)', () => {
    const message = `Feature commit

Co-authored-by: Jean-Pierre O'Brien.Jr. <jp@example.com>`;
    const result = extractCoAuthors(message);

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0], 'Jean-Pierre O\'Brien.Jr. <jp@example.com>');
  });

  test('should handle co-author with email-only in angle brackets', () => {
    const message = `Commit with email only

Co-authored-by: Developer <dev@company.co.uk>`;
    const result = extractCoAuthors(message);

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0], 'Developer <dev@company.co.uk>');
  });

  test('should match case-insensitively (co-authored-by vs Co-authored-by)', () => {
    const message = `First commit

co-authored-by: lowercase test <test@example.com>
CO-AUTHORED-BY: uppercase test <test2@example.com>`;
    const result = extractCoAuthors(message);

    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0], 'lowercase test <test@example.com>');
    assert.strictEqual(result[1], 'uppercase test <test2@example.com>');
  });

  test('should handle leading whitespace before co-author line', () => {
    const message = `Commit message

  Co-authored-by: Indented Dev <dev@example.com>`;
    const result = extractCoAuthors(message);

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0], 'Indented Dev <dev@example.com>');
  });

  test('should not match co-author without email (missing angle bracket)', () => {
    const message = `Commit message

Co-authored-by: No Email Dev
Co-authored-by: Missing Closing <dev@example.com
Co-authored-by: Valid Dev <valid@example.com>`;
    const result = extractCoAuthors(message);

    // Should only match the valid format
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0], 'Valid Dev <valid@example.com>');
  });

  test('should not match malformed co-author line (missing angle bracket)', () => {
    const message = `Commit message

Co-authored-by: Incomplete Dev
Co-authored-by: Also Incomplete`;
    const result = extractCoAuthors(message);

    assert.strictEqual(result.length, 0);
  });

  test('should handle empty co-author name', () => {
    const message = `Commit message

Co-authored-by:  <empty@example.com>`;
    const result = extractCoAuthors(message);

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0], ' <empty@example.com>');
  });

  test('should handle message with only co-authors', () => {
    const message = `Co-authored-by: Solo Dev <solo@example.com>`;
    const result = extractCoAuthors(message);

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0], 'Solo Dev <solo@example.com>');
  });

  test('should handle message with multiple lines before co-author', () => {
    const message = `First line
Second line
Third line

Co-authored-by: Dev <dev@example.com>

Footer text`;
    const result = extractCoAuthors(message);

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0], 'Dev <dev@example.com>');
  });

  test('should handle co-author with plus in email (plus addressing)', () => {
    const message = `Commit

Co-authored-by: Developer <dev+github@example.com>`;
    const result = extractCoAuthors(message);

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0], 'Developer <dev+github@example.com>');
  });

  test('should handle co-author with dots in name', () => {
    const message = `Commit

Co-authored-by: Jr. Sr. Dev <dev@example.com>`;
    const result = extractCoAuthors(message);

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0], 'Jr. Sr. Dev <dev@example.com>');
  });
});