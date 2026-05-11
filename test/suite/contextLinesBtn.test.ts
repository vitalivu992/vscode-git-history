import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('Context Lines Button in index.html', () => {
  const indexHtmlPath = path.join(__dirname, '../../src/webview/panel/index.html');

  test('index.html should have context-lines-btn button', () => {
    const source = fs.readFileSync(indexHtmlPath, 'utf-8');
    assert.ok(source.includes('id="context-lines-btn"'),
      'index.html should have context-lines-btn button');
    assert.ok(source.includes('id="context-lines-value"'),
      'index.html should have context-lines-value span');
    assert.ok(source.includes('Diff context lines (Ctrl+Shift+/)'),
      'index.html should have tooltip for context-lines-btn');
  });

  test('context-lines-btn should appear after ignore-ws-btn', () => {
    const source = fs.readFileSync(indexHtmlPath, 'utf-8');
    const ignoreWsPos = source.indexOf('id="ignore-ws-btn"');
    const contextLinesPos = source.indexOf('id="context-lines-btn"');
    assert.ok(ignoreWsPos > 0, 'ignore-ws-btn should exist');
    assert.ok(contextLinesPos > 0, 'context-lines-btn should exist');
    assert.ok(contextLinesPos > ignoreWsPos,
      'context-lines-btn should appear after ignore-ws-btn');
  });

  test('context-lines-value should have default value of 3', () => {
    const source = fs.readFileSync(indexHtmlPath, 'utf-8');
    assert.ok(source.includes('id="context-lines-value">3<'),
      'context-lines-value should default to 3');
  });
});
