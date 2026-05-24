import * as assert from 'assert';
import * as path from 'path';

suite('Copy Signature Info Unit Tests', () => {
  test('main.js should have handleCopySignatureInfo function', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('function handleCopySignatureInfo'), 'main.js should have handleCopySignatureInfo function');
  });

  test('main.js handleCopySignatureInfo should send copySignatureInfo message', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopySignatureInfo');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes("type: 'copySignatureInfo'"), 'handleCopySignatureInfo should send copySignatureInfo message');
  });

  test('main.js handleCopySignatureInfo should resolve target commit', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopySignatureInfo');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('getOrderedCommits'), 'handleCopySignatureInfo should use getOrderedCommits');
    assert.ok(fnBody.includes('getFilteredCommits'), 'handleCopySignatureInfo should use getFilteredCommits');
  });

  test('main.js should have copySignatureInfo in triggerAction switch', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes("case 'copySignatureInfo': handleCopySignatureInfo()"), 'main.js should have copySignatureInfo triggerAction case');
  });

  test('main.js should have keyboard shortcut Ctrl+Shift+Alt+G for copySignatureInfo', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    const handleKeyDownStart = source.indexOf('function handleKeyDown(e)');
    const handleKeyDownEnd = source.indexOf('\nfunction ', handleKeyDownStart + 1);
    const handleKeyDownBody = source.substring(handleKeyDownStart, handleKeyDownEnd > handleKeyDownStart ? handleKeyDownEnd : undefined);

    assert.ok(handleKeyDownBody.includes('handleCopySignatureInfo'), 'handleKeyDown should call handleCopySignatureInfo');
  });

  test('main.js context menu should have copy-signature-info action', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('data-action="copy-signature-info"'), 'context menu should have copy-signature-info action');
  });

  test('main.js context menu should have 🔐 icon for copy signature info', () => {
    const fs = require('fs');
    const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
    const source = fs.readFileSync(mainJsPath, 'utf-8');

    assert.ok(source.includes('🔐'), 'context menu should have 🔐 icon for signature info');
  });

  test('messageHandler.ts should have handleCopySignatureInfo function', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('function handleCopySignatureInfo'), 'messageHandler.ts should have handleCopySignatureInfo function');
  });

  test('messageHandler.ts should handle copySignatureInfo message', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes("case 'copySignatureInfo'"), 'messageHandler.ts should have copySignatureInfo case');
  });

  test('types.ts should have copySignatureInfo in WebviewAction', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("'copySignatureInfo'"), 'types.ts should have copySignatureInfo in WebviewAction');
  });

  test('types.ts should have copySignatureInfo message type in WebviewToExtMessage', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("type: 'copySignatureInfo'"), 'types.ts should have copySignatureInfo in WebviewToExtMessage');
  });

  test('extension.ts should register copySignatureInfo command', () => {
    const fs = require('fs');
    const extPath = path.resolve(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extPath, 'utf-8');

    assert.ok(source.includes("'gitHistory.copySignatureInfo'"), 'extension.ts should register copySignatureInfo command');
  });

  test('package.json should declare copySignatureInfo command', () => {
    const fs = require('fs');
    const pkgPath = path.resolve(__dirname, '../../../package.json');
    const source = fs.readFileSync(pkgPath, 'utf-8');

    assert.ok(source.includes('gitHistory.copySignatureInfo'), 'package.json should declare copySignatureInfo command');
  });

  test('package.json should have keybinding for copySignatureInfo', () => {
    const fs = require('fs');
    const pkgPath = path.resolve(__dirname, '../../../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

    const keybinding = pkg.contributes.keybindings.find(
      (kb: { command: string }) => kb.command === 'gitHistory.copySignatureInfo'
    );

    assert.ok(keybinding, 'package.json should have keybinding for copySignatureInfo');
    assert.strictEqual(keybinding.key, 'ctrl+shift+alt+g');
    assert.strictEqual(keybinding.mac, 'cmd+shift+alt+g');
    assert.strictEqual(keybinding.when, 'activeWebviewPanelId == gitHistory.webview');
  });

  test('messageHandler.ts handleCopySignatureInfo should check signature.verified', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const fnStart = source.indexOf('function handleCopySignatureInfo');
    const fnEnd = source.indexOf('\nfunction', fnStart + 1);
    const fnBody = source.substring(fnStart, fnEnd > fnStart ? fnEnd : undefined);

    assert.ok(fnBody.includes('signature?.verified'), 'handleCopySignatureInfo should check signature.verified');
    assert.ok(fnBody.includes('Signature: Verified'), 'handleCopySignatureInfo should output "Signature: Verified"');
    assert.ok(fnBody.includes('Signature: Not Verified'), 'handleCopySignatureInfo should output "Signature: Not Verified"');
    assert.ok(fnBody.includes('signature.signer'), 'handleCopySignatureInfo should include signer when available');
  });
});
