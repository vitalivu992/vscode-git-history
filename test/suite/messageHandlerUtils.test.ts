import * as assert from 'assert';
import { CommitInfo, SavedFilterPreset } from '../../src/types';
import {
	formatCommitsAsJson,
	escapeCsvField,
	formatCommitsAsCsv,
	formatCommitsAsMarkdown,
	formatCommitAsMarkdown,
	extractCoAuthors,
	validatePresetName
} from '../../src/webview/messageHandler';
import { PRESET_NAME_MAX_LENGTH, MAX_SAVED_PRESETS } from '../../src/settings/settingsTypes';

// Sample commit data for testing
const sampleCommits: CommitInfo[] = [
	{
		hash: 'abc123def456abc123def456abc123def456abc1',
		shortHash: 'abc123d',
		parentHashes: ['0000000000000000000000000000000000000000'],
		author: 'Alice Cooper',
		email: 'alice@example.com',
		date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
		message: 'Initial commit',
		fullMessage: 'Initial commit\n\nThis is the first commit',
		tags: ['v1.0.0'],
		stats: {
			filesChanged: 3,
			insertions: 150,
			deletions: 0
		}
	},
	{
		hash: 'def456abc123def456abc123def456abc123def4',
		shortHash: 'def456a',
		parentHashes: ['abc123def456abc123def456abc123def456abc1'],
		author: 'Bob Marley',
		email: 'bob@company.org',
		date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
		message: 'Add feature X',
		fullMessage: 'Add feature X',
		tags: ['v1.1.0', 'release'],
		stats: {
			filesChanged: 5,
			insertions: 200,
			deletions: 50
		}
	},
	{
		hash: '123abc456def789abc123def456abc789def123a',
		shortHash: '123abc4',
		parentHashes: ['def456abc123def456abc123def456abc123def4'],
		author: 'Charlie Day',
		email: 'charlie@example.com',
		date: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
		message: 'Fix bug in parser',
		fullMessage: 'Fix bug in parser\n\nCloses #123',
		tags: undefined,
		stats: undefined
	}
];

suite('messageHandlerUtils - escapeCsvField', () => {
	test('handles simple text without special characters', () => {
		const field = 'Simple text';
		assert.strictEqual(escapeCsvField(field), field);
	});

	test('escapes fields containing commas', () => {
		const field = 'Smith, John';
		assert.strictEqual(escapeCsvField(field), '"Smith, John"');
	});

	test('escapes fields containing quotes', () => {
		const field = 'He said "hello"';
		assert.strictEqual(escapeCsvField(field), '"He said ""hello"""');
	});

	test('escapes fields containing newlines', () => {
		const field = 'Line 1\nLine 2';
		assert.strictEqual(escapeCsvField(field), '"Line 1\nLine 2"');
	});

	test('escapes fields containing carriage returns', () => {
		const field = 'Line 1\rLine 2';
		assert.strictEqual(escapeCsvField(field), '"Line 1\rLine 2"');
	});

	test('handles combination of special characters', () => {
		const field = 'Co., "Inc"\nLine 2';
		assert.strictEqual(escapeCsvField(field), '"Co., ""Inc""\nLine 2"');
	});

	test('handles empty string', () => {
		const field = '';
		assert.strictEqual(escapeCsvField(field), '');
	});

	test('handles string with only quotes', () => {
		const field = '"""';
		assert.strictEqual(escapeCsvField(field), '""""""""');
	});
});

