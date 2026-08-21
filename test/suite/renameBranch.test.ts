import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

suite('Rename Branch Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const gitServicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');

  test('types.ts should have renameBranch in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'renameBranch'"),
      'WebviewAction should include renameBranch');
  });

  test('types.ts should have renameBranch message with branch and newName', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("{ type: 'renameBranch'; branch: string; newName: string }"),
      'WebviewToExtMessage should carry branch and newName');
  });

  test('messageHandler.ts should handle renameBranch case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'renameBranch':"),
      'messageHandler.ts should handle renameBranch case');
    assert.ok(source.includes('function handleRenameBranch'),
      'handleRenameBranch function should be defined');
  });

  test('messageHandler.handleRenameBranch asks for the new name and refreshes', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleRenameBranch');
    assert.ok(fnStart >= 0, 'handleRenameBranch should exist');
    const fnEnd = source.indexOf('\n\nasync function', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : source.length);

    assert.ok(fnBody.includes('showInputBox'), 'Should prompt for the new branch name');
    assert.ok(fnBody.includes('renameBranch('), 'Should call gitService renameBranch');
    assert.ok(fnBody.includes('panel.loadData()'), 'Should refresh the panel after renaming');
  });

  test('extension.ts should register gitHistory.renameBranch command', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("command: 'gitHistory.renameBranch', action: 'renameBranch'"),
      'renameBranch command should trigger the webview action');
  });

  test('package.json should contribute gitHistory.renameBranch command', () => {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    const commands = pkg.contributes.commands.map((c: { command: string }) => c.command);
    assert.ok(commands.includes('gitHistory.renameBranch'),
      'gitHistory.renameBranch should be contributed');
  });

  test('main.js should handle renameBranch action with a branch picker', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'renameBranch': handleRenameBranch(); break;"),
      'triggerAction switch should route renameBranch');
    assert.ok(source.includes('function handleRenameBranch'),
      'handleRenameBranch should exist in main.js');

    const fnStart = source.indexOf('function handleRenameBranch');
    const fnEnd = source.indexOf('function ', source.indexOf("type: 'renameBranch'"));
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : source.length);
    assert.ok(fnBody.includes("type: 'renameBranch'"),
      'Branch picker should post a renameBranch message');
    assert.ok(fnBody.includes('remotes/'),
      'Branch picker should list local branches only');
  });
});

suite('Rename Branch Git Integration Tests', () => {
  let tempDir: string;

  suiteSetup(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-rename-branch-test-'));

    const { execSync } = require('child_process');
    execSync('git init', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });

    fs.writeFileSync(path.join(tempDir, 'test.txt'), 'Initial content\n');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -m "Initial commit"', { cwd: tempDir });
    execSync('git branch feature/old-name', { cwd: tempDir });
  });

  suiteTeardown(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('gitService.renameBranch renames a local branch', async () => {
    const { execSync } = require('child_process');
    const { renameBranch } = await import('../../src/git/gitService');

    await renameBranch('feature/old-name', 'feature/new-name', tempDir);

    const branchOutput = execSync('git branch', { cwd: tempDir, encoding: 'utf-8' });
    assert.ok(!branchOutput.includes('feature/old-name'), 'Old branch name should be gone');
    assert.ok(branchOutput.includes('feature/new-name'), 'New branch name should exist');
  });

  test('gitService.renameBranch can rename the current branch', async () => {
    const { execSync } = require('child_process');
    const { renameBranch } = await import('../../src/git/gitService');

    await renameBranch('master', 'main', tempDir);

    const branchOutput = execSync('git branch', { cwd: tempDir, encoding: 'utf-8' });
    assert.ok(branchOutput.includes('main'), 'Current branch should be renamed to main');
    assert.ok(!branchOutput.includes('master'), 'Old current branch name should be gone');
  });

  test('gitService.renameBranch fails for non-existent branch', async () => {
    const { renameBranch } = await import('../../src/git/gitService');

    await assert.rejects(
      async () => await renameBranch('non-existent-branch', 'whatever', tempDir),
      /Git error/,
      'Should throw error for non-existent branch'
    );
  });
});
