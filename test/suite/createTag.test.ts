import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Create Tag Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const gitServicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  test('types.ts should have createTag message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'createTag'"),
      'types.ts should have createTag message type');
  });

  test('types.ts should have createTag in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'createTag'"),
      'WebviewAction should include createTag');
  });

  test('types.ts should have createTag in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);\s*$/m);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'createTag'"),
      'WebviewToExtMessage should include createTag');
  });

  test('types.ts should have createTag message with hash property', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("{ type: 'createTag'; hash: string }"),
      'types.ts should have createTag message with hash property');
  });

  test('messageHandler.ts should handle createTag case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'createTag':"),
      'messageHandler.ts should handle createTag case');
  });

  test('messageHandler.ts should import createTagFromCommit', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('createTagFromCommit'),
      'messageHandler.ts should import createTagFromCommit');
  });

  test('messageHandler.ts should have handleCreateTag function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleCreateTag'),
      'messageHandler.ts should have handleCreateTag function');
  });

  test('gitService.ts should have createTagFromCommit function', () => {
    const source = fs.readFileSync(gitServicePath, 'utf-8');
    assert.ok(source.includes('export async function createTagFromCommit'),
      'gitService.ts should have createTagFromCommit function');
  });

  test('gitService.ts should use git tag command', () => {
    const source = fs.readFileSync(gitServicePath, 'utf-8');
    assert.ok(source.includes("['tag'"),
      'gitService.ts should use git tag command');
  });

  test('main.js should have handleCreateTag function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleCreateTag'),
      'main.js should have handleCreateTag function');
  });

  test('main.js should have create-tag context menu item', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('data-action="create-tag"'),
      'main.js should have create-tag context menu item');
  });

  test('main.js should handle createTag action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'create-tag'"),
      'main.js should handle create-tag action');
  });

  test('main.js should have createTag in triggerAction switch', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'createTag':"),
      'main.js should have createTag in triggerAction switch');
  });

  test('package.json should register createTag command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.createTag'),
      'package.json should register createTag command');
  });

  test('package.json should have Create Tag from Commit title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Create Tag from Commit'),
      'package.json should have Create Tag from Commit title');
  });

  test('extension.ts should register createTag action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'createTag'"),
      'extension.ts should register createTag action');
  });

  test('CLAUDE.md should document create tag feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Create Tag from Commit') || source.includes('create a new git tag'),
      'CLAUDE.md should document create tag feature');
  });

  test('README.md should document create tag feature', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('Create tag from commit') || source.includes('create a tag'),
      'README.md should document create tag feature');
  });
});