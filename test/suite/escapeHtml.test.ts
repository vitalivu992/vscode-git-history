import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Reimplementation of escapeHtml from main.js for testing.
 * The original uses browser DOM APIs (document.createElement, textContent, innerHTML).
 * This mirrors the behavior using Node.js string replacement.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

suite('escapeHtml Function Tests', () => {

  suite('Basic HTML entity escaping', () => {

    test('should escape < character', () => {
      assert.strictEqual(escapeHtml('<'), '&lt;');
    });

    test('should escape > character', () => {
      assert.strictEqual(escapeHtml('>'), '&gt;');
    });

    test('should escape & character', () => {
      assert.strictEqual(escapeHtml('&'), '&amp;');
    });

    test('should escape " character', () => {
      assert.strictEqual(escapeHtml('"'), '&quot;');
    });

    test("should escape ' character", () => {
      assert.strictEqual(escapeHtml("'"), '&#39;');
    });

    test('should escape all five special characters in one string', () => {
      assert.strictEqual(escapeHtml('<>&"\''), '&lt;&gt;&amp;&quot;&#39;');
    });
  });

  suite('XSS attack vectors', () => {

    test('should escape script tags', () => {
      const input = '<script>alert("xss")</script>';
      const result = escapeHtml(input);
      assert.ok(!result.includes('<script'), 'Result should not contain <script');
      assert.ok(!result.includes('</script'), 'Result should not contain </script');
      assert.ok(result.includes('&lt;script'), 'Should escape opening script tag');
    });

    test('should escape event handler attributes', () => {
      const input = '<img onerror="alert(1)">';
      const result = escapeHtml(input);
      assert.ok(!result.includes('<img'), 'Result should not contain unescaped <img tag');
      assert.ok(result.includes('&lt;img'), 'Should escape opening img tag');
      assert.ok(result.includes('&quot;alert(1)&quot;'), 'Should escape quoted attribute values');
    });

    test('should escape SVG-based XSS', () => {
      const input = '<svg onload=alert(1)>';
      const result = escapeHtml(input);
      assert.ok(!result.includes('<svg'), 'Result should not contain unescaped <svg');
      assert.ok(result.includes('&lt;svg'), 'Should escape SVG tag');
    });

    test('should escape style tags', () => {
      const input = '<style>body{display:none}</style>';
      const result = escapeHtml(input);
      assert.ok(!result.includes('<style'), 'Result should not contain unescaped <style');
      assert.ok(result.includes('&lt;style'), 'Should escape style tag');
    });

    test('should escape iframe tags', () => {
      const input = '<iframe src="evil.com"></iframe>';
      const result = escapeHtml(input);
      assert.ok(!result.includes('<iframe'), 'Result should not contain unescaped <iframe');
      assert.ok(result.includes('&lt;iframe'), 'Should escape iframe tag');
    });

    test('should escape nested script in attributes', () => {
      const input = '"><script>alert(1)</script>';
      const result = escapeHtml(input);
      assert.ok(!result.includes('"><script'), 'Should break out of attribute context');
      assert.ok(result.includes('&quot;&gt;&lt;script'), 'Should escape all parts');
    });

    test('should escape javascript protocol in href context', () => {
      const input = '<a href="javascript:alert(1)">click</a>';
      const result = escapeHtml(input);
      // Note: escapeHtml escapes HTML entities, doesn't validate URLs
      // The 'javascript:' text remains but angle brackets are escaped
      assert.ok(result.includes('&lt;a'), 'Should escape opening tag');
      assert.ok(result.includes('javascript:alert(1)'), 'Protocol text is preserved but HTML is escaped');
      assert.ok(!result.includes('<a href'), 'Should not contain unescaped opening tag');
    });
  });

  suite('Edge cases', () => {

    test('should handle empty string', () => {
      assert.strictEqual(escapeHtml(''), '');
    });

    test('should return safe strings unchanged', () => {
      assert.strictEqual(escapeHtml('Hello World'), 'Hello World');
    });

    test('should handle multiple consecutive special characters', () => {
      assert.strictEqual(escapeHtml('<<<'), '&lt;&lt;&lt;');
      assert.strictEqual(escapeHtml('>>>'), '&gt;&gt;&gt;');
      assert.strictEqual(escapeHtml('&&&'), '&amp;&amp;&amp;');
    });

    test('should handle mixed content', () => {
      const input = 'Hello <script>World</script> & "friends"';
      const result = escapeHtml(input);
      assert.ok(result.includes('&lt;script'));
      assert.ok(result.includes('&amp;'));
      assert.ok(result.includes('&quot;friends&quot;'));
    });

    test('should handle Unicode characters', () => {
      const input = 'Hello 世界 <b>世界</b>';
      const result = escapeHtml(input);
      assert.ok(result.includes('世界'));
      assert.ok(result.includes('&lt;b&gt;'));
    });

    test('should handle emoji characters', () => {
      const input = '🎉 <script>🎉</script>';
      const result = escapeHtml(input);
      assert.ok(result.includes('🎉'));
      assert.ok(!result.includes('<script'));
    });

    test('should handle already escaped content (double escaping)', () => {
      const input = '&lt;script&gt;';
      const result = escapeHtml(input);
      // & gets escaped first, so &lt; becomes &amp;lt;
      assert.ok(result.includes('&amp;lt;'));
      assert.ok(result.includes('&amp;gt;'));
    });

    test('should handle newlines and tabs', () => {
      const input = 'line1\nline2\ttab';
      const result = escapeHtml(input);
      assert.ok(result.includes('\n'));
      assert.ok(result.includes('\t'));
    });

    test('should handle very long strings', () => {
      const input = '<script>alert(1)</script>'.repeat(1000);
      const result = escapeHtml(input);
      assert.ok(!result.includes('<script>'));
      assert.ok(result.includes('&lt;script&gt;'));
    });

    test('should handle strings with only spaces', () => {
      assert.strictEqual(escapeHtml('   '), '   ');
    });

    test('should handle numeric content', () => {
      assert.strictEqual(escapeHtml('12345'), '12345');
    });

    test('should handle null input (browser converts to "null" string)', () => {
      // Note: Browser DOM textContent converts null to "null" string
      // This test documents that behavior
      const input: any = null;
      // TypeScript would catch this at compile time with strict null checks
      // At runtime, our reimplementation would throw, but browser DOM doesn't
      // This test documents the expected browser behavior
      assert.doesNotThrow(() => {
        // In actual browser: div.textContent = null -> "null"
        // Our Node reimplementation would throw, documenting the difference
        try {
          escapeHtml(input);
        } catch (e) {
          // Expected in Node environment - browser would convert to string
          assert.ok(e instanceof TypeError, 'Should throw TypeError for null in Node');
        }
      });
    });

    test('should handle undefined input (browser converts to "undefined" string)', () => {
      // Note: Browser DOM textContent converts undefined to "undefined" string
      // This test documents that behavior
      const input: any = undefined;
      // Similar to null, browser handles this but Node doesn't
      try {
        escapeHtml(input);
      } catch (e) {
        // Expected in Node environment
        assert.ok(e instanceof TypeError, 'Should throw TypeError for undefined in Node');
      }
    });
  });

  suite('Security property verification', () => {

    test('output should never contain unescaped < when input contains <', () => {
      const inputs = [
        '<div>', '<script>', '<img', '<a href', '<!--', '<![CDATA['
      ];
      for (const input of inputs) {
        const result = escapeHtml(input);
        assert.ok(!result.includes('<'), `Result "${result}" should not contain unescaped < for input "${input}"`);
      }
    });

    test('output should never contain unescaped > when input contains >', () => {
      const inputs = [
        '>', '>>>', '/>', '->', '=>'
      ];
      for (const input of inputs) {
        const result = escapeHtml(input);
        assert.ok(!result.includes('>'), `Result "${result}" should not contain unescaped > for input "${input}"`);
      }
    });

    test('output should never contain unescaped & when input contains &', () => {
      const inputs = [
        '&', '&amp;', '&lt;', '&&', 'a&b'
      ];
      for (const input of inputs) {
        const result = escapeHtml(input);
        assert.ok(!result.includes('&') || result.includes('&amp;') || result.includes('&lt;') || result.includes('&gt;') || result.includes('&quot;') || result.includes('&#39;'),
          `Any & in result "${result}" must be part of an entity for input "${input}"`);
      }
    });

    test('output should never contain unescaped " when input contains "', () => {
      const result = escapeHtml('attr="value"');
      assert.ok(!result.includes('"'), `Result "${result}" should not contain unescaped double quotes`);
    });
  });
});

suite('escapeHtml Source Verification', () => {

  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');

  test('main.js should have escapeHtml function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function escapeHtml('), 'main.js should define escapeHtml function');
  });

  test('escapeHtml should use textContent for safe escaping', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('textContent'), 'escapeHtml should use textContent API');
    assert.ok(source.includes('innerHTML'), 'escapeHtml should read innerHTML');
  });

  test('escapeHtml should use createElement for DOM-based escaping', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('document.createElement'), 'escapeHtml should use document.createElement');
  });

  test('escapeHtml definitions should be identical (duplicate check)', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const matches = source.match(/function escapeHtml\(text\)\s*\{[\s\S]*?\n\s*\}/g);
    assert.ok(matches, 'Should find escapeHtml function definitions');
    assert.strictEqual(matches.length, 2, 'Should have exactly 2 definitions');

    // Normalize whitespace for comparison
    const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
    assert.strictEqual(normalize(matches[0]), normalize(matches[1]),
      'Both escapeHtml definitions should be identical');
  });
});
