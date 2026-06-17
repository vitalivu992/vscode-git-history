import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

suite('Copy Commit as HTML E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let simpleHash: string;
  let bodyHash: string;
  let statsHash: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-html-'));
    testFile = path.join(tempDir, 'test.txt');

    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Commit 1: simple commit
    fs.writeFileSync(testFile, 'Hello World\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit"', { cwd: tempDir });
    simpleHash = execSync('git rev-parse HEAD', { cwd: tempDir, encoding: 'utf-8' }).trim();

    // Commit 2: commit with body
    fs.writeFileSync(testFile, 'Hello World 2\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Add feature\n\nThis is a detailed description of the feature."', { cwd: tempDir });
    bodyHash = execSync('git rev-parse HEAD', { cwd: tempDir, encoding: 'utf-8' }).trim();

    // Commit 3: commit with multiple file changes (stats)
    fs.writeFileSync(path.join(tempDir, 'file1.txt'), 'content1\n');
    fs.writeFileSync(path.join(tempDir, 'file2.txt'), 'content2\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Add multiple files"', { cwd: tempDir });
    statsHash = execSync('git rev-parse HEAD', { cwd: tempDir, encoding: 'utf-8' }).trim();
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // ─── Source verification ─────────────────────────────────────────────────────

  test('formatCommitAsHtml function exists in messageHandler', () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');
    assert.ok(source.includes('export function formatCommitAsHtml'),
      'formatCommitAsHtml should be defined and exported');
  });

  test('handleCopyCommitHtml function exists in messageHandler', () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');
    assert.ok(source.includes('function handleCopyCommitHtml'),
      'handleCopyCommitHtml should be defined');
  });

  test('copyCommitHtml message type is handled in switch statement', () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitHtml'"),
      'copyCommitHtml case should exist in handleMessage switch');
    assert.ok(source.includes('handleCopyCommitHtml'),
      'Should call handleCopyCommitHtml');
  });

  test('copyCommitHtml is defined in WebviewAction type', () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'copyCommitHtml'"),
      'copyCommitHtml should be in WebviewAction type');
  });

  test('copyCommitHtml message type is defined in WebviewToExtMessage', () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("type: 'copyCommitHtml'"),
      'copyCommitHtml message type should be in WebviewToExtMessage');
  });

  test('command is registered in extension.ts', () => {
    const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("gitHistory.copyCommitHtml"),
      'gitHistory.copyCommitHtml command should be registered');
    assert.ok(source.includes("'copyCommitHtml'"),
      'copyCommitHtml action should be mapped');
  });

  test('command and keybinding are defined in package.json', () => {
    const packagePath = path.resolve(__dirname, '../../../package.json');
    const source = fs.readFileSync(packagePath, 'utf-8');
    const pkg = JSON.parse(source);

    const command = pkg.contributes.commands.find(
      (c: { command: string }) => c.command === 'gitHistory.copyCommitHtml'
    );
    assert.ok(command, 'Command should be registered in package.json');
    assert.ok(command.title.includes('HTML'), 'Command title should mention HTML');

    const keybinding = pkg.contributes.keybindings.find(
      (k: { command: string }) => k.command === 'gitHistory.copyCommitHtml'
    );
    assert.ok(keybinding, 'Keybinding should be registered in package.json');
    assert.strictEqual(keybinding.key, 'ctrl+alt+h');
    assert.strictEqual(keybinding.mac, 'cmd+alt+h');
    assert.strictEqual(keybinding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  // ─── HTML formatter output validation ────────────────────────────────────────

  test('formatCommitAsHtml produces valid HTML with inline styles', async () => {
    const { formatCommitAsHtml } = await import('../../src/webview/messageHandler');
    const commit = {
      hash: simpleHash,
      shortHash: simpleHash.substring(0, 7),
      parentHashes: [],
      author: 'Test User',
      email: 'test@example.com',
      date: new Date().toISOString(),
      message: 'Initial commit',
      fullMessage: 'Initial commit',
    };
    const html = formatCommitAsHtml(commit);
    assert.ok(html.startsWith('<div'));
    assert.ok(html.includes('style="'));
    assert.ok(html.includes('Initial commit'));
  });

  test('formatCommitAsHtml includes commit body when present', async () => {
    const { formatCommitAsHtml } = await import('../../src/webview/messageHandler');
    const commit = {
      hash: bodyHash,
      shortHash: bodyHash.substring(0, 7),
      parentHashes: [simpleHash],
      author: 'Test User',
      email: 'test@example.com',
      date: new Date().toISOString(),
      message: 'Add feature',
      fullMessage: 'Add feature\n\nThis is a detailed description of the feature.',
    };
    const html = formatCommitAsHtml(commit);
    assert.ok(html.includes('This is a detailed description'));
    assert.ok(html.includes('<hr'));
  });

  test('formatCommitAsHtml includes stats when available', async () => {
    const { formatCommitAsHtml } = await import('../../src/webview/messageHandler');
    const commit = {
      hash: statsHash,
      shortHash: statsHash.substring(0, 7),
      parentHashes: [bodyHash],
      author: 'Test User',
      email: 'test@example.com',
      date: new Date().toISOString(),
      message: 'Add multiple files',
      fullMessage: 'Add multiple files',
      stats: { filesChanged: 3, insertions: 6, deletions: 0 },
    };
    const html = formatCommitAsHtml(commit);
    assert.ok(html.includes('Stats'));
    assert.ok(html.includes('+6'));
  });

  test('formatCommitAsHtml escapes HTML special characters', async () => {
    const { formatCommitAsHtml } = await import('../../src/webview/messageHandler');
    const commit = {
      hash: 'aaa111bbb222ccc333ddd444eee555fff6667778',
      shortHash: 'aaa111b',
      parentHashes: [],
      author: 'Test <User>',
      email: 'test@test.com',
      date: new Date().toISOString(),
      message: 'Fix <bug> & "issue"',
      fullMessage: 'Fix <bug> & "issue"',
    };
    const html = formatCommitAsHtml(commit);
    assert.ok(html.includes('&lt;bug&gt;'));
    assert.ok(html.includes('&amp;'));
    assert.ok(!html.includes('<bug>'));
  });

  // ─── Webview integration ─────────────────────────────────────────────────────

  test('handleCopyHtml function exists in main.js', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCopyHtml()'),
      'handleCopyHtml function should exist in main.js');
    assert.ok(source.includes("type: 'copyCommitHtml'"),
      'Should send copyCommitHtml message');
  });

  test('Ctrl+Alt+H keyboard shortcut is handled in main.js', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("e.key === 'h'") && source.includes('handleCopyHtml'),
      'Ctrl+Alt+H should trigger handleCopyHtml');
  });

  test('copy-html context menu item exists in main.js', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('data-action="copy-html"'),
      'Context menu item with data-action="copy-html" should exist');
    assert.ok(source.includes('Copy as HTML'),
      'Context menu label should include "Copy as HTML"');
  });

  test('copyCommitHtml triggerAction case exists in main.js', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'copyCommitHtml'"),
      'copyCommitHtml triggerAction case should exist');
  });
});
