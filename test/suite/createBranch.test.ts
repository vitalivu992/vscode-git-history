import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Create Branch Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const gitServicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  test('types.ts should have createBranch message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'createBranch'"),
      'types.ts should have createBranch message type');
  });

  test('types.ts should have createBranch in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'createBranch'"),
      'WebviewAction should include createBranch');
  });

  test('types.ts should have createBranch in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'createBranch'"),
      'WebviewToExtMessage should include createBranch');
  });

  test('types.ts should have createBranch message with hash property', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("{ type: 'createBranch'; hash: string }"),
      'types.ts should have createBranch message with hash property');
  });

  test('messageHandler.ts should handle createBranch case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'createBranch':"),
      'messageHandler.ts should handle createBranch case');
  });

  test('messageHandler.ts should import createBranchFromCommit', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('createBranchFromCommit'),
      'messageHandler.ts should import createBranchFromCommit');
  });

  test('messageHandler.ts should have handleCreateBranch function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCreateBranch'),
      'messageHandler.ts should have handleCreateBranch function');
  });

  test('handleCreateBranch should prompt for branch name', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCreateBranch');
    assert.ok(fnStart >= 0, 'handleCreateBranch function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('showInputBox'),
      'handleCreateBranch should prompt for branch name');
    assert.ok(fnBody.includes('placeHolder'),
      'handleCreateBranch should provide placeholder');
  });

  test('handleCreateBranch should call createBranchFromCommit', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCreateBranch');
    assert.ok(fnStart >= 0, 'handleCreateBranch function should exist');
    const fnEnd = source.lastIndexOf('\n}', source.length);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('createBranchFromCommit'),
      'handleCreateBranch should call createBranchFromCommit');
  });

  test('handleCreateBranch should show confirmation on success', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCreateBranch');
    assert.ok(fnStart >= 0, 'handleCreateBranch function should exist');
    const fnEnd = source.lastIndexOf('\n}', source.length);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('showInformationMessage'),
      'handleCreateBranch should show confirmation message');
    assert.ok(fnBody.includes('created at commit'),
      'handleCreateBranch should confirm branch creation');
  });

  test('handleCreateBranch should handle empty input as cancel', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCreateBranch');
    assert.ok(fnStart >= 0, 'handleCreateBranch function should exist');
    const fnEnd = source.lastIndexOf('\n}', source.length);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('trim() === \'\'') || fnBody.includes('!branchName'),
      'handleCreateBranch should handle empty input as cancel');
  });

  test('handleCreateBranch should show error on failure', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleCreateBranch');
    assert.ok(fnStart >= 0, 'handleCreateBranch function should exist');
    const fnEnd = source.lastIndexOf('\n}', source.length);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('showErrorMessage'),
      'handleCreateBranch should show error message on failure');
    assert.ok(fnBody.includes('Failed to create branch'),
      'handleCreateBranch should show specific error message');
  });

  test('gitService.ts should have createBranchFromCommit function', () => {
    const source = fs.readFileSync(gitServicePath, 'utf-8');
    assert.ok(source.includes('export async function createBranchFromCommit'),
      'gitService.ts should have createBranchFromCommit function');
  });

  test('createBranchFromCommit should use git branch command', () => {
    const source = fs.readFileSync(gitServicePath, 'utf-8');
    const fnStart = source.indexOf('export async function createBranchFromCommit');
    assert.ok(fnStart >= 0, 'createBranchFromCommit function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 300);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : fnStart + 300);

    assert.ok(fnBody.includes("'branch'"),
      'createBranchFromCommit should use git branch command');
    assert.ok(fnBody.includes('branchName'),
      'createBranchFromCommit should use branchName parameter');
    assert.ok(fnBody.includes('commitHash'),
      'createBranchFromCommit should use commitHash parameter');
  });

  test('main.js should have handleCreateBranch function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCreateBranch'),
      'main.js should have handleCreateBranch function');
  });

  test('main.js should send createBranch message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("type: 'createBranch'"),
      'main.js should send createBranch message');
  });

  test('main.js triggerAction should dispatch createBranch', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'createBranch': handleCreateBranch()"),
      'main.js triggerAction should dispatch createBranch');
  });

  test('context menu should have create-branch item', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('data-action="create-branch"'),
      'Context menu should include create-branch');
  });

  test('context menu click handler should handle create-branch action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'create-branch'"),
      'Context menu click handler should handle create-branch action');
    const handlerIdx = source.indexOf("action === 'create-branch'");
    const nearby = source.substring(handlerIdx, handlerIdx + 200);
    assert.ok(nearby.includes('handleCreateBranch'),
      'create-branch handler should call handleCreateBranch');
  });

  test('package.json should register createBranch command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.createBranch'),
      'package.json should register gitHistory.createBranch command');
  });

  test('package.json should have Create Branch from Commit command title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Create Branch from Commit'),
      'package.json should have Create Branch from Commit command title');
  });

  test('extension.ts should register createBranch webview action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'createBranch'"),
      'extension.ts should register createBranch webview action');
  });

  test('handleCreateBranch should prioritize focused row over selected commit', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function handleCreateBranch');
    assert.ok(fnStart >= 0, 'handleCreateBranch function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('focusedIndex'),
      'handleCreateBranch should check focusedIndex first');
    assert.ok(fnBody.includes('selectedCommits'),
      'handleCreateBranch should fall back to selectedCommits');
  });

  test('handleCreateBranch should show error if no commit selected', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function handleCreateBranch');
    assert.ok(fnStart >= 0, 'handleCreateBranch function should exist');
    const fnEnd = source.indexOf('\n}', fnStart + 500);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : fnStart + 500);

    assert.ok(fnBody.includes('showError') || fnBody.includes('Select a commit'),
      'handleCreateBranch should show error if no commit selected');
  });

  test('CLAUDE.md should document Create Branch from Commit feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Create Branch from Commit') || source.includes('createBranch'),
      'CLAUDE.md should document Create Branch from Commit feature');
    assert.ok(source.includes('handleCreateBranch') || source.includes('createBranchFromCommit'),
      'CLAUDE.md should reference handleCreateBranch or createBranchFromCommit');
  });

  test('README.md should document create branch feature', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.toLowerCase().includes('create branch'),
      'README.md should document create branch feature');
  });
});
