import * as assert from 'assert';

// Mirror the GRAPH_COLORS constant from main.js
const GRAPH_COLORS = ['#4ec9b0', '#569cd6', '#c586c0', '#dcdcaa', '#ce9178', '#4fc1ff', '#d16969', '#b5cea8'];

/**
 * Generates a consistent color based on author name hash.
 * (mirroring the logic in main.js)
 */
function getAuthorColor(author: string): string {
  let hash = 0;
  for (let i = 0; i < author.length; i++) {
    hash = author.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRAPH_COLORS[Math.abs(hash) % GRAPH_COLORS.length];
}

/**
 * Extracts initials from author name.
 * (mirroring the logic in main.js)
 */
function getAuthorInitials(author: string): string {
  const parts = author.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return author.substring(0, 2).toUpperCase();
}

suite('Author Avatar Utils Tests', () => {

  suite('getAuthorColor function', () => {

    test('should return consistent color for same author name', () => {
      const color1 = getAuthorColor('John Doe');
      const color2 = getAuthorColor('John Doe');
      assert.strictEqual(color1, color2);
    });

    test('should return different colors for different author names', () => {
      const color1 = getAuthorColor('Alice Cooper');
      const color2 = getAuthorColor('Bob Marley');
      assert.notStrictEqual(color1, color2);
    });

    test('should return a color from GRAPH_COLORS array', () => {
      const color = getAuthorColor('Some Author');
      assert.ok(GRAPH_COLORS.includes(color), `${color} should be in GRAPH_COLORS`);
    });

    test('should handle empty string', () => {
      const color = getAuthorColor('');
      assert.ok(GRAPH_COLORS.includes(color), 'Empty string should still return a valid color');
    });

    test('should handle single character name', () => {
      const color = getAuthorColor('A');
      assert.ok(GRAPH_COLORS.includes(color));
    });

    test('should handle special characters in name', () => {
      const color = getAuthorColor('José García');
      assert.ok(GRAPH_COLORS.includes(color));
    });

    test('should handle unicode characters', () => {
      const color = getAuthorColor('田中太郎');
      assert.ok(GRAPH_COLORS.includes(color));
    });

    test('should be deterministic across multiple calls', () => {
      const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];
      for (const name of names) {
        const first = getAuthorColor(name);
        const second = getAuthorColor(name);
        const third = getAuthorColor(name);
        assert.strictEqual(first, second);
        assert.strictEqual(second, third);
      }
    });

    test('should handle names that differ only in case differently or consistently', () => {
      const colorLower = getAuthorColor('john doe');
      const colorUpper = getAuthorColor('John Doe');
      // They may or may not be the same, but both must be valid colors
      assert.ok(GRAPH_COLORS.includes(colorLower));
      assert.ok(GRAPH_COLORS.includes(colorUpper));
    });

    test('should handle very long author names', () => {
      const longName = 'A'.repeat(1000);
      const color = getAuthorColor(longName);
      assert.ok(GRAPH_COLORS.includes(color));
    });
  });

  suite('getAuthorInitials function', () => {

    test('should extract initials from two-part name', () => {
      assert.strictEqual(getAuthorInitials('John Doe'), 'JD');
    });

    test('should extract first and last initial from multi-part name', () => {
      assert.strictEqual(getAuthorInitials('John Middle Doe'), 'JE');
    });

    test('should return first two characters for single word name', () => {
      assert.strictEqual(getAuthorInitials('Single'), 'SI');
    });

    test('should handle extra whitespace', () => {
      assert.strictEqual(getAuthorInitials('  John  Doe  '), 'JD');
    });

    test('should uppercase lowercase names', () => {
      assert.strictEqual(getAuthorInitials('john doe'), 'JD');
    });

    test('should handle mixed case names', () => {
      assert.strictEqual(getAuthorInitials('JoHn DoE'), 'JD');
    });

    test('should handle single character first name with last name', () => {
      assert.strictEqual(getAuthorInitials('A Smith'), 'AS');
    });

    test('should handle two-character single word', () => {
      assert.strictEqual(getAuthorInitials('Al'), 'AL');
    });

    test('should handle single character name', () => {
      assert.strictEqual(getAuthorInitials('A'), 'A');
    });

    test('should handle empty string', () => {
      assert.strictEqual(getAuthorInitials(''), '');
    });

    test('should handle names with hyphens', () => {
      assert.strictEqual(getAuthorInitials('Mary-Jane Smith'), 'MS');
    });

    test('should handle names with many spaces', () => {
      assert.strictEqual(getAuthorInitials('  Alice   Beth   Carter  '), 'AC');
    });

    test('should handle tab-separated names', () => {
      assert.strictEqual(getAuthorInitials('John\tDoe'), 'JD');
    });
  });
});

suite('Author Avatar Utils Source Verification', () => {
  test('main.js should have getAuthorColor function', () => {
    const fs = require('fs');
    const path = require('path');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function getAuthorColor'), 'main.js should have getAuthorColor function');
  });

  test('main.js should have getAuthorInitials function', () => {
    const fs = require('fs');
    const path = require('path');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function getAuthorInitials'), 'main.js should have getAuthorInitials function');
  });

  test('main.js should have GRAPH_COLORS constant', () => {
    const fs = require('fs');
    const path = require('path');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('GRAPH_COLORS'), 'main.js should have GRAPH_COLORS constant');
    assert.ok(source.includes('#4ec9b0'), 'GRAPH_COLORS should contain expected colors');
  });

  test('main.js should have author avatar helpers section', () => {
    const fs = require('fs');
    const path = require('path');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Author avatar helpers'), 'main.js should have Author avatar helpers section');
  });
});
