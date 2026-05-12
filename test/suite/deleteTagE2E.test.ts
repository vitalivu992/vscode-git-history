import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Delete Tag E2E Tests', () => {
  let tempDir: string;
  let testFile: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-delete-tag-'));
    testFile = path.join(tempDir, 'test.txt');

    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Create initial commit
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

  test('gitService.deleteTagFromCommit exists', async () => {
    const gitServicePath = path.resolve(__dirname, '../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    assert.ok(source.includes('export async function deleteTagFromCommit'),
      'deleteTagFromCommit function should be exported');
  });

  test('gitService.deleteTagFromCommit deletes a tag', async () => {
    const { execSync } = require('child_process');

    // Get the hash of the first commit
    const logOutput = execSync('git log --format=%H', { cwd: tempDir, encoding: 'utf-8' });
    const commits = logOutput.trim().split('\n');
    const firstCommitHash = commits[commits.length - 1]; // Oldest commit

    // First create a tag
    execSync('git tag v1.0.0', { cwd: tempDir });

    // Verify tag was created
    let tagOutput = execSync('git tag', { cwd: tempDir, encoding: 'utf-8' });
    assert.ok(tagOutput.includes('v1.0.0'), 'Tag should be created');

    // Import and call deleteTagFromCommit
    const { deleteTagFromCommit } = require('../../src/git/gitService');

    await deleteTagFromCommit('v1.0.0', tempDir);

    // Verify tag was deleted
    tagOutput = execSync('git tag', { cwd: tempDir, encoding: 'utf-8' });
    assert.ok(!tagOutput.includes('v1.0.0'), 'Tag should be deleted');
  });

  test('gitService.deleteTagFromCommit fails for non-existent tag', async () => {
    const { deleteTagFromCommit } = require('../../src/git/gitService');

    // Try to delete a tag that doesn't exist
    await assert.rejects(
      async () => await deleteTagFromCommit('non-existent-tag', tempDir),
      /Git error/,
      'Should throw error for non-existent tag'
    );
  });

  test('messageHandler.handleDeleteTag exists', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('function handleDeleteTag'),
      'handleDeleteTag function should be defined');
  });

  test('messageHandler.handleDeleteTag checks for tags on commit', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleDeleteTag');
    assert.ok(fnStart >= 0, 'handleDeleteTag should exist');
    const fnEnd = source.indexOf('\n\nasync function', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : source.length);

    assert.ok(fnBody.includes('commit.tags'),
      'Should check for tags on commit');
    assert.ok(fnBody.includes('showErrorMessage') || fnBody.includes('showInformationMessage'),
      'Should show appropriate message');
  });

  test('messageHandler.handleDeleteTag handles single tag', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleDeleteTag');
    assert.ok(fnStart >= 0, 'handleDeleteTag should exist');
    const fnEnd = source.indexOf('\n\nasync function', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : source.length);

    // Should handle the case when there's only one tag
    assert.ok(fnBody.includes('tags.length === 1') || fnBody.includes('tags.length === 0') || fnBody.includes('showQuickPick'),
      'Should handle single tag case');
  });

  test('messageHandler.handleDeleteTag handles multiple tags', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleDeleteTag');
    assert.ok(fnStart >= 0, 'handleDeleteTag should exist');
    const fnEnd = source.indexOf('\n\nasync function', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : source.length);

    // Should use showQuickPick for multiple tags
    assert.ok(fnBody.includes('showQuickPick'),
      'Should use showQuickPick for multiple tags');
  });

  test('messageHandler.handleDeleteTag calls deleteTagFromCommit', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleDeleteTag');
    assert.ok(fnStart >= 0, 'handleDeleteTag should exist');
    const fnEnd = source.indexOf('\n\nasync function', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : source.length);

    assert.ok(fnBody.includes('deleteTagFromCommit'),
      'Should call deleteTagFromCommit');
  });

  test('messageHandler.handleDeleteTag refreshes panel after deletion', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleDeleteTag');
    assert.ok(fnStart >= 0, 'handleDeleteTag should exist');
    const fnEnd = source.indexOf('\n\nasync function', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : source.length);

    assert.ok(fnBody.includes('panel.loadData'),
      'Should refresh panel after deletion');
  });

  test('messageHandler.handleDeleteTag shows confirmation', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleDeleteTag');
    assert.ok(fnStart >= 0, 'handleDeleteTag should exist');
    const fnEnd = source.indexOf('\n\nasync function', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : source.length);

    assert.ok(fnBody.includes('showInformationMessage'),
      'Should show confirmation message');
    assert.ok(fnBody.includes('deleted'),
      'Confirmation should indicate deletion');
  });
});