import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('Filter Presets E2E Tests', () => {
	suite('Type Definitions', () => {
		test('SavedFilterPreset interface exists in types.ts', () => {
			const typesPath = path.resolve(__dirname, '../../../src/types.ts');
			const source = fs.readFileSync(typesPath, 'utf-8');

			assert.ok(source.includes('SavedFilterPreset'), 'types.ts should define SavedFilterPreset interface');
			assert.ok(source.includes('name: string'), 'SavedFilterPreset should have name property');
			assert.ok(source.includes('filterState: FilterQueryState'), 'SavedFilterPreset should have filterState property');
			assert.ok(source.includes('createdAt: string'), 'SavedFilterPreset should have createdAt property');
		});

		test('FilterQueryState interface exists in types.ts', () => {
			const typesPath = path.resolve(__dirname, '../../../src/types.ts');
			const source = fs.readFileSync(typesPath, 'utf-8');

			assert.ok(source.includes('FilterQueryState'), 'types.ts should define FilterQueryState interface');
			assert.ok(source.includes('query: string'), 'FilterQueryState should have query property');
			assert.ok(source.includes('hideMergeCommits: boolean'), 'FilterQueryState should have hideMergeCommits property');
			assert.ok(source.includes('sortMode: number'), 'FilterQueryState should have sortMode property');
			assert.ok(source.includes('showMyCommitsOnly: boolean'), 'FilterQueryState should have showMyCommitsOnly property');
			assert.ok(source.includes('regexSearchEnabled: boolean'), 'FilterQueryState should have regexSearchEnabled property');
			assert.ok(source.includes('pathFilter: string | null'), 'FilterQueryState should have pathFilter property');
		});

		test('SAVED_PRESETS_STORAGE_KEY constant exists in types.ts', () => {
			const typesPath = path.resolve(__dirname, '../../../src/types.ts');
			const source = fs.readFileSync(typesPath, 'utf-8');

			assert.ok(source.includes('SAVED_PRESETS_STORAGE_KEY'), 'types.ts should define SAVED_PRESETS_STORAGE_KEY constant');
			assert.ok(source.includes("'gitHistory.savedPresets'"), 'SAVED_PRESETS_STORAGE_KEY should be "gitHistory.savedPresets"');
		});

		test('MAX_SAVED_PRESETS constant equals 10', () => {
			const typesPath = path.resolve(__dirname, '../../../src/settings/settingsTypes.ts');
			const source = fs.readFileSync(typesPath, 'utf-8');

			assert.ok(source.includes('MAX_SAVED_PRESETS'), 'settingsTypes.ts should define MAX_SAVED_PRESETS constant');
			assert.ok(source.includes('MAX_SAVED_PRESETS = 10'), 'MAX_SAVED_PRESETS should equal 10');
		});

		test('PRESET_NAME_MAX_LENGTH constant equals 50', () => {
			const typesPath = path.resolve(__dirname, '../../../src/settings/settingsTypes.ts');
			const source = fs.readFileSync(typesPath, 'utf-8');

			assert.ok(source.includes('PRESET_NAME_MAX_LENGTH'), 'settingsTypes.ts should define PRESET_NAME_MAX_LENGTH constant');
			assert.ok(source.includes('PRESET_NAME_MAX_LENGTH = 50'), 'PRESET_NAME_MAX_LENGTH should equal 50');
		});
	});

	suite('Message Type Definitions', () => {
		test('ExtToWebviewMessage includes filterPresets message', () => {
			const typesPath = path.resolve(__dirname, '../../../src/types.ts');
			const source = fs.readFileSync(typesPath, 'utf-8');

			assert.ok(source.includes('type: \'filterPresets\''), 'ExtToWebviewMessage should include filterPresets message type');
			assert.ok(source.includes('presets: SavedFilterPreset[]'), 'filterPresets message should have presets property');
		});

		test('WebviewToExtMessage includes saveFilterPreset message', () => {
			const typesPath = path.resolve(__dirname, '../../../src/types.ts');
			const source = fs.readFileSync(typesPath, 'utf-8');

			assert.ok(source.includes('type: \'saveFilterPreset\''), 'WebviewToExtMessage should include saveFilterPreset message type');
			assert.ok(source.includes('name: string'), 'saveFilterPreset message should have name property');
			assert.ok(source.includes('filterState: FilterQueryState'), 'saveFilterPreset message should have filterState property');
		});

		test('WebviewToExtMessage includes deleteFilterPreset message', () => {
			const typesPath = path.resolve(__dirname, '../../../src/types.ts');
			const source = fs.readFileSync(typesPath, 'utf-8');

			assert.ok(source.includes('type: \'deleteFilterPreset\''), 'WebviewToExtMessage should include deleteFilterPreset message type');
			assert.ok(source.includes('name: string'), 'deleteFilterPreset message should have name property');
		});

		test('WebviewToExtMessage includes renameFilterPreset message', () => {
			const typesPath = path.resolve(__dirname, '../../../src/types.ts');
			const source = fs.readFileSync(typesPath, 'utf-8');

			assert.ok(source.includes('type: \'renameFilterPreset\''), 'WebviewToExtMessage should include renameFilterPreset message type');
			assert.ok(source.includes('oldName: string'), 'renameFilterPreset message should have oldName property');
			assert.ok(source.includes('newName: string'), 'renameFilterPreset message should have newName property');
		});

		test('WebviewToExtMessage includes getFilterPresets message', () => {
			const typesPath = path.resolve(__dirname, '../../../src/types.ts');
			const source = fs.readFileSync(typesPath, 'utf-8');

			assert.ok(source.includes('type: \'getFilterPresets\''), 'WebviewToExtMessage should include getFilterPresets message type');
		});

		test('WebviewToExtMessage includes applyPreset message', () => {
			const typesPath = path.resolve(__dirname, '../../../src/types.ts');
			const source = fs.readFileSync(typesPath, 'utf-8');

			assert.ok(source.includes('type: \'applyPreset\''), 'WebviewToExtMessage should include applyPreset message type');
			assert.ok(source.includes('presetName: string'), 'applyPreset message should have presetName property');
		});
	});

	suite('Message Handler Wiring', () => {
		test('handleMessage switch handles saveFilterPreset', () => {
			const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
			const source = fs.readFileSync(handlerPath, 'utf-8');

			assert.ok(source.includes("case 'saveFilterPreset':"), 'messageHandler should handle saveFilterPreset message');
			assert.ok(source.includes('await handleSaveFilterPreset'), 'messageHandler should call handleSaveFilterPreset');
		});

		test('handleMessage switch handles deleteFilterPreset', () => {
			const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
			const source = fs.readFileSync(handlerPath, 'utf-8');

			assert.ok(source.includes("case 'deleteFilterPreset':"), 'messageHandler should handle deleteFilterPreset message');
			assert.ok(source.includes('await handleDeleteFilterPreset'), 'messageHandler should call handleDeleteFilterPreset');
		});

		test('handleMessage switch handles renameFilterPreset', () => {
			const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
			const source = fs.readFileSync(handlerPath, 'utf-8');

			assert.ok(source.includes("case 'renameFilterPreset':"), 'messageHandler should handle renameFilterPreset message');
			assert.ok(source.includes('await handleRenameFilterPreset'), 'messageHandler should call handleRenameFilterPreset');
		});

		test('handleMessage switch handles getFilterPresets', () => {
			const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
			const source = fs.readFileSync(handlerPath, 'utf-8');

			assert.ok(source.includes("case 'getFilterPresets':"), 'messageHandler should handle getFilterPresets message');
			assert.ok(source.includes('await handleGetFilterPresets'), 'messageHandler should call handleGetFilterPresets');
		});

		test('handleMessage switch handles applyPreset', () => {
			const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
			const source = fs.readFileSync(handlerPath, 'utf-8');

			assert.ok(source.includes("case 'applyPreset':"), 'messageHandler should handle applyPreset message');
			assert.ok(source.includes('await handleApplyPreset'), 'messageHandler should call handleApplyPreset');
		});

		test('validatePresetName function is exported', () => {
			const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
			const source = fs.readFileSync(handlerPath, 'utf-8');

			assert.ok(source.includes('export function validatePresetName'), 'messageHandler should export validatePresetName function');
		});
	});

	suite('Webview Data Flow', () => {
		test('init message includes savedPresets field', () => {
			const typesPath = path.resolve(__dirname, '../../../src/types.ts');
			const source = fs.readFileSync(typesPath, 'utf-8');

			// Find the init message type definition
			assert.ok(source.includes('savedPresets?: SavedFilterPreset[]'), 'init message should include optional savedPresets field');
		});

		test('webviewProvider reads savedPresets from globalState', () => {
			const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
			const source = fs.readFileSync(providerPath, 'utf-8');

			assert.ok(source.includes('savedPresets'), 'webviewProvider should reference savedPresets');
			assert.ok(source.includes('globalState.get'), 'webviewProvider should read from globalState');
		});

		test('webviewProvider passes savedPresets in init message', () => {
			const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
			const source = fs.readFileSync(providerPath, 'utf-8');

			// Check that savedPresets is included in the init message
			assert.ok(source.includes('savedPresets:'), 'webviewProvider should include savedPresets in init message');
		});
	});

	suite('Persistence Across Sessions', () => {
		test('savedPresets persist in VS Code globalState', () => {
			const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
			const source = fs.readFileSync(handlerPath, 'utf-8');

			// Check that saveFilterPreset handler uses globalState
			assert.ok(source.includes('context.globalState'), 'handleSaveFilterPreset should use context.globalState');
			assert.ok(source.includes('globalState.update'), 'handleSaveFilterPreset should call globalState.update');
		});

		test('storage key is consistent across files', () => {
			const typesPath = path.resolve(__dirname, '../../../src/types.ts');
			const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');

			const typesSource = fs.readFileSync(typesPath, 'utf-8');
			const handlerSource = fs.readFileSync(handlerPath, 'utf-8');

			// Check that the same storage key is used
			assert.ok(typesSource.includes("'gitHistory.savedPresets'"), 'types.ts defines storage key');
			assert.ok(handlerSource.includes('SAVED_PRESETS_STORAGE_KEY'), 'messageHandler uses STORAGE_KEY constant');
		});
	});

	suite('Validation Constants', () => {
		test('MAX_SAVED_PRESETS is enforced in save handler', () => {
			const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
			const source = fs.readFileSync(handlerPath, 'utf-8');

			assert.ok(source.includes('MAX_SAVED_PRESETS'), 'handleSaveFilterPreset should reference MAX_SAVED_PRESETS');
			assert.ok(source.includes('existingPresets.length >= MAX_SAVED_PRESETS'), 'handleSaveFilterPreset should enforce limit');
		});

		test('PRESET_NAME_MAX_LENGTH is enforced in validation', () => {
			const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
			const source = fs.readFileSync(handlerPath, 'utf-8');

			assert.ok(source.includes('PRESET_NAME_MAX_LENGTH'), 'validatePresetName should reference PRESET_NAME_MAX_LENGTH');
			assert.ok(source.includes('name.length > PRESET_NAME_MAX_LENGTH'), 'validatePresetName should check max length');
		});
	});

	suite('Webview Integration', () => {
		test('saveFilterPreset webview action exists', () => {
			const typesPath = path.resolve(__dirname, '../../../src/types.ts');
			const source = fs.readFileSync(typesPath, 'utf-8');

			assert.ok(source.includes("'saveFilterPreset'"), 'WebviewAction should include saveFilterPreset');
		});

		test('loadFilterPreset webview action exists', () => {
			const typesPath = path.resolve(__dirname, '../../../src/types.ts');
			const source = fs.readFileSync(typesPath, 'utf-8');

			assert.ok(source.includes("'loadFilterPreset'"), 'WebviewAction should include loadFilterPreset');
		});

		test('renameFilterPreset webview action exists', () => {
			const typesPath = path.resolve(__dirname, '../../../src/types.ts');
			const source = fs.readFileSync(typesPath, 'utf-8');

			assert.ok(source.includes("'renameFilterPreset'"), 'WebviewAction should include renameFilterPreset');
		});
	});
});
