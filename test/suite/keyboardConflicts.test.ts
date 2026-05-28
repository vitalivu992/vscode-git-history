import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('Keyboard Shortcuts Conflicts Tests', () => {
	const packageJsonPath = path.join(__dirname, '..', '..', '..', 'package.json');

	let packageJson: any;

	setup(() => {
		const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
		packageJson = JSON.parse(packageJsonContent);
	});

	test('No duplicate keybindings exist in package.json', () => {
		const keybindings = packageJson.contributes?.keybindings || [];
		const keyMap = new Map<string, string[]>();

		// Group keybindings by key (excluding "when" condition)
		for (const binding of keybindings) {
			const key = binding.key;
			const when = binding.when || '';
			const command = binding.command;

			// Only check bindings that are active in the gitHistory webview
			// (ignore global shortcuts that might overlap with context-specific ones)
			if (!when.includes('activeWebviewPanelId == gitHistory.webview')) {
				continue;
			}

			const keyWithCondition = `${key}|${when}`;
			if (!keyMap.has(keyWithCondition)) {
				keyMap.set(keyWithCondition, []);
			}
			keyMap.get(keyWithCondition)!.push(command);
		}

		// Check for conflicts (same key and when condition, different command)
		const conflicts: string[] = [];
		for (const [keyWithCondition, commands] of keyMap) {
			if (commands.length > 1) {
				const [key] = keyWithCondition.split('|');
				conflicts.push(`Key "${key}" has ${commands.length} commands: ${commands.join(', ')}`);
			}
		}

		assert.strictEqual(conflicts.length, 0, `Found keyboard shortcut conflicts:\n${conflicts.join('\n')}`);
	});

	test('Verify fixed conflicts have correct shortcuts', () => {
		const keybindings = packageJson.contributes?.keybindings || [];
		const webviewBindings = keybindings.filter((b: any) =>
			b.when?.includes('activeWebviewPanelId == gitHistory.webview')
		);

		// Helper to find shortcut for a command
		const findShortcut = (commandName: string): string | undefined => {
			const binding = webviewBindings.find((b: any) => b.command === commandName);
			return binding?.key;
		};

		// Verify the three fixed conflicts:
		// 1. copyCommitShortDate should use Ctrl+Shift+J
		assert.strictEqual(findShortcut('gitHistory.copyCommitShortDate'), 'ctrl+shift+j',
			'copyCommitShortDate should use Ctrl+Shift+J');

		// 2. toggleIgnoreWhitespace should use Ctrl+Shift+Alt+J (NOT Ctrl+Shift+J)
		assert.strictEqual(findShortcut('gitHistory.toggleIgnoreWhitespace'), 'ctrl+shift+alt+j',
			'toggleIgnoreWhitespace should use Ctrl+Shift+Alt+J');

		// 3. revertCommit should use Ctrl+Alt+R
		assert.strictEqual(findShortcut('gitHistory.revertCommit'), 'ctrl+alt+r',
			'revertCommit should use Ctrl+Alt+R');

		// 4. copyRangeDiff should use Ctrl+Shift+Alt+R (NOT Ctrl+Alt+R)
		assert.strictEqual(findShortcut('gitHistory.copyRangeDiff'), 'ctrl+shift+alt+r',
			'copyRangeDiff should use Ctrl+Shift+Alt+R');

		// 5. toggleStats should use Ctrl+Shift+Alt+T
		assert.strictEqual(findShortcut('gitHistory.toggleStats'), 'ctrl+shift+alt+t',
			'toggleStats should use Ctrl+Shift+Alt+T');

		// 6. copyTrailers should use Ctrl+Shift+Alt+3 (NOT Ctrl+Shift+Alt+T)
		assert.strictEqual(findShortcut('gitHistory.copyTrailers'), 'ctrl+shift+alt+3',
			'copyTrailers should use Ctrl+Shift+Alt+3');
	});

	test('Verify metadata copy shortcuts follow pattern', () => {
		const keybindings = packageJson.contributes?.keybindings || [];
		const webviewBindings = keybindings.filter((b: any) =>
			b.when?.includes('activeWebviewPanelId == gitHistory.webview')
		);

		// Helper to find shortcut for a command
		const findShortcut = (commandName: string): string | undefined => {
			const binding = webviewBindings.find((b: any) => b.command === commandName);
			return binding?.key;
		};

		// Verify the pattern for metadata copy commands:
		// Ctrl+Shift+Alt+3 for trailers
		// Ctrl+Shift+Alt+4 for reviewers
		// Ctrl+Shift+Alt+5 for issue references
		assert.strictEqual(findShortcut('gitHistory.copyTrailers'), 'ctrl+shift+alt+3',
			'copyTrailers should use Ctrl+Shift+Alt+3');
		assert.strictEqual(findShortcut('gitHistory.copyReviewedBy'), 'ctrl+shift+alt+4',
			'copyReviewedBy should use Ctrl+Shift+Alt+4');
		assert.strictEqual(findShortcut('gitHistory.copyFixesReferences'), 'ctrl+shift+alt+5',
			'copyFixesReferences should use Ctrl+Shift+Alt+5');
	});
});
