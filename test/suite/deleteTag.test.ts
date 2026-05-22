import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Delete Tag Test Suite', () => {
  const typesPath = path.resolve(__dirname, '../../../src/types.ts');
  const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
  const gitServicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packagePath = path.resolve(__dirname, '../../../package.json');
  const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
  const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
  const readmePath = path.resolve(__dirname, '../../../README.md');

  test('types.ts should have deleteTag message type', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("'deleteTag'"),
      'types.ts should have deleteTag message type');
  });

  test('types.ts should have deleteTag in WebviewAction', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const actionMatch = source.match(/WebviewAction\s*=\s*([\s\S]*?);/);
    assert.ok(actionMatch, 'Should find WebviewAction type');
    assert.ok(actionMatch[1].includes("'deleteTag'"),
      'WebviewAction should include deleteTag');
  });

  test('types.ts should have deleteTag in WebviewToExtMessage', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    const msgMatch = source.match(/WebviewToExtMessage\s*=\s*([\s\S]*?);/);
    assert.ok(msgMatch, 'Should find WebviewToExtMessage type');
    assert.ok(msgMatch[1].includes("'deleteTag'"),
      'WebviewToExtMessage should include deleteTag');
  });

  test('types.ts should have deleteTag message with hash property', () => {
    const source = fs.readFileSync(typesPath, 'utf-8');
    assert.ok(source.includes("{ type: 'deleteTag'; hash: string }"),
      'types.ts should have deleteTag message with hash property');
  });

  test('messageHandler.ts should handle deleteTag case', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes("case 'deleteTag':"),
      'messageHandler.ts should handle deleteTag case');
  });

  test('messageHandler.ts should import deleteTagFromCommit', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('deleteTagFromCommit'),
      'messageHandler.ts should import deleteTagFromCommit');
  });

  test('messageHandler.ts should have handleDeleteTag function', () => {
    const source = fs.readFileSync(handlerPath, 'utf-8');
    assert.ok(source.includes('function handleDeleteTag'),
      'messageHandler.ts should have handleDeleteTag function');
  });

  test('gitService.ts should have deleteTagFromCommit function', () => {
    const source = fs.readFileSync(gitServicePath, 'utf-8');
    assert.ok(source.includes('export async function deleteTagFromCommit'),
      'gitService.ts should have deleteTagFromCommit function');
  });

  test('gitService.ts should use git tag -d command', () => {
    const source = fs.readFileSync(gitServicePath, 'utf-8');
    assert.ok(source.includes("['tag', '-d'"),
      'gitService.ts should use git tag -d command');
  });

  test('main.js should have handleDeleteTag function', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('function handleDeleteTag'),
      'main.js should have handleDeleteTag function');
  });

  test('main.js should have delete-tag context menu item', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes('data-action="delete-tag"'),
      'main.js should have delete-tag context menu item');
  });

  test('main.js should handle deleteTag action', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("action === 'delete-tag'"),
      'main.js should handle delete-tag action');
  });

  test('main.js should have deleteTag in triggerAction switch', () => {
    const source = fs.readFileSync(mainJsPath, 'utf-8');
    assert.ok(source.includes("case 'deleteTag':"),
      'main.js should have deleteTag in triggerAction switch');
  });

  test('package.json should register deleteTag command', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('gitHistory.deleteTag'),
      'package.json should register deleteTag command');
  });

  test('package.json should have Delete Tag from Commit title', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('Delete Tag from Commit'),
      'package.json should have Delete Tag from Commit title');
  });

  test('extension.ts should register deleteTag action', () => {
    const source = fs.readFileSync(extensionPath, 'utf-8');
    assert.ok(source.includes("action: 'deleteTag'"),
      'extension.ts should register deleteTag action');
  });

  test('CLAUDE.md should document delete tag feature', () => {
    const source = fs.readFileSync(claudePath, 'utf-8');
    assert.ok(source.includes('Delete Tag from Commit') || source.includes('delete a git tag'),
      'CLAUDE.md should document delete tag feature');
  });

  test('README.md should document delete tag feature', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('Delete tag from commit') || source.includes('delete a tag'),
      'README.md should document delete tag feature');
  });

  test('package.json should have deleteTag keybinding', () => {
    const source = fs.readFileSync(packagePath, 'utf-8');
    assert.ok(source.includes('ctrl+alt+.'),
      'package.json should have keybinding for deleteTag');
  });

  test('README.md should document deleteTag keyboard shortcut', () => {
    const source = fs.readFileSync(readmePath, 'utf-8');
    assert.ok(source.includes('Ctrl+Alt+.'),
      'README.md should document the deleteTag keyboard shortcut (Ctrl+Alt+.)');
  });
});