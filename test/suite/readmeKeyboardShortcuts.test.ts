import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('README Keyboard Shortcuts Documentation', () => {
  const packageJsonPath = path.resolve(__dirname, '../../package.json');
  const readmePath = path.resolve(__dirname, '../../README.md');

  test('every keyboard shortcut in package.json should be documented in README', () => {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const readme = fs.readFileSync(readmePath, 'utf-8');

    const keybindings = packageJson.contributes.keybindings
      .filter((kb: any) => kb.command.startsWith('gitHistory.'))
      .filter((kb: any) => kb.key || kb.mac); // Has a keybinding

    const undocumentedCommands: string[] = [];

    for (const kb of keybindings) {
      const commandName = kb.command.replace('gitHistory.', '');
      const expectedShortcut = formatShortcutForReadme(kb);

      // Check if command is mentioned in README with its keyboard shortcut
      if (!isGlobalCommand(kb.command) && !isDocumentedInReadme(readme, commandName, expectedShortcut)) {
        undocumentedCommands.push(`${kb.command} (${expectedShortcut})`);
      }
    }

    assert.strictEqual(undocumentedCommands.length, 0,
      `Keyboard shortcuts not documented in README.md:\n${undocumentedCommands.join('\n')}`);
  });

  function formatShortcutForReadme(kb: any): string {
    const formatKey = (key: string) => {
      return key.toLowerCase()
        .replace('ctrl+', 'Ctrl+')
        .replace('shift+', 'Shift+')
        .replace('cmd+', 'Cmd+')
        .replace('alt+', 'Alt+')
        .replace('\\.', '.');
    };

    const winKey = kb.key ? formatKey(kb.key) : '';
    const macKey = kb.mac ? formatKey(kb.mac) : '';
    return winKey && macKey ? `${winKey} / ${macKey}` : winKey || macKey;
  }

  function isGlobalCommand(command: string): boolean {
    // Some commands are global and may not need to be in the panel table
    const globalCommands = [
      'gitHistory.showFileHistory',
      'gitHistory.showSelectionHistory',
      'gitHistory.toggleBlame',
      'gitHistory.showBlameCommit'
    ];
    return globalCommands.includes(command);
  }

  function isDocumentedInReadme(readme: string, commandName: string, shortcut: string): boolean {
    // Check if the command is documented in the keyboard shortcuts section
    // The command might be mentioned by name, description, or shortcut
    const lowerReadme = readme.toLowerCase();
    const lowerCommand = commandName.toLowerCase();
    const lowerShortcut = shortcut.toLowerCase();

    // Look for the keyboard shortcuts section
    const keyboardSection = readme.substring(readme.indexOf('## Keyboard Shortcuts'));

    // Check if the command or shortcut is documented
    return keyboardSection.toLowerCase().includes(lowerShortcut) ||
           keyboardSection.toLowerCase().includes(lowerCommand.replace(/([a-z])([A-Z])/g, '$1 $2'));
  }
});
