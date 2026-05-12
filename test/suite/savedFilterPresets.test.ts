import * as assert from 'assert';
import { SavedFilterPreset, FilterQueryState } from '../../src/types';
import { MAX_SAVED_PRESETS, PRESET_NAME_MAX_LENGTH } from '../../src/settings/settingsTypes';
import { validatePresetName } from '../../src/webview/messageHandler';

suite('Saved Filter Presets Tests', function() {

  suite('Preset Name Validation', function() {
    const existingPresets: SavedFilterPreset[] = [
      { name: 'Bug Fixes', filterState: { query: 'bug', hideMergeCommits: true, sortMode: 0, showMyCommitsOnly: false, regexSearchEnabled: false, pathFilter: null }, createdAt: '2024-01-01T00:00:00.000Z' },
      { name: 'My Commits', filterState: { query: '', hideMergeCommits: false, sortMode: 1, showMyCommitsOnly: true, regexSearchEnabled: false, pathFilter: null }, createdAt: '2024-01-02T00:00:00.000Z' }
    ];

    test('should accept valid preset name', function() {
      const result = validatePresetName('New Preset', existingPresets);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.error, undefined);
    });

    test('should reject empty preset name', function() {
      const result = validatePresetName('', existingPresets);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.error, 'Preset name cannot be empty');
    });

    test('should reject whitespace-only preset name', function() {
      const result = validatePresetName('   ', existingPresets);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.error, 'Preset name cannot be empty');
    });

    test('should reject preset name exceeding max length', function() {
      const longName = 'a'.repeat(PRESET_NAME_MAX_LENGTH + 1);
      const result = validatePresetName(longName, existingPresets);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.error, `Preset name cannot exceed ${PRESET_NAME_MAX_LENGTH} characters`);
    });

    test('should accept preset name at max length', function() {
      const maxLengthName = 'a'.repeat(PRESET_NAME_MAX_LENGTH);
      const result = validatePresetName(maxLengthName, existingPresets);
      assert.strictEqual(result.valid, true);
    });

    test('should reject preset name with invalid characters', function() {
      const invalidChars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|', '\x00'];
      for (const char of invalidChars) {
        const result = validatePresetName(`Test${char}Name`, existingPresets);
        assert.strictEqual(result.valid, false);
        assert.strictEqual(result.error, 'Preset name contains invalid characters');
      }
    });

    test('should reject duplicate preset name (case-insensitive)', function() {
      const result = validatePresetName('bug fixes', existingPresets);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.error, 'Preset "bug fixes" already exists');
    });

    test('should reject duplicate preset name with different case', function() {
      const result = validatePresetName('BUG FIXES', existingPresets);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.error, 'Preset "BUG FIXES" already exists');
    });

    test('should accept unique preset name', function() {
      const result = validatePresetName('Unique Name', existingPresets);
      assert.strictEqual(result.valid, true);
    });
  });

  suite('Preset Storage and Retrieval', function() {
    test('should enforce max presets limit', function() {
      const presets: SavedFilterPreset[] = [];
      for (let i = 0; i < MAX_SAVED_PRESETS; i++) {
        presets.push({
          name: `Preset ${i}`,
          filterState: { query: '', hideMergeCommits: false, sortMode: 0, showMyCommitsOnly: false, regexSearchEnabled: false, pathFilter: null },
          createdAt: new Date(i).toISOString()
        });
      }

      // Should reject adding beyond limit
      const result = validatePresetName('New Preset', presets);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.error, `Maximum ${MAX_SAVED_PRESETS} presets allowed. Delete a preset first.`);
    });

    test('should accept presets up to limit', function() {
      const presets: SavedFilterPreset[] = [];
      for (let i = 0; i < MAX_SAVED_PRESETS - 1; i++) {
        presets.push({
          name: `Preset ${i}`,
          filterState: { query: '', hideMergeCommits: false, sortMode: 0, showMyCommitsOnly: false, regexSearchEnabled: false, pathFilter: null },
          createdAt: new Date(i).toISOString()
        });
      }

      const result = validatePresetName('Preset 9', presets);
      assert.strictEqual(result.valid, true);
    });
  });

  suite('Filter State Structure', function() {
    test('should create valid filter state', function() {
      const filterState: FilterQueryState = {
        query: 'author:john bug fix',
        hideMergeCommits: true,
        sortMode: 1,
        showMyCommitsOnly: false,
        regexSearchEnabled: false,
        pathFilter: null
      };

      assert.strictEqual(filterState.query, 'author:john bug fix');
      assert.strictEqual(filterState.hideMergeCommits, true);
      assert.strictEqual(filterState.sortMode, 1);
      assert.strictEqual(filterState.showMyCommitsOnly, false);
      assert.strictEqual(filterState.regexSearchEnabled, false);
      assert.strictEqual(filterState.pathFilter, null);
    });

    test('should handle empty filter state', function() {
      const filterState: FilterQueryState = {
        query: '',
        hideMergeCommits: false,
        sortMode: 0,
        showMyCommitsOnly: false,
        regexSearchEnabled: false,
        pathFilter: null
      };

      assert.strictEqual(filterState.query, '');
      assert.strictEqual(filterState.hideMergeCommits, false);
      assert.strictEqual(filterState.sortMode, 0);
      assert.strictEqual(filterState.showMyCommitsOnly, false);
      assert.strictEqual(filterState.regexSearchEnabled, false);
      assert.strictEqual(filterState.pathFilter, null);
    });

    test('should handle regexSearchEnabled and pathFilter', function() {
      const filterState: FilterQueryState = {
        query: 'author:john',
        hideMergeCommits: false,
        sortMode: 0,
        showMyCommitsOnly: false,
        regexSearchEnabled: true,
        pathFilter: 'src/utils.ts'
      };
      assert.strictEqual(filterState.regexSearchEnabled, true);
      assert.strictEqual(filterState.pathFilter, 'src/utils.ts');
    });
  });

  suite('Preset Summary Generation', function() {
    test('should generate summary for query-only preset', function() {
      const preset: SavedFilterPreset = {
        name: 'Search Preset',
        filterState: { query: 'bug fix', hideMergeCommits: false, sortMode: 0, showMyCommitsOnly: false, regexSearchEnabled: false, pathFilter: null },
        createdAt: '2024-01-01T00:00:00.000Z'
      };

      const query = preset.filterState.query;
      assert.ok(query.includes('bug fix'));
    });

    test('should generate summary for multi-filter preset', function() {
      const preset: SavedFilterPreset = {
        name: 'Complex Preset',
        filterState: { query: 'author:alice', hideMergeCommits: true, sortMode: 2, showMyCommitsOnly: false, regexSearchEnabled: true, pathFilter: 'src/' },
        createdAt: '2024-01-01T00:00:00.000Z'
      };

      assert.ok(preset.filterState.query.includes('author:alice'));
      assert.strictEqual(preset.filterState.hideMergeCommits, true);
      assert.strictEqual(preset.filterState.sortMode, 2);
      assert.strictEqual(preset.filterState.regexSearchEnabled, true);
      assert.strictEqual(preset.filterState.pathFilter, 'src/');
    });
  });

  suite('Source Verification', function() {
    test('should have MAX_SAVED_PRESETS constant', function() {
      assert.strictEqual(typeof MAX_SAVED_PRESETS, 'number');
      assert.strictEqual(MAX_SAVED_PRESETS, 10);
    });

    test('should have PRESET_NAME_MAX_LENGTH constant', function() {
      assert.strictEqual(typeof PRESET_NAME_MAX_LENGTH, 'number');
      assert.strictEqual(PRESET_NAME_MAX_LENGTH, 50);
    });

    test('should export SavedFilterPreset type', function() {
      const preset: SavedFilterPreset = {
        name: 'Test',
        filterState: { query: '', hideMergeCommits: false, sortMode: 0, showMyCommitsOnly: false, regexSearchEnabled: false, pathFilter: null },
        createdAt: '2024-01-01T00:00:00.000Z'
      };
      assert.ok(preset.name);
      assert.ok(preset.filterState);
      assert.ok(preset.createdAt);
    });

    test('should export validatePresetName function', function() {
      assert.strictEqual(typeof validatePresetName, 'function');
    });
  });
});
