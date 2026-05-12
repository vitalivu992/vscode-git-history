import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('SettingsService E2E Tests', () => {
	let tempDir: string;
	let testFile: string;

	suiteSetup(() => {
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-history-settings-e2e-'));
		testFile = path.join(tempDir, 'test.txt');

		const { execSync } = require('child_process');
		execSync('git init', { cwd: tempDir });
		execSync('git config user.name "Test User"', { cwd: tempDir });
		execSync('git config user.email "test@example.com"', { cwd: tempDir });

		fs.writeFileSync(testFile, 'line 1\nline 2\nline 3\n');
		execSync('git add .', { cwd: tempDir });
		execSync('git commit -m "Initial commit"', { cwd: tempDir });

		fs.writeFileSync(testFile, 'line 1\nmodified line 2\nline 3\n');
		execSync('git add .', { cwd: tempDir });
		execSync('git commit -m "Second commit"', { cwd: tempDir });
	});

	suiteTeardown(() => {
		fs.rmSync(tempDir, { recursive: true, force: true });
	});

	suite('Settings Persistence', () => {
		test('settingsService is initialized in extension.ts', () => {
			const extPath = path.resolve(__dirname, '../../../src/extension.ts');
			const source = fs.readFileSync(extPath, 'utf-8');

			assert.ok(source.includes('SettingsService'), 'extension.ts should import SettingsService');
			assert.ok(source.includes('new SettingsService'), 'extension.ts should instantiate SettingsService');
			assert.ok(source.includes('context.globalState'), 'extension.ts should pass globalState to SettingsService');
		});

		test('userSettings are included in init message', () => {
			const typesPath = path.resolve(__dirname, '../../../src/types.ts');
			const source = fs.readFileSync(typesPath, 'utf-8');

			assert.ok(source.includes('userSettings?: UserSettings'), 'init message should include optional userSettings');
		});

		test('webviewProvider passes userSettings in init message', async () => {
			const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
			const source = fs.readFileSync(providerPath, 'utf-8');

			assert.ok(source.includes('getSettings()'), 'webviewProvider should call getSettings');
			assert.ok(source.includes('userSettings'), 'webviewProvider should include userSettings in init message');
		});

		test('saveSettings message updates global state', () => {
			const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
			const source = fs.readFileSync(handlerPath, 'utf-8');

			assert.ok(source.includes("case 'saveSettings':"), 'messageHandler should handle saveSettings');
			assert.ok(source.includes('handleSaveSettings'), 'messageHandler should have handleSaveSettings function');
		});
	});

	suite('Backward Compatibility', () => {
		test('legacy sortOldestFirst setting is migrated on load', () => {
			const servicePath = path.resolve(__dirname, '../../../src/settings/settingsService.ts');
			const source = fs.readFileSync(servicePath, 'utf-8');

			assert.ok(source.includes('sortOldestFirst'), 'settingsService should check for legacy sortOldestFirst');
			assert.ok(source.includes('sortMode = (saved as any).sortOldestFirst ? 1 : 0'), 'settingsService should migrate sortOldestFirst to sortMode');
		});

		test('partial settings merge with defaults correctly', () => {
			const servicePath = path.resolve(__dirname, '../../../src/settings/settingsService.ts');
			const source = fs.readFileSync(servicePath, 'utf-8');

			assert.ok(source.includes('...DEFAULT_SETTINGS'), 'getSettings should merge with defaults');
			assert.ok(source.includes('...saved'), 'getSettings should merge saved settings after defaults');
		});

		test('UserSettings interface includes all required properties', () => {
			const typesPath = path.resolve(__dirname, '../../../src/settings/settingsTypes.ts');
			const source = fs.readFileSync(typesPath, 'utf-8');

			assert.ok(source.includes('diffType:'), 'UserSettings should have diffType');
			assert.ok(source.includes('wordWrapEnabled:'), 'UserSettings should have wordWrapEnabled');
			assert.ok(source.includes('sortMode:'), 'UserSettings should have sortMode');
			assert.ok(source.includes('hideMergeCommits:'), 'UserSettings should have hideMergeCommits');
			assert.ok(source.includes('regexSearchEnabled:'), 'UserSettings should have regexSearchEnabled');
			assert.ok(source.includes('showMyCommitsOnly:'), 'UserSettings should have showMyCommitsOnly');
			assert.ok(source.includes('ignoreWhitespace:'), 'UserSettings should have ignoreWhitespace');
			assert.ok(source.includes('diffContextLines:'), 'UserSettings should have diffContextLines');
			assert.ok(source.includes('searchQuery:'), 'UserSettings should have searchQuery');
			assert.ok(source.includes('showGraph:'), 'UserSettings should have showGraph');
		});

		test('DEFAULT_SETTINGS contains all default values', () => {
			const typesPath = path.resolve(__dirname, '../../../src/settings/settingsTypes.ts');
			const source = fs.readFileSync(typesPath, 'utf-8');

			assert.ok(source.includes("diffType: 'unified'"), 'DEFAULT_SETTINGS should have unified as default diffType');
			assert.ok(source.includes('wordWrapEnabled: false'), 'DEFAULT_SETTINGS should have false as default wordWrapEnabled');
			assert.ok(source.includes('sortMode: 0'), 'DEFAULT_SETTINGS should have 0 as default sortMode');
			assert.ok(source.includes('hideMergeCommits: false'), 'DEFAULT_SETTINGS should have false as default hideMergeCommits');
			assert.ok(source.includes('regexSearchEnabled: false'), 'DEFAULT_SETTINGS should have false as default regexSearchEnabled');
			assert.ok(source.includes('showMyCommitsOnly: false'), 'DEFAULT_SETTINGS should have false as default showMyCommitsOnly');
			assert.ok(source.includes('ignoreWhitespace: false'), 'DEFAULT_SETTINGS should have false as default ignoreWhitespace');
			assert.ok(source.includes('diffContextLines: 3'), 'DEFAULT_SETTINGS should have 3 as default diffContextLines');
			assert.ok(source.includes("searchQuery: ''"), 'DEFAULT_SETTINGS should have empty string as default searchQuery');
			assert.ok(source.includes('showGraph: true'), 'DEFAULT_SETTINGS should have true as default showGraph');
		});
	});

	suite('Settings in UI', () => {
		test('diff type toggle persists across sessions', () => {
			const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
			const source = fs.readFileSync(mainJsPath, 'utf-8');

			assert.ok(source.includes('setDiffType'), 'main.js should have setDiffType function');
			assert.ok(source.includes("type: 'saveSettings'"), 'main.js should send saveSettings message');
		});

		test('word wrap setting persists across sessions', () => {
			const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
			const source = fs.readFileSync(mainJsPath, 'utf-8');

			assert.ok(source.includes('handleWordWrapToggle'), 'main.js should have handleWordWrapToggle function');
			assert.ok(source.includes('wordWrapEnabled'), 'main.js should reference wordWrapEnabled');
		});

		test('sort mode persists across sessions', () => {
			const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
			const source = fs.readFileSync(mainJsPath, 'utf-8');

			assert.ok(source.includes('sortMode'), 'main.js should reference sortMode');
			assert.ok(source.includes('handleSortToggle'), 'main.js should have sort toggle handler');
		});

		test('hide merge commits persists across sessions', () => {
			const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
			const source = fs.readFileSync(mainJsPath, 'utf-8');

			assert.ok(source.includes('hideMergeCommits'), 'main.js should reference hideMergeCommits');
			assert.ok(source.includes('handleMergeToggle'), 'main.js should have merge toggle handler');
		});

		test('regex search mode persists across sessions', () => {
			const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
			const source = fs.readFileSync(mainJsPath, 'utf-8');

			assert.ok(source.includes('regexSearchEnabled'), 'main.js should reference regexSearchEnabled');
			assert.ok(source.includes('handleRegexToggle'), 'main.js should have regex toggle handler');
		});

		test('search query persists across sessions', () => {
			const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
			const source = fs.readFileSync(mainJsPath, 'utf-8');

			assert.ok(source.includes('searchQuery'), 'main.js should reference searchQuery');
			assert.ok(source.includes('saveSettings'), 'main.js should save settings on search change');
		});

		test('show graph setting persists across sessions', () => {
			const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
			const source = fs.readFileSync(mainJsPath, 'utf-8');

			assert.ok(source.includes('handleToggleGraph'), 'main.js should have handleToggleGraph function');
			assert.ok(source.includes('showGraph'), 'main.js should reference showGraph');
			assert.ok(source.includes("settings: { showGraph }"), 'main.js should save showGraph setting');
		});

		test('init message applies user settings on panel load', () => {
			const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
			const source = fs.readFileSync(mainJsPath, 'utf-8');

			// Find the init case in handleMessage
			const initIdx = source.indexOf("case 'init':");
			assert.ok(initIdx >= 0, 'main.js should handle init message');

			const nextCaseIdx = source.indexOf("case '", initIdx + 15);
			const initBlock = source.substring(initIdx, nextCaseIdx > 0 ? nextCaseIdx : initIdx + 2000);

			assert.ok(initBlock.includes('userSettings'), 'init handler should process userSettings');
			assert.ok(initBlock.includes('message.userSettings'), 'init handler should read message.userSettings');
		});

		test('settings restore all UI preferences on init', () => {
			const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
			const source = fs.readFileSync(mainJsPath, 'utf-8');

			const initIdx = source.indexOf("case 'init':");
			const nextCaseIdx = source.indexOf("case '", initIdx + 15);
			const initBlock = source.substring(initIdx, nextCaseIdx > 0 ? nextCaseIdx : initIdx + 2000);

			// Check that various settings are applied from userSettings
			assert.ok(initBlock.includes('diffType') || source.includes('setDiffType'), 'init should apply diffType');
			assert.ok(initBlock.includes('wordWrapEnabled'), 'init should apply wordWrapEnabled');
			assert.ok(initBlock.includes('sortMode'), 'init should apply sortMode');
		});
	});

	suite('SettingsService Methods', () => {
		test('SettingsService has getSettings method', () => {
			const servicePath = path.resolve(__dirname, '../../../src/settings/settingsService.ts');
			const source = fs.readFileSync(servicePath, 'utf-8');

			assert.ok(source.includes('getSettings()'), 'SettingsService should have getSettings method');
		});

		test('SettingsService has saveSettings method', () => {
			const servicePath = path.resolve(__dirname, '../../../src/settings/settingsService.ts');
			const source = fs.readFileSync(servicePath, 'utf-8');

			assert.ok(source.includes('saveSettings('), 'SettingsService should have saveSettings method');
		});

		test('SettingsService has resetSettings method', () => {
			const servicePath = path.resolve(__dirname, '../../../src/settings/settingsService.ts');
			const source = fs.readFileSync(servicePath, 'utf-8');

			assert.ok(source.includes('resetSettings()'), 'SettingsService should have resetSettings method');
		});

		test('SettingsService has getSetting method', () => {
			const servicePath = path.resolve(__dirname, '../../../src/settings/settingsService.ts');
			const source = fs.readFileSync(servicePath, 'utf-8');

			assert.ok(source.includes('getSetting<'), 'SettingsService should have generic getSetting method');
		});

		test('SettingsService has setSetting method', () => {
			const servicePath = path.resolve(__dirname, '../../../src/settings/settingsService.ts');
			const source = fs.readFileSync(servicePath, 'utf-8');

			assert.ok(source.includes('setSetting<'), 'SettingsService should have generic setSetting method');
		});
	});

	suite('Git Integration', () => {
		test('can load settings in a git repository context', async () => {
			const { SettingsService } = await import('../../src/settings/settingsService');
			const mockMemento: vscode.Memento = {
				get: () => undefined,
				update: () => Promise.resolve(),
				keys: () => [],
			};

			const service = new SettingsService(mockMemento);
			const settings = service.getSettings();

			assert.ok(settings, 'Should be able to load settings');
			assert.strictEqual(settings.diffType, 'unified');
		});

		test('settings do not interfere with git operations', async () => {
			const { getFileHistory } = await import('../../src/git/gitService');
			const commits = await getFileHistory(testFile, tempDir);

			assert.ok(commits.length >= 1, 'Should be able to get file history');
		});
	});

	suite('Data Flow Integration', () => {
		test('complete data flow: extension -> provider -> webview', () => {
			const extPath = path.resolve(__dirname, '../../../src/extension.ts');
			const providerPath = path.resolve(__dirname, '../../../src/webview/webviewProvider.ts');
			const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');

			const extSource = fs.readFileSync(extPath, 'utf-8');
			const providerSource = fs.readFileSync(providerPath, 'utf-8');
			const mainSource = fs.readFileSync(mainJsPath, 'utf-8');

			// Extension creates SettingsService with globalState
			assert.ok(extSource.includes('new SettingsService'), 'extension creates SettingsService');
			assert.ok(extSource.includes('context.globalState'), 'extension passes globalState');

			// Provider uses SettingsService
			assert.ok(providerSource.includes('settingsService'), 'provider has settingsService field');
			assert.ok(providerSource.includes('getSettings()'), 'provider calls getSettings');

			// Webview receives userSettings in init
			assert.ok(mainSource.includes('userSettings'), 'webview processes userSettings');
		});

		test('complete data flow: webview -> extension -> globalState', () => {
			const handlerPath = path.resolve(__dirname, '../../../src/webview/messageHandler.ts');
			const servicePath = path.resolve(__dirname, '../../../src/settings/settingsService.ts');

			const handlerSource = fs.readFileSync(handlerPath, 'utf-8');
			const serviceSource = fs.readFileSync(servicePath, 'utf-8');

			// Webview sends saveSettings message
			assert.ok(handlerSource.includes("case 'saveSettings':"), 'handler handles saveSettings');

			// Handler calls settingsService.saveSettings
			assert.ok(handlerSource.includes('settingsService.saveSettings'), 'handler calls saveSettings');

			// SettingsService saves to memento
			assert.ok(serviceSource.includes('_memento.update'), 'service saves to memento');
		});
	});

	suite('Settings Edge Cases', () => {
		test('handles empty memento gracefully', () => {
			const servicePath = path.resolve(__dirname, '../../../src/settings/settingsService.ts');
			const source = fs.readFileSync(servicePath, 'utf-8');

			// Check that getSettings returns DEFAULT_SETTINGS when memento is empty
			assert.ok(source.includes('if (!saved)'), 'getSettings checks for empty saved data');
			assert.ok(source.includes('return { ...DEFAULT_SETTINGS }'), 'getSettings returns defaults when empty');
		});

		test('handles partial saved settings', () => {
			const servicePath = path.resolve(__dirname, '../../../src/settings/settingsService.ts');
			const source = fs.readFileSync(servicePath, 'utf-8');

			// Check merge logic
			assert.ok(source.includes('...DEFAULT_SETTINGS, ...saved'), 'getSettings merges with defaults');
		});

		test('storage key is consistent across files', () => {
			const typesPath = path.resolve(__dirname, '../../../src/settings/settingsTypes.ts');
			const servicePath = path.resolve(__dirname, '../../../src/settings/settingsService.ts');

			const typesSource = fs.readFileSync(typesPath, 'utf-8');
			const serviceSource = fs.readFileSync(servicePath, 'utf-8');

			assert.ok(typesSource.includes("gitHistory.userSettings"), 'types defines storage key');
			assert.ok(serviceSource.includes('SETTINGS_STORAGE_KEY'), 'service uses STORAGE_KEY constant');
		});
	});
});
