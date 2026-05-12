import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

suite('FirstRunTipService E2E Tests', () => {
	suite('FirstRunTipService Integration', () => {
		test('FirstRunTipService is initialized in extension.ts', () => {
			const extPath = path.resolve(__dirname, '../../../src/extension.ts');
			const source = fs.readFileSync(extPath, 'utf-8');

			assert.ok(source.includes('FirstRunTipService'), 'extension.ts should import FirstRunTipService');
			assert.ok(source.includes('new FirstRunTipService'), 'extension.ts should instantiate FirstRunTipService');
			assert.ok(source.includes('context.globalState'), 'extension.ts should pass globalState to FirstRunTipService');
		});

		test('webviewProvider passes showFirstRunTip in init message', () => {
			const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
			const source = fs.readFileSync(providerPath, 'utf-8');

			assert.ok(source.includes('shouldShowTip()'), 'webviewProvider should call shouldShowTip');
			assert.ok(source.includes('showFirstRunTip:'), 'webviewProvider should include showFirstRunTip in init message');
		});

		test('types.ts defines showFirstRunTip message type', () => {
			const typesPath = path.resolve(__dirname, '../../../src/types.ts');
			const source = fs.readFileSync(typesPath, 'utf-8');

			assert.ok(source.includes('showFirstRunTip?: boolean'), 'types should define showFirstRunTip in init message type');
		});

		test('types.ts defines dismissFirstRunTip message type', () => {
			const typesPath = path.resolve(__dirname, '../../../src/types.ts');
			const source = fs.readFileSync(typesPath, 'utf-8');

			assert.ok(source.includes("type: 'dismissFirstRunTip'"), 'WebviewToExtMessage should define dismissFirstRunTip');
		});

		test('messageHandler handles dismissFirstRunTip message', () => {
			const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
			const source = fs.readFileSync(handlerPath, 'utf-8');

			assert.ok(source.includes("case 'dismissFirstRunTip':"), 'messageHandler should handle dismissFirstRunTip case');
			assert.ok(source.includes('handleDismissFirstRunTip'), 'messageHandler should have handleDismissFirstRunTip function');
		});

		test('handleDismissFirstRunTip calls firstRunTipService.markAsShown', () => {
			const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
			const source = fs.readFileSync(handlerPath, 'utf-8');

			const fnStart = source.indexOf('async function handleDismissFirstRunTip');
			const fnEnd = source.indexOf('\n}', fnStart) + 2;
			const fn = source.substring(fnStart, fnEnd);

			assert.ok(fn.includes('markAsShown'), 'handleDismissFirstRunTip should call markAsShown');
		});

		test('handleMessage accepts firstRunTipService parameter', () => {
			const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
			const source = fs.readFileSync(handlerPath, 'utf-8');

			const handleStart = source.indexOf('export async function handleMessage');
			const handleEnd = source.indexOf('): ', handleStart);
			const handleSig = source.substring(handleStart, handleEnd);

			assert.ok(handleSig.includes('firstRunTipService'), 'handleMessage should accept firstRunTipService parameter');
		});
	});

	suite('Data Flow Integration', () => {
		test('complete data flow: extension -> provider -> webview -> extension', () => {
			const extPath = path.resolve(__dirname, '../../../src/extension.ts');
			const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
			const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
			const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');

			const extSource = fs.readFileSync(extPath, 'utf-8');
			const providerSource = fs.readFileSync(providerPath, 'utf-8');
			const mainSource = fs.readFileSync(mainJsPath, 'utf-8');
			const handlerSource = fs.readFileSync(handlerPath, 'utf-8');

			// Extension creates FirstRunTipService with globalState
			assert.ok(extSource.includes('new FirstRunTipService'), 'extension creates FirstRunTipService');
			assert.ok(extSource.includes('context.globalState'), 'extension passes globalState');

			// Provider uses FirstRunTipService
			assert.ok(providerSource.includes('firstRunTipService'), 'provider has firstRunTipService field');
			assert.ok(providerSource.includes('shouldShowTip()'), 'provider calls shouldShowTip');

			// Webview receives showFirstRunTip in init and shows banner
			assert.ok(mainSource.includes('showFirstRunTip'), 'webview handles showFirstRunTip');
			assert.ok(mainSource.includes('showFirstRunTipBanner'), 'webview has showFirstRunTipBanner function');

			// Webview sends dismissFirstRunTip
			assert.ok(mainSource.includes('dismissFirstRunTip'), 'webview has dismissFirstRunTip function');
			assert.ok(mainSource.includes("type: 'dismissFirstRunTip'"), 'webview sends dismissFirstRunTip message');

			// Handler receives dismissFirstRunTip and calls markAsShown
			assert.ok(handlerSource.includes("case 'dismissFirstRunTip':"), 'handler handles dismissFirstRunTip');
			assert.ok(handlerSource.includes('markAsShown'), 'handler calls markAsShown');
		});
	});

	suite('UI Integration', () => {
		test('banner shows when showFirstRunTip is true', () => {
			const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
			const source = fs.readFileSync(mainJsPath, 'utf-8');

			const caseStart = source.indexOf("case 'showFirstRunTip':");
			const caseEnd = source.indexOf('break;', caseStart);
			const caseBlock = source.substring(caseStart, caseEnd);

			assert.ok(caseBlock.includes('showFirstRunTipBanner'), 'showFirstRunTip case shows banner');
		});

		test('banner does not show when showFirstRunTip is false', () => {
			const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
			const source = fs.readFileSync(mainJsPath, 'utf-8');

			const initStart = source.indexOf("case 'init':");
			const initEnd = source.indexOf('break;', initStart);
			const initCase = source.substring(initStart, initEnd);

			// Check that init message handles showFirstRunTip flag
			assert.ok(initCase.includes('showFirstRunTip'), 'init handles showFirstRunTip');
		});

		test('banner can be dismissed', () => {
			const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
			const source = fs.readFileSync(mainJsPath, 'utf-8');

			assert.ok(source.includes('dismissFirstRunTip'), 'dismissFirstRunTip function exists');
		});
	});

	suite('FirstRunTipService Methods', () => {
		test('FirstRunTipService has shouldShowTip method', () => {
			const servicePath = path.resolve(__dirname, '../../../src/firstRunTip/firstRunTip.ts');
			const source = fs.readFileSync(servicePath, 'utf-8');

			assert.ok(source.includes('shouldShowTip()'), 'FirstRunTipService should have shouldShowTip method');
		});

		test('FirstRunTipService has markAsShown method', () => {
			const servicePath = path.resolve(__dirname, '../../../src/firstRunTip/firstRunTip.ts');
			const source = fs.readFileSync(servicePath, 'utf-8');

			assert.ok(source.includes('markAsShown()'), 'FirstRunTipService should have markAsShown method');
		});

		test('FirstRunTipService has reset method', () => {
			const servicePath = path.resolve(__dirname, '../../../src/firstRunTip/firstRunTip.ts');
			const source = fs.readFileSync(servicePath, 'utf-8');

			assert.ok(source.includes('reset()'), 'FirstRunTipService should have reset method');
		});

		test('FirstRunTipService uses FIRST_RUN_SHOWN_KEY constant', () => {
			const servicePath = path.resolve(__dirname, '../../../src/firstRunTip/firstRunTip.ts');
			const source = fs.readFileSync(servicePath, 'utf-8');

			assert.ok(source.includes('FIRST_RUN_SHOWN_KEY'), 'FirstRunTipService should define FIRST_RUN_SHOWN_KEY');
			assert.ok(source.includes("gitHistory.firstRunShown"), 'FirstRunTipService should use gitHistory.firstRunShown');
		});
	});

	suite('Storage Key Consistency', () => {
		test('FIRST_RUN_SHOWN_KEY is consistent', () => {
			const servicePath = path.resolve(__dirname, '../../../src/firstRunTip/firstRunTip.ts');
			const source = fs.readFileSync(servicePath, 'utf-8');

			const keyDef = source.indexOf('const FIRST_RUN_SHOWN_KEY');
			assert.ok(keyDef >= 0, 'FIRST_RUN_SHOWN_KEY should be defined');

			const keyLine = source.substring(keyDef, keyDef + 100);
			assert.ok(keyLine.includes("'gitHistory.firstRunShown'"), 'Storage key should be gitHistory.firstRunShown');
		});
	});

	suite('Git Integration (can load in git repo context)', () => {
		test('can create FirstRunTipService in git context', async () => {
			const { FirstRunTipService } = await import('../../src/firstRunTip/firstRunTip');
			const mockMemento: vscode.Memento = {
				get: (key: string) => undefined,
				update: () => Promise.resolve(),
				keys: () => [],
			};

			const service = new FirstRunTipService(mockMemento);
			const shouldShow = service.shouldShowTip();

			assert.strictEqual(shouldShow, true, 'shouldShowTip should return true on fresh install');
		});
	});
});