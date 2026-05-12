import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Delete Branch Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const gitServicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');

  test('types.ts should have deleteBranch message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'deleteBranch'"),
      'types.ts should have deleteBranch message type');
  });

  test('types.ts should have deleteBranch in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);/);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'deleteBranch'"),
      'WebviewAction should include deleteBranch');
  });

  test('types.ts should have deleteBranch in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);/);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'deleteBranch'"),
      'WebviewToExtMessage should include deleteBranch');
  });

  test('types.ts should have deleteBranch message with branch property', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("{ type: 'deleteBranch'; branch: string"),
      'types.ts should have deleteBranch message with branch property');
  });

  test('types.ts should have deleteBranch message with optional force property', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("force?: boolean"),
      'types.ts should have deleteBranch message with optional force property');
  });

  test('messageHandler.ts should handle deleteBranch case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'deleteBranch':"),
      'messageHandler.ts should handle deleteBranch case');
  });

  test('messageHandler.ts should import deleteBranch', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('deleteBranch'),
      'messageHandler.ts should import deleteBranch from gitService');
  });

  test('messageHandler.ts should have handleDeleteBranch function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleDeleteBranch'),
      'messageHandler.ts should have handleDeleteBranch function');
  });

  test('gitService.ts should have deleteBranch function', () => {
    const source = fs.readFileSync(gitServicePath, 'utf-8');
    assert.ok(source.includes('export async function deleteBranch'),
      'gitService.ts should have deleteBranch function');
  });

  test('gitService.ts deleteBranch should support force flag', () => {
    const source = fs.readFileSync(gitServicePath, 'utf-8');
    const fnStart = source.indexOf('export async function deleteBranch');
    assert.ok(fnStart >= 0, 'deleteBranch function should exist');
    const fnEnd = source.indexOf('\n}\n', fnStart);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd + 3 : source.length);

    assert.ok(fnBody.includes('force'),
      'deleteBranch should accept force parameter');
    assert.ok(fnBody.includes("'-D'"),
      'deleteBranch should use -D flag for force delete');
    assert.ok(fnBody.includes("'-d'"),
      'deleteBranch should use -d flag for normal delete');
  });

  test('main.js should have handleDeleteBranch function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleDeleteBranch'),
      'main.js should have handleDeleteBranch function');
  });

  test('main.js should have deleteBranch in triggerAction switch', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'deleteBranch':"),
      'main.js should have deleteBranch in triggerAction switch');
  });

  test('main.js handleDeleteBranch should send deleteBranch message', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    const fnStart = source.indexOf('function handleDeleteBranch');
    assert.ok(fnStart >= 0, 'handleDeleteBranch should exist');
    const fnEnd = source.indexOf('\nfunction ', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : source.length);

    assert.ok(fnBody.includes("type: 'deleteBranch'"),
      'handleDeleteBranch should send deleteBranch message');
    assert.ok(fnBody.includes('branch:'),
      'handleDeleteBranch should include branch name in message');
  });

  test('package.json should register deleteBranch command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.deleteBranch'),
      'package.json should register deleteBranch command');
  });

  test('package.json should have Delete Branch title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Delete Branch'),
      'package.json should have Delete Branch title');
  });

  test('package.json should have deleteBranch keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('ctrl+alt+x') || source.includes('ctrl+alt+d'),
      'package.json should have keybinding for deleteBranch');
  });

  test('extension.ts should register deleteBranch action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'deleteBranch'"),
      'extension.ts should register deleteBranch action');
  });

  test('CLAUDE.md should document delete branch feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Delete Branch') || source.includes('delete branch'),
      'CLAUDE.md should document delete branch feature');
  });

  test('messageHandler handleDeleteBranch should prevent deleting current branch', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleDeleteBranch');
    assert.ok(fnStart >= 0, 'handleDeleteBranch should exist');
    const fnEnd = source.indexOf('\n\nasync function', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : source.length);

    assert.ok(fnBody.includes('currentBranch') || fnBody.includes('Cannot delete the current branch'),
      'handleDeleteBranch should prevent deleting current branch');
  });

  test('messageHandler handleDeleteBranch should offer force delete for unmerged branches', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleDeleteBranch');
    assert.ok(fnStart >= 0, 'handleDeleteBranch should exist');
    const fnEnd = source.indexOf('\n\nasync function', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : source.length);

    assert.ok(fnBody.includes('not fully merged') || fnBody.includes('Force Delete'),
      'handleDeleteBranch should offer force delete for unmerged branches');
  });

  test('messageHandler handleDeleteBranch should refresh panel after deletion', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    const fnStart = source.indexOf('function handleDeleteBranch');
    assert.ok(fnStart >= 0, 'handleDeleteBranch should exist');
    const fnEnd = source.indexOf('\n\nasync function', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > 0 ? fnEnd : source.length);

    assert.ok(fnBody.includes('panel.loadData'),
      'handleDeleteBranch should refresh panel after deletion');
  });
});
