import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('Open Commit URL Feature Tests', () => {
  let handlerSource: string;
  let typesSource: string;
  let mainJsSource: string;
  let extensionSource: string;

  suiteSetup(() => {
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    handlerSource = fs.readFileSync(handlerPath, 'utf-8');

    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    typesSource = fs.readFileSync(typesPath, 'utf-8');

    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    mainJsSource = fs.readFileSync(mainJsPath, 'utf-8');

    const extensionPath = path.resolve(__dirname, '../../../src/extension.ts');
    extensionSource = fs.readFileSync(extensionPath, 'utf-8');
  });

  // ─── types.ts ──────────────────────────────────────────────────────────────

  test('openCommitUrl message type is defined in WebviewToExtMessage', () => {
    assert.ok(
      typesSource.includes("type: 'openCommitUrl'"),
      'types.ts should define openCommitUrl message type'
    );
  });

  test('openFileUrl message type is defined in WebviewToExtMessage', () => {
    assert.ok(
      typesSource.includes("type: 'openFileUrl'"),
      'types.ts should define openFileUrl message type'
    );
  });

  test('openCommitUrl is defined in WebviewAction type', () => {
    assert.ok(
      typesSource.includes("'openCommitUrl'"),
      'types.ts should include openCommitUrl in WebviewAction'
    );
  });

  test('openFileUrl is defined in WebviewAction type', () => {
    assert.ok(
      typesSource.includes("'openFileUrl'"),
      'types.ts should include openFileUrl in WebviewAction'
    );
  });

  // ─── messageHandler.ts ──────────────────────────────────────────────────────

  test('openCommitUrl switch case exists in messageHandler', () => {
    assert.ok(
      handlerSource.includes("case 'openCommitUrl':"),
      'messageHandler should have switch case for openCommitUrl'
    );
  });

  test('openFileUrl switch case exists in messageHandler', () => {
    assert.ok(
      handlerSource.includes("case 'openFileUrl':"),
      'messageHandler should have switch case for openFileUrl'
    );
  });

  test('handleOpenCommitUrl function exists', () => {
    assert.ok(
      handlerSource.includes('function handleOpenCommitUrl'),
      'messageHandler should have handleOpenCommitUrl function'
    );
  });

  test('handleOpenFileUrl function exists', () => {
    assert.ok(
      handlerSource.includes('function handleOpenFileUrl'),
      'messageHandler should have handleOpenFileUrl function'
    );
  });

  test('handleOpenCommitUrl uses vscode.env.openExternal', () => {
    const fnStart = handlerSource.indexOf('function handleOpenCommitUrl');
    const fnEnd = handlerSource.indexOf('\n}', fnStart);
    const fnBody = handlerSource.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.openExternal'), 'Should call openExternal to open URL in browser');
    assert.ok(fnBody.includes('vscode.Uri.parse'), 'Should parse URL as URI');
    assert.ok(fnBody.includes('getCommitUrl'), 'Should use getCommitUrl to generate URL');
  });

  test('handleOpenCommitUrl has error handling', () => {
    const fnStart = handlerSource.indexOf('async function handleOpenCommitUrl');
    const fnEnd = handlerSource.indexOf('\n}', fnStart);
    const fnBody = handlerSource.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('try'), 'Should have try block');
    assert.ok(fnBody.includes('catch'), 'Should have catch block');
    assert.ok(fnBody.includes('showErrorMessage'), 'Should show error on failure');
  });

  test('handleOpenCommitUrl handles no URL gracefully', () => {
    const fnStart = handlerSource.indexOf('async function handleOpenCommitUrl');
    const fnEnd = handlerSource.indexOf('\n}', fnStart);
    const fnBody = handlerSource.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('!commitUrl'), 'Should check for null/undefined commit URL');
    assert.ok(fnBody.includes('showInformationMessage'), 'Should show info message when URL unavailable');
  });

  test('handleOpenFileUrl uses vscode.env.openExternal', () => {
    const fnStart = handlerSource.indexOf('function handleOpenFileUrl');
    const fnEnd = handlerSource.indexOf('\n}', fnStart);
    const fnBody = handlerSource.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('vscode.env.openExternal'), 'Should call openExternal to open URL in browser');
    assert.ok(fnBody.includes('vscode.Uri.parse'), 'Should parse URL as URI');
    assert.ok(fnBody.includes('getFileUrl'), 'Should use getFileUrl to generate URL');
  });

  test('handleOpenFileUrl has error handling', () => {
    const fnStart = handlerSource.indexOf('async function handleOpenFileUrl');
    const fnEnd = handlerSource.indexOf('\n}', fnStart);
    const fnBody = handlerSource.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes('try'), 'Should have try block');
    assert.ok(fnBody.includes('catch'), 'Should have catch block');
    assert.ok(fnBody.includes('showErrorMessage'), 'Should show error on failure');
  });

  test('openCommitUrl case calls handleOpenCommitUrl', () => {
    const caseStart = handlerSource.indexOf("case 'openCommitUrl':");
    const nextCase = handlerSource.indexOf('case ', caseStart + 1);
    const caseBlock = handlerSource.substring(caseStart, nextCase > caseStart ? nextCase : caseStart + 200);

    assert.ok(caseBlock.includes('handleOpenCommitUrl'), 'openCommitUrl case should call handleOpenCommitUrl');
  });

  test('openFileUrl case calls handleOpenFileUrl', () => {
    const caseStart = handlerSource.indexOf("case 'openFileUrl':");
    const nextCase = handlerSource.indexOf('case ', caseStart + 1);
    const caseBlock = handlerSource.substring(caseStart, nextCase > caseStart ? nextCase : caseStart + 200);

    assert.ok(caseBlock.includes('handleOpenFileUrl'), 'openFileUrl case should call handleOpenFileUrl');
  });

  // ─── main.js ──────────────────────────────────────────────────────────────

  test('handleOpenUrl function exists in main.js', () => {
    assert.ok(
      mainJsSource.includes('function handleOpenUrl()'),
      'main.js should have handleOpenUrl function'
    );
  });

  test('handleOpenFileUrl function exists in main.js', () => {
    assert.ok(
      mainJsSource.includes('function handleOpenFileUrl()'),
      'main.js should have handleOpenFileUrl function'
    );
  });

  test('handleOpenUrl sends openCommitUrl message', () => {
    const fnStart = mainJsSource.indexOf('function handleOpenUrl()');
    const fnEnd = mainJsSource.indexOf('\n}', fnStart);
    const fnBody = mainJsSource.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes("type: 'openCommitUrl'"), 'Should send openCommitUrl message');
  });

  test('handleOpenFileUrl sends openFileUrl message', () => {
    const fnStart = mainJsSource.indexOf('function handleOpenFileUrl()');
    const fnEnd = mainJsSource.indexOf('\n}', fnStart);
    const fnBody = mainJsSource.substring(fnStart, fnEnd);

    assert.ok(fnBody.includes("type: 'openFileUrl'"), 'Should send openFileUrl message');
  });

  test('openCommitUrl triggerAction case exists in main.js', () => {
    assert.ok(
      mainJsSource.includes("case 'openCommitUrl':"),
      'main.js triggerAction switch should have openCommitUrl case'
    );
  });

  test('openFileUrl triggerAction case exists in main.js', () => {
    assert.ok(
      mainJsSource.includes("case 'openFileUrl':"),
      'main.js triggerAction switch should have openFileUrl case'
    );
  });

  test('commit context menu has Open in browser item', () => {
    assert.ok(
      mainJsSource.includes('data-action="open-url"'),
      'Commit context menu should have open-url action'
    );
    assert.ok(
      mainJsSource.includes('Open in browser'),
      'Commit context menu should have "Open in browser" label'
    );
  });

  test('file context menu has Open file permalink in browser item', () => {
    assert.ok(
      mainJsSource.includes('data-action="open-file-url"'),
      'File context menu should have open-file-url action'
    );
    assert.ok(
      mainJsSource.includes('Open file permalink in browser'),
      'File context menu should have "Open file permalink in browser" label'
    );
  });

  test('commit context menu click handler dispatches openCommitUrl', () => {
    const contextMenuStart = mainJsSource.indexOf('showCommitContextMenu');
    const contextMenuEnd = mainJsSource.indexOf("// ─── Helpers", contextMenuStart);
    const contextMenuBlock = mainJsSource.substring(contextMenuStart, contextMenuEnd);

    assert.ok(
      contextMenuBlock.includes("action === 'open-url'"),
      'Click handler should check for open-url action'
    );
    assert.ok(
      contextMenuBlock.includes("type: 'openCommitUrl'"),
      'Click handler should send openCommitUrl message'
    );
  });

  test('file context menu click handler dispatches openFileUrl', () => {
    const fnStart = mainJsSource.indexOf('function showFileContextMenu');
    const fnEnd = mainJsSource.indexOf("\n// ─── Commit Context Menu", fnStart);
    const contextMenuBlock = mainJsSource.substring(fnStart, fnEnd);

    assert.ok(
      contextMenuBlock.includes("action === 'open-file-url'"),
      'Click handler should check for open-file-url action'
    );
    assert.ok(
      contextMenuBlock.includes("type: 'openFileUrl'"),
      'Click handler should send openFileUrl message'
    );
  });

  // ─── extension.ts ──────────────────────────────────────────────────────────

  test('openCommitUrl command is registered in webviewActions', () => {
    assert.ok(
      extensionSource.includes("action: 'openCommitUrl'"),
      'extension.ts webviewActions should include openCommitUrl'
    );
  });

  test('openFileUrl command is registered in webviewActions', () => {
    assert.ok(
      extensionSource.includes("action: 'openFileUrl'"),
      'extension.ts webviewActions should include openFileUrl'
    );
  });

  // ─── package.json ──────────────────────────────────────────────────────────

  test('openCommitUrl command is declared in package.json', () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    const commands = packageJson.contributes?.commands || [];
    const cmd = commands.find((c: any) => c.command === 'gitHistory.openCommitUrl');

    assert.ok(cmd, 'package.json should declare gitHistory.openCommitUrl command');
    assert.strictEqual(cmd.category, 'Git History', 'Command should be in Git History category');
  });

  test('openFileUrl command is declared in package.json', () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    const commands = packageJson.contributes?.commands || [];
    const cmd = commands.find((c: any) => c.command === 'gitHistory.openFileUrl');

    assert.ok(cmd, 'package.json should declare gitHistory.openFileUrl command');
    assert.strictEqual(cmd.category, 'Git History', 'Command should be in Git History category');
  });

  test('openCommitUrl keybinding exists in package.json', () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    const keybindings = packageJson.contributes?.keybindings || [];
    const kb = keybindings.find((k: any) => k.command === 'gitHistory.openCommitUrl');

    assert.ok(kb, 'package.json should have keybinding for gitHistory.openCommitUrl');
    assert.strictEqual(kb.when, 'activeWebviewPanelId == gitHistory.webview');
    assert.ok(kb.key, 'Keybinding should have a key');
    assert.ok(kb.mac, 'Keybinding should have a mac key');
  });

  test('openFileUrl keybinding exists in package.json', () => {
    const packageJsonPath = path.resolve(__dirname, '../../../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    const keybindings = packageJson.contributes?.keybindings || [];
    const kb = keybindings.find((k: any) => k.command === 'gitHistory.openFileUrl');

    assert.ok(kb, 'package.json should have keybinding for gitHistory.openFileUrl');
    assert.strictEqual(kb.when, 'activeWebviewPanelId == gitHistory.webview');
    assert.ok(kb.key, 'Keybinding should have a key');
    assert.ok(kb.mac, 'Keybinding should have a mac key');
  });
});
