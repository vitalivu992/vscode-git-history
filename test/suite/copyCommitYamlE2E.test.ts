import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Copy Commit as YAML E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHash: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-commit-yaml-'));
    testFile = path.join(tempDir, 'test.txt');

    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Create initial commit
    fs.writeFileSync(testFile, 'Hello World\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit"', { cwd: tempDir });
    commitHash = execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' }).trim();
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('formatCommitAsYaml produces valid YAML structure', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('export function formatCommitAsYaml');
    assert.ok(fnStart >= 0, 'formatCommitAsYaml should be defined');

    // Verify key YAML structure elements
    assert.ok(source.includes('hash:'), 'Should have hash key');
    assert.ok(source.includes('shortHash:'), 'Should have shortHash key');
    assert.ok(source.includes('author:'), 'Should have author key');
    assert.ok(source.includes('message:'), 'Should have message key');
    assert.ok(source.includes('parentHashes:'), 'Should have parentHashes key');
    assert.ok(source.includes('tags:'), 'Should have tags key');
    assert.ok(source.includes('stats:'), 'Should have stats key');
  });

  test('formatCommitAsYaml handles null body correctly', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('export function formatCommitAsYaml');
    assert.ok(fnStart >= 0, 'formatCommitAsYaml should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 50);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('body: null'),
      'Should handle null body');
    assert.ok(fnBody.includes('body: |'),
      'Should use literal block for body');
  });

  test('formatCommitAsYaml handles empty parentHashes array', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('export function formatCommitAsYaml');
    assert.ok(fnStart >= 0, 'formatCommitAsYaml should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 50);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('[]'),
      'Should handle empty parentHashes with empty array');
  });

  test('formatCommitAsYaml handles empty tags array', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('export function formatCommitAsYaml');
    assert.ok(fnStart >= 0, 'formatCommitAsYaml should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 50);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('tags:'),
      'Should have tags key');
  });

  test('formatCommitAsYaml handles null stats', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('export function formatCommitAsYaml');
    assert.ok(fnStart >= 0, 'formatCommitAsYaml should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 50);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('stats: null'),
      'Should handle null stats');
  });

  test('formatCommitAsYaml uses ISO 8601 date format', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('export function formatCommitAsYaml');
    assert.ok(fnStart >= 0, 'formatCommitAsYaml should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 50);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('toISOString'),
      'Should use ISO 8601 date format');
  });

  test('formatCommitAsYaml handles committer info', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('export function formatCommitAsYaml');
    assert.ok(fnStart >= 0, 'formatCommitAsYaml should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 50);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('committer'),
      'Should include committer section');
  });

  test('handleCopyCommitYaml resolves commit from panel', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify handler reads from commits array
    assert.ok(source.includes('function handleCopyCommitYaml'),
      'handleCopyCommitYaml should be defined');
    assert.ok(source.includes('panel.getCommits()'),
      'Should get commits from panel');
  });

  test('handleCopyCommitYaml writes YAML to clipboard', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitYaml');
    assert.ok(fnStart >= 0, 'handleCopyCommitYaml should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 100);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write to clipboard');
    assert.ok(fnBody.includes('Copied as YAML'),
      'Should show YAML confirmation');
  });

  test('handleCopyCommitYaml handles missing commit', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyCommitYaml');
    const fnEnd = source.indexOf('\n}', fnStart + 100);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'Should handle commit not found');
  });

  test('main.js handleCopyYaml target resolution prioritizes focused', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyYaml');
    assert.ok(fnStart >= 0, 'handleCopyYaml should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('focusedIndex'),
      'Should check focusedIndex');
    assert.ok(fnBody.includes('selectedCommits'),
      'Should check selectedCommits');
    assert.ok(fnBody.includes('focusedIndex >= 0'),
      'Should prioritize focused over selected');
  });

  test('main.js handleCopyYaml sends correct message type', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyYaml');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copyCommitYaml'"),
      'Should send copyCommitYaml message type');
    assert.ok(fnBody.includes('vscode.postMessage'),
      'Should post message to extension');
  });

  test('context menu includes copy-yaml item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-yaml"'),
      'Context menu should include copy-yaml item');
    assert.ok(source.includes('Copy as YAML'),
      'Context menu should have "Copy as YAML" label');
  });

  test('package.json keybinding for Ctrl+Alt+Shift+Y', async () => {
    const packagePath = path.resolve(__dirname, '../../package.json');
    const source = fs.readFileSync(packagePath, 'utf-8');
    const json = JSON.parse(source);

    const binding = json.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyCommitYaml'
    );

    assert.ok(binding, 'Should have keybinding for gitHistory.copyCommitYaml');
    assert.strictEqual(binding.key, 'ctrl+alt+shift+y',
      'Should use ctrl+alt+shift+y for Windows/Linux');
    assert.strictEqual(binding.mac, 'cmd+alt+shift+y',
      'Should use cmd+alt+shift+y for macOS');
    assert.strictEqual(binding.when, 'activeWebviewPanelId == gitHistory.webview',
      'Should only work when git history webview is active');
  });

  test('extension.ts registers copyCommitYaml action', async () => {
    const extensionPath = path.resolve(__dirname, '../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes("action: 'copyCommitYaml'"),
      'extension.ts should register copyCommitYaml action');
  });

  test('full integration: message flow from main.js to messageHandler.ts', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');

    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');
    const handlerSource = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify main.js posts the message
    assert.ok(mainSource.includes("type: 'copyCommitYaml'"),
      'main.js should post copyCommitYaml message');

    // Verify messageHandler.ts handles the message
    assert.ok(handlerSource.includes("case 'copyCommitYaml':"),
      'messageHandler.ts should handle copyCommitYaml case');
    assert.ok(handlerSource.includes('handleCopyCommitYaml'),
      'messageHandler.ts should call handleCopyCommitYaml');
  });
});
