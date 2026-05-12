import * as assert from 'assert';
import * as vscode from 'vscode';
import { SettingsService } from '../../src/settings/settingsService';
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY, UserSettings } from '../../src/settings/settingsTypes';

// Mock Memento for testing
class MockMemento implements vscode.Memento {
	private store = new Map<string, any>();

	get<T>(key: string): T | undefined {
		return this.store.get(key) as T | undefined;
	}

	update(key: string, value: any): Thenable<void> {
		if (value === undefined) {
			this.store.delete(key);
		} else {
			this.store.set(key, value);
		}
		return Promise.resolve();
	}

	keys(): readonly string[] {
		return Array.from(this.store.keys());
	}
}

suite('SettingsService Unit Tests', () => {
	let mockMemento: MockMemento;
	let settingsService: SettingsService;

	setup(() => {
		mockMemento = new MockMemento();
		settingsService = new SettingsService(mockMemento);
	});

	suite('getSettings', () => {
		test('returns DEFAULT_SETTINGS when no saved settings exist', () => {
			const settings = settingsService.getSettings();

			assert.deepStrictEqual(settings, DEFAULT_SETTINGS);
		});

		test('returns saved settings when they exist', async () => {
			const customSettings: UserSettings = {
				...DEFAULT_SETTINGS,
				diffType: 'side-by-side',
				wordWrapEnabled: true
			};

			await mockMemento.update(SETTINGS_STORAGE_KEY, customSettings);
			const settings = settingsService.getSettings();

			assert.strictEqual(settings.diffType, 'side-by-side');
			assert.strictEqual(settings.wordWrapEnabled, true);
		});

		test('merges saved settings with defaults for backward compatibility', async () => {
			// Simulate a partial saved setting (missing new fields added in later versions)
			const partialSettings = {
				diffType: 'side-by-side',
				wordWrapEnabled: true,
				sortMode: 1,
				// Missing: hideMergeCommits, regexSearchEnabled, showMyCommitsOnly, ignoreWhitespace, diffContextLines, searchQuery, showGraph, showSignatures
			};

			await mockMemento.update(SETTINGS_STORAGE_KEY, partialSettings);
			const settings = settingsService.getSettings();

			assert.strictEqual(settings.diffType, 'side-by-side');
			assert.strictEqual(settings.wordWrapEnabled, true);
			assert.strictEqual(settings.sortMode, 1);
			// Should have defaults for missing fields
			assert.strictEqual(settings.hideMergeCommits, false);
			assert.strictEqual(settings.regexSearchEnabled, false);
			assert.strictEqual(settings.showMyCommitsOnly, false);
			assert.strictEqual(settings.ignoreWhitespace, false);
			assert.strictEqual(settings.diffContextLines, 3);
			assert.strictEqual(settings.searchQuery, '');
			assert.strictEqual(settings.showGraph, true); // default
			assert.strictEqual(settings.showSignatures, true); // default
		});

		test('migrates sortOldestFirst: true to sortMode: 1', async () => {
			const legacySettings = {
				sortOldestFirst: true,
				diffType: 'unified'
			};

			await mockMemento.update(SETTINGS_STORAGE_KEY, legacySettings);
			const settings = settingsService.getSettings();

			assert.strictEqual(settings.sortMode, 1);
		});

		test('migrates sortOldestFirst: false to sortMode: 0', async () => {
			const legacySettings = {
				sortOldestFirst: false,
				diffType: 'unified'
			};

			await mockMemento.update(SETTINGS_STORAGE_KEY, legacySettings);
			const settings = settingsService.getSettings();

			assert.strictEqual(settings.sortMode, 0);
		});

		test('does not migrate when sortMode already exists', async () => {
			const mixedSettings = {
				sortOldestFirst: true, // legacy field
				sortMode: 3, // new field already set
				diffType: 'unified'
			};

			await mockMemento.update(SETTINGS_STORAGE_KEY, mixedSettings);
			const settings = settingsService.getSettings();

			// sortMode should not be changed by migration
			assert.strictEqual(settings.sortMode, 3);
		});

		test('handles missing individual fields gracefully', async () => {
			const partialSettings = {
				diffType: 'side-by-side',
				// All other fields missing
			};

			await mockMemento.update(SETTINGS_STORAGE_KEY, partialSettings);
			const settings = settingsService.getSettings();

			assert.strictEqual(settings.diffType, 'side-by-side');
			assert.strictEqual(settings.wordWrapEnabled, false); // default
			assert.strictEqual(settings.sortMode, 0); // default
			assert.strictEqual(settings.hideMergeCommits, false); // default
			assert.strictEqual(settings.regexSearchEnabled, false); // default
			assert.strictEqual(settings.showMyCommitsOnly, false); // default
			assert.strictEqual(settings.ignoreWhitespace, false); // default
			assert.strictEqual(settings.diffContextLines, 3); // default
			assert.strictEqual(settings.searchQuery, ''); // default
			assert.strictEqual(settings.showGraph, true); // default
			assert.strictEqual(settings.showSignatures, true); // default
		});

		test('returns a copy, not the original stored object', async () => {
			const customSettings: UserSettings = {
				...DEFAULT_SETTINGS,
				diffType: 'side-by-side'
			};

			await mockMemento.update(SETTINGS_STORAGE_KEY, customSettings);
			const settings1 = settingsService.getSettings();
			const settings2 = settingsService.getSettings();

			// Modify settings1
			settings1.diffType = 'unified';

			// settings2 should not be affected
			assert.strictEqual(settings2.diffType, 'side-by-side');
		});
	});

	suite('saveSettings', () => {
		test('saves new settings to memento', async () => {
			const newSettings: Partial<UserSettings> = {
				diffType: 'side-by-side'
			};

			await settingsService.saveSettings(newSettings);

			const stored = mockMemento.get<UserSettings>(SETTINGS_STORAGE_KEY);
			assert.strictEqual(stored?.diffType, 'side-by-side');
		});

		test('merges partial settings with existing settings', async () => {
			// Start with existing settings
			const existingSettings: UserSettings = {
				...DEFAULT_SETTINGS,
				diffType: 'side-by-side',
				wordWrapEnabled: true
			};
			await mockMemento.update(SETTINGS_STORAGE_KEY, existingSettings);

			// Save only one field
			await settingsService.saveSettings({ sortMode: 2 });

			const stored = mockMemento.get<UserSettings>(SETTINGS_STORAGE_KEY);
			assert.strictEqual(stored?.diffType, 'side-by-side'); // preserved
			assert.strictEqual(stored?.wordWrapEnabled, true); // preserved
			assert.strictEqual(stored?.sortMode, 2); // updated
		});

		test('overwrites existing settings with new values', async () => {
			// Start with existing settings
			const existingSettings: UserSettings = {
				...DEFAULT_SETTINGS,
				diffType: 'side-by-side',
				wordWrapEnabled: true
			};
			await mockMemento.update(SETTINGS_STORAGE_KEY, existingSettings);

			// Save conflicting value
			await settingsService.saveSettings({ diffType: 'unified' });

			const stored = mockMemento.get<UserSettings>(SETTINGS_STORAGE_KEY);
			assert.strictEqual(stored?.diffType, 'unified');
			assert.strictEqual(stored?.wordWrapEnabled, true); // preserved
		});

		test('persists to memento storage', async () => {
			const newSettings: Partial<UserSettings> = {
				hideMergeCommits: true,
				regexSearchEnabled: true
			};

			await settingsService.saveSettings(newSettings);

			const stored = mockMemento.get<UserSettings>(SETTINGS_STORAGE_KEY);
			assert.strictEqual(stored?.hideMergeCommits, true);
			assert.strictEqual(stored?.regexSearchEnabled, true);
		});

		test('merges with defaults when saving first time', async () => {
			// No existing settings
			const newSettings: Partial<UserSettings> = {
				diffType: 'side-by-side'
			};

			await settingsService.saveSettings(newSettings);

			const stored = mockMemento.get<UserSettings>(SETTINGS_STORAGE_KEY);
			assert.strictEqual(stored?.diffType, 'side-by-side');
			assert.strictEqual(stored?.wordWrapEnabled, false); // default
			assert.strictEqual(stored?.sortMode, 0); // default
		});

		test('handles all UserSettings properties', async () => {
			const fullSettings: Partial<UserSettings> = {
				diffType: 'side-by-side',
				wordWrapEnabled: true,
				sortMode: 1,
				hideMergeCommits: true,
				regexSearchEnabled: true,
				showMyCommitsOnly: true,
				ignoreWhitespace: true,
				diffContextLines: 5,
				showGraph: false,
				showSignatures: false,
				searchQuery: 'test query'
			};

			await settingsService.saveSettings(fullSettings);

			const stored = mockMemento.get<UserSettings>(SETTINGS_STORAGE_KEY);
			assert.deepStrictEqual(stored, { ...DEFAULT_SETTINGS, ...fullSettings });
		});
	});

	suite('resetSettings', () => {
		test('clears all settings from memento', async () => {
			const customSettings: UserSettings = {
				...DEFAULT_SETTINGS,
				diffType: 'side-by-side',
				wordWrapEnabled: true
			};

			await mockMemento.update(SETTINGS_STORAGE_KEY, customSettings);
			assert.ok(mockMemento.get(SETTINGS_STORAGE_KEY));

			await settingsService.resetSettings();

			assert.strictEqual(mockMemento.get(SETTINGS_STORAGE_KEY), undefined);
		});

		test('subsequent getSettings returns defaults after reset', async () => {
			const customSettings: UserSettings = {
				...DEFAULT_SETTINGS,
				diffType: 'side-by-side'
			};

			await mockMemento.update(SETTINGS_STORAGE_KEY, customSettings);
			await settingsService.resetSettings();

			const settings = settingsService.getSettings();
			assert.deepStrictEqual(settings, DEFAULT_SETTINGS);
		});

		test('can save new settings after reset', async () => {
			const customSettings: UserSettings = {
				...DEFAULT_SETTINGS,
				diffType: 'side-by-side'
			};

			await mockMemento.update(SETTINGS_STORAGE_KEY, customSettings);
			await settingsService.resetSettings();
			await settingsService.saveSettings({ diffType: 'unified' });

			const settings = settingsService.getSettings();
			assert.strictEqual(settings.diffType, 'unified');
		});
	});

	suite('getSetting', () => {
		test('returns single setting value by key', async () => {
			const customSettings: UserSettings = {
				...DEFAULT_SETTINGS,
				diffType: 'side-by-side'
			};

			await mockMemento.update(SETTINGS_STORAGE_KEY, customSettings);
			const diffType = settingsService.getSetting('diffType');

			assert.strictEqual(diffType, 'side-by-side');
		});

		test('returns default value when setting not saved', () => {
			// No saved settings
			const diffType = settingsService.getSetting('diffType');

			assert.strictEqual(diffType, 'unified'); // default
		});

		test('returns saved value when setting exists', async () => {
			await settingsService.saveSettings({ hideMergeCommits: true });
			const hideMergeCommits = settingsService.getSetting('hideMergeCommits');

			assert.strictEqual(hideMergeCommits, true);
		});

		test('works for all UserSettings properties', async () => {
			const customSettings: Partial<UserSettings> = {
				diffType: 'side-by-side',
				wordWrapEnabled: true,
				sortMode: 2,
				hideMergeCommits: true,
				regexSearchEnabled: true,
				showMyCommitsOnly: true,
				ignoreWhitespace: true,
				diffContextLines: 7,
				searchQuery: 'test',
				showGraph: false,
				showSignatures: false,
			};

			await settingsService.saveSettings(customSettings);

			assert.strictEqual(settingsService.getSetting('diffType'), 'side-by-side');
			assert.strictEqual(settingsService.getSetting('wordWrapEnabled'), true);
			assert.strictEqual(settingsService.getSetting('sortMode'), 2);
			assert.strictEqual(settingsService.getSetting('hideMergeCommits'), true);
			assert.strictEqual(settingsService.getSetting('regexSearchEnabled'), true);
			assert.strictEqual(settingsService.getSetting('showMyCommitsOnly'), true);
			assert.strictEqual(settingsService.getSetting('ignoreWhitespace'), true);
			assert.strictEqual(settingsService.getSetting('diffContextLines'), 7);
			assert.strictEqual(settingsService.getSetting('searchQuery'), 'test');
				assert.strictEqual(settingsService.getSetting('showGraph'), false);
				assert.strictEqual(settingsService.getSetting('showSignatures'), false);
		});
	});

	suite('setSetting', () => {
		test('updates single setting value', async () => {
			await settingsService.setSetting('diffType', 'side-by-side');

			const diffType = settingsService.getSetting('diffType');
			assert.strictEqual(diffType, 'side-by-side');
		});

		test('merges with existing settings', async () => {
			await settingsService.saveSettings({ diffType: 'side-by-side' });
			await settingsService.setSetting('wordWrapEnabled', true);

			const settings = settingsService.getSettings();
			assert.strictEqual(settings.diffType, 'side-by-side');
			assert.strictEqual(settings.wordWrapEnabled, true);
		});

		test('other settings remain unchanged', async () => {
			const initialSettings: Partial<UserSettings> = {
				diffType: 'side-by-side',
				wordWrapEnabled: true,
				sortMode: 1
			};

			await settingsService.saveSettings(initialSettings);
			await settingsService.setSetting('hideMergeCommits', true);

			const settings = settingsService.getSettings();
			assert.strictEqual(settings.diffType, 'side-by-side');
			assert.strictEqual(settings.wordWrapEnabled, true);
			assert.strictEqual(settings.sortMode, 1);
			assert.strictEqual(settings.hideMergeCommits, true);
		});

		test('can update all UserSettings properties individually', async () => {
			// Update each property individually
			await settingsService.setSetting('diffType', 'side-by-side');
			assert.strictEqual(settingsService.getSetting('diffType'), 'side-by-side');

			await settingsService.setSetting('wordWrapEnabled', true);
			assert.strictEqual(settingsService.getSetting('wordWrapEnabled'), true);

			await settingsService.setSetting('sortMode', 3);
			assert.strictEqual(settingsService.getSetting('sortMode'), 3);

			await settingsService.setSetting('hideMergeCommits', true);
			assert.strictEqual(settingsService.getSetting('hideMergeCommits'), true);

			await settingsService.setSetting('regexSearchEnabled', true);
			assert.strictEqual(settingsService.getSetting('regexSearchEnabled'), true);

			await settingsService.setSetting('showMyCommitsOnly', true);
			assert.strictEqual(settingsService.getSetting('showMyCommitsOnly'), true);

			await settingsService.setSetting('ignoreWhitespace', true);
			assert.strictEqual(settingsService.getSetting('ignoreWhitespace'), true);

			await settingsService.setSetting('diffContextLines', 10);
			assert.strictEqual(settingsService.getSetting('diffContextLines'), 10);

			await settingsService.setSetting('searchQuery', 'my query');
			await settingsService.setSetting('showGraph', false);
			assert.strictEqual(settingsService.getSetting('showGraph'), false);

			await settingsService.setSetting('showSignatures', false);
			assert.strictEqual(settingsService.getSetting('showSignatures'), false);
		});
	});

	suite('integration scenarios', () => {
		test('full lifecycle: save, read, update, reset', async () => {
			// Initial save
			await settingsService.saveSettings({ diffType: 'side-by-side' });
			assert.strictEqual(settingsService.getSetting('diffType'), 'side-by-side');

			// Update
			await settingsService.saveSettings({ wordWrapEnabled: true });
			assert.strictEqual(settingsService.getSetting('diffType'), 'side-by-side');
			assert.strictEqual(settingsService.getSetting('wordWrapEnabled'), true);

			// Partial update
			await settingsService.saveSettings({ diffType: 'unified' });
			assert.strictEqual(settingsService.getSetting('diffType'), 'unified');
			assert.strictEqual(settingsService.getSetting('wordWrapEnabled'), true);

			// Reset
			await settingsService.resetSettings();
			assert.strictEqual(settingsService.getSetting('diffType'), 'unified'); // default
			assert.strictEqual(settingsService.getSetting('wordWrapEnabled'), false); // default
		});

		test('legacy migration works correctly', async () => {
			// Simulate legacy settings
			const legacySettings = {
				sortOldestFirst: true,
				diffType: 'unified',
				wordWrapEnabled: false
			};

			await mockMemento.update(SETTINGS_STORAGE_KEY, legacySettings);
			const settings = settingsService.getSettings();

			assert.strictEqual(settings.sortMode, 1); // migrated
			assert.strictEqual(settings.diffType, 'unified');
			assert.strictEqual(settings.wordWrapEnabled, false);
		});

		test('new fields added in future versions merge with existing settings', async () => {
			// Simulate settings from an older version
			const oldSettings = {
				diffType: 'side-by-side',
				wordWrapEnabled: true,
				sortMode: 1,
				// Missing: hideMergeCommits, regexSearchEnabled, showMyCommitsOnly, ignoreWhitespace, diffContextLines, searchQuery, showGraph, showSignatures
			};

			await mockMemento.update(SETTINGS_STORAGE_KEY, oldSettings);
			const settings = settingsService.getSettings();

			// Old settings preserved
			assert.strictEqual(settings.diffType, 'side-by-side');
			assert.strictEqual(settings.wordWrapEnabled, true);
			assert.strictEqual(settings.sortMode, 1);

			// New fields have defaults
			assert.strictEqual(settings.hideMergeCommits, false);
			assert.strictEqual(settings.regexSearchEnabled, false);
			assert.strictEqual(settings.showMyCommitsOnly, false);
			assert.strictEqual(settings.ignoreWhitespace, false);
			assert.strictEqual(settings.diffContextLines, 3);
			assert.strictEqual(settings.searchQuery, '');
				assert.strictEqual(settings.showGraph, true);
				assert.strictEqual(settings.showSignatures, true);
		});
	});
});
