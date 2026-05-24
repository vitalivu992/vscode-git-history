import * as assert from 'assert';
import * as vscode from 'vscode';
import {
	handleSaveFilterPreset,
	handleDeleteFilterPreset,
	handleRenameFilterPreset,
	handleGetFilterPresets,
	handleApplyPreset
} from '../../src/webview/messageHandler';
import { SavedFilterPreset, SAVED_PRESETS_STORAGE_KEY } from '../../src/types';
import { MAX_SAVED_PRESETS, PRESET_NAME_MAX_LENGTH } from '../../src/settings/settingsTypes';
import { FilterQueryState } from '../../src/types';

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

// Simple stub for vscode.window methods
let showWarningMessageCalls: string[] = [];
let showInformationMessageCalls: string[];

function setupStubs() {
	showWarningMessageCalls = [];
	showInformationMessageCalls = [];
	(vscode.window as any).showWarningMessage = async (msg: string) => {
		showWarningMessageCalls.push(msg);
		return undefined;
	};
	(vscode.window as any).showInformationMessage = async (msg: string) => {
		showInformationMessageCalls.push(msg);
		return undefined;
	};
}

function restoreStubs() {
	delete (vscode.window as any).showWarningMessage;
	delete (vscode.window as any).showInformationMessage;
}

// Mock GitHistoryPanel
class MockGitHistoryPanel {
	private _messages: any[] = [];
	private _context: vscode.ExtensionContext;
	private _commits: any[] = [];

	constructor(context: vscode.ExtensionContext) {
		this._context = context;
	}

	getContext(): vscode.ExtensionContext {
		return this._context;
	}

	getCommits(): any[] {
		return this._commits;
	}

	getCwd(): string {
		return '/test/workspace';
	}

	postMessage(message: any): void {
		this._messages.push(message);
	}

	getMessages(): any[] {
		return this._messages;
	}

	clearMessages(): void {
		this._messages = [];
	}

	loadData(): Promise<void> {
		return Promise.resolve();
	}
}