suite('messageHandlerUtils - formatCommitsAsJson', () => {
	test('returns valid JSON string', () => {
		const result = formatCommitsAsJson(sampleCommits);
		const parsed = JSON.parse(result);
		assert.ok(Array.isArray(parsed));
		assert.strictEqual(parsed.length, 3);
	});

	test('preserves all commit fields', () => {
		const result = formatCommitsAsJson(sampleCommits);
		const parsed = JSON.parse(result) as CommitInfo[];

		assert.strictEqual(parsed[0].hash, sampleCommits[0].hash);
		assert.strictEqual(parsed[0].author, sampleCommits[0].author);
		assert.strictEqual(parsed[0].email, sampleCommits[0].email);
		assert.strictEqual(parsed[0].message, sampleCommits[0].message);
		assert.deepStrictEqual(parsed[0].stats, sampleCommits[0].stats);
	});

	test('handles empty commits array', () => {
		const result = formatCommitsAsJson([]);
		assert.strictEqual(result, '[]');
	});

	test('includes tags when present', () => {
		const result = formatCommitsAsJson(sampleCommits);
		const parsed = JSON.parse(result) as CommitInfo[];

		assert.deepStrictEqual(parsed[0].tags, ['v1.0.0']);
		assert.deepStrictEqual(parsed[1].tags, ['v1.1.0', 'release']);
		assert.strictEqual(parsed[2].tags, undefined);
	});

	test('formats with 2-space indentation', () => {
		const result = formatCommitsAsJson([sampleCommits[0]]);
		const lines = result.split('\n');
		assert.strictEqual(lines[0], '[');
		assert.ok(lines[1].startsWith('  '));
	});

	test('handles single commit', () => {
		const result = formatCommitsAsJson([sampleCommits[0]]);
		const parsed = JSON.parse(result);
		assert.strictEqual(parsed.length, 1);
		assert.strictEqual(parsed[0].hash, sampleCommits[0].hash);
	});

	test('handles commits with various data types', () => {
		const commits: CommitInfo[] = [
			{
				...sampleCommits[0],
				tags: [],
				stats: { filesChanged: 0, insertions: 0, deletions: 0 }
			}
		];
		const result = formatCommitsAsJson(commits);
		const parsed = JSON.parse(result);
		assert.deepStrictEqual(parsed[0].tags, []);
		assert.deepStrictEqual(parsed[0].stats, { filesChanged: 0, insertions: 0, deletions: 0 });
	});
});

suite('messageHandlerUtils - formatCommitsAsCsv', () => {
	test('includes correct headers', () => {
		const result = formatCommitsAsCsv([]);
		const lines = result.split('\n');
		assert.strictEqual(lines[0], 'Hash,Short Hash,Author,Email,Date,Message,Tags,Files Changed,Insertions,Deletions');
	});

	test('formats single commit correctly', () => {
		const result = formatCommitsAsCsv([sampleCommits[0]]);
		const lines = result.split('\n');
		const dataLine = lines[1];

		assert.ok(dataLine.includes(sampleCommits[0].hash));
		assert.ok(dataLine.includes(sampleCommits[0].shortHash));
		assert.ok(dataLine.includes(sampleCommits[0].author));
		assert.ok(dataLine.includes(sampleCommits[0].email));
		assert.ok(dataLine.includes('3')); // filesChanged
		assert.ok(dataLine.includes('150')); // insertions
		assert.ok(dataLine.includes('0')); // deletions
	});

	test('handles multiple commits', () => {
		const result = formatCommitsAsCsv(sampleCommits);
		const lines = result.split('\n');
		assert.strictEqual(lines.length, 4); // Header + 3 commits
	});

	test('joins multiple tags with semicolon', () => {
		const result = formatCommitsAsCsv([sampleCommits[1]]);
		const lines = result.split('\n');
		assert.ok(lines[1].includes('v1.1.0;release'));
	});

	test('handles missing stats as zeros', () => {
		const result = formatCommitsAsCsv([sampleCommits[2]]);
		const lines = result.split('\n');
		const fields = lines[1].split(',');
		assert.strictEqual(fields[fields.length - 1], '0');
		assert.strictEqual(fields[fields.length - 2], '0');
		assert.strictEqual(fields[fields.length - 3], '0');
	});

	test('escapes author names with commas', () => {
		const commit: CommitInfo = {
			...sampleCommits[0],
			author: 'Smith, John'
		};
		const result = formatCommitsAsCsv([commit]);
		assert.ok(result.includes('"Smith, John"'));
	});

	test('escapes messages with quotes', () => {
		const commit: CommitInfo = {
			...sampleCommits[0],
			message: 'Fix "critical" bug'
		};
		const result = formatCommitsAsCsv([commit]);
		assert.ok(result.includes('"Fix ""critical"" bug"'));
	});

	test('handles empty commits array', () => {
		const result = formatCommitsAsCsv([]);
		assert.strictEqual(result, 'Hash,Short Hash,Author,Email,Date,Message,Tags,Files Changed,Insertions,Deletions');
	});

	test('handles messages with newlines', () => {
		const commit: CommitInfo = {
			...sampleCommits[0],
			message: 'First line\nSecond line'
		};
		const result = formatCommitsAsCsv([commit]);
		assert.ok(result.includes('"First line\nSecond line"'));
	});

	test('handles commits without tags', () => {
		const result = formatCommitsAsCsv([sampleCommits[2]]);
		const lines = result.split('\n');
		const fields = lines[1].split(',');
		// Tags field (6th index, 0-based) should be empty
		assert.strictEqual(fields[6], '');
	});
});

