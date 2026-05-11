import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('Create Tag E2E Tests', () => {
  let tempDir: string;
  let testFile: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-create-tag-'));
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

  test('gitService.createTagFromCommit exists', async () => {
    const gitServicePath = path.resolve(__dirname, '../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    assert.ok(source.includes('export async function createTagFromCommit'),
      'createTagFromCommit function should be exported');
  });

  test('gitService.createTagFromCommit creates lightweight tag', async () => {
    const { execSync } = require('child_process');

    // Get the hash of the first commit
    const logOutput = execSync('git log --format=%H', { cwd: tempDir, encoding: 'utf-8' });
    const commits = logOutput.trim().split('\n');
    const firstCommitHash = commits[commits.length - 1]; // Oldest commit

    // Import and call createTagFromCommit
    const { createTagFromCommit } = require('../../src/git/gitService');

    await createTagFromCommit('v1.0.0', firstCommitHash, tempDir);

    // Verify tag was created
    const tagOutput = execSync('git tag', { cwd: tempDir, encoding: 'utf-8' });
    assert.ok(tagOutput.includes('v1.0.0'),
      'Tag should be created');

    // Verify tag points to the correct commit
    const tagHash = execSync('git rev-parse v1.0.0', { cwd: tempDir, encoding: 'utf-8' }).trim();
    assert.strictEqual(tagHash, firstCommitHash,
      'Tag should point to the correct commit');
  });

  test('gitService.createTagFromCommit creates annotated tag with message', async () => {
    const { execSync } = require('child_process');
    const { createTagFromCommit } = require('../../src/git/gitService');

    // Get the hash of the first commit
    const logOutput = execSync('git log --format=%H', { cwd: tempDir, encoding: 'utf-8' });
    const commits = logOutput.trim().split('\n');
    const firstCommitHash = commits[commits.length - 1];

    // Create annotated tag with message
    await createTagFromCommit('v2.0.0', firstCommitHash, tempDir, 'Release version 2.0.0');

    // Verify annotated tag was created
    const tagOutput = execSync('git tag', { cwd: tempDir, encoding: 'utf-8' });
    assert.ok(tagOutput.includes('v2.0.0'),
      'Annotated tag should be created');

    // Verify tag is annotated (has message)
    const tagMessage = execSync('git cat-file -p v2.0.0', { cwd: tempDir, encoding: 'utf-8' });
    assert.ok(tagMessage.includes('Release version 2.0.0'),
      'Annotated tag should have the message');
  });

  test('gitService.createTagFromCommit fails for invalid tag name', async () => {
    const { execSync } = require('child_process');
    const { createTagFromCommit } = require('../../src/git/gitService');

    // Get the hash of the first commit
    const logOutput = execSync('git log --format=%H', { cwd: tempDir, encoding: 'utf-8' });
    const commits = logOutput.trim().split('\n');
    const firstCommitHash = commits[commits.length - 1];

    // Try to create a tag with invalid name (contains ..)
    await assert.rejects(
      async () => await createTagFromCommit('invalid..tag', firstCommitHash, tempDir),
      /Git error/,
      'Should throw error for invalid tag name'
    );
  });

  test('gitService.createTagFromCommit fails for duplicate tag name', async () => {
    const { execSync } = require('child_process');
    const { createTagFromCommit } = require('../../src/git/gitService');

    // Get the hash of the first commit
    const logOutput = execSync('git log --format=%H', { cwd: tempDir, encoding: 'utf-8' });
    const commits = logOutput.trim().split('\n');
    const firstCommitHash = commits[commits.length - 1];

    // Create a tag
    execSync('git tag duplicate-tag', { cwd: tempDir });

    // Try to create the same tag again
    await assert.rejects(
      async () => await createTagFromCommit('duplicate-tag', firstCommitHash, tempDir),
      /Git error/,
      'Should throw error for duplicate tag name'
    );
  });

  test('messageHandler.handleCreateTag exists', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    assert.ok(source.includes('function handleCreateTag'),
      'handleCreateTag function should be defined');
  });

  test('messageHandler.handleCreateTag prompts for tag name', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCreateTag');
    assert.ok(fnStart >= 0, 'handleCreateTag should exist');
    const fnEnd = source.lastIndexOf('\n}', source.length);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('showInputBox'),
      'Should prompt for tag name using showInputBox');
    assert.ok(fnBody.includes('placeholder'),
      'Should provide placeholder for tag name');
  });

  test('messageHandler.handleCreateTag shows confirmation', async () => {
    const messageHandlerPath = path.resolve(__dirname, '../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(messageHandlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCreateTag');
    assert.ok(fnStart >= 0, 'handleCreateTag should exist');
    const fnEnd = source.lastIndexOf('\n}', source.length);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('showInformationMessage'),
      'Should show confirmation message');
    assert.ok(fnBody.includes('created at commit'),
      'Confirmation should include commit info');
  });
});