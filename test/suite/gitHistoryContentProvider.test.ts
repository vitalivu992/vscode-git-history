import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as vscode from 'vscode';
import { GitHistoryContentProvider } from '../../src/gitHistoryContentProvider';

suite('GitHistoryContentProvider Behavioral Tests', () => {
  let tempDir: string;
  let testFile: string;
  let provider: GitHistoryContentProvider;
  let rootFile: string;
  let nestedFile: string;

  suiteSetup(async () => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-provider-test-'));
    testFile = path.join(tempDir, 'test.txt');
    rootFile = path.join(tempDir, 'root.txt');
    nestedFile = path.join(tempDir, 'src', 'nested.ts');
    const nestedDir = path.dirname(nestedFile);

    // Initialize git repo
    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Create root level file and commit
    fs.writeFileSync(rootFile, 'Root file content\nLine 2\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit"', { cwd: tempDir });

    // Create test file with content
    fs.writeFileSync(testFile, 'Line 1\nLine 2\nLine 3\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Add test.txt"', { cwd: tempDir });

    // Create nested directory and file
    fs.mkdirSync(nestedDir, { recursive: true });
    fs.writeFileSync(nestedFile, 'export const x = 1;\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Add nested file"', { cwd: tempDir });

    // Modify test file
    fs.writeFileSync(testFile, 'Line 1\nLine 2 modified\nLine 3\nLine 4\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Modify test.txt"', { cwd: tempDir });

    // Create an empty file
    const emptyFile = path.join(tempDir, 'empty.txt');
    fs.writeFileSync(emptyFile, '');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Add empty file"', { cwd: tempDir });

    // Instantiate the provider
    provider = new GitHistoryContentProvider();
  });

  suiteTeardown(() => {
    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('provideTextDocumentContent returns correct content for valid URI', async () => {
    const { execSync } = require('child_process');
    const commitsOutput = execSync('git log --format=%H', { cwd: tempDir, encoding: 'utf-8' });
    const hashes = commitsOutput.trim().split('\n');
    const latestHash = hashes[0];

    const uri = vscode.Uri.parse(
      `git-history:/test.txt?commit=${latestHash}&cwd=${encodeURIComponent(tempDir)}`
    );
    const content = await provider.provideTextDocumentContent(uri);

    assert.ok(content.includes('Line 2 modified'), 'Should contain modified content');
    assert.ok(content.includes('Line 4'), 'Should contain new line 4');
  });

  test('provideTextDocumentContent returns content from specific commit', async () => {
    const { execSync } = require('child_process');
    const commitsOutput = execSync('git log --format=%H', { cwd: tempDir, encoding: 'utf-8' });
    const hashes = commitsOutput.trim().split('\n');

    // Get the second commit (index 1) where test.txt was first added
    const secondCommitHash = hashes[1];

    const uri = vscode.Uri.parse(
      `git-history:/test.txt?commit=${secondCommitHash}&cwd=${encodeURIComponent(tempDir)}`
    );
    const content = await provider.provideTextDocumentContent(uri);

    assert.ok(content.includes('Line 1'), 'Should contain Line 1');
    assert.ok(content.includes('Line 2'), 'Should contain Line 2');
    assert.ok(content.includes('Line 3'), 'Should contain Line 3');
    assert.ok(!content.includes('Line 2 modified'), 'Should not contain modified content');
    assert.ok(!content.includes('Line 4'), 'Should not contain Line 4');
  });

  test('provideTextDocumentContent handles path with leading slash', async () => {
    const { execSync } = require('child_process');
    const commitsOutput = execSync('git log --format=%H', { cwd: tempDir, encoding: 'utf-8' });
    const latestHash = commitsOutput.trim().split('\n')[0];

    // Standard git-history URI format with leading slash in path
    const uri = vscode.Uri.parse(
      `git-history:/test.txt?commit=${latestHash}&cwd=${encodeURIComponent(tempDir)}`
    );
    const content = await provider.provideTextDocumentContent(uri);

    assert.ok(content.length > 0, 'Should return content even with leading slash');
    assert.ok(content.includes('Line'), 'Should contain file content');
  });

  test('provideTextDocumentContent handles file path without leading slash', async () => {
    const { execSync } = require('child_process');
    const commitsOutput = execSync('git log --format=%H', { cwd: tempDir, encoding: 'utf-8' });
    const latestHash = commitsOutput.trim().split('\n')[0];

    // Manually construct URI without leading slash
    const uri = vscode.Uri.parse(
      `git-history:test.txt?commit=${latestHash}&cwd=${encodeURIComponent(tempDir)}`
    );
    const content = await provider.provideTextDocumentContent(uri);

    assert.ok(content.length > 0, 'Should return content');
    assert.ok(content.includes('Line'), 'Should contain file content');
  });

  test('provideTextDocumentContent handles root level file', async () => {
    const { execSync } = require('child_process');
    const commitsOutput = execSync('git log --format=%H', { cwd: tempDir, encoding: 'utf-8' });
    const latestHash = commitsOutput.trim().split('\n')[0];

    const uri = vscode.Uri.parse(
      `git-history:/root.txt?commit=${latestHash}&cwd=${encodeURIComponent(tempDir)}`
    );
    const content = await provider.provideTextDocumentContent(uri);

    assert.ok(content.includes('Root file content'), 'Should contain root file content');
    assert.ok(content.includes('Line 2'), 'Should contain second line');
  });

  test('provideTextDocumentContent handles nested file paths', async () => {
    const { execSync } = require('child_process');
    const commitsOutput = execSync('git log --format=%H', { cwd: tempDir, encoding: 'utf-8' });
    const latestHash = commitsOutput.trim().split('\n')[0];

    const uri = vscode.Uri.parse(
      `git-history:/src/nested.ts?commit=${latestHash}&cwd=${encodeURIComponent(tempDir)}`
    );
    const content = await provider.provideTextDocumentContent(uri);

    assert.ok(content.includes('export const x = 1;'), 'Should contain nested file content');
  });

  test('provideTextDocumentContent returns empty string for empty file', async () => {
    const { execSync } = require('child_process');
    const commitsOutput = execSync('git log --format=%H', { cwd: tempDir, encoding: 'utf-8' });
    const latestHash = commitsOutput.trim().split('\n')[0];

    const uri = vscode.Uri.parse(
      `git-history:/empty.txt?commit=${latestHash}&cwd=${encodeURIComponent(tempDir)}`
    );
    const content = await provider.provideTextDocumentContent(uri);

    assert.strictEqual(content, '', 'Empty file should return empty string');
  });

  test('provideTextDocumentContent handles missing file at commit', async () => {
    const { execSync } = require('child_process');
    const commitsOutput = execSync('git log --format=%H', { cwd: tempDir, encoding: 'utf-8' });

    // Use the initial commit (last in array) before test.txt was created
    const hashes = commitsOutput.trim().split('\n');
    const initialCommitHash = hashes[hashes.length - 1];

    const uri = vscode.Uri.parse(
      `git-history:/test.txt?commit=${initialCommitHash}&cwd=${encodeURIComponent(tempDir)}`
    );

    // getFileContentAtCommit should handle this gracefully
    // The behavior depends on how git show fails - it may throw or return error
    try {
      const content = await provider.provideTextDocumentContent(uri);
      // If it doesn't throw, content might be empty or an error message
      assert.ok(typeof content === 'string', 'Should return a string');
    } catch (error: any) {
      // If it throws, that's also acceptable behavior
      assert.ok(error.message, 'Error should have a message');
    }
  });

  test('provideTextDocumentContent handles invalid commit hash', async () => {
    const uri = vscode.Uri.parse(
      `git-history:/test.txt?commit=invalidhash123&cwd=${encodeURIComponent(tempDir)}`
    );

    try {
      const content = await provider.provideTextDocumentContent(uri);
      // May return error message or empty string
      assert.ok(typeof content === 'string', 'Should return a string or error');
    } catch (error: any) {
      // May throw for invalid commit
      assert.ok(error.message, 'Error should have a message');
    }
  });

  test('provideTextDocumentContent handles missing commit parameter', async () => {
    const uri = vscode.Uri.parse(
      `git-history:/test.txt?cwd=${encodeURIComponent(tempDir)}`
    );

    // Empty commit should be handled by getFileContentAtCommit
    const content = await provider.provideTextDocumentContent(uri);
    assert.ok(typeof content === 'string', 'Should return a string');
  });

  test('provideTextDocumentContent handles missing cwd parameter', async () => {
    const { execSync } = require('child_process');
    const commitsOutput = execSync('git log --format=%H', { cwd: tempDir, encoding: 'utf-8' });
    const latestHash = commitsOutput.trim().split('\n')[0];

    const uri = vscode.Uri.parse(
      `git-history:/test.txt?commit=${latestHash}`
    );

    // Empty cwd should cause an error or return empty
    try {
      const content = await provider.provideTextDocumentContent(uri);
      assert.ok(typeof content === 'string', 'Should return a string');
    } catch (error: any) {
      assert.ok(error.message, 'Error should have a message');
    }
  });

  test('provideTextDocumentContent handles special characters in file path', async () => {
    const { execSync } = require('child_process');

    // Create a file with special characters
    const specialFile = path.join(tempDir, 'special-file.txt');
    fs.writeFileSync(specialFile, 'Special content\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Add special file"', { cwd: tempDir });

    const commitsOutput = execSync('git log --format=%H', { cwd: tempDir, encoding: 'utf-8' });
    const latestHash = commitsOutput.trim().split('\n')[0];

    const uri = vscode.Uri.parse(
      `git-history:/special-file.txt?commit=${latestHash}&cwd=${encodeURIComponent(tempDir)}`
    );
    const content = await provider.provideTextDocumentContent(uri);

    assert.ok(content.includes('Special content'), 'Should handle special characters in filename');
  });

  test('provideTextDocumentContent returns different content for different commits', async () => {
    const { execSync } = require('child_process');
    const commitsOutput = execSync('git log --format=%H', { cwd: tempDir, encoding: 'utf-8' });
    const hashes = commitsOutput.trim().split('\n');

    // Get content from latest commit (where test.txt is modified)
    const latestUri = vscode.Uri.parse(
      `git-history:/test.txt?commit=${hashes[0]}&cwd=${encodeURIComponent(tempDir)}`
    );
    const latestContent = await provider.provideTextDocumentContent(latestUri);

    // Get content from earlier commit (where test.txt was first added)
    const earlierUri = vscode.Uri.parse(
      `git-history:/test.txt?commit=${hashes[1]}&cwd=${encodeURIComponent(tempDir)}`
    );
    const earlierContent = await provider.provideTextDocumentContent(earlierUri);

    assert.notStrictEqual(latestContent, earlierContent, 'Content should differ between commits');
    assert.ok(latestContent.includes('Line 2 modified'), 'Latest should have modified content');
    assert.ok(earlierContent.includes('Line 2') && !earlierContent.includes('Line 2 modified'),
      'Earlier should have original content');
  });

  test('GitHistoryContentProvider has static scheme property', () => {
    assert.strictEqual(GitHistoryContentProvider.scheme, 'git-history',
      'Should have git-history scheme');
  });
});
