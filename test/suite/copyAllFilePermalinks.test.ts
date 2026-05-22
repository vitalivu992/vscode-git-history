import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('copyAllFilePermalinks Unit Tests', function() {
  this.timeout(10000);

  test('messageHandler.ts should have handleCopyAllFilePermalinks function', function() {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopyAllFilePermalinks'), 'messageHandler.ts should have handleCopyAllFilePermalinks function');
  });

  test('handleCopyAllFilePermalinks should find commit by hash', function() {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAllFilePermalinks');
    const fnEnd = source.indexOf('\nasync function', fnStart + 1);
    const fn = source.substring(fnStart, fnEnd > fnStart ? fnEnd : source.length);

    assert.ok(fn.includes('panel.getCommits().find'), 'handleCopyAllFilePermalinks should find commit in panel');
  });

  test('handleCopyAllFilePermalinks should show commit not found error', function() {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAllFilePermalinks');
    const fnEnd = source.indexOf('\nasync function', fnStart + 1);
    const fn = source.substring(fnStart, fnEnd > fnStart ? fnEnd : source.length);

    assert.ok(fn.includes('Commit not found'), 'Should show commit not found message');
  });

  test('handleCopyAllFilePermalinks should get commit files', function() {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAllFilePermalinks');
    const fnEnd = source.indexOf('\nasync function', fnStart + 1);
    const fn = source.substring(fnStart, fnEnd > fnStart ? fnEnd : source.length);

    assert.ok(fn.includes('getCommitFiles'), 'Should call getCommitFiles');
    assert.ok(fn.includes('hash, cwd'), 'Should pass hash and cwd to getCommitFiles');
  });

  test('handleCopyAllFilePermalinks should handle no files changed case', function() {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAllFilePermalinks');
    const fnEnd = source.indexOf('\nasync function', fnStart + 1);
    const fn = source.substring(fnStart, fnEnd > fnStart ? fnEnd : source.length);

    assert.ok(fn.includes('No files changed') || fn.includes('No files changed in this commit'), 'Should handle no files changed');
  });

  test('handleCopyAllFilePermalinks should generate file permalinks via getFileUrl', function() {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAllFilePermalinks');
    const fnEnd = source.indexOf('\nasync function', fnStart + 1);
    const fn = source.substring(fnStart, fnEnd > fnStart ? fnEnd : source.length);

    assert.ok(fn.includes('getFileUrl'), 'Should call getFileUrl to generate permalinks');
    assert.ok(fn.includes('file.path, hash, cwd'), 'Should pass file path, hash and cwd to getFileUrl');
  });

  test('handleCopyAllFilePermalinks should join permalinks with newline', function() {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAllFilePermalinks');
    const fnEnd = source.indexOf('\nasync function', fnStart + 1);
    const fn = source.substring(fnStart, fnEnd > fnStart ? fnEnd : source.length);

    assert.ok(fn.includes("permalinks.join('\\n')"), 'Should join permalinks with newline');
  });

  test('handleCopyAllFilePermalinks should write to clipboard', function() {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAllFilePermalinks');
    const fnEnd = source.indexOf('\nasync function', fnStart + 1);
    const fn = source.substring(fnStart, fnEnd > fnStart ? fnEnd : source.length);

    assert.ok(fn.includes('clipboard.writeText'), 'Should write to clipboard');
  });

  test('handleCopyAllFilePermalinks should show singular/plural message', function() {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAllFilePermalinks');
    const fnEnd = source.indexOf('\nasync function', fnStart + 1);
    const fn = source.substring(fnStart, fnEnd > fnStart ? fnEnd : source.length);

    assert.ok(fn.includes('permalink') && fn.includes('> 1 ?'), 'Should use singular/plural form');
    assert.ok(fn.includes("'s'"), 'Should add s for plural');
  });

  test('handleCopyAllFilePermalinks should handle no remote configured case', function() {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAllFilePermalinks');
    const fnEnd = source.indexOf('\nasync function', fnStart + 1);
    const fn = source.substring(fnStart, fnEnd > fnStart ? fnEnd : source.length);

    assert.ok(fn.includes('Unable to generate file permalinks') || fn.includes('No remote configured'), 'Should handle no remote');
  });

  test('handleCopyAllFilePermalinks should have error handling', function() {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAllFilePermalinks');
    const fnEnd = source.indexOf('\nasync function', fnStart + 1);
    const fn = source.substring(fnStart, fnEnd > fnStart ? fnEnd : source.length);

    assert.ok(fn.includes('try') && fn.includes('catch'), 'Should have try-catch error handling');
    assert.ok(fn.includes('showErrorMessage'), 'Should show error message on exception');
  });

  test('messageHandler switch should have copyAllFilePermalinks case', function() {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes("case 'copyAllFilePermalinks':"), 'Switch should have copyAllFilePermalinks case');
  });

  test('main.js should have handleCopyAllFilePermalinks function', function() {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleCopyAllFilePermalinks'), 'main.js should have handleCopyAllFilePermalinks function');
  });

  test('main.js should send copyAllFilePermalinks message with hash', function() {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopyAllFilePermalinks');
    const nextFunction = source.indexOf('\nfunction ', fnStart + 1);
    const fn = source.substring(fnStart, nextFunction > fnStart ? nextFunction : source.length);

    assert.ok(fn.includes("type: 'copyAllFilePermalinks'"), 'Should send copyAllFilePermalinks message type');
    assert.ok(fn.includes('hash:') || fn.includes('hash,'), 'Should include hash in message');
  });

  test('main.js case copyAllFilePermalinks should call handler', function() {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'copyAllFilePermalinks':"), 'Switch should have copyAllFilePermalinks case');
    assert.ok(source.includes('handleCopyAllFilePermalinks()'), 'Case should call handler function');
  });

  test('types.ts should have copyAllFilePermalinks WebviewAction', function() {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    // Check that it's a valid WebviewAction
    const webviewActionMatch = source.match(/WebviewAction.*?=.*?\|[^]*?'copyAllFilePermalinks'/);
    assert.ok(webviewActionMatch, 'types.ts should have copyAllFilePermalinks in WebviewAction');
  });

  test('types.ts should have copyAllFilePermalinks message type', function() {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("type: 'copyAllFilePermalinks'"), 'types.ts should define copyAllFilePermalinks message type');
    assert.ok(source.includes('hash: string'), 'Message should include hash field');
  });

  test('extension.ts should register gitHistory.copyAllFilePermalinks command', function() {
    const extPath = path.resolve(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extPath, 'utf-8');

    assert.ok(source.includes("command: 'gitHistory.copyAllFilePermalinks'"), 'extension should register command');
    assert.ok(source.includes("action: 'copyAllFilePermalinks'"), 'Command should map to action');
  });
});