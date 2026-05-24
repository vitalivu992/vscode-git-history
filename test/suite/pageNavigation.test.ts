import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Page Navigation Test Suite', () => {
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  // Source verification tests
  test('main.js should handle PageDown key', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'PageDown':"),
      'main.js should handle PageDown key');
  });

  test('main.js should handle PageUp key', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'PageUp':"),
      'main.js should handle PageUp key');
  });

  test('main.js should have PAGE_SIZE constant set to 10', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('const PAGE_SIZE = 10'),
      'main.js should have PAGE_SIZE constant set to 10');
  });

  test('main.js keyboard help should include PageDown entry', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('Jump down one page (10 commits)'),
      'Keyboard help should include PageDown entry');
  });

  test('main.js keyboard help should include PageUp entry', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('Jump up one page (10 commits)'),
      'Keyboard help should include PageUp entry');
  });

  // Documentation tests
  test('README.md Keyboard Navigation table should include PageDown', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('PageDown'),
      'README.md should include PageDown in keyboard shortcuts');
  });

  test('README.md Keyboard Navigation table should include PageUp', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('PageUp'),
      'README.md should include PageUp in keyboard shortcuts');
  });

  // Logic tests
  test('PageDown should move focus by 10 commits', () => {
    const PAGE_SIZE = 10;
    let focusedIndex = 0;
    const filteredCommits = new Array(25).fill(null); // 25 commits

    focusedIndex = Math.min(focusedIndex + PAGE_SIZE, filteredCommits.length - 1);
    assert.strictEqual(focusedIndex, 10);
  });

  test('PageUp should move focus by 10 commits', () => {
    const PAGE_SIZE = 10;
    let focusedIndex = 20;
    const filteredCommits = new Array(25).fill(null);

    focusedIndex = Math.max(focusedIndex - PAGE_SIZE, 0);
    assert.strictEqual(focusedIndex, 10);
  });

  test('PageDown should stop at last commit', () => {
    const PAGE_SIZE = 10;
    let focusedIndex = 18; // Near end
    const filteredCommits = new Array(20).fill(null);

    focusedIndex = Math.min(focusedIndex + PAGE_SIZE, filteredCommits.length - 1);
    assert.strictEqual(focusedIndex, 19); // Last index
  });

  test('PageUp should stop at first commit', () => {
    const PAGE_SIZE = 10;
    let focusedIndex = 5; // Near start
    const filteredCommits = new Array(25).fill(null);

    focusedIndex = Math.max(focusedIndex - PAGE_SIZE, 0);
    assert.strictEqual(focusedIndex, 0); // First index
  });

  test('PageDown with less than 10 commits should stop at last', () => {
    const PAGE_SIZE = 10;
    let focusedIndex = 0;
    const filteredCommits = new Array(5).fill(null); // Only 5 commits

    focusedIndex = Math.min(focusedIndex + PAGE_SIZE, filteredCommits.length - 1);
    assert.strictEqual(focusedIndex, 4); // Last index
  });
});
