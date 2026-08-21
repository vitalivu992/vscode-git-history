import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('README Keyboard Shortcuts E2E Tests', () => {
  const readmePath = path.resolve(__dirname, '../../../README.md');
  const mainJsPath = path.resolve(__dirname, '../../../src/webview/panel/main.js');
  const packageJsonPath = path.resolve(__dirname, '../../../package.json');

  test.skip('keyboard help dialog shows all shortcuts documented in README', () => {
    const readme = fs.readFileSync(readmePath, 'utf-8');
    const mainJs = fs.readFileSync(mainJsPath, 'utf-8');

    // Extract keyboard shortcuts from README
    const readmeShortcuts = extractReadmeShortcuts(readme);

    // Extract keyboard shortcuts from main.js help dialog
    const helpDialogShortcuts = extractHelpDialogShortcuts(mainJs);

    // Verify all README shortcuts are in the help dialog
    const missingFromHelp: string[] = [];
    for (const shortcut of readmeShortcuts) {
      if (!helpDialogShortcuts.some(h => h.command === shortcut.command)) {
        missingFromHelp.push(shortcut.command);
      }
    }

    assert.strictEqual(missingFromHelp.length, 0,
      `Keyboard help dialog is missing commands documented in README:\n${missingFromHelp.join('\n')}`);
  });

  test.skip('keyboard help dialog shows all commands from package.json keybindings', () => {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const mainJs = fs.readFileSync(mainJsPath, 'utf-8');

    const keybindings = packageJson.contributes.keybindings
      .filter((kb: any) => kb.command.startsWith('gitHistory.'))
      .filter((kb: any) => kb.key || kb.mac);

    const helpDialogShortcuts = extractHelpDialogShortcuts(mainJs);

    const panelCommands = new Set<string>(
      keybindings
        .map((kb: any) => kb.command.replace('gitHistory.', '') as string)
        .filter((cmd: string) => !isGlobalCommand(`gitHistory.${cmd}`))
    );

    const missingFromHelp: string[] = [];
    for (const command of panelCommands) {
      if (!helpDialogShortcuts.some(h => h.command === command)) {
        missingFromHelp.push(command as string);
      }
    }

    assert.strictEqual(missingFromHelp.length, 0,
      `Keyboard help dialog is missing commands from package.json:\n${missingFromHelp.join('\n')}`);
  });

  test.skip('README contains all keyboard shortcuts from package.json', () => {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const readme = fs.readFileSync(readmePath, 'utf-8');

    const keybindings = packageJson.contributes.keybindings
      .filter((kb: any) => kb.command.startsWith('gitHistory.'))
      .filter((kb: any) => kb.key || kb.mac);

    const readmeContent = readme.toLowerCase();
    const keyboardSection = readme.substring(readme.indexOf('## Keyboard Shortcuts')).toLowerCase();

    const missingFromReadme: string[] = [];
    for (const kb of keybindings) {
      const commandName = kb.command.replace('gitHistory.', '');
      if (isGlobalCommand(kb.command)) {
        continue;
      }

      const expectedShortcut = formatShortcutForReadme(kb).toLowerCase();
      if (!keyboardSection.includes(expectedShortcut) &&
          !keyboardSection.includes(commandName.toLowerCase().replace(/([a-z])([a-z]+)/, '$1 $2'))) {
        missingFromReadme.push(`${kb.command} (${expectedShortcut})`);
      }
    }

    assert.strictEqual(missingFromReadme.length, 0,
      `README.md is missing keyboard shortcuts from package.json:\n${missingFromReadme.join('\n')}`);
  });

  function extractReadmeShortcuts(readme: string): Array<{command: string, shortcut: string}> {
    const shortcuts: Array<{command: string, shortcut: string}> = [];
    const keyboardSection = readme.substring(readme.indexOf('## Keyboard Shortcuts'));

    // Parse the keyboard shortcuts tables
    const lines = keyboardSection.split('\n');
    for (const line of lines) {
      if (line.startsWith('|') && !line.startsWith('|--')) {
        const parts = line.split('|').map(p => p.trim()).filter(p => p);
        if (parts.length >= 2) {
          const command = parts[0];
          const keybinding = parts[1];
          if (command && keybinding && keybinding !== 'none') {
            shortcuts.push({ command, shortcut: keybinding });
          }
        }
      }
    }
    return shortcuts;
  }

  function extractHelpDialogShortcuts(mainJs: string): Array<{command: string}> {
    const shortcuts: Array<{command: string}> = [];

    // Find the keyboard shortcuts data in the help dialog
    const helpDialogStart = mainJs.indexOf('function showKeyboardHelpDialog');
    if (helpDialogStart >= 0) {
      const helpDialogEnd = mainJs.indexOf('\n}', helpDialogStart + 5000);
      const helpDialogCode = mainJs.substring(helpDialogStart, helpDialogEnd);

      // Extract command names from the shortcuts data structure
      // Looking for patterns like 'Copy commit hash', 'Toggle word wrap', etc.
      const commandPattern = /'([^']+)'|`([^`]+)`/g;
      let match;
      const seenCommands = new Set<string>();

      while ((match = commandPattern.exec(helpDialogCode)) !== null) {
        const text = match[1] || match[2];
        // Filter to likely command names (multi-word, specific patterns)
        if (text && (text.includes(' ') || text.includes('copy') || text.includes('toggle')) &&
            !text.includes('shortcuts') && !text.includes('help')) {
          const commandName = text;
          if (!seenCommands.has(commandName)) {
            seenCommands.add(commandName);
            shortcuts.push({ command: commandName });
          }
        }
      }
    }
    return shortcuts;
  }

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
    const globalCommands = [
      'gitHistory.showFileHistory',
      'gitHistory.showSelectionHistory',
      'gitHistory.toggleBlame',
      'gitHistory.showBlameCommit'
    ];
    return globalCommands.includes(command);
  }
});
