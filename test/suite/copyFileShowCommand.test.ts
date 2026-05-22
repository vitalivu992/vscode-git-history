import * as assert from 'assert';
import * as path from 'path';

suite('Copy File Show Command Unit Tests', () => {
  test('types.ts should have copyFileShowCommand in WebviewAction', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("'copyFileShowCommand'"), 'types.ts should have copyFileShowCommand in WebviewAction');
  });

  test('types.ts should have copyFileShowCommand in WebviewToExtMessage', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("type: 'copyFileShowCommand'"), 'types.ts should have copyFileShowCommand in message type');
  });

  test('main.js should have handleCopyFileShowCommand function', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFileShowCommand'), 'main.js should have handleCopyFileShowCommand function');
  });

  test('main.js should handle copyFileShowCommand message case', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'copyFileShowCommand':"), 'main.js should handle copyFileShowCommand message');
  });

  test('main.js should send copyFileShowCommand message with hash', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const funcStart = source.indexOf('function handleCopyFileShowCommand');
    const funcEnd = source.indexOf('\nfunction', funcStart + 1);
    const funcBody = source.substring(funcStart, funcEnd > funcStart ? funcEnd : undefined);

    assert.ok(funcBody.includes('type: \'copyFileShowCommand\''), 'handleCopyFileShowCommand should send message with type');
    assert.ok(funcBody.includes('hash:'), 'handleCopyFileShowCommand should include hash in message');
  });

  test('main.js should have copy-file-show-command in file context menu', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-file-show-command"'), 'main.js should have copy-file-show-command in file context menu');
  });

  test('main.js should handle copy-file-show-command action', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("action === 'copy-file-show-command'"), 'main.js should handle copy-file-show-command action');
  });

  test('main.js should post copyFileShowCommand with filePath', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const actionStart = source.indexOf("action === 'copy-file-show-command'");
    const actionEnd = source.indexOf('\n      } else if', actionStart + 1);
    const actionBody = source.substring(actionStart, actionEnd > actionStart ? actionEnd : undefined);

    assert.ok(actionBody.includes('type: \'copyFileShowCommand\''), 'copy-file-show-command should post copyFileShowCommand type');
    assert.ok(actionBody.includes('filePath:'), 'copy-file-show-command should include filePath');
    assert.ok(actionBody.includes('hash:'), 'copy-file-show-command should include hash');
  });

  test('messageHandler.ts should have handleCopyFileShowCommand function', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyFileShowCommand'), 'messageHandler.ts should have handleCopyFileShowCommand function');
  });

  test('messageHandler.ts should handle copyFileShowCommand case', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes("case 'copyFileShowCommand':"), 'messageHandler.ts should handle copyFileShowCommand case');
  });

  test('messageHandler.ts handleCopyFileShowCommand should copy command to clipboard', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const funcStart = source.indexOf('function handleCopyFileShowCommand');
    const funcEnd = source.indexOf('\nfunction', funcStart + 1);
    const funcBody = source.substring(funcStart, funcEnd > funcStart ? funcEnd : undefined);

    assert.ok(funcBody.includes('clipboard.writeText'), 'handleCopyFileShowCommand should write to clipboard');
    assert.ok(funcBody.includes('git show'), 'handleCopyFileShowCommand should format git show command');
  });

  test('messageHandler.ts handleCopyFileShowCommand should quote paths with spaces', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const funcStart = source.indexOf('function handleCopyFileShowCommand');
    const funcEnd = source.indexOf('\nfunction', funcStart + 1);
    const funcBody = source.substring(funcStart, funcEnd > funcStart ? funcEnd : undefined);

    assert.ok(funcBody.includes("filePath.includes(' ')"), 'handleCopyFileShowCommand should check for spaces in path');
    assert.ok(funcBody.includes("'${filePath}'"), 'handleCopyFileShowCommand should quote path with single quotes');
  });

  test('extension.ts should have copyFileShowCommand action mapping', () => {
    const fs = require('fs');
    const extPath = path.resolve(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extPath, 'utf-8');

    assert.ok(source.includes('gitHistory.copyFileShowCommand'), 'extension.ts should have copyFileShowCommand command');
    assert.ok(source.includes("action: 'copyFileShowCommand'"), 'extension.ts should map action');
  });

  test('package.json should have copyFileShowCommand command', () => {
    const fs = require('fs');
    const pkgPath = path.resolve(__dirname, '../../../package.json');
    const source = fs.readFileSync(pkgPath, 'utf-8');

    assert.ok(source.includes('gitHistory.copyFileShowCommand'), 'package.json should have copyFileShowCommand command');
  });

  test('package.json copyFileShowCommand should have keybinding', () => {
    const fs = require('fs');
    const pkgPath = path.resolve(__dirname, '../../../package.json');
    const source = fs.readFileSync(pkgPath, 'utf-8');

    const cmdStart = source.indexOf('"command": "gitHistory.copyFileShowCommand"');
    const cmdEnd = source.indexOf('},', cmdStart);
    const cmdBlock = source.substring(cmdStart, cmdEnd > cmdStart ? cmdEnd + 2 : undefined);

    assert.ok(cmdBlock.includes('"key":'), 'copyFileShowCommand should have keybinding');
  });

  test('package.json copyFileShowCommand should have correct keybinding', () => {
    const fs = require('fs');
    const pkgPath = path.resolve(__dirname, '../../../package.json');
    const source = fs.readFileSync(pkgPath, 'utf-8');

    const cmdStart = source.indexOf('"command": "gitHistory.copyFileShowCommand"');
    const cmdEnd = source.indexOf('},', cmdStart);
    const cmdBlock = source.substring(cmdStart, cmdEnd > cmdStart ? cmdEnd + 2 : undefined);

    assert.ok(cmdBlock.includes('ctrl+alt+shift+v'), 'copyFileShowCommand should have ctrl+alt+shift+v keybinding');
  });
});