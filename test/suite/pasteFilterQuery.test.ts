import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

suite('Paste Filter Query Tests', () => {
  test('pasteFilterQuery action is registered in extension.ts', () => {
    const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf-8');

    assert.ok(
      source.includes("action: 'pasteFilterQuery'"),
      'extension.ts should register pasteFilterQuery action'
    );
  });

  test('pasteFilterQuery is in WebviewAction type', () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(
      source.includes("'pasteFilterQuery'"),
      'types.ts should include pasteFilterQuery in WebviewAction'
    );
  });

  test('pasteFilterQuery message type is defined in WebviewToExtMessage', () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(
      source.includes("type: 'pasteFilterQuery'"),
      'types.ts should define pasteFilterQuery message type'
    );
  });

  test('applyFilterQuery message type is defined in ExtToWebviewMessage', () => {
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(
      source.includes("type: 'applyFilterQuery'"),
      'types.ts should define applyFilterQuery message type'
    );
  });

  test('pasteFilterQuery case exists in messageHandler switch', () => {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(
      source.includes("case 'pasteFilterQuery':"),
      'messageHandler should have case for pasteFilterQuery'
    );
  });

  test('handlePasteFilterQuery function exists', () => {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(
      source.includes('function handlePasteFilterQuery'),
      'messageHandler should have handlePasteFilterQuery function'
    );
  });

  test('handlePasteFilterQuery reads from clipboard', () => {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handlePasteFilterQuery');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('clipboard.readText'), 'Should read from clipboard');
    assert.ok(fnBody.includes('JSON.parse'), 'Should parse JSON from clipboard');
    assert.ok(fnBody.includes('applyFilterQuery'), 'Should send applyFilterQuery message to webview');
  });

  test('handlePasteFilterQuery has error handling for invalid JSON', () => {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handlePasteFilterQuery');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('catch'), 'Should catch JSON parse errors');
    assert.ok(fnBody.includes('showWarningMessage'), 'Should show warning for invalid input');
  });

  test('handlePasteFilterQuery validates filter state object', () => {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handlePasteFilterQuery');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes("typeof filterState !== 'object'"), 'Should validate filter state type');
  });

  test('pasteFilterQuery command is declared in package.json', () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    const commands = packageJson.contributes?.commands || [];
    const pasteCmd = commands.find((c: any) => c.command === 'gitHistory.pasteFilterQuery');

    assert.ok(pasteCmd, 'package.json should declare gitHistory.pasteFilterQuery command');
    assert.strictEqual(pasteCmd.category, 'Git History');
    assert.ok(pasteCmd.title.length > 0);
  });

  test('pasteFilterQuery keybinding is registered in package.json', () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    const keybindings = packageJson.contributes?.keybindings || [];
    const kb = keybindings.find((k: any) => k.command === 'gitHistory.pasteFilterQuery');

    assert.ok(kb, 'package.json should have keybinding for pasteFilterQuery');
    assert.strictEqual(kb.key, 'ctrl+shift+4');
    assert.strictEqual(kb.mac, 'cmd+shift+4');
    assert.strictEqual(kb.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('paste filter button exists in index.html', () => {
    const htmlPath = path.resolve(__dirname, '../../../src/webview/panel/index.html');
    const source = fs.readFileSync(htmlPath, 'utf-8');

    assert.ok(
      source.includes('id="paste-filter-query-btn"'),
      'index.html should have paste-filter-query-btn button'
    );
  });

  test('paste filter button exists in webviewProvider.ts', () => {
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(
      source.includes('id="paste-filter-query-btn"'),
      'webviewProvider should have paste-filter-query-btn button'
    );
  });

  test('paste filter button styling exists in styles.css', () => {
    const cssPath = path.resolve(__dirname, '../../../src/webview/panel/styles.css');
    const source = fs.readFileSync(cssPath, 'utf-8');

    assert.ok(
      source.includes('.paste-filter-query-btn'),
      'styles.css should have paste-filter-query-btn styling'
    );
  });

  test('pasteFilterQuery handler exists in main.js triggerAction', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(
      source.includes("case 'pasteFilterQuery':"),
      'main.js should handle pasteFilterQuery in triggerAction'
    );
  });

  test('applyFilterQuery message handler exists in main.js', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(
      source.includes("case 'applyFilterQuery':"),
      'main.js should handle applyFilterQuery message'
    );
  });

  test('applyFilterQuery function exists in main.js', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(
      source.includes('function applyFilterQuery'),
      'main.js should have applyFilterQuery function'
    );
  });

  test('handlePasteFilterQuery function exists in main.js', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(
      source.includes('function handlePasteFilterQuery'),
      'main.js should have handlePasteFilterQuery function'
    );
  });

  test('applyFilterQuery validates filter state fields', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function applyFilterQuery');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes("typeof filterState.query === 'string'"), 'Should validate query type');
    assert.ok(fnBody.includes("typeof filterState.hideMergeCommits === 'boolean'"), 'Should validate hideMergeCommits type');
    assert.ok(fnBody.includes("typeof filterState.sortMode === 'number'"), 'Should validate sortMode type');
    assert.ok(fnBody.includes("typeof filterState.showMyCommitsOnly === 'boolean'"), 'Should validate showMyCommitsOnly type');
  });

  test('applyFilterQuery refreshes the UI after applying', () => {
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function applyFilterQuery');
    const fnEnd = source.indexOf('\n}', fnStart);
    const fnBody = source.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('renderCommits()'), 'Should call renderCommits');
    assert.ok(fnBody.includes('updateCommitCount()'), 'Should call updateCommitCount');
    assert.ok(fnBody.includes('renderFilterBadges()'), 'Should call renderFilterBadges');
  });
});