suite('messageHandlerUtils - formatCommitsAsMarkdown', () => {
	test('contains ### heading with short hash', () => {
		const result = formatCommitsAsMarkdown([sampleCommits[0]]);
		assert.ok(result.includes('### abc123d'));
	});

	test('includes stats in heading', () => {
		const result = formatCommitsAsMarkdown([sampleCommits[0]]);
		assert.ok(result.includes('(3 files, +150, -0)'));
	});

	test('includes tags as inline code', () => {
		const result = formatCommitsAsMarkdown([sampleCommits[0]]);
		assert.ok(result.includes('`v1.0.0`'));
	});

	test('includes author with email', () => {
		const result = formatCommitsAsMarkdown([sampleCommits[0]]);
		assert.ok(result.includes('**Author:** Alice Cooper <alice@example.com>'));
	});

	test('includes date', () => {
		const result = formatCommitsAsMarkdown([sampleCommits[0]]);
		assert.ok(result.includes('**Date:**'));
	});

	test('includes message', () => {
		const result = formatCommitsAsMarkdown([sampleCommits[0]]);
		assert.ok(result.includes('Initial commit'));
	});

	test('shows body when fullMessage differs', () => {
		const result = formatCommitsAsMarkdown([sampleCommits[0]]);
		assert.ok(result.includes('---'));
		assert.ok(result.includes('This is the first commit'));
	});

	test('handles commit without body', () => {
		const result = formatCommitsAsMarkdown([sampleCommits[1]]);
		assert.ok(!result.includes('---'));
	});

	test('handles multiple tags', () => {
		const result = formatCommitsAsMarkdown([sampleCommits[1]]);
		assert.ok(result.includes('`v1.1.0`'));
		assert.ok(result.includes('`release`'));
	});

	test('handles single file stats', () => {
		const singleFileCommit = { ...sampleCommits[1], stats: { filesChanged: 1, insertions: 10, deletions: 2 } };
		const result = formatCommitsAsMarkdown([singleFileCommit]);
		assert.ok(result.includes('(1 file, +10, -2)'));
	});

	test('handles commit without stats', () => {
		const result = formatCommitsAsMarkdown([sampleCommits[2]]);
		assert.ok(!result.includes('(')); // No stats parentheses
		assert.ok(result.includes('### 123abc4'));
	});

	test('handles commit without tags', () => {
		const result = formatCommitsAsMarkdown([sampleCommits[2]]);
		assert.ok(!result.includes('`'));
	});

	test('formats multiple commits', () => {
		const result = formatCommitsAsMarkdown(sampleCommits);
		const sections = result.split('### ');
		assert.strictEqual(sections.length, 4); // Empty intro + 3 commits
	});

	test('handles empty commits array', () => {
		const result = formatCommitsAsMarkdown([]);
		assert.strictEqual(result, '');
	});

	test('handles commits with full body', () => {
		const result = formatCommitsAsMarkdown([sampleCommits[0]]);
		assert.ok(result.includes('This is the first commit'));
	});
});

