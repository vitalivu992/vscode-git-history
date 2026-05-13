import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { getFileStats } from '../../src/git/gitService';

suite('Copy File Stats Tests', () => {
  let tempDir: string;
  let testFile1: string;
  let testFile2: string;
  let commitHash: string;

  suiteSetup(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-copy-file-stats-test-'));
    testFile1 = path.join(tempDir, 'test1.txt');
    testFile2 = path.join(tempDir, 'test2.txt');

    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    // Create initial commit
    fs.writeFileSync(testFile1, 'Initial content line 1\nInitial content line 2\n');
    fs.writeFileSync(testFile2, 'Another file content\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit"', { cwd: tempDir });

    // Create second commit with multiple file changes
    fs.writeFileSync(testFile1, 'Initial content line 1\nModified content line 2\nAdded line 3\nAdded line 4\n');
    fs.writeFileSync(testFile2, 'Modified file content\nNew line here\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Second commit with file changes"', { cwd: tempDir });

    // Get the hash of the second commit
    const output = execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' });
    commitHash = output.trim();
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('types.ts should have copyFileStats message type', () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("type: 'copyFileStats'"),
      'types.ts should have copyFileStats message type');
    assert.ok(source.includes('hash: string'),
      'copyFileStats should have hash field');
  });

  test('types.ts should have FileStats interface', () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes('interface FileStats'),
      'types.ts should have FileStats interface');
    assert.ok(source.includes('path: string'),
      'FileStats should have path field');
    assert.ok(source.includes('insertions: number'),
      'FileStats should have insertions field');
    assert.ok(source.includes('deletions: number'),
      'FileStats should have deletions field');
    assert.ok(source.includes('isBinary: boolean'),
      'FileStats should have isBinary field');
  });

  test('types.ts should have copyFileStats WebviewAction', () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("'copyFileStats'"),
      'types.ts WebviewAction should include copyFileStats');
  });

  test('gitService.ts should have getFileStats function', () => {
    const gitServicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    assert.ok(source.includes('export async function getFileStats'),
      'gitService.ts should have getFileStats function');
  });

  test('getFileStats should return per-file statistics', async () => {
    const stats = await getFileStats(commitHash, tempDir);

    assert.ok(Array.isArray(stats), 'getFileStats should return an array');
    assert.ok(stats.length >= 2, 'Should have at least 2 files in stats');

    // Check first file stats (test1.txt)
    const test1Stats = stats.find((s: any) => s.path.endsWith('test1.txt'));
    assert.ok(test1Stats, 'Should have stats for test1.txt');
    assert.strictEqual(test1Stats.insertions, 2, 'test1.txt should have 2 insertions');
    assert.strictEqual(test1Stats.deletions, 1, 'test1.txt should have 1 deletion');
    assert.strictEqual(test1Stats.isBinary, false, 'test1.txt should not be binary');

    // Check second file stats (test2.txt)
    const test2Stats = stats.find((s: any) => s.path.endsWith('test2.txt'));
    assert.ok(test2Stats, 'Should have stats for test2.txt');
    assert.strictEqual(test2Stats.insertions, 1, 'test2.txt should have 1 insertion');
    assert.strictEqual(test2Stats.deletions, 1, 'test2.txt should have 1 deletion');
    assert.strictEqual(test2Stats.isBinary, false, 'test2.txt should not be binary');
  });

  test('getFileStats should handle binary files', async () => {
    // Create a binary file
    const binaryFile = path.join(tempDir, 'binary.dat');
    fs.writeFileSync(binaryFile, Buffer.from([0x00, 0x01, 0x02, 0x03]));

    const { execSync } = require('child_process');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Add binary file"', { cwd: tempDir });

    const output = execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' });
    const binaryCommitHash = output.trim();

    const stats = await getFileStats(binaryCommitHash, tempDir);

    const binaryStats = stats.find((s: any) => s.path.endsWith('binary.dat'));
    assert.ok(binaryStats, 'Should have stats for binary.dat');
    assert.strictEqual(binaryStats.isBinary, true, 'binary.dat should be marked as binary');
    assert.strictEqual(binaryStats.insertions, 0, 'Binary file should have 0 insertions');
    assert.strictEqual(binaryStats.deletions, 0, 'Binary file should have 0 deletions');
  });

  test('getFileStats should handle file paths with special characters', async () => {
    // Create a file with spaces in name
    const spaceFile = path.join(tempDir, 'file with spaces.txt');
    fs.writeFileSync(spaceFile, 'Content with spaces\n');

    const { execSync } = require('child_process');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Add file with spaces"', { cwd: tempDir });

    const output = execSync('git log --format=%H -1', { cwd: tempDir, encoding: 'utf-8' });
    const spaceCommitHash = output.trim();

    const stats = await getFileStats(spaceCommitHash, tempDir);

    const spaceStats = stats.find((s: any) => s.path.endsWith('file with spaces.txt'));
    assert.ok(spaceStats, 'Should handle file paths with spaces');
    assert.ok(spaceStats.path.includes('file with spaces.txt'), 'Path should preserve spaces');
  });

  test('messageHandler.ts should have handleCopyFileStats function', () => {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('case \'copyFileStats\''),
      'messageHandler.ts should handle copyFileStats message');
    assert.ok(source.includes('async function handleCopyFileStats'),
      'messageHandler.ts should have handleCopyFileStats function');
  });

  test('messageHandler.ts should import getFileStats', () => {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('getFileStats'),
      'messageHandler.ts should import getFileStats');
  });

  test('main.js should have copy-file-stats context menu action', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-file-stats"'),
      'main.js context menu should include copy-file-stats action');
    assert.ok(source.includes('Copy file stats'),
      'main.js context menu should have Copy file stats label');
  });

  test('main.js should have handleCopyFileStats function', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFileStats()'),
      'main.js should have handleCopyFileStats function');
    assert.ok(source.includes('type: \'copyFileStats\''),
      'main.js should send copyFileStats message');
  });

  test('extension.ts should register gitHistory.copyFileStats command', () => {
    const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(source.includes('gitHistory.copyFileStats'),
      'extension.ts should register gitHistory.copyFileStats command');
    assert.ok(source.includes('action: \'copyFileStats\''),
      'extension.ts should map copyFileStats action');
  });

  test('package.json should have gitHistory.copyFileStats command', () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    assert.ok(packageJson.contributes.commands.some(
      (c: any) => c.command === 'gitHistory.copyFileStats'),
      'package.json should have gitHistory.copyFileStats command');

    const command = packageJson.contributes.commands.find(
      (c: any) => c.command === 'gitHistory.copyFileStats');
    assert.strictEqual(command.title, 'Git History: Copy File Stats',
      'Command title should be correct');
    assert.strictEqual(command.category, 'Git History',
      'Command category should be Git History');
  });

  test('package.json should have keybinding for copyFileStats', () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    const keybinding = packageJson.contributes.keybindings.find(
      (k: any) => k.command === 'gitHistory.copyFileStats');
    assert.ok(keybinding, 'package.json should have keybinding for copyFileStats');
    assert.ok(keybinding.key, 'Should have a key defined');
    assert.ok(keybinding.when.includes('gitHistory.webview'),
      'Keybinding should be scoped to gitHistory webview');
  });
});
