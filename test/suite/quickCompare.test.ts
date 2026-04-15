import * as assert from 'assert';
import * as path from 'path';

suite('Quick Compare Tests', () => {
  test('types.ts should have quickCompare message type', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("'quickCompare'"),
      'types.ts should have quickCompare message type');
  });

  test('gitService.ts should have getCommitParentDiff function', () => {
    const fs = require('fs');
    const servicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
    const source = fs.readFileSync(servicePath, 'utf-8');

    assert.ok(source.includes('getCommitParentDiff'),
      'gitService.ts should have getCommitParentDiff function');
  });

  test('gitService.ts should use diff command with hash~1..hash', () => {
    const fs = require('fs');
    const servicePath = path.resolve(__dirname, '../../../src/git/gitService.ts');
    const source = fs.readFileSync(servicePath, 'utf-8');

    assert.ok(source.includes('${hash}~1..${hash}'),
      'gitService.ts should use diff command with hash~1..hash');
  });

  test('messageHandler.ts should handle quickCompare case', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes("case 'quickCompare':"),
      'messageHandler.ts should handle quickCompare case');
  });

  test('messageHandler.ts should import getCommitParentDiff', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('getCommitParentDiff'),
      'messageHandler.ts should import getCommitParentDiff');
  });

  test('main.js should have handleQuickCompare function', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleQuickCompare'),
      'main.js should have handleQuickCompare function');
  });

  test('main.js should send quickCompare message', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("type: 'quickCompare'"),
      'main.js should send quickCompare message');
  });

  test('main.js should handle Ctrl+Alt+P keyboard shortcut', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("e.altKey") && source.includes("e.key === 'p'"),
      'main.js should handle Ctrl+Alt+P keyboard shortcut');
  });

  test('webviewProvider.ts should have compare-parent-btn', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('compare-parent-btn'),
      'webviewProvider.ts should have compare-parent-btn button');
  });

  test('main.js should get compare-parent-btn element', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("getElementById('compare-parent-btn')"),
      'main.js should get compare-parent-btn element');
  });

  test('main.js should add click listener to compareParentBtn', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('compareParentBtn') && source.includes('addEventListener'),
      'main.js should add click listener to compareParentBtn');
  });

  test('styles.css should have compare-parent-btn styling', () => {
    const fs = require('fs');
    const stylesPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(stylesPath, 'utf-8');

    assert.ok(source.includes('.compare-parent-btn'),
      'styles.css should have compare-parent-btn styling');
  });

  test('handleQuickCompare should send message with focused or selected commit', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const hasFocused = source.includes('focusedIndex >= 0') && source.includes('focusedIndex < displayCommits.length');
    const hasSelected = source.includes('selectedCommits.size === 1');

    assert.ok(hasFocused && hasSelected,
      'handleQuickCompare should check both focused and selected commits');
  });

  test('messageHandler should handle root commit (no parent) case', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('Root commit has no parent'),
      'messageHandler should handle root commit case with appropriate message');
  });
});
