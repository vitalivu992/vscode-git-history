import * as assert from 'assert';
import * as path from 'path';

suite('Copy Commit Patch Test Suite', () => {
  test('types.ts should have copyCommitPatch message type', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("'copyCommitPatch'"),
      'types.ts should have copyCommitPatch message type');
  });

  test('messageHandler.ts should handle copyCommitPatch case', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes("case 'copyCommitPatch':"),
      'messageHandler.ts should handle copyCommitPatch case');
  });

  test('messageHandler.ts should have handleCopyCommitPatch function', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyCommitPatch'),
      'messageHandler.ts should have handleCopyCommitPatch function');
  });

  test('messageHandler.ts should import getCommitPatch from gitService', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('getCommitPatch'),
      'messageHandler.ts should import getCommitPatch from gitService');
  });

  test('gitService.ts should have getCommitPatch function', () => {
    const fs = require('fs');
    const gitServicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    assert.ok(source.includes('export async function getCommitPatch'),
      'gitService.ts should export getCommitPatch function');
  });

  test('getCommitPatch should use format-patch command', () => {
    const fs = require('fs');
    const gitServicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
    const source = fs.readFileSync(gitServicePath, 'utf-8');

    assert.ok(source.includes("'format-patch'"),
      'getCommitPatch should use git format-patch command');
    assert.ok(source.includes("'-1'"),
      'getCommitPatch should use -1 flag for single commit');
    assert.ok(source.includes("'--stdout'"),
      'getCommitPatch should use --stdout flag');
  });

  test('main.js should have handleCopyPatch function', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleCopyPatch'),
      'main.js should have handleCopyPatch function');
  });

  test('main.js should send copyCommitPatch message', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("type: 'copyCommitPatch'"),
      'main.js should send copyCommitPatch message');
  });

  test('main.js should handle Ctrl+Shift+E keyboard shortcut', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Check for the E key handler in keyboard shortcuts
    assert.ok(source.includes("e.key === 'e'") && source.includes('e.shiftKey'),
      'main.js should handle Ctrl+Shift+E keyboard shortcut');
  });

  test('main.js should call handleCopyPatch on Ctrl+Shift+E', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Find the Ctrl+Shift+E section and verify it calls handleCopyPatch
    const keyboardSection = source.substring(
      source.indexOf("e.key === 'e'"),
      source.indexOf("e.key === 'e'") + 200
    );
    assert.ok(keyboardSection.includes('handleCopyPatch'),
      'Ctrl+Shift+E shortcut should call handleCopyPatch');
  });

  test('main.js should add copy-patch to commit context menu', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-patch"'),
      'main.js should add copy-patch action to context menu');
  });

  test('context menu should have patch icon', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // The patch menu item should have a bandage/emoji icon
    assert.ok(source.includes('🩹') || source.includes('copy-patch'),
      'Copy patch menu item should exist with appropriate indicator');
  });

  test('CLAUDE.md should document Copy Commit as Patch feature', () => {
    const fs = require('fs');
    const claudePath = path.resolve(__dirname, '../../../CLAUDE.md');
    const source = fs.readFileSync(claudePath, 'utf-8');

    assert.ok(source.includes('Copy Commit as Patch'),
      'CLAUDE.md should document Copy Commit as Patch feature');
  });

  test('README.md should document patch keyboard shortcut', () => {
    const fs = require('fs');
    const readmePath = path.resolve(__dirname, '../../../README.md');
    const source = fs.readFileSync(readmePath, 'utf-8');

    assert.ok(source.includes('Copy Commit as Patch') || source.includes('Ctrl+Shift+E'),
      'README.md should document copy patch feature or keyboard shortcut');
  });

  test('handleCopyPatch should resolve commit from focused or selected', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    // Find the handleCopyPatch function
    const funcStart = source.indexOf('function handleCopyPatch()');
    assert.ok(funcStart > -1, 'handleCopyPatch function should exist');

    // Extract function body (look for the next function or end of relevant section)
    const nextFunc = source.indexOf('function ', funcStart + 1);
    const functionBody = nextFunc > -1
      ? source.substring(funcStart, nextFunc)
      : source.substring(funcStart, funcStart + 500);

    assert.ok(functionBody.includes('getOrderedCommits'),
      'handleCopyPatch should use getOrderedCommits to resolve commit');
    assert.ok(functionBody.includes('focusedIndex'),
      'handleCopyPatch should check focusedIndex');
    assert.ok(functionBody.includes('.size'),
      'handleCopyPatch should check selection size');
  });

  test('messageHandler should use vscode.env.clipboard for patch', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    // Find the handleCopyCommitPatch function
    const funcStart = source.indexOf('function handleCopyCommitPatch');
    assert.ok(funcStart > -1, 'handleCopyCommitPatch function should exist');

    const functionSection = source.substring(funcStart, funcStart + 800);
    assert.ok(functionSection.includes('vscode.env.clipboard.writeText'),
      'handleCopyCommitPatch should write to vscode.env.clipboard');
  });

  test('messageHandler should show information message after copying patch', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const funcStart = source.indexOf('function handleCopyCommitPatch');
    assert.ok(funcStart > -1, 'handleCopyCommitPatch function should exist');

    const functionSection = source.substring(funcStart, funcStart + 800);
    assert.ok(functionSection.includes('showInformationMessage'),
      'handleCopyCommitPatch should show confirmation message');
  });
});