suite('messageHandlerUtils - formatCommitAsMarkdown', () => {
	test('formats commit with minimal data', () => {
		const commit: CommitInfo = {
			...sampleCommits[2],
			fullMessage: 'Fix bug in parser' // Same as message, no body
		};
		const result = formatCommitAsMarkdown(commit);
		assert.ok(result.includes('## Fix bug in parser (123abc4)'));
		assert.ok(result.includes('**Author:** Charlie Day <charlie@example.com>'));
		assert.ok(result.includes('**Date:**'));
	});

	test('formats commit with all fields', () => {
		const result = formatCommitAsMarkdown(sampleCommits[0]);
		assert.ok(result.includes('## Initial commit (abc123d)'));
		assert.ok(result.includes('**Author:** Alice Cooper <alice@example.com>'));
		assert.ok(result.includes('**Date:**'));
		assert.ok(result.includes('**Files:** 3 files changed, +150, -0'));
		assert.ok(result.includes('**Tags:** v1.0.0'));
		assert.ok(result.includes('This is the first commit'));
	});

	test('handles commit with stats', () => {
		const result = formatCommitAsMarkdown(sampleCommits[0]);
		assert.ok(result.includes('**Files:**'));
		assert.ok(result.includes('3 files changed'));
		assert.ok(result.includes('+150'));
		assert.ok(result.includes('-0'));
	});

	test('handles commit without stats', () => {
		const result = formatCommitAsMarkdown(sampleCommits[2]);
		assert.ok(!result.includes('**Files:**'));
	});

	test('handles commit with tags', () => {
		const result = formatCommitAsMarkdown(sampleCommits[0]);
		assert.ok(result.includes('**Tags:** v1.0.0'));
	});

	test('handles commit without tags', () => {
		const result = formatCommitAsMarkdown(sampleCommits[2]);
		assert.ok(!result.includes('**Tags:**'));
	});

	test('handles commit with body', () => {
		const result = formatCommitAsMarkdown(sampleCommits[0]);
		assert.ok(result.includes('This is the first commit'));
	});

	test('handles commit without body', () => {
		const commit: CommitInfo = {
			...sampleCommits[1],
			fullMessage: 'Add feature X'
		};
		const result = formatCommitAsMarkdown(commit);
		// Should not have extra content after the date section
		const dateEnd = result.indexOf('**Date:**');
		const afterDate = result.substring(dateEnd + 10);
		// Count newlines after date
		const linesAfterDate = afterDate.split('\n').slice(0, 5);
		// If there's no stats or tags, the body section should be minimal
		assert.ok(linesAfterDate.length >= 2);
	});

	test('includes relative and absolute date', () => {
		const result = formatCommitAsMarkdown(sampleCommits[0]);
		assert.ok(result.includes('**Date:**'));
		// Should have relative date
		assert.ok(result.includes('Yesterday') || result.includes('days ago') || result.includes('Today'));
		// Should have ISO date
		assert.ok(result.includes('Z')); // ISO dates end with Z
	});

	test('handles today date', () => {
		const todayCommit: CommitInfo = {
			...sampleCommits[0],
			date: new Date().toISOString()
		};
		const result = formatCommitAsMarkdown(todayCommit);
		assert.ok(result.includes('Today'));
	});

	test('handles yesterday date', () => {
		const yesterdayCommit: CommitInfo = {
			...sampleCommits[0],
			date: new Date(Date.now() - 86400000).toISOString()
		};
		const result = formatCommitAsMarkdown(yesterdayCommit);
		assert.ok(result.includes('Yesterday'));
	});

	test('uses singular for single file stats', () => {
		const commit: CommitInfo = {
			...sampleCommits[0],
			stats: { filesChanged: 1, insertions: 1, deletions: 1 }
		};
		const result = formatCommitAsMarkdown(commit);
		assert.ok(result.includes('1 file changed'));
		assert.ok(result.includes('+1'));
		assert.ok(result.includes('-1'));
	});
});

