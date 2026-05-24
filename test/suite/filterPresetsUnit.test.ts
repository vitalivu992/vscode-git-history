import * as assert from 'assert';
import { validatePresetName } from '../../src/webview/messageHandler';
import { SavedFilterPreset } from '../../src/types';

suite('Filter Presets Unit Tests', () => {
	suite('validatePresetName', () => {
		let existingPresets: SavedFilterPreset[];

		setup(() => {
			existingPresets = [
				{
					name: 'Test Preset',
					filterState: {
						query: 'author:test',
						hideMergeCommits: true,
						sortMode: 0,
						showMyCommitsOnly: false,
						regexSearchEnabled: false,
						pathFilter: null
					},
					createdAt: '2024-05-24T10:00:00.000Z'
				},
				{
					name: 'My Filter',
					filterState: {
						query: 'bug fix',
						hideMergeCommits: false,
						sortMode: 1,
						showMyCommitsOnly: true,
						regexSearchEnabled: true,
						pathFilter: 'src/'
					},
					createdAt: '2024-05-24T11:00:00.000Z'
				}
			];
		});

		test('empty name returns error', () => {
			const result = validatePresetName('', existingPresets);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Preset name cannot be empty');
		});

		test('whitespace-only name returns error', () => {
			const result = validatePresetName('   ', existingPresets);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Preset name cannot be empty');
		});

		test('name exceeding 50 characters returns error', () => {
			const longName = 'a'.repeat(51);
			const result = validatePresetName(longName, existingPresets);
			assert.strictEqual(result.valid, false);
			assert.ok(result.error?.includes('cannot exceed 50 characters'));
		});

		test('name exactly at 50 characters is valid', () => {
			const name = 'a'.repeat(50);
			const result = validatePresetName(name, existingPresets);
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.error, undefined);
		});

		test('name with leading/trailing spaces is trimmed before validation', () => {
			const name = '  Valid Name  ';
			const result = validatePresetName(name, existingPresets);
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.error, undefined);
		});

		test('invalid characters return error', () => {
			// Test all invalid character groups
			const invalidChars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|'];

			for (const char of invalidChars) {
				const name = `Test${char}Name`;
				const result = validatePresetName(name, existingPresets);
				assert.strictEqual(result.valid, false);
				assert.ok(result.error?.includes('invalid characters'), `Failed for character: ${char}`);
			}
		});

		test('control characters return error', () => {
			const nameWithControlChar = 'Test\x00Name';
			const result = validatePresetName(nameWithControlChar, existingPresets);
			assert.strictEqual(result.valid, false);
			assert.ok(result.error?.includes('invalid characters'));
		});

		test('duplicate name (case-insensitive) returns error', () => {
			const result = validatePresetName('test preset', existingPresets);
			assert.strictEqual(result.valid, false);
			assert.ok(result.error?.includes('already exists'));
		});

		test('duplicate name with different case returns error', () => {
			const result = validatePresetName('TEST PRESET', existingPresets);
			assert.strictEqual(result.valid, false);
			assert.ok(result.error?.includes('already exists'));
		});

		test('valid unique name returns success', () => {
			const result = validatePresetName('New Preset', existingPresets);
			assert.strictEqual(result.valid, true);
			assert.strictEqual(result.error, undefined);
		});

		test('special characters like hyphen and underscore are allowed', () => {
			const names = ['my-preset', 'my_preset', 'my.preset', 'my preset'];

			for (const name of names) {
				const result = validatePresetName(name, existingPresets);
				assert.strictEqual(result.valid, true, `Name "${name}" should be valid`);
			}
		});

		test('unicode characters are allowed', () => {
			const names = ['测试预设', 'Test中文', '🎯My Filter'];

			for (const name of names) {
				const result = validatePresetName(name, existingPresets);
				assert.strictEqual(result.valid, true, `Name "${name}" should be valid`);
			}
		});

		test('validation works with empty existing presets list', () => {
			const result = validatePresetName('New Preset', []);
			assert.strictEqual(result.valid, true);
		});

		test('single character name is valid', () => {
			const result = validatePresetName('a', existingPresets);
			assert.strictEqual(result.valid, true);
		});
	});
});