suite('Filter Presets Message Handler Tests', () => {
	let mockMemento: MockMemento;
	let mockContext: vscode.ExtensionContext;
	let mockPanel: MockGitHistoryPanel;

	const sampleFilterState: FilterQueryState = {
		query: 'author:test after:2024-01-01',
		hideMergeCommits: true,
		sortMode: 1,
		showMyCommitsOnly: false,
		regexSearchEnabled: true,
		pathFilter: 'src/'
	};

	setup(() => {
		setupStubs();
		mockMemento = new MockMemento();
		mockContext = {
			globalState: mockMemento,
			workspaceState: mockMemento
		} as unknown as vscode.ExtensionContext;
		mockPanel = new MockGitHistoryPanel(mockContext);
	});

	teardown(() => {
		restoreStubs();
	});

	suite('handleSaveFilterPreset', () => {
		test('saves new preset to globalState', async () => {
			await handleSaveFilterPreset('New Preset', sampleFilterState, mockPanel as any);

			const stored = mockMemento.get<SavedFilterPreset[]>(SAVED_PRESETS_STORAGE_KEY);
			assert.ok(stored);
			assert.strictEqual(stored?.length, 1);
			assert.strictEqual(stored?.[0].name, 'New Preset');
			assert.deepStrictEqual(stored?.[0].filterState, sampleFilterState);
		});

		test('sends filterPresets message with updated presets', async () => {
			await handleSaveFilterPreset('My Filter', sampleFilterState, mockPanel as any);

			const messages = mockPanel.getMessages();
			assert.ok(messages.length > 0);
			const filterPresetsMsg = messages.find(m => m.type === 'filterPresets');
			assert.ok(filterPresetsMsg);
			assert.strictEqual(filterPresetsMsg.presets.length, 1);
		});

		test('shows error for empty preset name', async () => {
			await handleSaveFilterPreset('', sampleFilterState, mockPanel as any);

			assert.strictEqual(showWarningMessageCalls.length, 1);
			const errorMsg = showWarningMessageCalls[0];
			assert.ok(errorMsg.includes('cannot be empty'));

			const stored = mockMemento.get<SavedFilterPreset[]>(SAVED_PRESETS_STORAGE_KEY);
			assert.strictEqual(stored, undefined);
		});

		test('shows error for whitespace-only name', async () => {
			await handleSaveFilterPreset('   ', sampleFilterState, mockPanel as any);

			assert.strictEqual(showWarningMessageCalls.length, 1);
			const errorMsg = showWarningMessageCalls[0];
			assert.ok(errorMsg.includes('cannot be empty'));
		});

		test('shows error for name exceeding max length', async () => {
			const longName = 'a'.repeat(PRESET_NAME_MAX_LENGTH + 1);
			await handleSaveFilterPreset(longName, sampleFilterState, mockPanel as any);

			assert.strictEqual(showWarningMessageCalls.length, 1);
			const errorMsg = showWarningMessageCalls[0];
			assert.ok(errorMsg.includes('cannot exceed'));
		});

		test('shows error for name with invalid characters', async () => {
			await handleSaveFilterPreset('Test/Filter', sampleFilterState, mockPanel as any);

			assert.strictEqual(showWarningMessageCalls.length, 1);
			const errorMsg = showWarningMessageCalls[0];
			assert.ok(errorMsg.includes('invalid characters'));
		});

		test('shows error for duplicate name (case-insensitive)', async () => {
			// Save first preset
			await handleSaveFilterPreset('My Filter', sampleFilterState, mockPanel as any);
			mockPanel.clearMessages();
			showWarningMessageCalls = [];
			showInformationMessageCalls = [];

			// Try to save duplicate
			await handleSaveFilterPreset('my filter', sampleFilterState, mockPanel as any);

			assert.strictEqual(showWarningMessageCalls.length, 1);
			const errorMsg = showWarningMessageCalls[0];
			assert.ok(errorMsg.includes('already exists'));
		});

		test('enforces maximum presets limit', async () => {
			// Fill up to max limit
			for (let i = 0; i < MAX_SAVED_PRESETS; i++) {
				await handleSaveFilterPreset(`Preset ${i}`, sampleFilterState, mockPanel as any);
			}
			mockPanel.clearMessages();
			showWarningMessageCalls = [];
			showInformationMessageCalls = [];

			// Try to save one more
			await handleSaveFilterPreset('Extra Preset', sampleFilterState, mockPanel as any);

			assert.strictEqual(showWarningMessageCalls.length, 1);
			const errorMsg = showWarningMessageCalls[0];
			assert.ok(errorMsg.includes(`Maximum ${MAX_SAVED_PRESETS} presets`));
		});

		test('trims preset name before saving', async () => {
			await handleSaveFilterPreset('  My Filter  ', sampleFilterState, mockPanel as any);

			const stored = mockMemento.get<SavedFilterPreset[]>(SAVED_PRESETS_STORAGE_KEY);
			assert.strictEqual(stored?.[0].name, 'My Filter');
		});

		test('sets createdAt timestamp on new preset', async () => {
			const beforeTime = new Date().toISOString();
			await handleSaveFilterPreset('Test', sampleFilterState, mockPanel as any);
			const afterTime = new Date().toISOString();

			const stored = mockMemento.get<SavedFilterPreset[]>(SAVED_PRESETS_STORAGE_KEY);
			if (stored && stored[0]) {
				assert.ok(stored[0].createdAt >= beforeTime);
				assert.ok(stored[0].createdAt <= afterTime);
			} else {
				assert.fail('Preset not found');
			}
		});

		test('shows success message on save', async () => {
			await handleSaveFilterPreset('Test Preset', sampleFilterState, mockPanel as any);

			assert.strictEqual(showInformationMessageCalls.length, 1);
			const successMsg = showInformationMessageCalls[0];
			assert.ok(successMsg.includes('saved'));
		});
	});

	suite('handleDeleteFilterPreset', () => {
		setup(async () => {
			// Create test presets
			const presets: SavedFilterPreset[] = [
				{
					name: 'Preset 1',
					filterState: sampleFilterState,
					createdAt: '2024-05-24T10:00:00.000Z'
				},
				{
					name: 'Preset 2',
					filterState: sampleFilterState,
					createdAt: '2024-05-24T11:00:00.000Z'
				},
				{
					name: 'Preset 3',
					filterState: sampleFilterState,
					createdAt: '2024-05-24T12:00:00.000Z'
				}
			];
			await mockMemento.update(SAVED_PRESETS_STORAGE_KEY, presets);
		});

		test('deletes preset from globalState', async () => {
			await handleDeleteFilterPreset('Preset 2', mockPanel as any);

			const stored = mockMemento.get<SavedFilterPreset[]>(SAVED_PRESETS_STORAGE_KEY);
			assert.strictEqual(stored?.length, 2);
			assert.ok(stored?.find(p => p.name === 'Preset 1'));
			assert.ok(stored?.find(p => p.name === 'Preset 3'));
			assert.ok(!stored?.find(p => p.name === 'Preset 2'));
		});

		test('deletes preset case-insensitively', async () => {
			await handleDeleteFilterPreset('preset 2', mockPanel as any);

			const stored = mockMemento.get<SavedFilterPreset[]>(SAVED_PRESETS_STORAGE_KEY);
			assert.strictEqual(stored?.length, 2);
			assert.ok(!stored?.find(p => p.name.toLowerCase() === 'preset 2'));
		});

		test('sends filterPresets message with updated list', async () => {
			await handleDeleteFilterPreset('Preset 2', mockPanel as any);

			const messages = mockPanel.getMessages();
			const filterPresetsMsg = messages.find(m => m.type === 'filterPresets');
			assert.ok(filterPresetsMsg);
			assert.strictEqual(filterPresetsMsg.presets.length, 2);
		});

		test('shows info message when preset not found', async () => {
			await handleDeleteFilterPreset('Nonexistent', mockPanel as any);

			assert.strictEqual(showInformationMessageCalls.length, 1);
			const msg = showInformationMessageCalls[0];
			assert.ok(msg.includes('not found'));

			// Original presets should remain unchanged
			const stored = mockMemento.get<SavedFilterPreset[]>(SAVED_PRESETS_STORAGE_KEY);
			assert.strictEqual(stored?.length, 3);
		});

		test('shows success message on deletion', async () => {
			await handleDeleteFilterPreset('Preset 1', mockPanel as any);

			assert.strictEqual(showInformationMessageCalls.length, 1);
			const successMsg = showInformationMessageCalls[0];
			assert.ok(successMsg.includes('deleted'));
		});
	});

	suite('handleRenameFilterPreset', () => {
		setup(async () => {
			const presets: SavedFilterPreset[] = [
				{
					name: 'Old Name 1',
					filterState: sampleFilterState,
					createdAt: '2024-05-24T10:00:00.000Z'
				},
				{
					name: 'Other Preset',
					filterState: sampleFilterState,
					createdAt: '2024-05-24T11:00:00.000Z'
				}
			];
			await mockMemento.update(SAVED_PRESETS_STORAGE_KEY, presets);
		});

		test('renames preset while preserving createdAt and filterState', async () => {
			await handleRenameFilterPreset('Old Name 1', 'New Name', mockPanel as any);

			const stored = mockMemento.get<SavedFilterPreset[]>(SAVED_PRESETS_STORAGE_KEY);
			const renamedPreset = stored?.find(p => p.name === 'New Name');
			assert.ok(renamedPreset);
			assert.strictEqual(renamedPreset.createdAt, '2024-05-24T10:00:00.000Z');
			assert.deepStrictEqual(renamedPreset.filterState, sampleFilterState);
		});

		test('does not rename when new name is same as old (case-insensitive)', async () => {
			await handleRenameFilterPreset('Old Name 1', 'old name 1', mockPanel as any);

			const stored = mockMemento.get<SavedFilterPreset[]>(SAVED_PRESETS_STORAGE_KEY);
			// Name should remain unchanged (original casing)
			assert.ok(stored?.find(p => p.name === 'Old Name 1'));
			assert.strictEqual(stored?.length, 2);
		});

		test('shows error when preset to rename not found', async () => {
			await handleRenameFilterPreset('Nonexistent', 'New Name', mockPanel as any);

			assert.strictEqual(showInformationMessageCalls.length, 1);
			const msg = showInformationMessageCalls[0];
			assert.ok(msg.includes('not found'));
		});

		test('shows error for invalid new name', async () => {
			await handleRenameFilterPreset('Old Name 1', 'Invalid/Name', mockPanel as any);

			assert.strictEqual(showWarningMessageCalls.length, 1);
			const errorMsg = showWarningMessageCalls[0];
			assert.ok(errorMsg.includes('invalid characters'));
		});

		test('prevents duplicate name with other preset', async () => {
			await handleRenameFilterPreset('Old Name 1', 'Other Preset', mockPanel as any);

			assert.strictEqual(showWarningMessageCalls.length, 1);
			const errorMsg = showWarningMessageCalls[0];
			assert.ok(errorMsg.includes('already exists'));

			// Original should remain unchanged
			const stored = mockMemento.get<SavedFilterPreset[]>(SAVED_PRESETS_STORAGE_KEY);
			assert.ok(stored?.find(p => p.name === 'Old Name 1'));
			assert.ok(stored?.find(p => p.name === 'Other Preset'));
		});

		test('sends filterPresets message with updated list', async () => {
			await handleRenameFilterPreset('Old Name 1', 'Renamed Preset', mockPanel as any);

			const messages = mockPanel.getMessages();
			const filterPresetsMsg = messages.find(m => m.type === 'filterPresets');
			assert.ok(filterPresetsMsg);
			assert.strictEqual(filterPresetsMsg.presets.length, 2);
			assert.ok(filterPresetsMsg.presets.find((p: SavedFilterPreset) => p.name === 'Renamed Preset'));
		});

		test('trims new name before saving', async () => {
			await handleRenameFilterPreset('Old Name 1', '  New Name  ', mockPanel as any);

			const stored = mockMemento.get<SavedFilterPreset[]>(SAVED_PRESETS_STORAGE_KEY);
			const renamed = stored?.find(p => p.name === 'New Name');
			assert.ok(renamed);
		});

		test('shows success message on rename', async () => {
			await handleRenameFilterPreset('Old Name 1', 'New Name', mockPanel as any);

			assert.strictEqual(showInformationMessageCalls.length, 1);
			const successMsg = showInformationMessageCalls[0];
			assert.ok(successMsg.includes('Renamed'));
		});
	});

	suite('handleGetFilterPresets', () => {
		test('returns all presets when they exist', async () => {
			const presets: SavedFilterPreset[] = [
				{
					name: 'Preset 1',
					filterState: sampleFilterState,
					createdAt: '2024-05-24T10:00:00.000Z'
				},
				{
					name: 'Preset 2',
					filterState: sampleFilterState,
					createdAt: '2024-05-24T11:00:00.000Z'
				}
			];
			await mockMemento.update(SAVED_PRESETS_STORAGE_KEY, presets);

			await handleGetFilterPresets(mockPanel as any);

			const messages = mockPanel.getMessages();
			const filterPresetsMsg = messages.find(m => m.type === 'filterPresets');
			assert.ok(filterPresetsMsg);
			assert.strictEqual(filterPresetsMsg.presets.length, 2);
		});

		test('returns empty array when no presets exist', async () => {
			await handleGetFilterPresets(mockPanel as any);

			const messages = mockPanel.getMessages();
			const filterPresetsMsg = messages.find(m => m.type === 'filterPresets');
			assert.ok(filterPresetsMsg);
			assert.strictEqual(filterPresetsMsg.presets.length, 0);
		});
	});

	suite('handleApplyPreset', () => {
		setup(async () => {
			const presets: SavedFilterPreset[] = [
				{
					name: 'My Filter',
					filterState: {
						query: 'bug fix',
						hideMergeCommits: true,
						sortMode: 1,
						showMyCommitsOnly: false,
						regexSearchEnabled: false,
						pathFilter: 'src/'
					},
					createdAt: '2024-05-24T10:00:00.000Z'
				}
			];
			await mockMemento.update(SAVED_PRESETS_STORAGE_KEY, presets);
		});

		test('sends applyFilterQuery message with preset filterState', async () => {
			await handleApplyPreset('My Filter', mockPanel as any);

			const messages = mockPanel.getMessages();
			const applyMsg = messages.find(m => m.type === 'applyFilterQuery');
			assert.ok(applyMsg);
			assert.strictEqual(applyMsg.filterState.query, 'bug fix');
			assert.strictEqual(applyMsg.filterState.pathFilter, 'src/');
		});

		test('finds preset case-insensitively', async () => {
			await handleApplyPreset('my filter', mockPanel as any);

			const messages = mockPanel.getMessages();
			const applyMsg = messages.find(m => m.type === 'applyFilterQuery');
			assert.ok(applyMsg);
		});

		test('shows info message when preset not found', async () => {
			await handleApplyPreset('Nonexistent', mockPanel as any);

			assert.strictEqual(showInformationMessageCalls.length, 1);
			const msg = showInformationMessageCalls[0];
			assert.ok(msg.includes('not found'));

			// No applyFilterQuery message should be sent
			const messages = mockPanel.getMessages();
			const applyMsg = messages.find(m => m.type === 'applyFilterQuery');
			assert.strictEqual(applyMsg, undefined);
		});

		test('shows success message with preset name', async () => {
			await handleApplyPreset('My Filter', mockPanel as any);

			assert.strictEqual(showInformationMessageCalls.length, 1);
			const successMsg = showInformationMessageCalls[0];
			assert.ok(successMsg.includes('Applied preset'));
			assert.ok(successMsg.includes('My Filter'));
		});
	});

	suite('integration scenarios', () => {
		test('full lifecycle: save, apply, rename, delete', async () => {
			// Save
			await handleSaveFilterPreset('Test', sampleFilterState, mockPanel as any);
			mockPanel.clearMessages();
			showInformationMessageCalls = [];

			// Apply
			await handleApplyPreset('Test', mockPanel as any);
			mockPanel.clearMessages();
			showInformationMessageCalls = [];

			// Rename
			await handleRenameFilterPreset('Test', 'Renamed', mockPanel as any);
			mockPanel.clearMessages();
			showInformationMessageCalls = [];

			// Delete
			await handleDeleteFilterPreset('Renamed', mockPanel as any);

			const stored = mockMemento.get<SavedFilterPreset[]>(SAVED_PRESETS_STORAGE_KEY);
			assert.strictEqual(stored?.length, 0);
		});

		test('multiple presets can coexist', async () => {
			await handleSaveFilterPreset('Preset 1', { ...sampleFilterState, query: 'query1' }, mockPanel as any);
			mockPanel.clearMessages();
			showInformationMessageCalls = [];

			await handleSaveFilterPreset('Preset 2', { ...sampleFilterState, query: 'query2' }, mockPanel as any);
			mockPanel.clearMessages();
			showInformationMessageCalls = [];

			await handleSaveFilterPreset('Preset 3', { ...sampleFilterState, query: 'query3' }, mockPanel as any);

			const stored = mockMemento.get<SavedFilterPreset[]>(SAVED_PRESETS_STORAGE_KEY);
			assert.strictEqual(stored?.length, 3);
		});
	});
});
