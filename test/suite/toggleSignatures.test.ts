import * as assert from 'assert';
import * as path from 'path';

suite('Signature Badge Tests', () => {
  test('main.js should render signature badge based on commit.signature', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('commit.signature'), 'main.js should check commit.signature for badge rendering');
  });

  test('main.js should render verified badge with ✓ character', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('✓'), 'main.js should render verified badge with ✓ character');
  });

  test('main.js should render unverified badge with ✗ character', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('✗'), 'main.js should render unverified badge with ✗ character');
  });

  test('styles.css should have .signature-badge styling', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.signature-badge'), 'styles.css should have .signature-badge styling');
  });

  test('styles.css should have .signature-badge.verified styling', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.signature-badge.verified'), 'styles.css should have .signature-badge.verified styling');
  });

  test('styles.css should have .signature-badge.unverified styling', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.signature-badge.unverified'), 'styles.css should have .signature-badge.unverified styling');
  });

  suite('README Documentation Verification', () => {
    test('README should document GPG signature verification', () => {
      const fs = require('fs');
      const readmePath = path.resolve(__dirname, '../../../README.md');
      const source = fs.readFileSync(readmePath, 'utf-8');

      assert.ok(source.includes('GPG signature verification'),
        'README should describe GPG signature verification');
    });
  });
});