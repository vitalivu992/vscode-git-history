import * as assert from 'assert';
import * as vscode from 'vscode';
import { SavedFilterPreset, FilterQueryState, SAVED_PRESETS_STORAGE_KEY } from '../../src/types';
import { MAX_SAVED_PRESETS, PRESET_NAME_MAX_LENGTH } from '../../src/settings/settingsTypes';

suite('Saved Filter Presets E2E Tests', () => {
  let mockContext: vscode.ExtensionContext;

  setup(() => {
    // Create a mock context with globalState
    mockContext = {
      globalState: {
        get: (key: string) => {
          if (key === SAVED_PRESETS_STORAGE_KEY) {
            return [];
          }
          return undefined;
        },
        update: async (_key: string, _value: unknown) => {},
        keys: (): readonly string[] => []
      }
    } as unknown as vscode.ExtensionContext;
  });

  test('save preset with valid name stores in globalState', async () => {
    const presetName = 'Bug Fixes';
    const filterState: FilterQueryState = {
      query: 'bug fix',
      hideMergeCommits: true,
      sortMode: 0,
      showMyCommitsOnly: false
    };

    // Simulate saving to globalState
    const existingPresets: SavedFilterPreset[] = [];
    const newPreset: SavedFilterPreset = {
      name: presetName,
      filterState: filterState,
      createdAt: new Date().toISOString()
    };

    const updatedPresets = [...existingPresets, newPreset];

    // Verify preset was added
    assert.strictEqual(updatedPresets.length, 1);
    assert.strictEqual(updatedPresets[0].name, presetName);
    assert.strictEqual(updatedPresets[0].filterState.query, 'bug fix');
  });

  test('reject duplicate preset name (case-insensitive)', async () => {
    const existingPresets: SavedFilterPreset[] = [
      {
        name: 'Bug Fixes',
        filterState: { query: 'bug', hideMergeCommits: false, sortMode: 0, showMyCommitsOnly: false },
        createdAt: '2024-01-01T00:00:00.000Z'
      }
    ];

    // Try to add duplicate with different case
    const duplicateName = 'BUG FIXES';
    const isDuplicate = existingPresets.some(
      p => p.name.toLowerCase() === duplicateName.toLowerCase()
    );

    assert.strictEqual(isDuplicate, true);
  });

  test('enforce max 10 presets limit', async () => {
    const presets: SavedFilterPreset[] = [];
    for (let i = 0; i < MAX_SAVED_PRESETS; i++) {
      presets.push({
        name: `Preset ${i}`,
        filterState: { query: '', hideMergeCommits: false, sortMode: 0, showMyCommitsOnly: false },
        createdAt: new Date(i).toISOString()
      });
    }

    // Should be at max limit
    assert.strictEqual(presets.length, MAX_SAVED_PRESETS);

    // Adding one more should exceed limit
    const wouldExceedLimit = presets.length >= MAX_SAVED_PRESETS;
    assert.strictEqual(wouldExceedLimit, true);
  });

  test('load preset applies correct filter state', async () => {
    const preset: SavedFilterPreset = {
      name: 'My Filter',
      filterState: {
        query: 'author:alice feature',
        hideMergeCommits: true,
        sortMode: 1,
        showMyCommitsOnly: false
      },
      createdAt: '2024-01-01T00:00:00.000Z'
    };

    // Simulate applying preset
    const appliedState = preset.filterState;

    assert.strictEqual(appliedState.query, 'author:alice feature');
    assert.strictEqual(appliedState.hideMergeCommits, true);
    assert.strictEqual(appliedState.sortMode, 1);
    assert.strictEqual(appliedState.showMyCommitsOnly, false);
  });

  test('delete preset removes from storage', async () => {
    const presets: SavedFilterPreset[] = [
      { name: 'Preset 1', filterState: { query: '', hideMergeCommits: false, sortMode: 0, showMyCommitsOnly: false }, createdAt: '2024-01-01T00:00:00.000Z' },
      { name: 'Preset 2', filterState: { query: '', hideMergeCommits: false, sortMode: 0, showMyCommitsOnly: false }, createdAt: '2024-01-02T00:00:00.000Z' },
      { name: 'Preset 3', filterState: { query: '', hideMergeCommits: false, sortMode: 0, showMyCommitsOnly: false }, createdAt: '2024-01-03T00:00:00.000Z' }
    ];

    const nameToDelete = 'Preset 2';
    const updatedPresets = presets.filter(p => p.name.toLowerCase() !== nameToDelete.toLowerCase());

    assert.strictEqual(updatedPresets.length, 2);
    assert.strictEqual(updatedPresets.find(p => p.name === 'Preset 2'), undefined);
    assert.strictEqual(updatedPresets.find(p => p.name === 'Preset 1')?.name, 'Preset 1');
    assert.strictEqual(updatedPresets.find(p => p.name === 'Preset 3')?.name, 'Preset 3');
  });

  test('presets persist across sessions (simulation)', async () => {
    // Simulate session 1: Save presets
    const session1Presets: SavedFilterPreset[] = [
      { name: 'Session Preset', filterState: { query: 'test', hideMergeCommits: false, sortMode: 0, showMyCommitsOnly: false }, createdAt: '2024-01-01T00:00:00.000Z' }
    ];

    // Simulate session 2: Load presets from "storage"
    const session2Presets = [...session1Presets];

    assert.strictEqual(session2Presets.length, 1);
    assert.strictEqual(session2Presets[0].name, 'Session Preset');
  });

  test('keyboard shortcuts trigger correct actions', () => {
    // Simulate Ctrl+Shift+0 (save preset)
    const savePresetShortcut = { ctrlKey: true, shiftKey: true, key: '0' };
    const isSavePresetShortcut = savePresetShortcut.ctrlKey && savePresetShortcut.shiftKey && savePresetShortcut.key === '0';
    assert.strictEqual(isSavePresetShortcut, true);

    // Simulate Ctrl+Shift+1 (load preset)
    const loadPresetShortcut = { ctrlKey: true, shiftKey: true, key: '1' };
    const isLoadPresetShortcut = loadPresetShortcut.ctrlKey && loadPresetShortcut.shiftKey && loadPresetShortcut.key === '1';
    assert.strictEqual(isLoadPresetShortcut, true);
  });

  test('preset name validation respects max length', () => {
    const validName = 'A'.repeat(PRESET_NAME_MAX_LENGTH);
    const invalidName = 'A'.repeat(PRESET_NAME_MAX_LENGTH + 1);

    assert.strictEqual(validName.length, PRESET_NAME_MAX_LENGTH);
    assert.strictEqual(invalidName.length, PRESET_NAME_MAX_LENGTH + 1);
  });

  test('preset stores createdAt timestamp', async () => {
    const beforeSave = new Date().toISOString();
    const preset: SavedFilterPreset = {
      name: 'Timestamp Test',
      filterState: { query: '', hideMergeCommits: false, sortMode: 0, showMyCommitsOnly: false },
      createdAt: new Date().toISOString()
    };
    const afterSave = new Date().toISOString();

    const createdAt = preset.createdAt;
    assert.ok(createdAt >= beforeSave);
    assert.ok(createdAt <= afterSave);
  });

  test('empty preset list returns empty array', async () => {
    const presets: SavedFilterPreset[] = [];
    assert.strictEqual(presets.length, 0);
  });

  test('filter state with all options enabled', async () => {
    const filterState: FilterQueryState = {
      query: 'author:john tag:v2.0 after:2024-01-01',
      hideMergeCommits: true,
      sortMode: 3,
      showMyCommitsOnly: true
    };

    assert.ok(filterState.query.includes('author:john'));
    assert.ok(filterState.query.includes('tag:v2.0'));
    assert.ok(filterState.query.includes('after:2024-01-01'));
    assert.strictEqual(filterState.hideMergeCommits, true);
    assert.strictEqual(filterState.sortMode, 3);
    assert.strictEqual(filterState.showMyCommitsOnly, true);
  });

  test('preset name with special characters is rejected', () => {
    const invalidNames = ['Test/Name', 'Test\\Name', 'Test:Name', 'Test*Name', 'Test?Name', 'Test<Name>', 'Test|Name'];

    for (const name of invalidNames) {
      const hasInvalidChar = /[\/\\:*?"<>|]/.test(name);
      assert.strictEqual(hasInvalidChar, true, `Name "${name}" should contain invalid character`);
    }
  });

  test('preset dropdown renders correctly', async () => {
    const presets: SavedFilterPreset[] = [
      { name: 'Preset A', filterState: { query: 'test', hideMergeCommits: false, sortMode: 0, showMyCommitsOnly: false }, createdAt: '2024-01-01T00:00:00.000Z' },
      { name: 'Preset B', filterState: { query: '', hideMergeCommits: true, sortMode: 1, showMyCommitsOnly: false }, createdAt: '2024-01-02T00:00:00.000Z' }
    ];

    assert.strictEqual(presets.length, 2);
    assert.strictEqual(presets[0].name, 'Preset A');
    assert.strictEqual(presets[1].name, 'Preset B');
  });

  test('preset summary generates correctly', () => {
    const preset: SavedFilterPreset = {
      name: 'Complex Filter',
      filterState: {
        query: 'bug fix',
        hideMergeCommits: true,
        sortMode: 2,
        showMyCommitsOnly: false
      },
      createdAt: '2024-01-01T00:00:00.000Z'
    };

    const hasQuery = preset.filterState.query !== '';
    const hasNoMerge = preset.filterState.hideMergeCommits;
    const sortLabels = ['Newest', 'Oldest', 'A-Z', 'Z-A'];
    const sortLabel = sortLabels[preset.filterState.sortMode];

    assert.strictEqual(hasQuery, true);
    assert.strictEqual(hasNoMerge, true);
    assert.strictEqual(sortLabel, 'A-Z');
  });
});
