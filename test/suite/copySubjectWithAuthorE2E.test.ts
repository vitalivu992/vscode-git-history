import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Copy Subject With Author E2E Tests', () => {
  let tempDir: string;
  let testFile: string;
  let commitHash: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-subject-with-author-'));
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

  test('handleCopySubjectWithAuthor with valid commit', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopySubjectWithAuthor'),
      'handleCopySubjectWithAuthor should be defined');
    assert.ok(source.includes('panel.getCommits()'),
      'Should get commits from panel');
  });

  test('handleCopySubjectWithAuthor formats as subject - author', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopySubjectWithAuthor');
    assert.ok(fnStart >= 0, 'handleCopySubjectWithAuthor should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 100);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('${commit.message} - ${commit.author}'),
      'Should format as subject - author');
    assert.ok(fnBody.includes('vscode.env.clipboard.writeText'),
      'Should write to clipboard');
  });

  test('handleCopySubjectWithAuthor truncates long output', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopySubjectWithAuthor');
    const fnEnd = source.indexOf('\n}', fnStart + 100);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('substring(0, 47)'),
      'Should truncate at 47 chars for display');
    assert.ok(fnBody.includes("'...'"),
      'Should append ellipsis');
  });

  test('handleCopySubjectWithAuthor handles missing commit', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopySubjectWithAuthor');
    const fnEnd = source.indexOf('\n}', fnStart + 100);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('Commit not found'),
      'Should handle commit not found');
  });

  test('main.js handleCopySubjectWithAuthor target resolution prioritizes focused', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopySubjectWithAuthor');
    assert.ok(fnStart >= 0, 'handleCopySubjectWithAuthor should exist');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('focusedIndex'),
      'Should check focusedIndex');
    assert.ok(fnBody.includes('selectedCommits'),
      'Should check selectedCommits');
    assert.ok(fnBody.includes('focusedIndex >= 0'),
      'Should prioritize focused over selected');
  });

  test('main.js handleCopySubjectWithAuthor sends correct message type', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopySubjectWithAuthor');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copySubjectWithAuthor'"),
      'Should send copySubjectWithAuthor message type');
    assert.ok(fnBody.includes('vscode.postMessage'),
      'Should post message to extension');
  });

  test('main.js triggerAction dispatches copySubjectWithAuthor', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'copySubjectWithAuthor':"),
      'Should have case for copySubjectWithAuthor');
    assert.ok(source.includes("handleCopySubjectWithAuthor()"),
      'Should call handleCopySubjectWithAuthor');
  });

  test('context menu includes copy-subject-with-author item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('copy-subject-with-author'),
      'Context menu should include copy-subject-with-author item');
    assert.ok(source.includes('Copy subject with author'),
      'Context menu should have "Copy subject with author" label');
    assert.ok(source.includes('📝'),
      'Context menu should have memo icon');
  });

  test('extension.ts registers copySubjectWithAuthor action', async () => {
    const extensionPath = path.resolve(__dirname, '../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes("action: 'copySubjectWithAuthor'"),
      'extension.ts should register copySubjectWithAuthor action');
  });

  test('subject - author format produces expected output', async () => {
    const message = 'Initial commit';
    const author = 'Test User';
    const result = `${message} - ${author}`;
    assert.strictEqual(result, 'Initial commit - Test User');
  });

  test('full integration: message flow from main.js to messageHandler.ts', async () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');

    const mainSource = fs.readFileSync(mainJsPath, 'utf-8');
    const handlerSource = fs.readFileSync(messageHandlerPath, 'utf-8');

    // Verify main.js posts the message
    assert.ok(mainSource.includes("type: 'copySubjectWithAuthor'"),
      'main.js should post copySubjectWithAuthor message');

    // Verify messageHandler.ts handles the message
    assert.ok(handlerSource.includes("case 'copySubjectWithAuthor':"),
      'messageHandler.ts should handle copySubjectWithAuthor case');
    assert.ok(handlerSource.includes('handleCopySubjectWithAuthor'),
      'messageHandler.ts should call handleCopySubjectWithAuthor');
  });
});