suite('messageHandlerUtils - extractCoAuthors', () => {
	test('extracts single co-author with standard format', () => {
		const message = `Initial commit

Co-authored-by: Alice <alice@example.com>`;
		const result = extractCoAuthors(message);

		assert.strictEqual(result.length, 1);
		assert.strictEqual(result[0], 'Alice <alice@example.com>');
	});

	test('extracts multiple co-authors on separate lines', () => {
		const message = `Initial commit

Co-authored-by: Alice <alice@example.com>
Co-authored-by: Bob <bob@example.com>
Co-authored-by: Carol <carol@example.com>`;
		const result = extractCoAuthors(message);

		assert.strictEqual(result.length, 3);
		assert.strictEqual(result[0], 'Alice <alice@example.com>');
		assert.strictEqual(result[1], 'Bob <bob@example.com>');
		assert.strictEqual(result[2], 'Carol <carol@example.com>');
	});

	test('returns empty array when no co-authors in message', () => {
		const message = `Initial commit

This is a simple commit message without any co-authors.`;
		const result = extractCoAuthors(message);

		assert.strictEqual(result.length, 0);
		assert.deepStrictEqual(result, []);
	});

	test('handles co-author with complex name', () => {
		const message = `Feature commit

Co-authored-by: Jean-Pierre O'Brien.Jr. <jp@example.com>`;
		const result = extractCoAuthors(message);

		assert.strictEqual(result.length, 1);
		assert.strictEqual(result[0], 'Jean-Pierre O\'Brien.Jr. <jp@example.com>');
	});

	test('handles co-author with email in angle brackets', () => {
		const message = `Commit with email

Co-authored-by: Developer <dev@company.co.uk>`;
		const result = extractCoAuthors(message);

		assert.strictEqual(result.length, 1);
		assert.strictEqual(result[0], 'Developer <dev@company.co.uk>');
	});

	test('matches case-insensitively', () => {
		const message = `First commit

co-authored-by: lowercase test <test@example.com>
CO-AUTHORED-BY: uppercase test <test2@example.com>`;
		const result = extractCoAuthors(message);

		assert.strictEqual(result.length, 2);
		assert.strictEqual(result[0], 'lowercase test <test@example.com>');
		assert.strictEqual(result[1], 'uppercase test <test2@example.com>');
	});

	test('handles leading whitespace', () => {
		const message = `Commit message

  Co-authored-by: Indented Dev <dev@example.com>`;
		const result = extractCoAuthors(message);

		assert.strictEqual(result.length, 1);
		assert.strictEqual(result[0], 'Indented Dev <dev@example.com>');
	});

	test('does not match co-author without email', () => {
		const message = `Commit message

Co-authored-by: No Email Dev
Co-authored-by: Missing Closing <dev@example.com
Co-authored-by: Valid Dev <valid@example.com>`;
		const result = extractCoAuthors(message);

		assert.strictEqual(result.length, 1);
		assert.strictEqual(result[0], 'Valid Dev <valid@example.com>');
	});

	test('handles empty co-author name', () => {
		const message = `Commit message

Co-authored-by:  <empty@example.com>`;
		const result = extractCoAuthors(message);

		assert.strictEqual(result.length, 1);
		assert.strictEqual(result[0], ' <empty@example.com>');
	});

	test('handles message with only co-authors', () => {
		const message = `Co-authored-by: Solo Dev <solo@example.com>`;
		const result = extractCoAuthors(message);

		assert.strictEqual(result.length, 1);
		assert.strictEqual(result[0], 'Solo Dev <solo@example.com>');
	});

	test('handles multiple lines before co-author', () => {
		const message = `First line
Second line
Third line

Co-authored-by: Dev <dev@example.com>

Footer text`;
		const result = extractCoAuthors(message);

		assert.strictEqual(result.length, 1);
		assert.strictEqual(result[0], 'Dev <dev@example.com>');
	});

	test('handles co-author with plus in email', () => {
		const message = `Commit

Co-authored-by: Developer <dev+github@example.com>`;
		const result = extractCoAuthors(message);

		assert.strictEqual(result.length, 1);
		assert.strictEqual(result[0], 'Developer <dev+github@example.com>');
	});

	test('handles co-author with dots in name', () => {
		const message = `Commit

Co-authored-by: Jr. Sr. Dev <dev@example.com>`;
		const result = extractCoAuthors(message);

		assert.strictEqual(result.length, 1);
		assert.strictEqual(result[0], 'Jr. Sr. Dev <dev@example.com>');
	});

	test('trims whitespace from co-author name', () => {
		const message = `Commit

Co-authored-by:  Spacy Name  <dev@example.com>`;
		const result = extractCoAuthors(message);

		assert.strictEqual(result.length, 1);
		assert.strictEqual(result[0], 'Spacy Name <dev@example.com>');
	});

	test('returns empty array for empty message', () => {
		const result = extractCoAuthors('');
		assert.deepStrictEqual(result, []);
	});

	test('handles multiple co-authored-by lines with same format', () => {
		const message = `Commit

Co-authored-by: Alice <alice@example.com>
Co-authored-by: Bob <bob@example.com>`;
		const result = extractCoAuthors(message);
		assert.strictEqual(result.length, 2);
	});
});

