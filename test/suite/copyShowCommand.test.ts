import * as assert from 'assert';
import * as path from 'path';

// Simulates formatting a git show command (from messageHandler logic)
function formatShowCommand(hash: string): string {
  return `git show ${hash}`;
}

suite('Copy Show Command Tests', () => {
  test('formatShowCommand should format with full hash', () => {
    const hash = 'a1b2c3d4e5f6789012345678901234567890abcd';
    const command = formatShowCommand(hash);
    assert.strictEqual(command, `git show ${hash}`);
  });

  test('formatShowCommand should format with short hash', () => {
    const hash = 'a1b2c3d';
    const command = formatShowCommand(hash);
    assert.strictEqual(command, 'git show a1b2c3d');
  });

  test('formatShowCommand should handle empty hash', () => {
    const command = formatShowCommand('');
    assert.strictEqual(command, 'git show ');
  });
});

suite('Copy Show Command Source Verification', () => {
  test('types.ts should have copyShowCommand in WebviewAction', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("| 'copyShowCommand'"),
      'types.ts should have copyShowCommand in WebviewAction');
  });

  test('types.ts should have copyShowCommand message type', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("type: 'copyShowCommand'"),
      'types.ts should have copyShowCommand message type');
  });

  test('types.ts copyShowCommand should have hash field', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("type: 'copyShowCommand'; hash: string"),
      'types.ts copyShowCommand should have hash field');
  });

  test('messageHandler.ts should handle copyShowCommand case', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes("case 'copyShowCommand':"),
      'messageHandler.ts should handle copyShowCommand case');
  });

  test('messageHandler.ts should have handleCopyShowCommand function', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyShowCommand'),
      'messageHandler.ts should have handleCopyShowCommand function');
  });

  test('messageHandler.ts handleCopyShowCommand should use git show format', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('`git show ${commit.hash}`'),
      'handleCopyShowCommand should format as git show <hash>');
  });

  test('messageHandler.ts handleCopyShowCommand should use vscode.env.clipboard', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('vscode.env.clipboard.writeText'),
      'handleCopyShowCommand should use vscode.env.clipboard.writeText');
  });

  test('main.js should have copy-show-command context menu action', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-show-command"'),
      'main.js context menu should include copy-show-command action');
  });

  test('main.js should handle copy-show-command action', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("action === 'copy-show-command'"),
      'main.js should handle copy-show-command action');
  });

  test('main.js should send copyShowCommand message', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("type: 'copyShowCommand'"),
      'main.js should send copyShowCommand message');
  });

  test('main.js should have handleCopyShowCommand function', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleCopyShowCommand'),
      'main.js should have handleCopyShowCommand function');
  });

  test('main.js should handle copyShowCommand in triggerAction switch', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'copyShowCommand':"),
      'main.js should handle copyShowCommand in triggerAction switch');
  });

  test('main.js should handle Ctrl+Alt+V keyboard shortcut', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(
      source.includes('e.altKey') &&
      source.includes("e.key === 'v'") &&
      source.includes('handleCopyShowCommand'),
      'main.js should handle Ctrl+Alt+V and call handleCopyShowCommand'
    );
  });
});
