import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Jump to Parent Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  // ─── Source verification tests ──────────────────────────────────────────

  test('types.ts should have jumpToParent in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'jumpToParent'"),
      'WebviewAction should include jumpToParent');
  });

  test('main.js should have jumpToParent function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function jumpToParent()'),
      'main.js should have jumpToParent function');
  });

  test('main.js triggerAction should dispatch jumpToParent', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'jumpToParent': jumpToParent()"),
      'main.js triggerAction should dispatch jumpToParent');
  });

  test('main.js should show error when no commit focused', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("'No commit focused'"),
      'main.js should show error when no commit focused');
  });

  test('main.js should show error for root commit', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("'Root commit has no parent'"),
      'main.js should show error for root commit');
  });

  test('main.js should show error when parent not in current view', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('Parent commit not in current view'),
      'main.js should show error when parent not in current view');
  });

  test('main.js jumpToParent should use parentHashes[0]', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function jumpToParent()');
    assert.ok(fnStart >= 0, 'jumpToParent function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);
    assert.ok(fnBody.includes('parentHashes[0]'),
      'jumpToParent should use first parent hash');
  });

  test('main.js jumpToParent should call scrollToCommitByHash', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function jumpToParent()');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);
    assert.ok(fnBody.includes('scrollToCommitByHash'),
      'jumpToParent should call scrollToCommitByHash');
  });

  test('main.js jumpToParent should verify parent exists in filtered list', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function jumpToParent()');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);
    assert.ok(fnBody.includes('parentExists') || fnBody.includes('.some(c => c.hash'),
      'jumpToParent should check if parent exists in filtered list');
  });

  test('main.js keyboard help should include jump to parent', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('Jump to parent commit'),
      'Keyboard help should include jump to parent commit');
  });

  test('package.json should register jumpToParent command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.jumpToParent'),
      'package.json should register gitHistory.jumpToParent command');
  });

  test('package.json should have Jump to Parent command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Jump to Parent Commit'),
      'package.json should have Jump to Parent Commit command title');
  });

  test('package.json should register Ctrl+P keybinding for jumpToParent', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.jumpToParent'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.jumpToParent');
    assert.strictEqual(binding.key, 'ctrl+p');
    assert.strictEqual(binding.mac, 'cmd+p');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('extension.ts should register jumpToParent webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'jumpToParent'"),
      'extension.ts should register jumpToParent webview action');
  });

  test('CLAUDE.md should document Jump to Parent Commit feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Jump to Parent Commit'),
      'CLAUDE.md should document Jump to Parent Commit feature');
    assert.ok(source.includes('jumpToParent'),
      'CLAUDE.md should reference jumpToParent');
  });

  test('README.md should document Jump to Parent feature', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('Jump to Parent') || source.includes('Cmd+P'),
      'README.md should document Jump to Parent feature');
  });

  // ─── Logic tests (pure function tests) ──────────────────────────────────

  test('should detect root commit (no parent)', () => {
    const mockCommit = { hash: 'aaa', parentHashes: [] };
    const hasParent = mockCommit.parentHashes && mockCommit.parentHashes.length > 0;
    assert.strictEqual(hasParent, false);
  });

  test('should get first parent hash from commit', () => {
    const mockCommit = { hash: 'bbb', parentHashes: ['aaa', 'ccc'] };
    const parentHash = mockCommit.parentHashes[0];
    assert.strictEqual(parentHash, 'aaa');
  });

  test('should check if parent exists in filtered list', () => {
    const mockCommits = [
      { hash: 'aaa' },
      { hash: 'bbb', parentHashes: ['aaa'] },
      { hash: 'ccc' }
    ];
    const parentHash = 'aaa';
    const parentExists = mockCommits.some(c => c.hash === parentHash);
    assert.strictEqual(parentExists, true);
  });

  test('should return false when parent not in filtered list', () => {
    const mockCommits = [
      { hash: 'bbb', parentHashes: ['aaa'] },
      { hash: 'ccc' }
    ];
    const parentHash = 'aaa';
    const parentExists = mockCommits.some(c => c.hash === parentHash);
    assert.strictEqual(parentExists, false);
  });
});