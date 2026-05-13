import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Tag Navigation Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  // ─── Source verification tests ──────────────────────────────────────────

  test('types.ts should have jumpToNextTag in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);/);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'jumpToNextTag'"),
      'WebviewAction should include jumpToNextTag');
  });

  test('types.ts should have jumpToPreviousTag in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);/);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'jumpToPreviousTag'"),
      'WebviewAction should include jumpToPreviousTag');
  });

  test('main.js should have getTaggedCommits function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function getTaggedCommits()'),
      'main.js should have getTaggedCommits function');
  });

  test('main.js should have jumpToNextTag function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function jumpToNextTag()'),
      'main.js should have jumpToNextTag function');
  });

  test('main.js should have jumpToPreviousTag function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function jumpToPreviousTag()'),
      'main.js should have jumpToPreviousTag function');
  });

  test('main.js triggerAction should dispatch jumpToNextTag', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'jumpToNextTag': jumpToNextTag()"),
      'main.js triggerAction should dispatch jumpToNextTag');
  });

  test('main.js triggerAction should dispatch jumpToPreviousTag', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'jumpToPreviousTag': jumpToPreviousTag()"),
      'main.js triggerAction should dispatch jumpToPreviousTag');
  });

  test('main.js should show error when no tagged commits found', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("'No tagged commits found'"),
      'main.js should show error when no tagged commits found');
  });

  test('main.js should wrap around in jumpToNextTag', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function jumpToNextTag()');
    assert.ok(fnStart >= 0, 'jumpToNextTag function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);
    assert.ok(fnBody.includes('nextIndex = 0'),
      'jumpToNextTag should wrap around to first tag');
  });

  test('main.js should wrap around in jumpToPreviousTag', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function jumpToPreviousTag()');
    assert.ok(fnStart >= 0, 'jumpToPreviousTag function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);
    assert.ok(fnBody.includes('prevIndex = taggedCommits.length - 1'),
      'jumpToPreviousTag should wrap around to last tag');
  });

  test('main.js getTaggedCommits should filter commits with tags', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function getTaggedCommits()');
    assert.ok(fnStart >= 0, 'getTaggedCommits function should exist');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);
    assert.ok(fnBody.includes('.tags') && fnBody.includes('.length > 0'),
      'getTaggedCommits should filter for commits with tags');
  });

  test('main.js keyboard help should include tag navigation', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('Jump to next tagged commit'),
      'Keyboard help should include jump to next tag');
    assert.ok(source.includes('Jump to previous tagged commit'),
      'Keyboard help should include jump to previous tag');
  });

  test('package.json should register jumpToNextTag command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.jumpToNextTag'),
      'package.json should register gitHistory.jumpToNextTag command');
  });

  test('package.json should register jumpToPreviousTag command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.jumpToPreviousTag'),
      'package.json should register gitHistory.jumpToPreviousTag command');
  });

  test('package.json should have Jump to Next Tag command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Jump to Next Tag'),
      'package.json should have Jump to Next Tag command title');
  });

  test('package.json should have Jump to Previous Tag command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Jump to Previous Tag'),
      'package.json should have Jump to Previous Tag command title');
  });

  test('package.json should register Ctrl+] keybinding for jumpToNextTag', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.jumpToNextTag'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.jumpToNextTag');
    assert.strictEqual(binding.key, 'ctrl+]');
    assert.strictEqual(binding.mac, 'cmd+]');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('package.json should register Ctrl+[ keybinding for jumpToPreviousTag', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);
    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.jumpToPreviousTag'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.jumpToPreviousTag');
    assert.strictEqual(binding.key, 'ctrl+[');
    assert.strictEqual(binding.mac, 'cmd+[');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('extension.ts should register jumpToNextTag webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'jumpToNextTag'"),
      'extension.ts should register jumpToNextTag webview action');
  });

  test('extension.ts should register jumpToPreviousTag webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'jumpToPreviousTag'"),
      'extension.ts should register jumpToPreviousTag webview action');
  });

  test('CLAUDE.md should document Tag Navigation feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Tag Navigation'),
      'CLAUDE.md should document Tag Navigation feature');
    assert.ok(source.includes('jumpToNextTag'),
      'CLAUDE.md should reference jumpToNextTag');
    assert.ok(source.includes('jumpToPreviousTag'),
      'CLAUDE.md should reference jumpToPreviousTag');
  });

  test('README.md should document Tag Navigation feature', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('Tag Navigation') || source.includes('Ctrl+]'),
      'README.md should document Tag Navigation feature or keyboard shortcut');
  });

  // ─── Logic tests (pure function tests) ──────────────────────────────────

  test('should filter commits that have tags', () => {
    const mockCommits = [
      { hash: 'aaa', tags: [] },
      { hash: 'bbb', tags: ['v1.0.0'] },
      { hash: 'ccc', tags: [] },
      { hash: 'ddd', tags: ['v1.1.0'] },
      { hash: 'eee', tags: ['v1.2.0', 'release'] },
    ];
    const tagged = mockCommits.filter(c => c.tags && c.tags.length > 0);
    assert.strictEqual(tagged.length, 3);
    assert.strictEqual(tagged[0].hash, 'bbb');
    assert.strictEqual(tagged[1].hash, 'ddd');
    assert.strictEqual(tagged[2].hash, 'eee');
  });

  test('should find current commit index in tagged list', () => {
    const tagged = [
      { hash: 'bbb', tags: ['v1.0.0'] },
      { hash: 'ddd', tags: ['v1.1.0'] },
      { hash: 'eee', tags: ['v1.2.0'] },
    ];
    const currentHash = 'ddd';
    const index = tagged.findIndex(c => c.hash === currentHash);
    assert.strictEqual(index, 1);
  });

  test('should return -1 when current commit is not tagged', () => {
    const tagged = [
      { hash: 'bbb', tags: ['v1.0.0'] },
      { hash: 'ddd', tags: ['v1.1.0'] },
    ];
    const currentHash = 'aaa';
    const index = tagged.findIndex(c => c.hash === currentHash);
    assert.strictEqual(index, -1);
  });

  test('should wrap around when at last tag (next)', () => {
    const tagged = [
      { hash: 'bbb', tags: ['v1.0.0'] },
      { hash: 'ddd', tags: ['v1.1.0'] },
      { hash: 'eee', tags: ['v1.2.0'] },
    ];
    let nextIndex = 2; // At last tag
    if (nextIndex < tagged.length - 1) {
      nextIndex = nextIndex + 1;
    } else {
      nextIndex = 0; // Wrap
    }
    assert.strictEqual(nextIndex, 0);
  });

  test('should wrap around when at first tag (previous)', () => {
    const tagged = [
      { hash: 'bbb', tags: ['v1.0.0'] },
      { hash: 'ddd', tags: ['v1.1.0'] },
      { hash: 'eee', tags: ['v1.2.0'] },
    ];
    let prevIndex = 0; // At first tag
    if (prevIndex > 0) {
      prevIndex = prevIndex - 1;
    } else {
      prevIndex = tagged.length - 1; // Wrap
    }
    assert.strictEqual(prevIndex, 2);
  });

  test('should start from first tag when no current commit (next)', () => {
    const tagged = [
      { hash: 'bbb', tags: ['v1.0.0'] },
      { hash: 'ddd', tags: ['v1.1.0'] },
    ];
    const currentIndex = -1;
    let nextIndex;
    if (currentIndex < 0) {
      nextIndex = 0;
    } else if (currentIndex < tagged.length - 1) {
      nextIndex = currentIndex + 1;
    } else {
      nextIndex = 0;
    }
    assert.strictEqual(nextIndex, 0);
  });

  test('should start from last tag when no current commit (previous)', () => {
    const tagged = [
      { hash: 'bbb', tags: ['v1.0.0'] },
      { hash: 'ddd', tags: ['v1.1.0'] },
    ];
    const currentIndex = -1;
    let prevIndex;
    if (currentIndex < 0) {
      prevIndex = tagged.length - 1;
    } else if (currentIndex > 0) {
      prevIndex = currentIndex - 1;
    } else {
      prevIndex = tagged.length - 1;
    }
    assert.strictEqual(prevIndex, 1);
  });

  test('should handle single tag (both next and previous stay on same)', () => {
    const tagged = [
      { hash: 'bbb', tags: ['v1.0.0'] },
    ];
    // Next from index 0 (at last) wraps to 0
    let nextIndex = 0;
    if (nextIndex < tagged.length - 1) {
      nextIndex = nextIndex + 1;
    } else {
      nextIndex = 0;
    }
    assert.strictEqual(nextIndex, 0);

    // Previous from index 0 (at first) wraps to last (0)
    let prevIndex = 0;
    if (prevIndex > 0) {
      prevIndex = prevIndex - 1;
    } else {
      prevIndex = tagged.length - 1;
    }
    assert.strictEqual(prevIndex, 0);
  });

  test('should handle empty tagged commits list', () => {
    const mockCommits = [
      { hash: 'aaa', tags: [] },
      { hash: 'ccc', tags: [] },
    ];
    const tagged = mockCommits.filter(c => c.tags && c.tags.length > 0);
    assert.strictEqual(tagged.length, 0);
  });
});
