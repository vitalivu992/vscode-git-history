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
			if (!when.includes('activeWebviewViewId == gitHistory.webview')) {
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
			b.when?.includes('activeWebviewViewId == gitHistory.webview')
		);

		// Helper to find shortcut for a command
		const findShortcut = (commandName: string): string | undefined => {
			const binding = webviewBindings.find((b: any) => b.command === commandName);
			return binding?.key;
		};

		// Verify the three fixed conflicts:
		// 1. toggleIgnoreWhitespace should use Ctrl+Shift+Alt+J (NOT Ctrl+Shift+J)
		assert.strictEqual(findShortcut('gitHistory.toggleIgnoreWhitespace'), 'ctrl+shift+alt+j',
			'toggleIgnoreWhitespace should use Ctrl+Shift+Alt+J');

		// 2. revertCommit should use Ctrl+Alt+R
		assert.strictEqual(findShortcut('gitHistory.revertCommit'), 'ctrl+alt+r',
			'revertCommit should use Ctrl+Alt+R');
	});
});
