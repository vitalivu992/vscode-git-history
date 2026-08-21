import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Create Branch E2E Tests', () => {
  let tempDir: string;
  let testFile: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-create-branch-'));
    testFile = path.join(tempDir, 'test.txt');

    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Create initial commit
    fs.writeFileSync(testFile, 'Hello World\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit"', { cwd: tempDir });

    // Create a second commit to have history
    fs.writeFileSync(testFile, 'Hello World\nLine 2\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Add second line"', { cwd: tempDir });
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('gitService.createBranchFromCommit exists', async () => {
    const gitServicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    assert.ok(source.includes('export async function createBranchFromCommit'),
      'createBranchFromCommit function should be exported');
  });

  test('gitService.createBranchFromCommit creates branch at commit', async () => {
    const { execSync } = require('child_process');

    // Get the hash of the first commit
    const logOutput = execSync('git log --format=%H', { cwd: tempDir, encoding: 'utf-8' });
    const commits = logOutput.trim().split('\n');
    const firstCommitHash = commits[commits.length - 1]; // Oldest commit

    // Import and call createBranchFromCommit
    const { createBranchFromCommit } = require('../../src/git/gitService');

    await createBranchFromCommit('test-branch-from-commit', firstCommitHash, tempDir);

    // Verify branch was created
    const branchOutput = execSync('git branch', { cwd: tempDir, encoding: 'utf-8' });
    assert.ok(branchOutput.includes('test-branch-from-commit'),
      'Branch should be created');

    // Verify branch points to the correct commit
    const branchHash = execSync('git rev-parse test-branch-from-commit', { cwd: tempDir, encoding: 'utf-8' }).trim();
    assert.strictEqual(branchHash, firstCommitHash,
      'Branch should point to the correct commit');
  });

  test('gitService.createBranchFromCommit fails for invalid branch name', async () => {
    const { execSync } = require('child_process');
    const { createBranchFromCommit } = require('../../src/git/gitService');

    // Get the hash of the first commit
    const logOutput = execSync('git log --format=%H', { cwd: tempDir, encoding: 'utf-8' });
    const commits = logOutput.trim().split('\n');
    const firstCommitHash = commits[commits.length - 1];

    // Try to create a branch with invalid name (contains ..)
    await assert.rejects(
      async () => await createBranchFromCommit('invalid..branch', firstCommitHash, tempDir),
      /Git error/,
      'Should throw error for invalid branch name'
    );
  });

  test('gitService.createBranchFromCommit fails for duplicate branch name', async () => {
    const { execSync } = require('child_process');
    const { createBranchFromCommit } = require('../../src/git/gitService');

    // Get the hash of the first commit
    const logOutput = execSync('git log --format=%H', { cwd: tempDir, encoding: 'utf-8' });
    const commits = logOutput.trim().split('\n');
    const firstCommitHash = commits[commits.length - 1];

    // Create a branch
    execSync('git branch duplicate-branch', { cwd: tempDir });

    // Try to create the same branch again
    await assert.rejects(
      async () => await createBranchFromCommit('duplicate-branch', firstCommitHash, tempDir),
      /Git error/,
      'Should throw error for duplicate branch name'
    );
  });

  test('messageHandler.handleCreateBranch exists', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('function handleCreateBranch'),
      'handleCreateBranch function should be defined');
  });

  test('messageHandler.handleCreateBranch prompts for branch name', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCreateBranch');
    assert.ok(fnStart >= 0, 'handleCreateBranch should exist');
    const fnEnd = source.lastIndexOf('\n}', source.length);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('showInputBox'),
      'Should prompt for branch name using showInputBox');
    assert.ok(fnBody.includes('placeHolder'),
      'Should provide placeholder for branch name');
  });

  test('messageHandler.handleCreateBranch shows confirmation', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCreateBranch');
    assert.ok(fnStart >= 0, 'handleCreateBranch should exist');
    const fnEnd = source.lastIndexOf('\n}', source.length);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('showInformationMessage'),
      'Should show confirmation message');
    assert.ok(fnBody.includes('created at commit'),
      'Confirmation should include commit info');
  });

  test('messageHandler.handleCreateBranch shows error on failure', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCreateBranch');
    assert.ok(fnStart >= 0, 'handleCreateBranch should exist');
    const fnEnd = source.lastIndexOf('\n}', source.length);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('showErrorMessage'),
      'Should show error message on failure');
    assert.ok(fnBody.includes('Failed to create branch'),
      'Error message should be descriptive');
  });

  test('main.js handleCreateBranch exists', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleCreateBranch'),
      'handleCreateBranch should be defined in main.js');
  });

  test('main.js handleCreateBranch sends createBranch message', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCreateBranch');
    assert.ok(fnStart >= 0, 'handleCreateBranch should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes("type: 'createBranch'"),
      'Should send createBranch message type');
    assert.ok(fnBody.includes('hash:'),
      'Should include commit hash');
  });

  test('context menu has create-branch item', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="create-branch"'),
      'Context menu should include create-branch');
    assert.ok(source.includes('Create branch from commit'),
      'Context menu should have label Create branch from commit');
  });

  test('context menu click handles create-branch action', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("action === 'create-branch'"),
      'Should handle create-branch action');
    const handlerIdx = source.indexOf("action === 'create-branch'");
    const nearby = source.substring(handlerIdx, handlerIdx + 200);
    assert.ok(nearby.includes('handleCreateBranch'),
      'create-branch action should call handleCreateBranch');
  });

  test('triggerAction handles createBranch', async () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'createBranch':"),
      'triggerAction should handle createBranch');
    assert.ok(source.includes("case 'createBranch': handleCreateBranch()"),
      'createBranch case should call handleCreateBranch');
  });

  test('package.json command registration', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');

    assert.ok(content.includes('"gitHistory.createBranch"'),
      'package.json should register createBranch command');
    assert.ok(content.includes('Create Branch from Commit'),
      'package.json should have command title');
  });

  test('extension.ts registers createBranch webview action', async () => {
    const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes("action: 'createBranch'"),
      'extension.ts should register createBranch action');
  });
});
