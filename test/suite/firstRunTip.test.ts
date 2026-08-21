import * as assert from 'assert';
import * as path from 'path';

suite('First Run Tip Service Tests', () => {
  test('firstRunTip.ts should exist', () => {
    const fs = require('fs');
    const servicePath = path.resolve(__dirname, '../../../src/firstRunTip/firstRunTip.ts');
    assert.ok(fs.existsSync(servicePath), 'firstRunTip.ts should exist');
  });

  test('firstRunTip/index.ts should exist', () => {
    const fs = require('fs');
    const indexPath = path.resolve(__dirname, '../../../src/firstRunTip/index.ts');
    assert.ok(fs.existsSync(indexPath), 'firstRunTip/index.ts should exist');
  });

  test('FirstRunTipService should have shouldShowTip method', () => {
    const fs = require('fs');
    const servicePath = path.resolve(__dirname, '../../../src/firstRunTip/firstRunTip.ts');
    const source = fs.readFileSync(servicePath, 'utf-8');

    assert.ok(source.includes('shouldShowTip'), 'FirstRunTipService should have shouldShowTip method');
  });

  test('FirstRunTipService should have markAsShown method', () => {
    const fs = require('fs');
    const servicePath = path.resolve(__dirname, '../../../src/firstRunTip/firstRunTip.ts');
    const source = fs.readFileSync(servicePath, 'utf-8');

    assert.ok(source.includes('markAsShown'), 'FirstRunTipService should have markAsShown method');
  });

  test('FirstRunTipService should have reset method', () => {
    const fs = require('fs');
    const servicePath = path.resolve(__dirname, '../../../src/firstRunTip/firstRunTip.ts');
    const source = fs.readFileSync(servicePath, 'utf-8');

    assert.ok(source.includes('reset'), 'FirstRunTipService should have reset method');
  });

  test('FirstRunTipService should accept Memento in constructor', () => {
    const fs = require('fs');
    const servicePath = path.resolve(__dirname, '../../../src/firstRunTip/firstRunTip.ts');
    const source = fs.readFileSync(servicePath, 'utf-8');

    assert.ok(source.includes('memento: vscode.Memento'), 'FirstRunTipService constructor should accept Memento');
  });

  test('FirstRunTipService should use FIRST_RUN_SHOWN_KEY constant', () => {
    const fs = require('fs');
    const servicePath = path.resolve(__dirname, '../../../src/firstRunTip/firstRunTip.ts');
    const source = fs.readFileSync(servicePath, 'utf-8');

    assert.ok(source.includes('FIRST_RUN_SHOWN_KEY'), 'FirstRunTipService should use FIRST_RUN_SHOWN_KEY constant');
    assert.ok(source.includes("gitHistory.firstRunShown"), 'FIRST_RUN_SHOWN_KEY should be gitHistory.firstRunShown');
  });

  test('firstRunTip/index.ts should export FirstRunTipService', () => {
    const fs = require('fs');
    const indexPath = path.resolve(__dirname, '../../../src/firstRunTip/index.ts');
    const source = fs.readFileSync(indexPath, 'utf-8');

    assert.ok(source.includes('FirstRunTipService'), 'index.ts should export FirstRunTipService');
  });

  test('extension.ts should import FirstRunTipService', () => {
    const fs = require('fs');
    const extPath = path.resolve(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extPath, 'utf-8');

    assert.ok(source.includes("from './firstRunTip'"), 'extension.ts should import from ./firstRunTip');
    assert.ok(source.includes('FirstRunTipService'), 'extension.ts should reference FirstRunTipService');
  });

  test('extension.ts should initialize FirstRunTipService', () => {
    const fs = require('fs');
    const extPath = path.resolve(__dirname, '../../../src/extension.ts');
    const source = fs.readFileSync(extPath, 'utf-8');

    assert.ok(source.includes('new FirstRunTipService'), 'extension.ts should create FirstRunTipService instance');
    assert.ok(source.includes('context.globalState'), 'extension.ts should pass globalState to FirstRunTipService');
  });

  test('types.ts should have showFirstRunTip message type', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("| { type: 'showFirstRunTip' }"), 'ExtToWebviewMessage should have showFirstRunTip type');
  });

  test('types.ts should have dismissFirstRunTip message type', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes("| { type: 'dismissFirstRunTip' }"), 'WebviewToExtMessage should have dismissFirstRunTip type');
  });

  test('webviewProvider.ts should import FirstRunTipService', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes("from '../firstRunTip'"), 'webviewProvider.ts should import from ../firstRunTip');
  });

  test('webviewProvider.ts should have firstRunTipService field', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('FirstRunTipService'), 'webviewProvider.ts should reference FirstRunTipService field');
  });

  test('webviewProvider.ts loadData should check shouldShowTip', () => {
    const fs = require('fs');
    const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
    const source = fs.readFileSync(providerPath, 'utf-8');

    assert.ok(source.includes('shouldShowTip'), 'loadData should call shouldShowTip to check if tip should be shown');
    assert.ok(source.includes('showFirstRunTip'), 'init message should include showFirstRunTip flag');
  });

  test('messageHandler.ts should import FirstRunTipService', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes("from '../firstRunTip'"), 'messageHandler.ts should import from ../firstRunTip');
  });

  test('messageHandler.ts should have handleDismissFirstRunTip function', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes('handleDismissFirstRunTip'), 'messageHandler.ts should have handleDismissFirstRunTip function');
  });

  test('messageHandler.ts handleDismissFirstRunTip should call markAsShown', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const dismissStart = source.indexOf('function handleDismissFirstRunTip');
    const dismissEnd = source.indexOf('\n}', dismissStart) + 2;
    const dismissFn = source.substring(dismissStart, dismissEnd);

    assert.ok(dismissFn.includes('markAsShown'), 'handleDismissFirstRunTip should call markAsShown');
  });

  test('messageHandler.ts should have dismissFirstRunTip case in switch', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    assert.ok(source.includes("case 'dismissFirstRunTip':"), 'messageHandler.ts should have dismissFirstRunTip case');
  });

  test('messageHandler.ts handleMessage should accept firstRunTipService parameter', () => {
    const fs = require('fs');
    const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
    const source = fs.readFileSync(handlerPath, 'utf-8');

    const handleStart = source.indexOf('export async function handleMessage');
    const handleEnd = source.indexOf('): Promise<void>', handleStart);
    const handleSig = source.substring(handleStart, handleEnd);

    assert.ok(handleSig.includes('firstRunTipService'), 'handleMessage should accept firstRunTipService parameter');
  });

  test('init message should include showFirstRunTip flag', () => {
    const fs = require('fs');
    const typesPath = path.resolve(__dirname, '../../../src/types.ts');
    const source = fs.readFileSync(typesPath, 'utf-8');

    assert.ok(source.includes('showFirstRunTip?: boolean'), 'init message type should include showFirstRunTip flag');
  });
});
