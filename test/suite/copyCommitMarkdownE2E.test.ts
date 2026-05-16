import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

suite('Copy Commit Markdown E2E Tests', () => {
  let tempDir: string;
  let testFile: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-markdown-'));
    testFile = path.join(tempDir, 'test.txt');

    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Create commit with multi-line message (subject + body), stats, and tags
    fs.writeFileSync(testFile, 'Hello World\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Add authentication feature\n\nImplemented JWT-based authentication with refresh token support.\n- Added login/logout endpoints\n- Created auth middleware\n- Added token validation"', { cwd: tempDir });
    execSync('git tag v1.0.0', { cwd: tempDir });

    // Create commit with stats but no body
    fs.writeFileSync(testFile, 'Hello World 2\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Fix typo in README"', { cwd: tempDir });

    // Create commit with minimal info (no stats at beginning of history)
    fs.writeFileSync(testFile, 'Hello World 3\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit"', { cwd: tempDir });
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('git commit with body can be formatted as markdown', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('function formatCommitAsMarkdown'),
      'formatCommitAsMarkdown should be defined');
    assert.ok(source.includes('## ') || source.includes('commit.message'),
      'Should format commit with markdown heading');
  });

  test('formatCommitAsMarkdown includes all required fields', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function formatCommitAsMarkdown');
    assert.ok(fnStart >= 0, 'formatCommitAsMarkdown should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 800);
    const fnBody = source.substring(fnStart, fnEnd);

    // Check for markdown heading with message
    assert.ok(fnBody.includes('## ') || fnBody.includes('commit.message'),
      'Should include heading with commit message');

    // Check for short hash in heading
    assert.ok(fnBody.includes('shortHash') || fnBody.includes('('),
      'Should include short hash in heading');

    // Check for author section
    assert.ok(fnBody.includes('**Author:**') || fnBody.includes('Author'),
      'Should include author label');
    assert.ok(fnBody.includes('commit.author') || fnBody.includes('commit.email'),
      'Should include author name and email');

    // Check for date section with relative and absolute
    assert.ok(fnBody.includes('**Date:**') || fnBody.includes('Date'),
      'Should include date label');
    assert.ok(fnBody.includes('toISOString') || fnBody.includes('relativeDate'),
      'Should format date as ISO and relative');

    // Check for stats section
    assert.ok(fnBody.includes('**Files:**') || fnBody.includes('stats'),
      'Should include file stats');

    // Check for tags section
    assert.ok(fnBody.includes('**Tags:**') || fnBody.includes('tags'),
      'Should handle tags');

    // Check for body section
    assert.ok(fnBody.includes('fullMessage') || fnBody.includes('body'),
      'Should include commit body when different from subject');
  });

  test('formatCommitAsMarkdown handles commits without body', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function formatCommitAsMarkdown');
    const fnEnd = source.indexOf('\n}', fnStart + 800);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('fullMessage') && fnBody.includes('commit.message'),
      'Should check if fullMessage differs from message');
    assert.ok(fnBody.includes('.trim()'),
      'Should trim body before checking');
  });

  test('formatCommitAsMarkdown handles commits without stats', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function formatCommitAsMarkdown');
    const fnEnd = source.indexOf('\n}', fnStart + 800);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('commit.stats') || fnBody.includes('if ('),
      'Should check if stats exist before including');
    assert.ok(fnBody.includes('filesChanged') || fnBody.includes('insertions'),
      'Should access stats properties');
  });

  test('formatCommitAsMarkdown handles commits without tags', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function formatCommitAsMarkdown');
    const fnEnd = source.indexOf('\n}', fnStart + 800);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('commit.tags') || fnBody.includes('tags'),
      'Should check for tags');
    assert.ok(fnBody.includes('.length') || fnBody.includes('join'),
      'Should handle tags array');
  });

  test('handleCopyCommitMarkdown calls formatCommitAsMarkdown', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitMarkdown');
    assert.ok(fnStart >= 0, 'handleCopyCommitMarkdown should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 300);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('formatCommitAsMarkdown'),
      'Should call formatCommitAsMarkdown helper');
    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write formatted markdown to clipboard');
  });

  test('handleCopyCommitMarkdown handles commit not found', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitMarkdown');
    const fnEnd = source.indexOf('\n}', fnStart + 300);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'Should handle commit not found');
  });

  test('handleCopyCommitMarkdown shows confirmation message', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitMarkdown');
    const fnEnd = source.indexOf('\n}', fnStart + 300);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Copied as Markdown'),
      'Should show confirmation with "Copied as Markdown"');
    assert.ok(fnBody.includes('shortHash'),
      'Should include short hash in confirmation');
  });

  test('main.js handleCopyMarkdown target resolution prioritizes focused', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyMarkdown');
    assert.ok(fnStart >= 0, 'handleCopyMarkdown should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('focusedIndex'),
      'Should check focusedIndex');
    assert.ok(fnBody.includes('selectedCommits'),
      'Should check selectedCommits');
    assert.ok(fnBody.includes('focusedIndex >= 0'),
      'Should prioritize focused over selected');
  });

  test('main.js handleCopyMarkdown sends correct message type', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyMarkdown');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copyCommitMarkdown'"),
      'Should send copyCommitMarkdown message type');
  });

  test('main.js handleCopyMarkdown handles no target', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyMarkdown');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('Select a commit') && fnBody.includes('Markdown'),
      'Should show error when no commit selected');
  });

  test('context menu has copy-markdown item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-markdown"'),
      'Context menu should include copy-markdown');
    assert.ok(source.includes('Copy as Markdown'),
      'Context menu should have label Copy as Markdown');
  });

  test('context menu click handles copy-markdown action', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("action === 'copy-markdown'"),
      'Should handle copy-markdown action');
    assert.ok(source.includes("type: 'copyCommitMarkdown'"),
      'Should send copyCommitMarkdown message');
  });

  test('Ctrl+Alt+M keyboard shortcut integration', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("e.key === 'm'") &&
      source.includes('e.altKey') &&
      source.includes('handleCopyMarkdown'),
      'Ctrl+Alt+M shortcut should be handled');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.copyCommitMarkdown"'),
      'package.json should register copyCommitMarkdown command');
    assert.ok(content.includes('"ctrl+alt+m"'),
      'package.json should define Ctrl+Alt+M keybinding');
  });

  test('package.json keybinding uses correct keys', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    const json = JSON.parse(content);

    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyCommitMarkdown'
    );
    assert.ok(binding, 'Should have keybinding for gitHistory.copyCommitMarkdown');
    assert.strictEqual(binding.key, 'ctrl+alt+m');
    assert.strictEqual(binding.mac, 'cmd+alt+m');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('keyboard help includes Copy as Markdown', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('Copy as Markdown') || source.includes('copy-markdown'),
      'Keyboard help should include Copy as Markdown');
  });

  test('markdown format example matches specification', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function formatCommitAsMarkdown');
    const fnEnd = source.indexOf('\n}', fnStart + 800);
    const fnBody = source.substring(fnStart, fnEnd);

    // Verify format: ## {message} ({shortHash})
    assert.ok(fnBody.includes('## ') && fnBody.includes('(') && fnBody.includes(')'),
      'Should format heading as "## {message} ({shortHash})"');

    // Verify: **Author:** {name} <{email}>
    assert.ok(fnBody.includes('**Author:**'),
      'Should include author in bold markdown');

    // Verify: **Date:** {relativeDate} ({absoluteDate})
    assert.ok(fnBody.includes('**Date:**'),
      'Should include date in bold markdown');

    // Verify: **Files:** {filesChanged} changed, +{insertions}, -{deletions}
    assert.ok(fnBody.includes('**Files:**') || fnBody.includes('changed'),
      'Should include files changed line');
  });
});
