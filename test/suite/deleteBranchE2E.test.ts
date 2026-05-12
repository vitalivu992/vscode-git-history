import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Delete Branch E2E Tests', () => {
  let tempDir: string;
  let testFile: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-delete-branch-'));
    testFile = path.join(tempDir, 'test.txt');

    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Create initial commit on main
    fs.writeFileSync(testFile, 'Hello World\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit"', { cwd: tempDir });

    // Create a second commit
    fs.writeFileSync(testFile, 'Hello World\nLine 2\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Add second line"', { cwd: tempDir });
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('gitService.deleteBranch exists', async () => {
    const gitServicePath = path.resolve(__dirname, '../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    assert.ok(source.includes('export async function deleteBranch'),
      'deleteBranch function should be exported');
  });

  test('gitService.deleteBranch deletes a local branch', async () => {
    const { execSync } = require('child_process');

    // Create a branch from current HEAD
    execSync('git branch test-branch-to-delete', { cwd: tempDir });

    // Verify branch was created
    let branchOutput = execSync('git branch', { cwd: tempDir, encoding: 'utf-8' });
    assert.ok(branchOutput.includes('test-branch-to-delete'), 'Branch should be created');

    // Import and call deleteBranch
    const { deleteBranch } = require('../../src/git/gitService');

    await deleteBranch('test-branch-to-delete', tempDir);

    // Verify branch was deleted
    branchOutput = execSync('git branch', { cwd: tempDir, encoding: 'utf-8' });
    assert.ok(!branchOutput.includes('test-branch-to-delete'), 'Branch should be deleted');
  });

  test('gitService.deleteBranch fails for non-existent branch', async () => {
    const { deleteBranch } = require('../../src/git/gitService');

    // Try to delete a branch that doesn't exist
    await assert.rejects(
      async () => await deleteBranch('non-existent-branch', tempDir),
      /Git error/,
      'Should throw error for non-existent branch'
    );
  });

  test('gitService.deleteBranch with force deletes unmerged branch', async () => {
    const { execSync } = require('child_process');

    // Create a branch, make a commit on it, then switch back
    execSync('git checkout -b unmerged-branch', { cwd: tempDir });
    fs.writeFileSync(testFile, 'Uncommitted changes\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Unmerged commit"', { cwd: tempDir });

    // Switch back to master
    execSync('git checkout master', { cwd: tempDir });

    // Try normal delete first - should fail
    const { deleteBranch } = require('../../src/git/gitService');

    await assert.rejects(
      async () => await deleteBranch('unmerged-branch', tempDir, false),
      /Git error/,
      'Should fail to delete unmerged branch without force'
    );

    // Force delete should work
    await deleteBranch('unmerged-branch', tempDir, true);

    const branchOutput = execSync('git branch', { cwd: tempDir, encoding: 'utf-8' });
    assert.ok(!branchOutput.includes('unmerged-branch'), 'Unmerged branch should be force deleted');
  });

  test('messageHandler.handleDeleteBranch exists', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('function handleDeleteBranch'),
      'handleDeleteBranch function should be defined');
  });

  test('messageHandler.handleDeleteBranch checks for current branch', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleDeleteBranch');
    assert.ok(fnStart >= 0, 'handleDeleteBranch should exist');
    const fnEnd = source.indexOf('\n\nasync function', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : source.length);

    assert.ok(fnBody.includes('currentBranch') || fnBody.includes('Cannot delete the current branch'),
      'Should check for current branch');
  });

  test('messageHandler.handleDeleteBranch shows confirmation', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleDeleteBranch');
    assert.ok(fnStart >= 0, 'handleDeleteBranch should exist');
    const fnEnd = source.indexOf('\n\nasync function', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : source.length);

    assert.ok(fnBody.includes('showInformationMessage'),
      'Should show confirmation dialog');
    assert.ok(fnBody.includes('Delete'),
      'Should have Delete button in confirmation');
  });

  test('messageHandler.handleDeleteBranch calls deleteBranch', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleDeleteBranch');
    assert.ok(fnStart >= 0, 'handleDeleteBranch should exist');
    const fnEnd = source.indexOf('\n\nasync function', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : source.length);

    assert.ok(fnBody.includes('deleteBranch('),
      'Should call deleteBranch from gitService');
  });

  test('messageHandler.handleDeleteBranch refreshes panel after deletion', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleDeleteBranch');
    assert.ok(fnStart >= 0, 'handleDeleteBranch should exist');
    const fnEnd = source.indexOf('\n\nasync function', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : source.length);

    assert.ok(fnBody.includes('panel.loadData'),
      'Should refresh panel after deletion');
  });

  test('main.js handleDeleteBranch filters to local branches only', () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleDeleteBranch');
    assert.ok(fnStart >= 0, 'handleDeleteBranch should exist');
    const fnEnd = source.indexOf('\nfunction ', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : source.length);

    assert.ok(fnBody.includes('remotes/') || fnBody.includes('startsWith'),
      'Should filter out remote branches');
  });

  test('main.js handleDeleteBranch prevents deleting current branch', () => {
    const mainJsPath = path.resolve(__dirname, '../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleDeleteBranch');
    assert.ok(fnStart >= 0, 'handleDeleteBranch should exist');
    const fnEnd = source.indexOf('\nfunction ', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : source.length);

    assert.ok(fnBody.includes('currentBranch') || fnBody.includes('current'),
      'Should identify current branch');
    assert.ok(fnBody.includes('Cannot delete current branch') || fnBody.includes('Cannot delete') || fnBody.includes('current-branch'),
      'Should prevent deleting current branch');
  });
});