suite('messageHandlerUtils - validatePresetName', () => {
	const existingPresets: SavedFilterPreset[] = [
		{
			name: 'Bug Fixes',
			filterState: {
				query: 'bug',
				hideMergeCommits: true,
				sortMode: 0,
				showMyCommitsOnly: false,
				regexSearchEnabled: false,
				pathFilter: null
			},
			createdAt: '2024-01-01T00:00:00.000Z'
		},
		{
			name: 'My Commits',
			filterState: {
				query: '',
				hideMergeCommits: false,
				sortMode: 1,
				showMyCommitsOnly: true,
				regexSearchEnabled: false,
				pathFilter: null
			},
			createdAt: '2024-01-02T00:00:00.000Z'
		}
	];

	test('accepts valid preset name', () => {
		const result = validatePresetName('New Preset', existingPresets);
		assert.strictEqual(result.valid, true);
		assert.strictEqual(result.error, undefined);
	});

	test('rejects empty preset name', () => {
		const result = validatePresetName('', existingPresets);
		assert.strictEqual(result.valid, false);
		assert.strictEqual(result.error, 'Preset name cannot be empty');
	});

	test('rejects whitespace-only preset name', () => {
		const result = validatePresetName('   ', existingPresets);
		assert.strictEqual(result.valid, false);
		assert.strictEqual(result.error, 'Preset name cannot be empty');
	});

	test('rejects preset name exceeding max length', () => {
		const longName = 'a'.repeat(PRESET_NAME_MAX_LENGTH + 1);
		const result = validatePresetName(longName, existingPresets);
		assert.strictEqual(result.valid, false);
		assert.strictEqual(result.error, `Preset name cannot exceed ${PRESET_NAME_MAX_LENGTH} characters`);
	});

	test('accepts preset name at max length', () => {
		const maxLengthName = 'a'.repeat(PRESET_NAME_MAX_LENGTH);
		const result = validatePresetName(maxLengthName, existingPresets);
		assert.strictEqual(result.valid, true);
		assert.strictEqual(result.error, undefined);
	});

	test('rejects preset name with invalid characters', () => {
		const invalidChars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|'];
		for (const char of invalidChars) {
			const result = validatePresetName(`Test${char}Name`, existingPresets);
			assert.strictEqual(result.valid, false);
			assert.strictEqual(result.error, 'Preset name contains invalid characters');
		}
	});

	test('rejects preset name with control characters', () => {
		const result = validatePresetName('Test\x00Name', existingPresets);
		assert.strictEqual(result.valid, false);
		assert.strictEqual(result.error, 'Preset name contains invalid characters');
	});

	test('rejects duplicate preset name (case-insensitive)', () => {
		const result = validatePresetName('bug fixes', existingPresets);
		assert.strictEqual(result.valid, false);
		assert.strictEqual(result.error, 'Preset "bug fixes" already exists');
	});

	test('rejects duplicate preset name with different case', () => {
		const result = validatePresetName('BUG FIXES', existingPresets);
		assert.strictEqual(result.valid, false);
		assert.strictEqual(result.error, 'Preset "BUG FIXES" already exists');
	});

	test('accepts unique preset name', () => {
		const result = validatePresetName('Unique Name', existingPresets);
		assert.strictEqual(result.valid, true);
		assert.strictEqual(result.error, undefined);
	});

	test('accepts preset name with special allowed characters', () => {
		const result = validatePresetName('Test-Preset_123', []);
		assert.strictEqual(result.valid, true);
	});

	test('handles empty existing presets array', () => {
		const result = validatePresetName('New Preset', []);
		assert.strictEqual(result.valid, true);
	});

	test('enforces max presets limit', () => {
		const presets: SavedFilterPreset[] = [];
		for (let i = 0; i < MAX_SAVED_PRESETS; i++) {
			presets.push({
				name: `Preset ${i}`,
				filterState: {
					query: '',
					hideMergeCommits: false,
					sortMode: 0,
					showMyCommitsOnly: false,
					regexSearchEnabled: false,
					pathFilter: null
				},
				createdAt: new Date(i).toISOString()
			});
		}

		const result = validatePresetName('New Preset', presets);
		assert.strictEqual(result.valid, false);
		assert.strictEqual(result.error, `Maximum ${MAX_SAVED_PRESETS} presets allowed. Delete a preset first.`);
	});

	test('accepts presets up to limit', () => {
		const presets: SavedFilterPreset[] = [];
		for (let i = 0; i < MAX_SAVED_PRESETS - 1; i++) {
			presets.push({
				name: `Preset ${i}`,
				filterState: {
					query: '',
					hideMergeCommits: false,
					sortMode: 0,
					showMyCommitsOnly: false,
					regexSearchEnabled: false,
					pathFilter: null
				},
				createdAt: new Date(i).toISOString()
			});
		}

		const result = validatePresetName('Preset 9', presets);
		assert.strictEqual(result.valid, true);
	});
});
